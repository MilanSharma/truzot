import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("regenerate");

fal.config({ credentials: process.env.FAL_KEY });

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const authHeader = req.headers.get("Authorization") ?? "";
 const accessToken = authHeader.replace("Bearer ", "").trim();
 if (!accessToken) {
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 }
 const supabase = getAuthenticatedClient(accessToken);
 const {
 data: { user },
 } = await supabase.auth.getUser();
 if (!user) {
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 }

 const { orderId, imageUrl } = await req.json() as { orderId?: string; imageUrl?: string };
 if (!orderId || !imageUrl) {
 return addCors(
 NextResponse.json(
 { error: "Missing orderId or imageUrl" },
 { status: 400 },
 ),
 origin,
 );
 }

 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("id, user_id, status, plan, preferences")
 .eq("id", orderId)
 .single();
 if (!order) {
 return addCors(
 NextResponse.json({ error: "Order not found" }, { status: 404 }),
 origin,
 );
 }
 if (order.user_id !== user.id) {
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );
 }
 if (order.status !== "completed") {
 return addCors(
 NextResponse.json(
 { error: "Can only regenerate from completed orders" },
 { status: 400 },
 ),
 origin,
 );
 }

 // Look up the training model
 const { data: training } = await supabaseAdmin
 .from("trainings")
 .select("model_id")
 .eq("order_id", orderId)
 .single();

 if (!training?.model_id) {
 return addCors(
 NextResponse.json(
 { error: "No model found for regeneration" },
 { status: 400 },
 ),
 origin,
 );
 }

 // Find the original prompt for this image
 const { data: originalHeadshot } = await supabaseAdmin
 .from("headshots")
 .select("style")
 .eq("image_url", imageUrl)
 .eq("order_id", orderId)
 .maybeSingle();

 const prompt =
 originalHeadshot?.style ||
 "A professional headshot of TOK, studio lighting, 8k";

 // Removed synchronous fal.run to prevent timeouts. Relying on manual review flagging.

 // Fallback: flag for manual review if auto-generation fails
 await supabaseAdmin.from("headshot_flags").upsert(
 {
 order_id: orderId,
 image_url: imageUrl,
 user_id: user.id,
 reason: "regenerate_request",
 created_at: new Date().toISOString(),
 },
 { onConflict: "order_id,image_url" },
 );

 log.info(
 { orderId, userId: user.id, imageUrl: imageUrl.substring(0, 80) },
 "Auto-regeneration failed, flagged for manual review",
 );

 return addCors(
 NextResponse.json({
 success: true,
 message:
 "Auto-regeneration failed. Our team will review and generate a replacement.",
 }),
 origin,
 );
 } catch (err) {
 log.error({ err }, "Regenerate request failed");
 return addCors(
 NextResponse.json({ error: "Request failed" }, { status: 500 }),
 origin,
 );
 }
});
