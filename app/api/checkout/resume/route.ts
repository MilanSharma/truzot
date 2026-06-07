import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLANS } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import { getStripe } from "@/lib/stripe";

const log = createLogger("resume-checkout");

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
      .from("orders")
      .select("user_id, status, plan, email, preferences")
      .eq("id", orderId)
      .single();
    if (!order || order.user_id !== user.id)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "pending")
      return NextResponse.json(
        { error: "Order is not pending payment" },
        { status: 400 },
      );

    const planConfig = PLANS[order.plan as keyof typeof PLANS];
    if (!planConfig)
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });

    const stripe = getStripe();
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const label = `${planConfig.name} — ${planConfig.shots} Headshots`;

    let customerId: string | undefined;
    const existingCustomers = await stripe.customers.list({
      email: order.email,
      limit: 1,
    });
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    }

    const idempotencyKey = `resume-${orderId}-${Date.now()}`;
    const session = await stripe.checkout.sessions.create(
      {
        payment_method_types: ["card"],
        mode: "payment",
        customer: customerId,
        customer_email: customerId ? undefined : order.email,
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: label,
                description: "AI Professional Headshots",
              },
              unit_amount: planConfig.amount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId,
          plan: order.plan,
          email: order.email,
          userId: user.id,
        },
        success_url: `${baseUrl}/claim-order?order=${orderId}`,
        cancel_url: `${baseUrl}/dashboard`,
      },
      { idempotencyKey },
    );

    return NextResponse.json({ url: session.url });
  } catch (err) {
    log.error({ err }, "Resume checkout failed");
    return NextResponse.json(
      { error: "Failed to resume checkout" },
      { status: 500 },
    );
  }
}
