import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { createHmac } from "crypto";

const log = createLogger("download-token");

export const POST = withContext(async (req: Request) => {
 try {
   const { orderId, email_token } = await req.json() as { orderId?: string; email_token?: string };
   if (!orderId) return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

   const { data: order } = await supabaseAdmin.from("orders").select("user_id").eq("id", orderId).single();
   if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

   let isAuthorized = false;
   let authorizedUserId: string | null = null;
   const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");

   if (authHeader) {
     const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
     if (user && user.id === order.user_id) {
       authorizedUserId = user.id;
       isAuthorized = true;
     }
   } else if (email_token) {
     const expected = createHmac("sha256", process.env.CRON_SECRET!).update(orderId).digest("hex").substring(0, 32);
     if (email_token === expected) {
       authorizedUserId = order.user_id; // Will be null for guests
       isAuthorized = true;
     }
   }

   if (!isAuthorized) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

   const { data: tokenRow, error } = await supabaseAdmin
     .from("download_tokens")
     .insert({
       user_id: authorizedUserId,
       order_id: orderId,
       expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
     })
     .select("id")
     .single();

   if (error || !tokenRow) {
     return NextResponse.json({ error: "Failed to create download token" }, { status: 500 });
   }

   return NextResponse.json({ token: tokenRow.id });
 } catch (err) {
   return NextResponse.json({ error: "Internal error" }, { status: 500 });
 }
});
