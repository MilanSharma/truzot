import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { trainModel } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendOrderConfirmationEmail } from '@/lib/email';


export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-06-20' });
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
    const { orderId, plan, email } = session.metadata ?? {};

    if (!orderId) {
      console.error('Missing metadata in session:', session.id);
      return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Retrieve order to fetch the database stored zip_url and current status
    const { data: order, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('zip_url, status')
      .eq('id', orderId)
      .single();

    if (fetchError || !order?.zip_url) {
      console.error('Failed to retrieve order:', orderId, fetchError);
      return NextResponse.json({ error: 'Order not found' }, { status: 400 });
    }

    // Idempotency: Avoid starting multiple parallel training calls if Stripe retries the webhook
    if (['training', 'generating', 'completed'].includes(order.status)) {
      console.log(`Order ${orderId} is already in state: ${order.status}. Skipping duplicate kickoff.`);
      return NextResponse.json({ received: true });
    }

    let freshZipUrl = order.zip_url;

    // Refresh zip_url if it is an expired signed URL (longer than 2 hours)
    if (freshZipUrl.includes('/object/sign/')) {
      try {
        const urlObj = new URL(freshZipUrl);
        const pathParts = urlObj.pathname.split('/object/sign/uploads/');
        if (pathParts.length > 1) {
          const storagePath = pathParts[1];
          const { data: newData } = await supabaseAdmin.storage
            .from('uploads')
            .createSignedUrl(storagePath, 7200);
          if (newData?.signedUrl) {
            freshZipUrl = newData.signedUrl;
            await supabaseAdmin.from('orders').update({ zip_url: freshZipUrl }).eq('id', orderId);
          }
        }
      } catch (e) {
        console.error('Failed to refresh zip URL during webhook extraction:', e);
      }
    }

    // Mark order as paid & training
    await supabaseAdmin
      .from('orders')
      .update({ status: 'training', stripe_payment_intent: session.payment_intent as string })
      .eq('id', orderId);

    // Create training row safely
    await supabaseAdmin
      .from('trainings')
      .upsert({ order_id: orderId, status: 'training' }, { onConflict: 'order_id' });

    // Kick off fal.ai training
    try {
      await trainModel(freshZipUrl, orderId);
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
      const planAmounts: Record<string, number> = { basic: 2900, pro: 3900, executive: 5900 };
      await sendOrderConfirmationEmail(email, plan, planAmounts[plan] ?? 2900).catch(console.error);
    }
  }

  return NextResponse.json({ received: true });
}
