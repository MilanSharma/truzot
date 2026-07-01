import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("download-token");

export const POST = withContext(async (req: Request) => {
 try {
 const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!authHeader)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(authHeader);
 if (!user)
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

 const { orderId } = await req.json();
 if (!orderId)
 return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("user_id")
 .eq("id", orderId)
 .single();
 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });
 if (order.user_id !== user.id)
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 const { data: tokenRow, error } = await supabaseAdmin
 .from("download_tokens")
 .insert({
 user_id: user.id,
 order_id: orderId,
 expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
 })
 .select("id")
 .single();

 if (error || !tokenRow) {
 log.error({ err: error }, "Failed to create download token");
 return NextResponse.json(
 { error: "Failed to create download token" },
 { status: 500 },
 );
 }

 return NextResponse.json({ token: tokenRow.id });
 } catch (err) {
 log.error({ err }, "Download token error");
 return NextResponse.json({ error: "Internal error" }, { status: 500 });
 }
});
