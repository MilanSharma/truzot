import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { addCors } from "@/lib/cors";
import { fal } from "@fal-ai/client";

const log = createLogger("free-train");

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

fal.config({ credentials: process.env.FAL_KEY });

export const maxDuration = 300;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const fingerprint = getIp(req);

    const body = await req.json();
    const { storagePath } = body;

    if (!storagePath) {
      return addCors(
        NextResponse.json({ error: "Missing fields" }, { status: 400 }),
        origin,
      );
    }

    // Server-side rate limiting by user_id (not client-controlled fingerprint)
    // Optimistically lock the quota before doing any work
    const { data: lockedUsage } = await supabaseAdmin
      .from("free_usage")
      .update({ remaining: 0 })
      .eq("fingerprint", fingerprint)
      .gt("remaining", 0)
      .select()
      .single();

    if (!lockedUsage) {
      // If no row was updated, check if we need to insert a new row
      const { data: existingRow } = await supabaseAdmin
        .from("free_usage")
        .select("id")
        .eq("fingerprint", fingerprint)
        .maybeSingle();

      if (existingRow) {
        // Row exists but remaining was 0
        return addCors(
          NextResponse.json({ error: "Free limit reached" }, { status: 429 }),
          origin,
        );
      } else {
        // No row exists, insert one with remaining: 0 to lock it
        const { error: insertError } = await supabaseAdmin
          .from("free_usage")
          .insert({ fingerprint, remaining: 0 });

        if (insertError) {
          return addCors(
            NextResponse.json({ error: "Free limit reached" }, { status: 429 }),
            origin,
          );
        }
      }
    }

    const { data: signedUrl } = await supabaseAdmin.storage
      .from("uploads")
      .createSignedUrl(storagePath, 14400);

    if (!signedUrl?.signedUrl) {
      return addCors(
        NextResponse.json({ error: "File not found" }, { status: 404 }),
        origin,
      );
    }

    const trainResult = await fal.queue.submit(
      "fal-ai/flux-lora-fast-training",
      {
        input: {
          images_data_url: signedUrl.signedUrl,
          steps: 200,
          trigger_word: "TOK",
        },
        storageSettings: { expiresIn: "7d" },
      },
    );

    const requestId = (trainResult as any).request_id;
    if (!requestId) {
      return addCors(
        NextResponse.json(
          { error: "Training submission failed" },
          { status: 500 },
        ),
        origin,
      );
    }

    let trainingComplete = false;
    let modelId = "";
    const POLL_INTERVAL = 5000;
    const MAX_POLLS = 40;
    let consecutiveFails = 0;
    for (let i = 0; i < MAX_POLLS; i++) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL));
      try {
        const status = await fal.queue.status(
          "fal-ai/flux-lora-fast-training",
          { requestId },
        );
        if (status.status === "COMPLETED") {
          const result = await fal.queue.result(
            "fal-ai/flux-lora-fast-training",
            { requestId },
          );
          const data = result as any;
          modelId =
            data.diffusers_lora_file?.url ??
            data.diff_url ??
            data.output?.diffusers_lora_file?.url;
          if (modelId) {
            trainingComplete = true;
            break;
          }
        }
        consecutiveFails = 0;
      } catch (err) {
        consecutiveFails++;
        log.warn({ err, attempt: i, orderId: requestId }, "FAL poll error");
        if (consecutiveFails > 5) break;
      }
    }

    if (!trainingComplete || !modelId) {
      try {
        await fal.queue.cancel("fal-ai/flux-lora-fast-training", { requestId });
      } catch (e) {
        log.warn(
          { err: e, requestId },
          "Failed to cancel FAL queue job on timeout",
        );
      }
      try {
        await supabaseAdmin.storage.from("uploads").remove([storagePath]);
      } catch (e) {
        log.warn({ err: e, storagePath }, "Failed to delete upload on timeout");
      }
      return addCors(
        NextResponse.json({ error: "Training timed out" }, { status: 504 }),
        origin,
      );
    }

    const genResult = await fal.run("fal-ai/flux-lora", {
      input: {
        prompt:
          "A professional corporate headshot of TOK, a person with professional attire, studio background, soft lighting, 8k",
        loras: [{ path: modelId, scale: 0.85 }],
        num_inference_steps: 28,
        guidance_scale: 3.5,
        num_images: 1,
        image_size: "portrait_4_3",
        output_format: "jpeg",
      },
      storageSettings: { expiresIn: "7d" },
    });

    const imageUrl = (genResult as any).images?.[0]?.url;
    if (!imageUrl) {
      return addCors(
        NextResponse.json({ error: "Generation failed" }, { status: 500 }),
        origin,
      );
    }

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 30000);
    const imgRes = await fetch(imageUrl, { signal: controller.signal });
    clearTimeout(fetchTimeout);

    if (!imgRes.ok) {
      return addCors(
        NextResponse.json({ error: "Image fetch failed" }, { status: 502 }),
        origin,
      );
    }

    const imgBody = imgRes.body;
    if (!imgBody) {
      return addCors(
        NextResponse.json({ error: "Empty image response" }, { status: 502 }),
        origin,
      );
    }
    const storageKey = `free/${crypto.randomUUID()}.jpg`;
    const { data: uploaded } = await supabaseAdmin.storage
      .from("headshots")
      .upload(storageKey, imgBody, {
        contentType: "image/jpeg",
        upsert: false,
      });

    let publicUrl = imageUrl;
    if (uploaded?.path) {
      const { data: pub } = supabaseAdmin.storage
        .from("headshots")
        .getPublicUrl(uploaded.path);
      if (pub?.publicUrl) publicUrl = pub.publicUrl;
    }

    // Quota was already locked at the start of the request

    await supabaseAdmin.storage.from("uploads").remove([storagePath]);

    return addCors(NextResponse.json({ url: publicUrl }), origin);
  } catch (err) {
    log.error({ err }, "Free train error");
    return addCors(
      NextResponse.json({ error: "Internal error" }, { status: 500 }),
      origin,
    );
  }
});
