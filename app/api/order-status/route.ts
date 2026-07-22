import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLAN_SHOTS } from "@/lib/plans";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

export const OPTIONS = handleOptions;

export const GET = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 const { searchParams } = new URL(req.url);
 const orderId = searchParams.get("orderId");
 const downloadToken = searchParams.get("download_token");
 const emailToken = searchParams.get("email_token");

 if (!orderId)
 return addCors(
 NextResponse.json({ error: "Missing orderId" }, { status: 400 }),
 origin,
 );

 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 let userId: string | null = null;
 let order: {
 status: string;
 plan: string;
 user_id: string | null;
 regenerate_credits: number | null;
 } | null = null;

 // 1. Try download_token first for anonymous access
 if (downloadToken) {
 const { data: tokenRow } = await supabaseAdmin
 .from("download_tokens")
 .select("user_id, order_id, expires_at")
 .eq("id", downloadToken)
 .maybeSingle();

 if (tokenRow && new Date(tokenRow.expires_at) > new Date()) {
 userId = tokenRow.user_id;
 const { data: tokOrder } = await supabaseAdmin
 .from("orders")
 .select("status, plan, user_id, regenerate_credits")
 .eq("id", orderId)
 .maybeSingle();
 order = tokOrder;
 }
 }

 // 2. Validate email_token for secure guest access via email link
 if (!order && emailToken) {
 const secret = process.env.CRON_SECRET!;
 const expected = createHmac("sha256", secret)
 .update(orderId)
 .digest("hex")
 .substring(0, 32);
 if (emailToken === expected) {
 const { data: tokOrder } = await supabaseAdmin
 .from("orders")
 .select("status, plan, user_id, regenerate_credits")
 .eq("id", orderId)
 .maybeSingle();
 if (tokOrder) {
 order = tokOrder;
 userId = "email-token-auth"; // Dummy ID to pass subsequent checks
 }
 }
 }

 // 3. Fall back to authenticated access
 if (!order && token) {
 const supabase = getAuthenticatedClient(token);
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (user) {
 userId = user.id;
 const { data: authOrder } = await supabase
 .from("orders")
 .select("status, plan, user_id, regenerate_credits")
 .eq("id", orderId)
 .maybeSingle();
 order = authOrder;
 }
 }

 if (!order)
 return addCors(
 NextResponse.json({ error: "Order not found" }, { status: 404 }),
 origin,
 );

 // Only allow access if user owns the order or is anonymous with a valid token
 if (
 order.user_id &&
 userId &&
 userId !== "email-token-auth" &&
 order.user_id !== userId
 )
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );

 let headshots: {
 id: string;
 image_url: string;
 style: string;
 category: string;
 created_at: string;
 }[] = [];
 let count = 0;
 const target = PLAN_SHOTS[order.plan] ?? 40;

 if (order.status === "completed") {
 const { data: shots } = await supabaseAdmin
 .from("headshots")
 .select("id, image_url, style, category, created_at")
 .eq("order_id", orderId)
 .order("created_at", { ascending: true });
 headshots = (shots || []).map((h) => ({
   id: h.id,
   image_url: h.image_url,
   style: h.style ?? "",
   category: h.category ?? "",
   created_at: h.created_at,
 }));
 count = headshots.length;
 } else if (order.status === "generating") {
 const { count: generatedCount } = await supabaseAdmin
 .from("headshots")
 .select("id", { count: "exact", head: true })
 .eq("order_id", orderId);
 count = generatedCount ?? 0;
 }

 return addCors(
 NextResponse.json({
 status: order.status,
 headshots,
 count,
 target,
 regenerateCredits: order.regenerate_credits ?? 0,
 }),
 origin,
 );
});
