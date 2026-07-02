import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("receipt-url");

export const POST = withContext(async (req: Request) => {
 try {
 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!token) {
 return NextResponse.json(
 { error: "Authentication required" },
 { status: 401 },
 );
 }
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(token);
 if (!user) {
 return NextResponse.json({ error: "Invalid token" }, { status: 401 });
 }

 const { paymentIntent } = await req.json() as { paymentIntent?: string };
 if (!paymentIntent) {
 return NextResponse.json(
 { error: "Missing paymentIntent" },
 { status: 400 },
 );
 }

 // Verify the user owns this payment intent
 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("user_id")
 .eq("stripe_payment_intent", paymentIntent)
 .maybeSingle();
 if (!order || order.user_id !== user.id) {
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 const stripe = getStripe();
 const pi = await stripe.paymentIntents.retrieve(paymentIntent);
 const chargeId =
 typeof pi.latest_charge === "string"
 ? pi.latest_charge
 : pi.latest_charge?.id;
 if (!chargeId) {
 return NextResponse.json({ url: null });
 }

 const charge = await stripe.charges.retrieve(chargeId);
 return NextResponse.json({ url: charge.receipt_url || null });
 } catch (err) {
 log.error({ err }, "Failed to fetch receipt URL");
 return NextResponse.json(
 { error: "Failed to fetch receipt URL" },
 { status: 500 },
 );
 }
});
