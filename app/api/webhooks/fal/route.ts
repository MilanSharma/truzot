import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const token = searchParams.get('token');

    const webhookSecret = process.env.FAL_WEBHOOK_SECRET || 'fallback_secret_token_123';
    if (!token || token !== webhookSecret) {
      return NextResponse.json({ error: 'Unauthorized webhook call' }, { status: 401 });
    }

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

    // Instantly transition to "generating". The browser dashboard will now poll and process batches.
    await supabaseAdmin
      .from('trainings')
      .update({ status: 'generating', model_id: modelId })
      .eq('order_id', orderId);

    await supabaseAdmin
      .from('orders')
      .update({ status: 'generating' })
      .eq('id', orderId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Fal webhook error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
