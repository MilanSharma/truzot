import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trainModel, generateWebhookToken } from "@/lib/ai/fal-client";
import { storeWebhookEvent } from "@/lib/webhook-store";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { isValidTransition } from "@/lib/order-status";

const log = createLogger("fal-webhook");
export const maxDuration = 30;

async function triggerGenerate(orderId: string): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const cronSecret = process.env.CRON_SECRET;
  if (!siteUrl || !cronSecret) return false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${siteUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-truzot-secret": cronSecret,
        },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) return true;
      log.error(
        { status: res.status, attempt, orderId },
        "Generate trigger attempt failed",
      );
    } catch (err) {
      log.error({ err, attempt, orderId }, "Generate trigger attempt error");
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  return false;
}

async function triggerGenerateAsync(orderId: string): Promise<void> {
  waitUntil(
    triggerGenerate(orderId).then((success) => {
      if (!success) {
        log.error({ orderId }, "All generate trigger attempts failed");
      }
    }),
  );
}

export const POST = withContext(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const token = searchParams.get("token");

    if (!orderId || !token)
      return NextResponse.json({ error: "Missing params" }, { status: 400 });
    const expected = generateWebhookToken(orderId);
    if (token !== expected)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
        .select("status, preferences, zip_url")
        .eq("id", orderId)
        .single();
      const currentStatus = order?.status || "";
      if (!isValidTransition(currentStatus, "failed")) {
        log.warn(
          { orderId, currentStatus },
          "Ignoring ERROR webhook — terminal state",
        );
        return NextResponse.json({ ok: true });
      }
      const prefs = (order?.preferences as Record<string, any>) || {};
      const retryCount = (prefs.retry_count as number) || 0;

      if (retryCount < 1 && isValidTransition(currentStatus, "training")) {
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
          log.error(
            { err: trainErr, orderId },
            "Training upsert failed on retry",
          );
          // Don't fail the order — training may already be in progress
          return NextResponse.json({ ok: true });
        }
        if (zipUrl) {
          try {
            const result = await trainModel(zipUrl, orderId);
            await supabaseAdmin
              .from("trainings")
              .update({ request_id: result.request_id })
              .eq("order_id", orderId);
          } catch (err) {
            Sentry.captureException(err, {
              tags: { orderId },
              level: "fatal",
            });
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
        const { data: failedOrder } = await supabaseAdmin
          .from("orders")
          .select("stripe_payment_intent")
          .eq("id", orderId)
          .single();
        if (failedOrder?.stripe_payment_intent) {
          try {
            const { getStripe } = await import("@/lib/stripe");
            const stripe = getStripe();
            await stripe.refunds.create({
              payment_intent: failedOrder.stripe_payment_intent as string,
            });
            await supabaseAdmin
              .from("orders")
              .update({ status: "refunded" })
              .eq("id", orderId);
            log.info({ orderId }, "Auto-refund issued after training failure");
          } catch (refundErr) {
            Sentry.captureException(refundErr, {
              tags: { orderId },
              level: "fatal",
            });
            log.error({ err: refundErr, orderId }, "Auto-refund failed");
          }
        }
      }
      return NextResponse.json({ ok: true });
    }

    if (data.status !== "COMPLETED" && data.status !== "OK")
      return NextResponse.json({ ok: true });

    // Check all possible locations where fal.ai might nest the model URL
    const output = data.payload ?? data.output ?? data.result ?? data;
    const modelId =
      output?.diffusers_lora_file?.url ??
      data.diffusers_lora_file?.url ??
      data.diff_url ??
      data.output?.diffusers_lora_file?.url ??
      data.payload?.diffusers_lora_file?.url ??
      data.data?.diffusers_lora_file?.url ??
      data.result?.diffusers_lora_file?.url;

    if (!modelId) {
      log.error({ data }, "No model URL found in webhook payload");
      return NextResponse.json({ error: "No model URL" }, { status: 400 });
    }

    const { data: curOrder } = await supabaseAdmin
      .from("orders")
      .select("status")
      .eq("id", orderId)
      .single();
    if (!isValidTransition(curOrder?.status || "", "generating")) {
      log.warn(
        { orderId, currentStatus: curOrder?.status },
        "Ignoring COMPLETED webhook — invalid transition",
      );
      return NextResponse.json({ ok: true });
    }

    await supabaseAdmin
      .from("trainings")
      .update({ status: "generating", model_id: modelId })
      .eq("order_id", orderId);
    await supabaseAdmin
      .from("orders")
      .update({ status: "generating" })
      .eq("id", orderId);

    triggerGenerateAsync(orderId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
