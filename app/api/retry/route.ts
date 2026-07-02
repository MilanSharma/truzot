import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trainModel } from "@/lib/ai/fal-client";
import { retrySchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { isValidTransition } from "@/lib/order-status";

const log = createLogger("retry");

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!token)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(token);
 if (!user)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );

 const body = await req.json() as Record<string, unknown>;
 const parsed = validate(retrySchema, body);
 if (parsed.error)
 return addCors(
 NextResponse.json({ error: parsed.error }, { status: 400 }),
 origin,
 );
 const { orderId } = parsed.data!;

 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("*")
 .eq("id", orderId)
 .single();
 if (!order)
 return addCors(
 NextResponse.json({ error: "Order not found" }, { status: 404 }),
 origin,
 );
 if (order.user_id !== user.id)
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );
 if (!isValidTransition(order.status, "training"))
 return addCors(
 NextResponse.json(
 { error: "Order is not in a retryable state" },
 { status: 400 },
 ),
 origin,
 );

 let zipUrl = order.zip_url;
 const prefs = (order.preferences as Record<string, any>) || {};
 const storagePath = prefs.storagePath as string | undefined;
 if (storagePath) {
 try {
 const { data: newData } = await supabaseAdmin.storage
 .from("uploads")
 .createSignedUrl(storagePath, 7200);
 if (newData?.signedUrl) zipUrl = newData.signedUrl;
 } catch (e) {
 log.error({ err: e, orderId }, "Failed to refresh zip URL");
 }
 }

 await supabaseAdmin
 .from("orders")
 .update({ status: "training" })
 .eq("id", orderId);
 await supabaseAdmin
 .from("trainings")
 .upsert(
 { order_id: orderId, status: "training", error: null, model_id: null },
 { onConflict: "order_id" },
 );

 try {
 await trainModel(zipUrl, orderId);
 } catch (err) {
 await supabaseAdmin
 .from("trainings")
 .update({ status: "failed", error: String(err) })
 .eq("order_id", orderId);
 await supabaseAdmin
 .from("orders")
 .update({ status: "failed" })
 .eq("id", orderId);
 return addCors(
 NextResponse.json(
 { error: "Training failed to start on retry" },
 { status: 500 },
 ),
 origin,
 );
 }

 return addCors(NextResponse.json({ ok: true }), origin);
 } catch (err) {
 log.error({ err }, "Retry failed");
 return addCors(
 NextResponse.json({ error: "Retry failed" }, { status: 500 }),
 origin,
 );
 }
});
