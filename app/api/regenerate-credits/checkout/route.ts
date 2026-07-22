import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const CREDIT_PRICE_CENTS = 100; // $1 per regenerate, matches the fal.ai cost it covers
const ALLOWED_QUANTITIES = [1, 5, 10];

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const { orderId, quantity } = (await req.json()) as {
      orderId?: string;
      quantity?: number;
    };
    if (!orderId || !ALLOWED_QUANTITIES.includes(quantity as number)) {
      return addCors(
        NextResponse.json({ error: "Missing orderId or invalid quantity" }, { status: 400 }),
        origin,
      );
    }

    // Same guest-vs-claimed trust model as /api/regenerate and /api/download:
    // unclaimed (guest) orders are reachable by anyone holding the order id,
    // claimed orders require the caller's session to match the owner.
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
      userId = user?.id ?? null;
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, email, user_id, status")
      .eq("id", orderId)
      .single();

    if (!order) {
      return addCors(NextResponse.json({ error: "Order not found" }, { status: 404 }), origin);
    }
    if (order.user_id && order.user_id !== userId) {
      return addCors(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), origin);
    }
    if (order.status !== "completed") {
      return addCors(
        NextResponse.json({ error: "Can only buy regenerate credits on a completed order" }, { status: 400 }),
        origin,
      );
    }

    const stripe = getStripe();
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: order.email || undefined,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${quantity} Regenerate Credit${(quantity as number) > 1 ? "s" : ""}`,
              description: "Regenerate individual headshots on your completed shoot",
            },
            unit_amount: CREDIT_PRICE_CENTS,
          },
          quantity,
        },
      ],
      metadata: {
        type: "regenerate_credits",
        orderId,
        credits: String(quantity),
      },
      success_url: `${baseUrl}/dashboard?order=${orderId}&credits_purchased=1`,
      cancel_url: `${baseUrl}/dashboard?order=${orderId}`,
    });

    return addCors(NextResponse.json({ url: session.url }), origin);
  } catch (error: any) {
    return addCors(
      NextResponse.json({ error: error.message || "Failed to create checkout session" }, { status: 500 }),
      origin,
    );
  }
});
