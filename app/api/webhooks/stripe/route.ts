import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { trainModel } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/email';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Stripe signature verification failed:', err);
    return NextResponse.json({ error: 'Webhook signature failed' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const { orderId, plan, zip_url, email } = session.metadata ?? {};

    if (!orderId || !zip_url) {
      console.error('Missing metadata in session:', session.id);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Mark order as paid & training
    await supabaseAdmin
      .from('orders')
      .update({ status: 'training', stripe_payment_intent: session.payment_intent as string })
      .eq('id', orderId);

    // Create training row
    await supabaseAdmin
      .from('trainings')
      .insert({ order_id: orderId, status: 'training' });

    // Kick off fal.ai training
    try {
      await trainModel(zip_url, orderId);
    } catch (err) {
      console.error('Training kickoff failed:', err);
      await supabaseAdmin
        .from('trainings')
        .update({ status: 'failed', error: String(err) })
        .eq('order_id', orderId);
      return NextResponse.json({ error: 'Training failed to start' }, { status: 500 });
    }

    // Send confirmation email
    if (email) {
      const planAmounts: Record<string, number> = { basic: 2900, pro: 9900, executive: 19900 };
      await sendOrderConfirmationEmail(email, plan, planAmounts[plan] ?? 2900).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
