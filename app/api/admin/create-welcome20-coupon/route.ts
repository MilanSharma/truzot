import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";

// One-time setup endpoint to create the WELCOME20 coupon, replacing
// WELCOME10 (10% -> 20%). Same pattern as the original WELCOME10 route.
// Gated by its own throwaway literal secret since it's a standalone
// single-use call, not part of the cron system. Delete after running once.
const ONE_TIME_SECRET = "b3e91f4a7c62d80519fe3a8c6d17092bfa54d21c8e0736f195a";

export async function POST(req: Request) {
  const authHeader = req.headers.get("x-truzot-secret");
  if (authHeader !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  try {
    const existing = await stripe.coupons.retrieve("WELCOME20");
    return NextResponse.json({ message: "Already exists", coupon: existing });
  } catch {
    // Not found — create it.
  }

  const coupon = await stripe.coupons.create({
    id: "WELCOME20",
    name: "New Customer 20% Off",
    percent_off: 20,
    duration: "once",
  });

  return NextResponse.json({ message: "Created", coupon });
}

// Delete the superseded WELCOME10 coupon so stale bookmarked/cached links
// stop applying the smaller discount once WELCOME20 is confirmed live.
export async function DELETE(req: Request) {
  const authHeader = req.headers.get("x-truzot-secret");
  if (authHeader !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = getStripe();
  try {
    const deleted = await stripe.coupons.del("WELCOME10");
    return NextResponse.json({ message: "Deleted", deleted });
  } catch (err) {
    return NextResponse.json({ message: "Not found or already deleted", error: String(err) });
  }
}
