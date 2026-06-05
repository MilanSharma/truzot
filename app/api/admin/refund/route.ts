import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("admin-refund");

export const POST = withContext(async (req: Request) => {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    if (!adminEmails.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("stripe_payment_intent")
      .eq("id", orderId)
      .single();
    if (!order?.stripe_payment_intent)
      return NextResponse.json(
        { error: "No payment intent found" },
        { status: 404 },
      );

    const stripe = getStripe();
    const refund = await stripe.refunds.create({
      payment_intent: order.stripe_payment_intent as string,
    });

    await supabaseAdmin
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", orderId);

    log.info({ orderId, refundId: refund.id }, "Refund processed");
    return NextResponse.json({
      message: "Refund processed",
      refundId: refund.id,
    });
  } catch (err) {
    log.error({ err }, "Refund failed");
    return NextResponse.json({ error: "Refund failed" }, { status: 500 });
  }
});
