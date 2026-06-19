import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("cancel-order");

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!orderId)
      return addCors(
        NextResponse.json({ error: "Missing order id" }, { status: 400 }),
        origin,
      );

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, status, stripe_payment_intent")
      .eq("id", orderId)
      .single();

    if (!order)
      return addCors(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        origin,
      );
    if (order.user_id !== user.id)
      return addCors(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        origin,
      );

    if (order.status !== "generating" && order.status !== "training") {
      return addCors(
        NextResponse.json(
          { error: "Order cannot be cancelled" },
          { status: 400 },
        ),
        origin,
      );
    }

    // Update status to failed
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", orderId);

    // Auto-refund if they paid
    if (order.stripe_payment_intent) {
      try {
        const stripe = getStripe();
        await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent as string,
        });
        await supabaseAdmin
          .from("orders")
          .update({ status: "refunded" })
          .eq("id", orderId);
        log.info({ orderId }, "Auto-refund issued for cancelled order");
      } catch (refundErr) {
        log.error(
          { err: refundErr, orderId },
          "Auto-refund failed for cancelled order",
        );
      }
    }

    return addCors(NextResponse.json({ success: true }), origin);
  } catch (err) {
    Sentry.captureException(err);
    log.error({ err }, "Cancel order failed");
    return addCors(
      NextResponse.json({ error: "Failed to cancel order" }, { status: 500 }),
      origin,
    );
  }
});
