import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
 try {
 // Verify cron secret
 const authHeader = req.headers.get("authorization");
 if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 // Find orders that completed 3 days ago and haven't received upsell email
 const threeDaysAgo = new Date();
 threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

 const { data: eligibleOrders, error } = await supabaseAdmin
 .from("orders")
 .select("*, upsell_emails!left(order_id)")
 .eq("status", "completed")
 .lt("completed_at", threeDaysAgo.toISOString())
 .is("upsell_emails.order_id", null)
 .limit(50); // Process in batches

 if (error) {
 console.error("Error fetching eligible orders:", error);
 return NextResponse.json({ error: error.message }, { status: 500 });
 }

 if (!eligibleOrders || eligibleOrders.length === 0) {
 return NextResponse.json({ message: "No eligible orders found" });
 }

 let sent = 0;
 let failed = 0;

 for (const order of eligibleOrders) {
 try {
 const response = await fetch(
 `${process.env.NEXT_PUBLIC_SITE_URL}/api/upsell-emails`,
 {
 method: "POST",
 headers: { "Content-Type": "application/json", "Authorization": `Bearer ${process.env.CRON_SECRET}` },
 body: JSON.stringify({
 orderId: order.id,
 email: order.email,
 plan: order.plan,
 }),
 },
 );

 if (response.ok) {
 sent++;
 } else {
 failed++;
 }
 } catch (err) {
 console.error(`Failed to send upsell for order ${order.id}:`, err);
 failed++;
 }
 }

 return NextResponse.json({
 message: `Processed ${eligibleOrders.length} orders`,
 sent,
 failed,
 });
 } catch (error) {
 console.error("Upsell cron error:", error);
 return NextResponse.json(
 { error: "Internal server error" },
 { status: 500 },
 );
 }
}
