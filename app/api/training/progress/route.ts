import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { addCors } from "@/lib/cors";
import { fal } from "@/lib/ai/fal-client-module";

const log = createLogger("training-progress");

export const GET = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!token)
 return addCors(
 NextResponse.json(
 { error: "Authentication required" },
 { status: 401 },
 ),
 origin,
 );
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(token);
 if (!user)
 return addCors(
 NextResponse.json({ error: "Invalid token" }, { status: 401 }),
 origin,
 );

 const { searchParams } = new URL(req.url);
 const orderId = searchParams.get("orderId");
 if (!orderId)
 return addCors(
 NextResponse.json({ error: "Missing orderId" }, { status: 400 }),
 origin,
 );

 // Verify the requesting user owns this order
 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("user_id")
 .eq("id", orderId)
 .maybeSingle();
 if (order && order.user_id && order.user_id !== user.id) {
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );
 }
 if (!orderId)
 return addCors(
 NextResponse.json({ error: "Missing orderId" }, { status: 400 }),
 origin,
 );

 const { data: training, error } = await supabaseAdmin
 .from("trainings")
 .select("*")
 .eq("order_id", orderId)
 .maybeSingle();

 if (error)
 return addCors(
 NextResponse.json({ error: "Database error" }, { status: 500 }),
 origin,
 );
 if (!training) return addCors(NextResponse.json({ progress: 0 }), origin);

 if (training.status === "generating" || training.status === "completed") {
 return addCors(NextResponse.json({ progress: 100 }), origin);
 }
 if (training.status === "failed") {
 return addCors(
 NextResponse.json({ progress: 0, status: "failed" }),
 origin,
 );
 }
 if (training.status !== "training") {
 return addCors(NextResponse.json({ progress: 0 }), origin);
 }

 if (training.request_id) {
 try {
 const status = await fal.queue.status(
 "fal-ai/flux-lora-fast-training",
 {
 requestId: training.request_id,
 logs: true,
 },
 );

 if (status.status === "COMPLETED")
 return addCors(NextResponse.json({ progress: 100 }), origin);

 if (status.status === "IN_QUEUE") {
 const queuePosition =
 "queue_position" in status ? (status as any).queue_position : 0;
 return addCors(
 NextResponse.json({
 progress: Math.max(1, 10 - queuePosition * 2),
 status: "in_queue",
 queuePosition,
 }),
 origin,
 );
 }

 if (status.status === "IN_PROGRESS") {
 const logs = (status as any).logs || [];
 for (const entry of logs) {
 const msg =
 typeof entry === "string" ? entry : entry?.message || "";
 const stepMatch = msg.match(/Step\s*(\d+)\s*[\/|of]\s*(\d+)/i);
 if (stepMatch) {
 const step = parseInt(stepMatch[1]);
 const total = parseInt(stepMatch[2]);
 return addCors(
 NextResponse.json({
 progress: Math.round((step / total) * 100),
 status: "in_progress",
 step,
 total,
 }),
 origin,
 );
 }
 }
 return addCors(
 NextResponse.json({ progress: 50, status: "in_progress" }),
 origin,
 );
 }
 } catch (err) {
 log.warn({ err, orderId }, "FAL queue status check failed");
 }
 }

 return addCors(NextResponse.json({ progress: 0 }), origin);
 } catch (err) {
 log.error({ err }, "Training progress error");
 return addCors(
 NextResponse.json({ error: "Internal error" }, { status: 500 }),
 origin,
 );
 }
});
