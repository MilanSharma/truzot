import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PLANS } from "@/lib/plans";

export async function POST(req: Request) {
  try {
    const { coupon, plan } = await req.json();

    if (!coupon || !plan) {
      return NextResponse.json({ error: "Missing coupon or plan" }, { status: 400 });
    }

    if (!PLANS[plan as keyof typeof PLANS]) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const planConfig = PLANS[plan as keyof typeof PLANS];
    const couponUpper = coupon.toUpperCase();
    let discountAmount = 0;
    let appliedDiscountCode: string | undefined;

    // Mirrors the authoritative floor in /api/checkout — inference + one-time
    // LoRA training + Stripe's cut. This endpoint is advisory (it only drives
    // the UI's price preview); /api/checkout is what actually enforces it.
    const PLAN_SHOTS = { basic: 40, pro: 100, executive: 150 };
    const expectedShots = PLAN_SHOTS[plan as keyof typeof PLAN_SHOTS];
    const minimumViablePrice = Math.ceil(
      (expectedShots * 3.54 + 200 + 30) / (1 - 0.029),
    );

    // Check waitlist discount codes
    if (couponUpper.startsWith("TRUZOT-")) {
      const possibleCodes = Array.from(
        new Set([
          couponUpper,
          couponUpper.replace(/O/g, "0"),
          couponUpper.replace(/0/g, "O"),
        ]),
      );

      const staleBefore = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: entry } = await supabaseAdmin
        .from("waitlist")
        .select("id, discount_code")
        .in("discount_code", possibleCodes)
        .eq("used", false)
        // Don't green-light a code that another in-flight checkout already
        // holds — otherwise the UI promises a discount that /api/checkout
        // will then correctly refuse.
        .or(`reserved_at.is.null,reserved_at.lt.${staleBefore}`)
        .maybeSingle();

      if (entry) {
        // 20% (not a flat $5) - matches WELCOME20, the sitewide code any
        // anonymous visitor already gets from the homepage banner. A flat $5
        // was worth LESS than WELCOME20 on every single plan ($5.80-$11.80),
        // meaning the "exclusive" reward for someone who actually tried the
        // product and gave their email was a worse deal than what a visitor
        // gets for doing nothing. Same rate already approved for WELCOME20,
        // not a new discount decision.
        discountAmount = Math.round(planConfig.amount * 0.2);
        appliedDiscountCode = entry.discount_code || couponUpper;

        if (planConfig.amount - discountAmount < minimumViablePrice) {
          return NextResponse.json(
            { error: "This discount can't be applied to that plan." },
            { status: 400 },
          );
        }
      } else {
        return NextResponse.json({ error: "Invalid discount code" }, { status: 400 });
      }
    } else {
      // Check Stripe coupons
      try {
        const stripe = getStripe();
        const stripeCoupon = await stripe.coupons.retrieve(couponUpper);
        if (!stripeCoupon.valid) {
          return NextResponse.json({ error: "Invalid discount code" }, { status: 400 });
        }
        appliedDiscountCode = couponUpper;
        
        // Calculate discount from Stripe coupon
        if (stripeCoupon.amount_off) {
          discountAmount = stripeCoupon.amount_off;
        } else if (stripeCoupon.percent_off) {
          discountAmount = Math.round(planConfig.amount * (stripeCoupon.percent_off / 100));
        }
        
        if (planConfig.amount - discountAmount < minimumViablePrice) {
          return NextResponse.json(
            { error: "This discount can't be applied to that plan." },
            { status: 400 },
          );
        }
      } catch (err) {
        return NextResponse.json({ error: "Invalid discount code" }, { status: 400 });
      }
    }

    const finalAmount = discountAmount > 0 ? planConfig.amount - discountAmount : planConfig.amount;

    return NextResponse.json({
      valid: true,
      discountAmount,
      finalAmount,
      appliedDiscountCode,
    });
  } catch (err) {
    console.error("Coupon validation error:", err);
    return NextResponse.json({ error: "Failed to validate coupon" }, { status: 500 });
  }
}
