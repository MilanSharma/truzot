import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

const log = require("@/lib/logger").createLogger("get-session");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json({ error: "Missing session_id" }, { status: 400 });
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    return NextResponse.json({
      amount: session.amount_total ? session.amount_total / 100 : 0,
      currency: (session.currency || "USD").toUpperCase(),
      email: session.customer_details?.email || "",
      paymentStatus: session.payment_status, // "paid" | "unpaid" | "no_payment_required"
    });
  } catch (err: any) {
    log.error({ err }, "Failed to fetch Stripe session");
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
