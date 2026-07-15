import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("order-failure");

export async function failOrderAndRefund(orderId: string): Promise<void> {
  await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", orderId);

  const { data: failedOrder } = await supabaseAdmin
    .from("orders").select("stripe_payment_intent").eq("id", orderId).single();

  if (!failedOrder?.stripe_payment_intent) {
    log.error({ orderId }, "Generation failed — no payment_intent on file, cannot auto-refund");
    return;
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create(
      { payment_intent: failedOrder.stripe_payment_intent as string },
      { idempotencyKey: `generate-fail-refund-${orderId}` },
    );
    await supabaseAdmin.from("orders").update({ status: "refunded" }).eq("id", orderId);
    log.info({ orderId }, "Auto-refund issued after generation failure");
  } catch (refundErr) {
    Sentry.captureException(refundErr, { tags: { orderId }, level: "fatal" });
    log.error({ err: refundErr, orderId }, "Auto-refund failed");
  }
}
