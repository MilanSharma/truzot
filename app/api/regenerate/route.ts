import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { regenerateOne } from "@/lib/ai/fal-client";
import { withFalSlot } from "@/lib/fal-concurrency";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("regenerate");

// A single fal-ai/flux-lora call typically finishes in 5-15s; 60s gives
// generous headroom without holding the customer's browser open indefinitely.
export const maxDuration = 60;

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

 // Find the original prompt/category for this image
 const { data: originalHeadshot } = await supabaseAdmin
 .from("headshots")
 .select("id, style, category")
 .eq("image_url", imageUrl)
 .eq("order_id", orderId)
 .maybeSingle();

 if (!originalHeadshot) {
 return addCors(
 NextResponse.json({ error: "Headshot not found" }, { status: 404 }),
 origin,
 );
 }

 const prompt =
 originalHeadshot.style ||
 "A professional headshot of TOK wearing business attire, studio lighting, professional photography.";

 try {
 const { url: newUrl } = await withFalSlot(() =>
 regenerateOne(training.model_id!, order.plan, prompt),
 );

 // Insert-then-delete (not the reverse) so a crash between the two steps
 // leaves the customer with an extra photo, never zero — replacing their
 // set is best-effort, but losing a photo outright is not.
 const { data: inserted, error: insertErr } = await supabaseAdmin
 .from("headshots")
 .insert({
 order_id: orderId,
 image_url: newUrl,
 style: prompt,
 category: originalHeadshot.category,
 })
 .select("id, image_url, style, category, created_at")
 .single();
 if (insertErr || !inserted) throw insertErr || new Error("Insert returned no row");

 await supabaseAdmin.from("headshots").delete().eq("id", originalHeadshot.id);

 log.info({ orderId, userId: user.id }, "Regenerated headshot");
 return addCors(
 NextResponse.json({ success: true, headshot: inserted }),
 origin,
 );
 } catch (genErr) {
 log.error({ err: genErr, orderId, userId: user.id }, "Auto-regeneration failed, flagging for manual review");

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

 return addCors(
 NextResponse.json({
 success: false,
 message:
 "Regeneration failed. We've flagged this for manual review and will follow up by email.",
 }, { status: 502 }),
 origin,
 );
 }
 } catch (err) {
 log.error({ err }, "Regenerate request failed");
 return addCors(
 NextResponse.json({ error: "Request failed" }, { status: 500 }),
 origin,
 );
 }
});
