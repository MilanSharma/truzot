import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLANS } from "@/lib/plans";
import { checkoutSchema, validate } from "@/lib/validations";
import * as Sentry from "@sentry/nextjs";
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
 const body = await req.json() as Record<string, unknown>;
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

 // Email validation is securely handled by Zod schema (checkoutSchema)

 // Verify storage path exists before creating Stripe session
 if (!zipUrl && storagePath) {
 try {
 const folder = storagePath.split("/")[0];
 const filename = storagePath.split("/").pop();
 const { data: listData } = await supabaseAdmin.storage
 .from("uploads")
 .list(folder, { search: filename });
 if (!listData || listData.length === 0) {
 return addCors(
 NextResponse.json(
 { error: "Uploaded file not found. Please re-upload your photos." },
 { status: 404 },
 ),
 origin,
 );
 }
 const { data } = await supabaseAdmin.storage
 .from("uploads")
 .createSignedUrl(storagePath, 7200);
 zipUrl = data?.signedUrl;
 } catch (err) {
 return addCors(
 NextResponse.json(
 { error: "Failed to verify uploaded file. Please re-upload your photos." },
 { status: 404 },
 ),
 origin,
 );
 }
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
 // Enforce email verification for email/password users
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
 
 userId = user.id;
 } else {
 supabase = supabaseAdmin;
 }

 let discount: Stripe.Checkout.SessionCreateParams.Discount | undefined;
 let appliedDiscountCode: string | undefined;
 let discountAmount = 0;

 if (coupon) {
 const couponUpper = coupon.toUpperCase();

 let waitlistEntry: { id: string; discount_code: string } | null = null;
 let waitlistError: any = null;

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

 // Check if discount code exists and is valid (but don't mark as used yet)
 const { data: entry, error: err } = await supabaseAdmin
 .from("waitlist")
 .select("id, discount_code")
 .in("discount_code", possibleCodes)
 .eq("used", false)
 .maybeSingle();

 waitlistEntry = entry;
 waitlistError = err;

 if (waitlistError) {
 return addCors(
 NextResponse.json(
 { error: "Failed to validate discount code." },
 { status: 500 },
 ),
 origin,
 );
 } else if (!waitlistEntry) {
 return addCors(
 NextResponse.json(
 { error: "This discount code has already been used or is invalid." },
 { status: 400 },
 ),
 origin,
 );
 } else {
 // Apply $5 flat discount (500 cents) matching the exit intent popup
 discountAmount = 500;
 appliedDiscountCode = waitlistEntry.discount_code || couponUpper;

 // Mark discount for Stripe (using amount_off)
 // Waitlist discount applied via unit_amount
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
 !stripeCoupon.valid ||
 (stripeCoupon.redeem_by &&
 stripeCoupon.redeem_by * 1000 < Date.now()) ||
 (stripeCoupon.max_redemptions !== null &&
 stripeCoupon.times_redeemed >= stripeCoupon.max_redemptions)
 ) {
 return addCors(
 NextResponse.json(
 { error: "This coupon is invalid or has already been used." },
 { status: 400 },
 ),
 origin,
 );
 }
 discount = { coupon: stripeCoupon.id };
 appliedDiscountCode = couponUpper;
 } catch (err) {
 return addCors(
 NextResponse.json(
 { error: "Coupon code not found." },
 { status: 400 },
 ),
 origin,
 );
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
        const pkMatch = cookieHeader.match(/promotekit_referral=([^;]+)/);
        const pkReferral = pkMatch ? pkMatch[1] : undefined;

 const emailToken = createHmac("sha256", process.env.CRON_SECRET!)
 .update(existing.id)
 .digest("hex")
 .substring(0, 32);
 const existingSession = await stripe.checkout.sessions.create({
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
 promotekit_referral: pkReferral || "",
 },
 success_url: `${baseUrl}/dashboard?order=${existing.id}&email_token=${emailToken}`,
 cancel_url: `${baseUrl}/upload?cancelled=1`,
 ...(discount && !discountAmount ? { discounts: [discount] } : {}),
 });

 // UPDATE the existing pending order with the NEW details (in case user changed photos/plan)
 await supabase
 .from("orders")
 .update({
 plan,
 email,
 amount_cents: finalAmount,
 zip_url: zipUrl,
 shoot_name: shootName || null,
 original_amount_cents: planConfig.amount,
 discount_amount_cents: discountAmount,
 discount_code: appliedDiscountCode || null,
 preferences: {
 gender,
 eyeColor,
 hairColor,
 clothing,
 background,
 framing,
 selectedStyles: selectedStyles || [],
 storagePath: storagePath || null,
 idempotency_key: idempotencyKey,
 },
 })
 .eq("id", existing.id);

 return addCors(NextResponse.json({ url: existingSession.url }), origin);
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

 if (orderError) {
 // Handle unique constraint violation (race condition on pending order)
 if (orderError.code === "23505") {
 log.info({ userId, email }, "Pending order conflict - recovering existing order");
 // Search for existing pending order by user_id or email (not idempotencyKey)
 const { data: existing } = await supabase
 .from("orders")
 .select("id, status, plan, email, user_id")
 .or(`user_id.eq.${userId},email.eq.${email}`)
 .eq("status", "pending")
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

 // Update existing order with new idempotencyKey and details
 await supabase
 .from("orders")
 .update({
 plan,
 email,
 amount_cents: finalAmount,
 zip_url: zipUrl,
 shoot_name: shootName || null,
 original_amount_cents: planConfig.amount,
 discount_amount_cents: discountAmount,
 discount_code: appliedDiscountCode || null,
 preferences: {
 gender,
 eyeColor,
 hairColor,
 clothing,
 background,
 framing,
 selectedStyles: selectedStyles || [],
 storagePath: storagePath || null,
 idempotency_key: idempotencyKey,
 },
 })
 .eq("id", existing.id);

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
 const pkMatch = cookieHeader.match(/promotekit_referral=([^;]+)/);
 const pkReferral = pkMatch ? pkMatch[1] : undefined;

 const emailToken = createHmac("sha256", process.env.CRON_SECRET!)
 .update(existing.id)
 .digest("hex")
 .substring(0, 32);
 let existingSession: Stripe.Checkout.Session;
 try {
 existingSession = await stripe.checkout.sessions.create({
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
 promotekit_referral: pkReferral || "",
 },
 success_url: `${baseUrl}/dashboard?order=${existing.id}&email_token=${emailToken}`,
 cancel_url: `${baseUrl}/upload?cancelled=1`,
 ...(discount && !discountAmount ? { discounts: [discount] } : {}),
 });
 } catch (stripeErr) {
 // Discount code is no longer marked at checkout time, so no rollback needed
 throw stripeErr;
 }

 // UPDATE the existing pending order with the NEW details
 // Use WHERE clause to prevent concurrent updates from overwriting data
 const { error: updateError } = await supabase
 .from("orders")
 .update({
 plan,
 email,
 amount_cents: finalAmount,
 zip_url: zipUrl,
 shoot_name: shootName || null,
 original_amount_cents: planConfig.amount,
 discount_amount_cents: discountAmount,
 discount_code: appliedDiscountCode || null,
 preferences: {
 gender,
 eyeColor,
 hairColor,
 clothing,
 background,
 framing,
 selectedStyles: selectedStyles || [],
 storagePath: storagePath || null,
 idempotency_key: idempotencyKey,
 },
 })
 .eq("id", existing.id);

 // If update failed due to concurrent modification, fetch the latest order and return its session
 if (updateError) {
 log.warn({ idempotencyKey, err: updateError }, "Concurrent order update detected, fetching latest order");
 const { data: latestOrder } = await supabase
 .from("orders")
 .select("id, status, plan, email")
 .filter("preferences->>idempotency_key", "eq", idempotencyKey)
 .maybeSingle();
 if (latestOrder && latestOrder.status === "pending") {
 // Re-create session with latest order details
 const label = `${planConfig.name} — ${planConfig.shots} Headshots`;
 let customerId: string | undefined;
 const existingCustomers = await stripe.customers.list({
 email: latestOrder.email || email,
 limit: 1,
 });
 if (existingCustomers.data.length > 0) {
 customerId = existingCustomers.data[0].id;
 }
 const emailToken = createHmac("sha256", process.env.CRON_SECRET!)
 .update(latestOrder.id)
 .digest("hex")
 .substring(0, 32);
 const retrySession = await stripe.checkout.sessions.create({
 payment_method_types: ["card"],
 mode: "payment",
 customer: customerId,
 customer_email: customerId ? undefined : latestOrder.email || email,
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
 orderId: latestOrder.id,
 plan: latestOrder.plan,
 email: latestOrder.email || email,
 userId: userId || "",
 coupon: coupon || "",
 discount_code: appliedDiscountCode || "",
 discount_amount: discountAmount.toString(),
 promotekit_referral: pkReferral || "",
 },
 success_url: `${baseUrl}/dashboard?order=${latestOrder.id}&email_token=${emailToken}`,
 cancel_url: `${baseUrl}/upload?cancelled=1`,
 ...(discount && !discountAmount ? { discounts: [discount] } : {}),
 });
 return addCors(NextResponse.json({ url: retrySession.url }), origin);
 }
 // If we can't recover, return an error
 return addCors(
 NextResponse.json(
 { error: "Concurrent checkout detected. Please try again." },
 { status: 409 },
 ),
 origin,
 );
 }

 return addCors(NextResponse.json({ url: existingSession.url }), origin);
 }
 }

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

 if (!order) {
 log.error(
 { error: orderError, body: { plan, email, userId, shootName } },
 "Order insert returned no data",
 );
 return addCors(
 NextResponse.json(
 { error: "Failed to create order" },
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
        const pkMatch = cookieHeader.match(/promotekit_referral=([^;]+)/);
        const pkReferral = pkMatch ? pkMatch[1] : undefined;

 const emailToken = createHmac("sha256", process.env.CRON_SECRET!)
 .update(orderId)
 .digest("hex")
 .substring(0, 32);
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
 promotekit_referral: pkReferral || "",
 },
 success_url: `${baseUrl}/dashboard?order=${orderId}&email_token=${emailToken}`,
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
 // Discount code is no longer marked at checkout time, so no rollback needed
 await supabase.from("orders").delete().eq("id", orderId);
 throw err;
 }
 } catch (err) {
 Sentry.captureException(err);
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
