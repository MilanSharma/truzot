import { NextResponse } from "next/server";
import Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { trainModel } from "@/lib/ai/fal-client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { PLANS } from "@/lib/plans";
import { storeWebhookEvent } from "@/lib/webhook-store";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";
import { isValidTransition } from "@/lib/order-status";
import crypto from "crypto";

const log = createLogger("stripe-webhook");

const MAX_BODY_SIZE = 1_048_576; // 1MB

// Helper function to hash PII for Meta CAPI (lowercase, trimmed SHA-256)
function hashValue(value: string | undefined | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  return crypto.createHash("sha256").update(cleaned).digest("hex");
}

// Send event to Meta CAPI
async function sendMetaCAPIEvent(session: Stripe.Checkout.Session, orderId: string) {
  try {
    const pixelId = "1385221020153603";
    const accessToken = process.env.META_CAPI_ACCESS_TOKEN;

    if (!accessToken) {
      log.warn("META_CAPI_ACCESS_TOKEN not configured, skipping CAPI event");
      return;
    }

    const email = session.customer_details?.email;
    const fullName = session.customer_details?.name || "";
    const [firstName, ...lastNameArray] = fullName.trim().split(" ");
    const lastName = lastNameArray.join(" ");

    const currency = (session.currency || "USD").toUpperCase();
    const value = session.amount_total ? session.amount_total / 100 : 0;
    const eventId = session.id; // Stripe Checkout Session ID for deduplication

    const clientIp = session.metadata?.client_ip || "";
    const userAgent = session.metadata?.user_agent || "";

    // Hash PII fields
    const hashedEmail = hashValue(email);
    const hashedFirstName = hashValue(firstName);
    const hashedLastName = hashValue(lastName);
    const hashedCountry = hashValue(session.customer_details?.address?.country);
    const hashedZip = hashValue(session.customer_details?.address?.postal_code);

    const capiPayload: any = {
      data: [
        {
          event_name: "Purchase",
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          action_source: "website",
          event_source_url: `${process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com"}/dashboard`,
          user_data: {
            em: hashedEmail ? [hashedEmail] : [],
            fn: hashedFirstName ? [hashedFirstName] : [],
            ln: hashedLastName ? [hashedLastName] : [],
            zp: hashedZip ? [hashedZip] : [],
            country: hashedCountry ? [hashedCountry] : [],
            client_ip_address: clientIp || undefined,
            client_user_agent: userAgent || undefined,
            fbp: session.metadata?.fbp || undefined,
            fbc: session.metadata?.fbc || undefined,
          },
          custom_data: {
            currency: currency,
            value: value,
          },
        },
      ],
    };

    // Add test event code if configured (for Meta testing)
    if (process.env.META_TEST_EVENT_CODE) {
      capiPayload.test_event_code = process.env.META_TEST_EVENT_CODE;
    }

    const response = await fetch(
      `https://graph.facebook.com/v20.0/${pixelId}/events?access_token=${accessToken}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(capiPayload),
      }
    );

    const result = await response.json();
    log.info({ result, orderId }, "Meta CAPI event sent");
  } catch (err) {
    log.error({ err, orderId }, "Failed to send Meta CAPI event");
  }
}

// Send event to Google Ads Offline Conversions
async function sendGoogleAdsOfflineConversion(session: Stripe.Checkout.Session, orderId: string) {
  try {
    const conversionId = process.env.GOOGLE_ADS_CONVERSION_ID;
    const accessToken = process.env.GOOGLE_ADS_ACCESS_TOKEN;

    if (!conversionId || !accessToken) {
      log.warn("GOOGLE_ADS_CONVERSION_ID or GOOGLE_ADS_ACCESS_TOKEN not configured, skipping Google Ads event");
      return;
    }

    const currency = (session.currency || "USD").toUpperCase();
    const value = session.amount_total ? session.amount_total / 100 : 0;
    const orderIdForGA = session.id; // Use Stripe session ID as Google order ID

    // Get gclid/gbraid from session metadata if available
    const gclid = session.metadata?.gclid;
    const gbraid = session.metadata?.gbraid;

    const payload = {
      conversions: [
        {
          conversion_id: orderIdForGA,
          conversion_name: "purchase",
          conversion_date_time: new Date().toISOString(),
          conversion_value: value,
          conversion_currency_code: currency,
          gclid: gclid || undefined,
          gbraid: gbraid || undefined,
        },
      ],
    };

    const response = await fetch(
      `https://googleads.googleapis.com/v17/customers/${conversionId}/offlineUserDataUploads:uploadUserData`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`,
          "developer-token": process.env.GOOGLE_ADS_DEVELOPER_TOKEN || "",
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();
    log.info({ result, orderId }, "Google Ads offline conversion sent");
  } catch (err) {
    log.error({ err, orderId }, "Failed to send Google Ads offline conversion");
  }
}

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
 // Check if webhook secret is configured
 if (!process.env.STRIPE_WEBHOOK_SECRET) {
 log.error("STRIPE_WEBHOOK_SECRET not configured");
 await storeWebhookEvent(
 "stripe",
 null,
 "signature_failed",
 { signature: signature?.slice(0, 16) },
 "failed",
 "STRIPE_WEBHOOK_SECRET not configured",
 );
 return NextResponse.json(
 { error: "Webhook signature failed" },
 { status: 500 },
 );
 }
 try {
 event = stripe.webhooks.constructEvent(
 body,
 signature,
 process.env.STRIPE_WEBHOOK_SECRET,
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
 // Return 400 for definitive signature failures (invalid signature)
 // This prevents Stripe from retrying events with malformed signatures
 return NextResponse.json(
 { error: "Webhook signature failed" },
 { status: 400 },
 );
 }
 // Check if event already exists before inserting
 if (event.id) {
 const { data: existingEvent } = await supabaseAdmin
 .from("webhook_events")
 .select("id")
 .eq("event_id", event.id)
 .limit(1);
 if (existingEvent && existingEvent.length > 0) {
 log.info({ eventId: event.id }, "Duplicate webhook — skipping");
 return NextResponse.json({ received: true });
 }
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

 // Idempotency check: claim the event
 if (event.id) {
 const { data: claimed } = await supabaseAdmin.from("webhook_events").update({ status: "processing" }).eq("event_id", event.id).eq("status", "received").select("id").maybeSingle();
 if (!claimed) {
 log.info({ eventId: event.id, orderId }, "Duplicate webhook — skipping");
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

 waitUntil(
 fetch(`${siteUrl}/api/generate`, {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 "x-truzot-secret": cronSecret || "",
 },
 body: JSON.stringify({ orderId }),
 }).catch((err) =>
 log.error({ err, orderId }, "Trigger generate failed for upsell"),
 )
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

 // Mark waitlist discount code as used after successful payment
 const discountCode = existingPrefs.discount_code as string | undefined;
 if (discountCode && discountCode.startsWith("TRUZOT-")) {
 try {
 await supabaseAdmin
 .from("waitlist")
 .update({ used: true, used_at: new Date().toISOString() })
 .eq("discount_code", discountCode)
 .eq("used", false);
 log.info({ discountCode, orderId }, "Marked waitlist discount code as used");
 } catch (err) {
 log.error({ err, discountCode }, "Failed to mark discount code as used");
 }
 }

 const affiliateCode = session.metadata?.promotekit_referral;
const updatedPrefs: Record<string, any> = { ...existingPrefs, stripe_customer_id: customerId };
if (affiliateCode) {
 updatedPrefs.promotekit_referral = affiliateCode;
}

const { error: orderUpdateError } = await supabaseAdmin
.from("orders")
.update({
status: "training",
zip_url: freshZipUrl,
stripe_payment_intent: session.payment_intent as string,
preferences: updatedPrefs,
})
.eq("id", orderId);
 if (orderUpdateError)
 return NextResponse.json(
 { error: "Failed to update order" },
 { status: 500 },
 );

 // Send Meta CAPI event for purchase tracking
 waitUntil(sendMetaCAPIEvent(session, orderId));

 // Send Google Ads offline conversion for purchase tracking
 waitUntil(sendGoogleAdsOfflineConversion(session, orderId));

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

 // Mark event as processed before triggering background training to prevent duplicate processing on Stripe retry
 if (event.id) {
 await supabaseAdmin
 .from("webhook_events")
 .update({ status: "processed" })
 .eq("event_id", event.id)
 .eq("source", "stripe")
 .eq("status", "received");
 }

 // Trigger training in background to avoid webhook timeout
 waitUntil((async () => {
 try {
 const imageCount = (existingPrefs.image_count as number) || 5;
 const result = await trainModel(freshZipUrl, orderId, imageCount);
 await supabaseAdmin
 .from("trainings")
 .update({ request_id: result.request_id })
 .eq("order_id", orderId);
 } catch (err) {
 log.error({ err, orderId }, "Failed to start background training");
 // Fail the order so the cron job picks it up for an auto-refund
 await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", orderId);
 await supabaseAdmin.from("trainings").update({ status: "failed", error: String(err) }).eq("order_id", orderId);
 }
 })());
 if (email) {
 const planAmount = PLANS[plan as keyof typeof PLANS]?.amount ?? 2900;
 await sendOrderConfirmationEmail(email, plan, planAmount).catch((err) =>
 log.error({ err, orderId }, "Failed to send confirmation email"),
 );
 }
 }
 return NextResponse.json({ received: true });
});
