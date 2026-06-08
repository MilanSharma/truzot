import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { addCors } from "@/lib/cors";
import { fal } from "@fal-ai/client";
import { createHash } from "crypto";

const log = createLogger("free-train");

fal.config({ credentials: process.env.FAL_KEY });

export const maxDuration = 300;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    // Require authenticated user for free training
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    if (token) {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(token);
      if (user) userId = user.id;
    }
    if (!userId) {
      return addCors(
        NextResponse.json(
          { error: "Authentication required" },
          { status: 401 },
        ),
        origin,
      );
    }

    const body = await req.json();
    const { storagePath, fingerprint } = body;

    if (!storagePath || !fingerprint) {
      return addCors(
        NextResponse.json({ error: "Missing fields" }, { status: 400 }),
        origin,
      );
    }

    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const raw = `${fingerprint}:${clientIp}`;
    const ipHash = createHash("sha256").update(raw).digest("hex");

    const { data: usage } = await supabaseAdmin
      .from("free_usage")
      .select("remaining")
      .eq("fingerprint", ipHash)
      .maybeSingle();

    if (usage && (usage.remaining ?? 0) <= 0) {
      return addCors(
        NextResponse.json({ error: "Free limit reached" }, { status: 429 }),
        origin,
      );
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
          steps: 500,
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
    const POLL_INTERVAL = 3000;
    const MAX_POLLS = Math.floor(295000 / POLL_INTERVAL);
    let consecutiveFails = 0;
    const startTime = Date.now();
    for (let i = 0; i < MAX_POLLS; i++) {
      if (Date.now() - startTime > 295000) break;
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

    if (usage) {
      await supabaseAdmin
        .from("free_usage")
        .update({ remaining: 0 })
        .eq("fingerprint", ipHash);
    } else {
      await supabaseAdmin
        .from("free_usage")
        .insert({ fingerprint: ipHash, remaining: 0 });
    }

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
