import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLANS } from "@/lib/plans";
import { checkoutSchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("checkout");

const STRIPE_PRICE_IDS: Record<string, string> = {
  basic: process.env.STRIPE_PRICE_BASIC!,
  pro: process.env.STRIPE_PRICE_PRO!,
  executive: process.env.STRIPE_PRICE_EXECUTIVE!,
};

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  const stripe = getStripe();
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

    const body = await req.json();
    const parsed = validate(checkoutSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    const {
      plan,
      email,
      zipUrl,
      storagePath,
      gender,
      eyeColor,
      profession,
      idempotencyKey,
    } = parsed.data!;

    if (!PLANS[plan])
      return addCors(
        NextResponse.json({ error: "Invalid plan" }, { status: 400 }),
        origin,
      );
    const planConfig = PLANS[plan];

    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id")
        .filter("preferences->>idempotency_key", "eq", idempotencyKey)
        .maybeSingle();
      if (existing) {
        return addCors(
          NextResponse.json({ orderId: existing.id, existing: true }),
          origin,
        );
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        email,
        plan,
        amount_cents: planConfig.amount,
        status: "pending",
        zip_url: zipUrl,
        user_id: user.id,
        preferences: {
          gender,
          eyeColor,
          profession,
          storagePath: storagePath || null,
          idempotency_key: idempotencyKey || undefined,
        },
      })
      .select("id")
      .single();

    if (orderError || !order)
      return addCors(
        NextResponse.json({ error: "Failed to create order" }, { status: 500 }),
        origin,
      );

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const priceId = STRIPE_PRICE_IDS[plan];
    const label = `${planConfig.name} — ${planConfig.shots} Headshots`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: email,
      line_items: priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
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
      metadata: { orderId: order.id, plan, email },
      success_url: `${baseUrl}/dashboard?order=${order.id}&success=1`,
      cancel_url: `${baseUrl}/upload?cancelled=1`,
    });

    return addCors(NextResponse.json({ url: session.url }), origin);
  } catch (err) {
    log.error({ err }, "Checkout failed");
    return addCors(
      NextResponse.json({ error: "Checkout failed" }, { status: 500 }),
      origin,
    );
  }
});
