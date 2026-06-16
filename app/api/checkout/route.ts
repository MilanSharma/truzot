import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLANS } from "@/lib/plans";
import { checkoutSchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";
import type Stripe from "stripe";

const log = createLogger("checkout");

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const stripe = getStripe();
    const body = await req.json();
    const parsed = validate(checkoutSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    let {
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
      shootName,
      coupon,
    } = parsed.data!;

    // Basic email domain validation
    const emailDomain = email.split("@")[1];
    if (!emailDomain || emailDomain.length < 4 || !emailDomain.includes(".")) {
      return addCors(
        NextResponse.json(
          { error: "Please provide a valid email address." },
          { status: 400 },
        ),
        origin,
      );
    }

    // Generate signed download URL from storagePath if zipUrl not provided
    if (!zipUrl && storagePath) {
      const { data } = await supabaseAdmin.storage
        .from("uploads")
        .createSignedUrl(storagePath, 7200);
      zipUrl = data?.signedUrl;
    }

    if (!PLANS[plan])
      return addCors(
        NextResponse.json({ error: "Invalid plan" }, { status: 400 }),
        origin,
      );
    const planConfig = PLANS[plan];

    // Try to get authenticated user
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    let supabase;

    if (token) {
      supabase = getAuthenticatedClient(token);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user)
        return addCors(
          NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
          origin,
        );
      // Enforce email verification for email/password users (Bypassed to reduce checkout friction)
      /*
      if (user.app_metadata?.provider === "email" && !user.email_confirmed_at) {
        return addCors(
          NextResponse.json(
            {
              error:
                "Please verify your email address before checking out. Check your inbox for the verification link.",
              needsVerification: true,
            },
            { status: 403 },
          ),
          origin,
        );
      }
      */
      userId = user.id;
    } else {
      supabase = supabaseAdmin;
    }

    let discount: Stripe.Checkout.SessionCreateParams.Discount | undefined;
    let appliedDiscountCode: string | undefined;
    let discountAmount = 0;

    if (coupon) {
      const couponUpper = coupon.toUpperCase();

      // Check for waitlist discount codes (TRUZOT-XXXXXXXX format)
      if (couponUpper.startsWith("TRUZOT-")) {
        // Handle optical confusion between O and 0
        const possibleCodes = Array.from(
          new Set([
            couponUpper,
            couponUpper.replace(/O/g, "0"),
            couponUpper.replace(/0/g, "O"),
          ]),
        );

        const { data: waitlistEntry, error: waitlistError } =
          await supabaseAdmin
            .from("waitlist")
            .select("id, discount_code, used")
            .in("discount_code", possibleCodes)
            .maybeSingle();

        if (waitlistError) {
          log.warn(
            { coupon: couponUpper, err: waitlistError },
            "Waitlist lookup failed",
          );
        } else if (!waitlistEntry) {
          log.warn({ coupon: couponUpper }, "Discount code not found");
        } else if (waitlistEntry.used) {
          log.warn({ coupon: couponUpper }, "Discount code already used");
        } else {
          // Apply $5 flat discount (500 cents) matching the exit intent popup
          discountAmount = 500;
          appliedDiscountCode = waitlistEntry.discount_code || couponUpper;
          // Mark discount for Stripe (using amount_off)
          discount = {
            coupon: "waitlist_5_off", // placeholder
          };
          log.info(
            { coupon: couponUpper, discountAmount },
            "Waitlist discount applied",
          );
        }
      } else {
        // Check Stripe coupons
        try {
          const stripeCoupon = await stripe.coupons.retrieve(couponUpper);
          if (
            stripeCoupon.valid &&
            (!stripeCoupon.redeem_by ||
              stripeCoupon.redeem_by * 1000 > Date.now()) &&
            (stripeCoupon.max_redemptions === null ||
              stripeCoupon.times_redeemed < stripeCoupon.max_redemptions)
          ) {
            discount = { coupon: stripeCoupon.id };
            appliedDiscountCode = couponUpper;
          } else {
            log.warn(
              { coupon: couponUpper },
              "Invalid or expired coupon attempted",
            );
          }
        } catch (err) {
          log.warn({ coupon: couponUpper, err }, "Coupon not found");
        }
      }
    }

    const finalAmount =
      discountAmount > 0
        ? planConfig.amount - discountAmount
        : planConfig.amount;

    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    if (idempotencyKey) {
      const { data: existing } = await supabase
        .from("orders")
        .select("id, status, plan, email")
        .filter("preferences->>idempotency_key", "eq", idempotencyKey)
        .maybeSingle();
      if (existing) {
        if (existing.status !== "pending") {
          return addCors(
            NextResponse.json(
              { error: "This order is already being processed." },
              { status: 400 },
            ),
            origin,
          );
        }

        const label = `${planConfig.name} — ${planConfig.shots} Headshots`;
        let customerId: string | undefined;
        const existingCustomers = await stripe.customers.list({
          email: existing.email || email,
          limit: 1,
        });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }

        const cookieHeader = req.headers.get("cookie") || "";
        const rewardfulMatch = cookieHeader.match(
          /rewardful\.referral=([^;]+)/,
        );
        const referralId = rewardfulMatch ? rewardfulMatch[1] : undefined;

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          mode: "payment",
          customer: customerId,
          customer_email: customerId ? undefined : existing.email || email,
          client_reference_id: referralId,
          automatic_tax: { enabled: false },
          billing_address_collection: "auto",
          line_items: [
            {
              price_data: {
                currency: "usd",
                product_data: {
                  name: label,
                  description: "AI Professional Headshots",
                },
                unit_amount: finalAmount,
              },
              quantity: 1,
            },
          ],
          metadata: {
            orderId: existing.id,
            plan: existing.plan,
            email: existing.email || email,
            userId: userId || "",
            coupon: coupon || "",
            discount_code: appliedDiscountCode || "",
            discount_amount: discountAmount.toString(),
          },
          success_url: `${baseUrl}/claim-order?order=${existing.id}`,
          cancel_url: `${baseUrl}/upload?cancelled=1`,
          ...(discount && !discountAmount ? { discounts: [discount] } : {}),
        });

        return addCors(NextResponse.json({ url: session.url }), origin);
      }
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        email,
        plan,
        amount_cents: finalAmount,
        original_amount_cents: planConfig.amount,
        discount_amount_cents: discountAmount,
        discount_code: appliedDiscountCode || null,
        status: "pending",
        zip_url: zipUrl,
        user_id: userId,
        shoot_name: shootName || null,
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

    if (orderError || !order) {
      log.error(
        { error: orderError, body: { plan, email, userId, shootName } },
        "Order insert failed",
      );
      return addCors(
        NextResponse.json(
          {
            error: `Failed to create order: ${orderError?.message || "Unknown error"}`,
          },
          { status: 500 },
        ),
        origin,
      );
    }

    const orderId = order.id;

    try {
      const label = `${planConfig.name} — ${planConfig.shots} Headshots`;

      // Look up or create Stripe customer to avoid duplicates
      let customerId: string | undefined;
      const existingCustomers = await stripe.customers.list({
        email,
        limit: 1,
      });
      if (existingCustomers.data.length > 0) {
        customerId = existingCustomers.data[0].id;
      }

      // Extract Rewardful referral ID from cookie
      const cookieHeader = req.headers.get("cookie") || "";
      const rewardfulMatch = cookieHeader.match(/rewardful\.referral=([^;]+)/);
      const referralId = rewardfulMatch ? rewardfulMatch[1] : undefined;

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        mode: "payment",
        customer: customerId,
        customer_email: customerId ? undefined : email,
        client_reference_id: referralId,
        automatic_tax: { enabled: false },
        billing_address_collection: "auto",
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: label,
                description: "AI Professional Headshots",
              },
              unit_amount: finalAmount,
            },
            quantity: 1,
          },
        ],
        metadata: {
          orderId,
          plan,
          email,
          userId: userId || "",
          coupon: coupon || "",
          discount_code: appliedDiscountCode || "",
          discount_amount: discountAmount.toString(),
        },
        success_url: `${baseUrl}/claim-order?order=${orderId}`,
        cancel_url: `${baseUrl}/upload?cancelled=1`,
        ...(discount && !discountAmount ? { discounts: [discount] } : {}),
      };
      const requestOptions: Stripe.RequestOptions = {};
      if (idempotencyKey) {
        requestOptions.idempotencyKey = `checkout-${idempotencyKey}`;
      }
      const session = await stripe.checkout.sessions.create(
        sessionParams,
        requestOptions,
      );

      return addCors(NextResponse.json({ url: session.url }), origin);
    } catch (err) {
      await supabase.from("orders").delete().eq("id", orderId);
      throw err;
    }
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
