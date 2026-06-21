import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { trainModel } from "@/lib/ai/fal-client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import { storeWebhookEvent } from "@/lib/webhook-store";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";
import { isValidTransition } from "@/lib/order-status";

const log = createLogger("stripe-webhook");

const MAX_BODY_SIZE = 1_048_576; // 1MB

export const POST = withContext(async (req: Request) => {
  const stripe = getStripe();
  const contentLength = parseInt(req.headers.get("content-length") || "0", 10);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing Stripe signature" },
      { status: 400 },
    );
  }
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    await storeWebhookEvent(
      "stripe",
      null,
      "signature_failed",
      { signature: signature?.slice(0, 16) },
      "failed",
      String(err),
    );
    log.error({ err }, "Stripe signature verification failed");
    return NextResponse.json(
      { error: "Webhook signature failed" },
      { status: 400 },
    );
  }
  await storeWebhookEvent(
    "stripe",
    event.id,
    event.type,
    event.data.object,
    "received",
  );
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { orderId, plan, email, userId } = session.metadata ?? {};
    if (!orderId)
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });

    // Idempotency check: skip if this event was already processed
    if (event.id) {
      const { data: existing } = await supabaseAdmin
        .from("webhook_events")
        .select("id")
        .eq("event_id", event.id)
        .eq("status", "processed")
        .maybeSingle();
      if (existing) {
        log.info(
          { eventId: event.id, orderId },
          "Duplicate webhook — skipping",
        );
        return NextResponse.json({ received: true });
      }
    }
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("zip_url, status, preferences, user_id")
      .eq("id", orderId)
      .single();
    if (fetchError)
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    if (["training", "generating", "completed"].includes(order.status))
      return NextResponse.json({ received: true });

    // 🚀 NEW: FAST-TRACK UPSELL PACKAGES TO GENERATION (Bypasses Training)
    if (plan === "custom_upsell") {
      await supabaseAdmin
        .from("orders")
        .update({
          status: "generating",
          stripe_payment_intent: session.payment_intent as string,
        })
        .eq("id", orderId);

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
      const cronSecret = process.env.CRON_SECRET;

      fetch(`${siteUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-truzot-secret": cronSecret || "",
        },
        body: JSON.stringify({ orderId }),
      }).catch((err) =>
        log.error({ err, orderId }, "Trigger generate failed for upsell"),
      );

      if (event.id) {
        await supabaseAdmin
          .from("webhook_events")
          .update({ status: "processed" })
          .eq("event_id", event.id)
          .eq("source", "stripe")
          .eq("status", "received");
      }
      return NextResponse.json({ received: true });
    }

    if (!isValidTransition(order.status, "training")) {
      log.warn(
        { orderId, currentStatus: order.status },
        "Invalid transition to training from current status",
      );
      return NextResponse.json({ received: true });
    }

    // Claim guest order if userId is in metadata
    if (!order.user_id && userId) {
      await supabaseAdmin
        .from("orders")
        .update({ user_id: userId })
        .eq("id", orderId);
    }

    const prefs = (order.preferences as Record<string, any>) || {};
    let freshZipUrl = order.zip_url;
    const storagePath = prefs.storagePath as string | undefined;
    if (storagePath) {
      try {
        const { data: newData } = await supabaseAdmin.storage
          .from("uploads")
          .createSignedUrl(storagePath, 7200);
        if (newData?.signedUrl) {
          freshZipUrl = newData.signedUrl;
        }
      } catch (e) {
        log.error({ err: e, orderId }, "Failed to refresh zip URL");
      }
    }
    if (!freshZipUrl)
      return NextResponse.json(
        { error: "No zip URL available" },
        { status: 400 },
      );

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const existingPrefs = (order.preferences as Record<string, any>) || {};

    // Mark waitlist discount code as used
    const discountCode = session.metadata?.discount_code;
    if (discountCode && discountCode.startsWith("TRUZOT-")) {
      await supabaseAdmin
        .from("waitlist")
        .update({ used: true, used_at: new Date().toISOString() })
        .eq("discount_code", discountCode.toUpperCase());
      log.info({ discountCode }, "Waitlist discount code marked as used");
    }

    const { error: orderUpdateError } = await supabaseAdmin
      .from("orders")
      .update({
        status: "training",
        zip_url: freshZipUrl,
        stripe_payment_intent: session.payment_intent as string,
        preferences: { ...existingPrefs, stripe_customer_id: customerId },
      })
      .eq("id", orderId);
    if (orderUpdateError)
      return NextResponse.json(
        { error: "Failed to update order" },
        { status: 500 },
      );

    const { error: trainingUpsertError } = await supabaseAdmin
      .from("trainings")
      .upsert(
        { order_id: orderId, status: "training" },
        { onConflict: "order_id" },
      );
    if (trainingUpsertError) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);
      return NextResponse.json(
        { error: "Failed to create training record" },
        { status: 500 },
      );
    }

    // Mark event as processed before trainModel to prevent duplicate processing on Stripe retry
    if (event.id) {
      await supabaseAdmin
        .from("webhook_events")
        .update({ status: "processed" })
        .eq("event_id", event.id)
        .eq("source", "stripe")
        .eq("status", "received");
    }

    try {
      const result = await trainModel(freshZipUrl, orderId);
      await supabaseAdmin
        .from("trainings")
        .update({ request_id: result.request_id })
        .eq("order_id", orderId);
    } catch (err) {
      Sentry.captureException(err, {
        tags: { orderId },
        level: "fatal",
      });
      log.error({ err, orderId }, "Training kickoff failed");
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", orderId);
      await supabaseAdmin
        .from("trainings")
        .update({ status: "failed", error: String(err) })
        .eq("order_id", orderId);
      if (session.payment_intent) {
        try {
          await stripe.refunds.create({
            payment_intent: session.payment_intent as string,
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
      return NextResponse.json(
        { error: "Training failed to start" },
        { status: 500 },
      );
    }
    if (email) {
      const planAmount = PLANS[plan as keyof typeof PLANS]?.amount ?? 2900;
      await sendOrderConfirmationEmail(email, plan, planAmount).catch((err) =>
        log.error({ err, orderId }, "Failed to send confirmation email"),
      );
    }
  }
  return NextResponse.json({ received: true });
});
