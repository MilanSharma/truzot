import { NextResponse } from "next/server";
import Stripe from "stripe";
import { trainModel } from "@/lib/ai/fal-client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("Stripe-Signature")!;

  try {
    const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const imageUrl = session.metadata?.zip_url;
      const userId = session.metadata?.userId;

      if (imageUrl && userId) {
        // Trigger the AI Training
        await trainModel(imageUrl, userId);
      }
    }
    return NextResponse.json({ received: true });
  } catch (err) {
    return NextResponse.json({ error: "Webhook Error" }, { status: 400 });
  }
}