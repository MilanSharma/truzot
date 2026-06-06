import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trainModel } from "@/lib/ai/fal-client";
import { storeWebhookEvent } from "@/lib/webhook-store";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("fal-webhook");
export const maxDuration = 30;

export const POST = withContext(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");

    const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
    if (!webhookSecret || token !== webhookSecret)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const data = await req.json();
    const falEventId = data.id || `fal-${Date.now()}`;

    await storeWebhookEvent(
      "fal",
      falEventId,
      data.status || "unknown",
      data,
      "received",
    );

    if (data.status === "ERROR" || data.error) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("preferences, zip_url")
        .eq("id", orderId)
        .single();
      const prefs = (order?.preferences as Record<string, any>) || {};
      const retryCount = (prefs.retry_count as number) || 0;

      if (retryCount < 1) {
        let zipUrl = order?.zip_url;
        const storagePath = prefs.storagePath as string | undefined;
        if (storagePath) {
          try {
            const { data: newData } = await supabaseAdmin.storage
              .from("uploads")
              .createSignedUrl(storagePath, 7200);
            if (newData?.signedUrl) zipUrl = newData.signedUrl;
          } catch (e) {
            log.error(
              { err: e, orderId },
              "Failed to refresh zip URL on retry",
            );
          }
        }
        const { error: orderErr } = await supabaseAdmin
          .from("orders")
          .update({
            status: "training",
            zip_url: zipUrl,
            preferences: { ...prefs, retry_count: retryCount + 1 },
          })
          .eq("id", orderId);
        if (orderErr)
          return NextResponse.json(
            { error: "Order update failed" },
            { status: 500 },
          );
        const { error: trainErr } = await supabaseAdmin
          .from("trainings")
          .upsert(
            {
              order_id: orderId,
              status: "training",
              error: null,
              model_id: null,
            },
            { onConflict: "order_id" },
          );
        if (trainErr) {
          await supabaseAdmin
            .from("orders")
            .update({ status: "failed" })
            .eq("id", orderId);
          return NextResponse.json(
            { error: "Training upsert failed" },
            { status: 500 },
          );
        }
        if (zipUrl) {
          try {
            const result = await trainModel(zipUrl, orderId);
            await supabaseAdmin
              .from("trainings")
              .update({ request_id: result.request_id })
              .eq("order_id", orderId);
          } catch (err) {
            await supabaseAdmin
              .from("trainings")
              .update({ status: "failed", error: String(err) })
              .eq("order_id", orderId);
            await supabaseAdmin
              .from("orders")
              .update({ status: "failed" })
              .eq("id", orderId);
          }
        }
      } else {
        await supabaseAdmin
          .from("trainings")
          .update({ status: "failed", error: data.error ?? "Unknown error" })
          .eq("order_id", orderId);
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orderId);
      }
      return NextResponse.json({ ok: true });
    }

    if (data.status !== "COMPLETED" && data.status !== "OK")
      return NextResponse.json({ ok: true });

    const modelId =
      data.diffusers_lora_file?.url ??
      data.diff_url ??
      data.output?.diffusers_lora_file?.url;
    if (!modelId)
      return NextResponse.json({ error: "No model URL" }, { status: 400 });

    await supabaseAdmin
      .from("trainings")
      .update({ status: "generating", model_id: modelId })
      .eq("order_id", orderId);
    await supabaseAdmin
      .from("orders")
      .update({ status: "generating" })
      .eq("id", orderId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      // FIX 5: Pass the Cron Secret to authorize the internal trigger
      fetch(`${siteUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-truzot-secret": process.env.CRON_SECRET || "",
        },
        body: JSON.stringify({ orderId }),
      }).catch((err) =>
        log.error({ err, orderId }, "Server-side generation trigger failed"),
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
