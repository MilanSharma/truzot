import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { withContext } from "@/lib/request-context";

export const POST = withContext(async (req: Request) => {
 try {
 const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader);
 if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 
 const stripe = getStripe();
 const { orderId, clothing, background } = await req.json() as { orderId?: string; clothing?: string; background?: string };
 if (!orderId || !clothing || !background) {
 return NextResponse.json({ error: "Missing fields" }, { status: 400 });
 }

 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("id, email, user_id, preferences")
 .eq("id", orderId)
 .single();

 if (!order)
 return NextResponse.json({ error: "Order not found" }, { status: 404 });

 if (order.user_id !== user.id)
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });

 const { data: training } = await supabaseAdmin
 .from("trainings")
 .select("model_id")
 .eq("order_id", orderId)
 .single();

 if (!training || !training.model_id) {
 return NextResponse.json(
 { error: "No trained model found to reuse" },
 { status: 400 },
 );
 }

 const originalPrefs = (order.preferences as any) || {};

 const { data: newOrder, error: insertError } = await supabaseAdmin
 .from("orders")
 .insert({
 user_id: order.user_id,
 email: order.email,
 status: "pending",
 plan: "custom_upsell",
 amount_cents: 1400,
 preferences: {
 ...originalPrefs,
 clothing,
 background,
 selectedStyles: ["custom"],
 is_upsell: true,
 parent_order_id: orderId,
 },
 })
 .select()
 .single();

 if (insertError || !newOrder) {
 return NextResponse.json(
 { error: "Failed to create order" },
 { status: 500 },
 );
 }

 // Pass the existing trained model_id into the new order so it doesn't try to retrain
 await supabaseAdmin.from("trainings").insert({
 order_id: newOrder.id,
 status: "generating",
 model_id: training.model_id,
 });

 const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
 try {
      const session = await stripe.checkout.sessions.create({
 payment_method_types: ["card"],
 line_items: [
 {
 price_data: {
 currency: "usd",
 product_data: {
 name: "Custom Studio Pack (20 Headshots)",
 description: `Custom ${clothing} with ${background} background`,
 },
 unit_amount: 1400,
 },
 quantity: 1,
 },
 ],
 mode: "payment",
 success_url: `${baseUrl}/dashboard?order=${newOrder.id}&upsell=success`,
 cancel_url: `${baseUrl}/dashboard?order=${orderId}&upsell=cancelled`,
 customer_email: order.email || undefined,
 metadata: {
 orderId: newOrder.id,
 parent_order_id: orderId,
 type: "custom_upsell",
 plan: "custom_upsell",
 email: order.email || "",
 },
 });

 return NextResponse.json({ url: session.url });
 
    } catch (stripeErr: any) {
      await supabaseAdmin.from("orders").delete().eq("id", newOrder.id);
      return NextResponse.json({ error: stripeErr.message || "Failed to create checkout session" }, { status: 500 });
    }
  } catch (error: any) {
 return NextResponse.json({ error: error.message }, { status: 500 });
 }
});
