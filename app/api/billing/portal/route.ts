import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("billing-portal");

export const GET = withContext(async (req: Request) => {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const stripe = getStripe();

    // Find Stripe Customer for this user
    const { data: orders } = await supabase
      .from("orders")
      .select("preferences")
      .not("preferences->>stripe_customer_id", "is", null)
      .order("created_at", { ascending: false })
      .limit(1);
    let customerId: string | null =
      (orders?.[0]?.preferences as Record<string, any>)?.stripe_customer_id ||
      null;

    if (!customerId) {
      const { data: ordersWithPI } = await supabase
        .from("orders")
        .select("stripe_payment_intent")
        .not("stripe_payment_intent", "is", null)
        .limit(1);
      if (ordersWithPI?.[0]?.stripe_payment_intent) {
        const pi = await stripe.paymentIntents.retrieve(
          ordersWithPI[0].stripe_payment_intent as string,
        );
        customerId =
          typeof pi.customer === "string"
            ? pi.customer
            : pi.customer?.id || null;
      }
    }

    if (!customerId) {
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });
      customerId = customers.data[0]?.id || null;
    }

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${siteUrl}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    log.error({ err }, "Billing portal error");
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 },
    );
  }
});
