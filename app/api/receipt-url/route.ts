import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createLogger } from "@/lib/logger";

const log = createLogger("receipt-url");

export const POST = async (req: Request) => {
  try {
    const { paymentIntent } = await req.json();
    if (!paymentIntent) {
      return NextResponse.json(
        { error: "Missing paymentIntent" },
        { status: 400 },
      );
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
};
