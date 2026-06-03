import { NextResponse } from 'next/server';
import { generateHeadshots } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendHeadshotsReadyEmail } from '@/lib/email';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');

    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    const data = await req.json();
    console.log('Fal webhook received:', JSON.stringify(data).slice(0, 200));

    if (data.status === 'ERROR' || data.error) {
      await supabaseAdmin
        .from('trainings')
        .update({ status: 'failed', error: data.error ?? 'Unknown fal error' })
        .eq('order_id', orderId);
      await supabaseAdmin
        .from('orders')
        .update({ status: 'failed' })
        .eq('id', orderId);
      return NextResponse.json({ ok: true });
    }

    if (data.status !== 'COMPLETED' && data.status !== 'OK') {
      return NextResponse.json({ ok: true });
    }

    // Training completed — get the LoRA model URL
    const modelId = data.diffusers_lora_file?.url ?? data.diff_url ?? data.output?.diffusers_lora_file?.url;
    if (!modelId) {
      console.error('No model URL in fal webhook payload');
      return NextResponse.json({ error: 'No model URL' }, { status: 400 });
    }

    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('plan, email')
      .eq('id', orderId)
      .single();

    await supabaseAdmin
      .from('trainings')
      .update({ status: 'generating', model_id: modelId })
      .eq('order_id', orderId);

    await supabaseAdmin
      .from('orders')
      .update({ status: 'generating' })
      .eq('id', orderId);

    // Generate headshots
    const results = await generateHeadshots(modelId, order?.plan ?? 'basic');

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

    await supabaseAdmin
      .from('trainings')
      .update({ status: 'completed' })
      .eq('order_id', orderId);

    await supabaseAdmin
      .from('orders')
      .update({ status: 'completed' })
      .eq('id', orderId);

    if (order?.email) {
      await sendHeadshotsReadyEmail(order.email, orderId, headshotsToInsert.length).catch(console.error);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Fal webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
