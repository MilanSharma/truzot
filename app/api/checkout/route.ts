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

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const stripe = getStripe();
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
      hairColor,
      clothing,
      background,
      framing,
      selectedStyles,
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
          hairColor,
          clothing,
          background,
          framing,
          selectedStyles: selectedStyles || [],
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

    const orderId = order.id;

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const label = `${planConfig.name} — ${planConfig.shots} Headshots`;

    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "payment",
        customer_email: email,
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
        metadata: { orderId, plan, email },
        success_url: `${baseUrl}/claim-order?order=${orderId}`,
        cancel_url: `${baseUrl}/upload?cancelled=1`,
      });
    } catch (stripeErr) {
      // Clean up the dangling order since Stripe session failed
      await supabase.from("orders").delete().eq("id", orderId);
      throw stripeErr;
    }

    return addCors(NextResponse.json({ url: session.url }), origin);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown checkout error";
    log.error(
      {
        err:
          err instanceof Error
            ? { message: err.message, stack: err.stack }
            : err,
      },
      "Checkout failed",
    );
    return addCors(
      NextResponse.json({ error: message }, { status: 500 }),
      origin,
    );
  }
});
