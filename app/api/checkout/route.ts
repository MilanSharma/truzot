import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase/admin';


const PLANS: Record<string, { priceId: string; amount: number; label: string; shots: number }> = {
  basic:     { priceId: process.env.STRIPE_PRICE_BASIC!,     amount: 2900,  label: 'Basic — 40 Headshots',      shots: 40 },
  pro:       { priceId: process.env.STRIPE_PRICE_PRO!,       amount: 3900,  label: 'Pro — 100 Headshots',       shots: 100 },
  executive: { priceId: process.env.STRIPE_PRICE_EXECUTIVE!, amount: 5900,  label: 'Executive — 200 Headshots', shots: 200 },
};

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
  try {
    // Destructure plan, email, zipUrl, and userId in a single call to preserve the request stream
    const { plan, email, zipUrl, userId } = await req.json();

    if (!PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan];

    // Create an order linked to the user account if authenticated
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        email,
        plan,
        amount_cents: planConfig.amount,
        status: 'pending',
        zip_url: zipUrl,
        user_id: userId || null, // Link order on creation
      })
      .select('id')
      .single();

    if (orderError || !order) {
      console.error('Order creation error:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // Dynamically get the base URL from the request headers
    const url = new URL(req.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: planConfig.label, description: 'AI Professional Headshots · Delivered in 60 minutes' },
            unit_amount: planConfig.amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        orderId: order.id,
        plan,
        email,
      },
      success_url: `${baseUrl}/dashboard?order=${order.id}&success=1`,
      cancel_url:  `${baseUrl}/upload?cancelled=1`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 });
  }
}
