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

    // Calculate minimum viable price based on fal.ai generation costs
    // Basic: 40 images × $0.035 = $1.40 minimum
    // Pro: 100 images × $0.035 = $3.50 minimum  
    // Executive: 150 images × $0.035 = $5.25 minimum
    const PLAN_SHOTS = { basic: 40, pro: 100, executive: 150 };
    const COST_PER_IMAGE = 0.035; // $0.035 per megapixel
    const expectedShots = PLAN_SHOTS[plan as keyof typeof PLAN_SHOTS];
    const minimumViablePrice = Math.ceil(expectedShots * COST_PER_IMAGE * 100); // Convert to cents

    // Check waitlist discount codes
    if (couponUpper.startsWith("TRUZOT-")) {
      const possibleCodes = Array.from(
        new Set([
          couponUpper,
          couponUpper.replace(/O/g, "0"),
          couponUpper.replace(/0/g, "O"),
        ]),
      );

      const { data: entry } = await supabaseAdmin
        .from("waitlist")
        .select("id, discount_code")
        .in("discount_code", possibleCodes)
        .eq("used", false)
        .maybeSingle();

      if (entry) {
        discountAmount = 500;
        appliedDiscountCode = entry.discount_code || couponUpper;
        
        // TEMPORARILY DISABLED FOR TESTING: Validate that final price doesn't fall below minimum viable cost
        // const finalAmount = planConfig.amount - discountAmount;
        // if (finalAmount < minimumViablePrice) {
        //   return NextResponse.json({ 
        //     error: `Discount too large. Minimum price for ${plan} plan is $${(minimumViablePrice / 100).toFixed(2)} to cover generation costs.` 
        //   }, { status: 400 });
        // }
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
        
        // TEMPORARILY DISABLED FOR TESTING: Validate that final price doesn't fall below minimum viable cost
        // const finalAmount = planConfig.amount - discountAmount;
        // if (finalAmount < minimumViablePrice) {
        //   return NextResponse.json({ 
        //     error: `Discount too large. Minimum price for ${plan} plan is $${(minimumViablePrice / 100).toFixed(2)} to cover generation costs.` 
        //   }, { status: 400 });
        // }
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
