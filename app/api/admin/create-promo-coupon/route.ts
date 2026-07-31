import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// One-time setup endpoint to create the sitewide WELCOME10 coupon in
// whichever Stripe account/mode is actually configured on this deployment
// (avoids copying the live secret key around to run a local script).
// Delete this route after running it once.
export async function POST(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  try {
    const existing = await stripe.coupons.retrieve("WELCOME10");
    return NextResponse.json({ message: "Already exists", coupon: existing });
  } catch {
    // Not found — create it.
  }

  const coupon = await stripe.coupons.create({
    id: "WELCOME10",
    name: "New Customer 10% Off",
    percent_off: 10,
    duration: "once",
  });

  return NextResponse.json({ message: "Created", coupon });
}
