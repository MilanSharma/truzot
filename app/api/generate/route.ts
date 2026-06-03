import { NextResponse } from 'next/server';
import { generateHeadshots, PLAN_SHOTS } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendHeadshotsReadyEmail } from '@/lib/email';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .select('status, plan, email')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'generating') {
      return NextResponse.json({ status: order.status });
    }

    const { data: training, error: trainingError } = await supabaseAdmin
      .from('trainings')
      .select('model_id')
      .eq('order_id', orderId)
      .single();

    if (trainingError || !training?.model_id) {
      return NextResponse.json({ error: 'Model training not found' }, { status: 404 });
    }

    // 1. Check existing generations
    const { count } = await supabaseAdmin
      .from('headshots')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId);

    const generatedCount = count ?? 0;
    const targetCount = PLAN_SHOTS[order.plan] ?? 40;

    if (generatedCount >= targetCount) {
      await supabaseAdmin.from('orders').update({ status: 'completed' }).eq('id', orderId);
      await supabaseAdmin.from('trainings').update({ status: 'completed' }).eq('order_id', orderId);
      return NextResponse.json({ status: 'completed', count: generatedCount, target: targetCount });
    }

    // 2. Generate the next batch safely (5 at a time)
    const batchSize = 5;
    const results = await generateHeadshots(training.model_id, order.plan, generatedCount, batchSize);

    const headshotsToInsert = results.flatMap((res: any) =>
      (res.images ?? []).map((img: any) => ({
        order_id: orderId,
        image_url: img.url,
        style: 'ai-generated',
      }))
    );

    if (headshotsToInsert.length > 0) {
      await supabaseAdmin.from('headshots').insert(headshotsToInsert);
    }

    const newCount = generatedCount + headshotsToInsert.length;

    // --- SAFETY CHECK ---
    // If a batch yields 0 images, Fal.ai rejected them (e.g. NSFW filter).
    if (headshotsToInsert.length === 0) {
      console.error(`Batch for order ${orderId} generated 0 images. Marking as failed.`);
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
      await supabaseAdmin.from('trainings').update({ status: 'failed', error: 'AI generation blocked' }).eq('order_id', orderId);
      return NextResponse.json({ status: 'failed', count: newCount, target: targetCount });
    }

    // 3. Complete order if target is met
    if (newCount >= targetCount) {
      await supabaseAdmin.from('orders').update({ status: 'completed' }).eq('id', orderId);
      await supabaseAdmin.from('trainings').update({ status: 'completed' }).eq('order_id', orderId);
      
      if (order.email) {
        await sendHeadshotsReadyEmail(order.email, orderId, newCount).catch(console.error);
      }
      return NextResponse.json({ status: 'completed', count: newCount, target: targetCount });
    }

    return NextResponse.json({ status: 'generating', count: newCount, target: targetCount });
  } catch (err) {
    console.error('Batch generation error:', err);
    return NextResponse.json({ error: 'Batch generation failed' }, { status: 500 });
  }
}
