import { NextResponse } from "next/server";
import Stripe from "stripe";
import { trainModel } from "@/lib/ai/fal-client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import { storeWebhookEvent } from "@/lib/webhook-store";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("stripe-webhook");

export const POST = withContext(async (req: Request) => {
  const stripe = getStripe();
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature")!;
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
    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("zip_url, status, preferences, user_id")
      .eq("id", orderId)
      .single();
    if (fetchError || !order?.zip_url)
      return NextResponse.json({ error: "Order not found" }, { status: 400 });
    if (["training", "generating", "completed"].includes(order.status))
      return NextResponse.json({ received: true });

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

    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
    const existingPrefs = (order.preferences as Record<string, any>) || {};

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
        .update({ status: "pending" })
        .eq("id", orderId);
      return NextResponse.json(
        { error: "Failed to create training record" },
        { status: 500 },
      );
    }

    try {
      const result = await trainModel(freshZipUrl, orderId);
      await supabaseAdmin
        .from("trainings")
        .update({ request_id: result.request_id })
        .eq("order_id", orderId);
    } catch (err) {
      log.error({ err, orderId }, "Training kickoff failed");
      await supabaseAdmin
        .from("trainings")
        .update({ status: "failed", error: String(err) })
        .eq("order_id", orderId);
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
