import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const token   = searchParams.get('token');

    const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
    if (!webhookSecret || token !== webhookSecret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });

    const data = await req.json();

    if (data.status === 'ERROR' || data.error) {
      await supabaseAdmin.from('trainings').update({ status: 'failed', error: data.error ?? 'Unknown error' }).eq('order_id', orderId);
      await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
      return NextResponse.json({ ok: true });
    }

    if (data.status !== 'COMPLETED' && data.status !== 'OK') return NextResponse.json({ ok: true });

    const modelId = data.diffusers_lora_file?.url ?? data.diff_url ?? data.output?.diffusers_lora_file?.url;
    if (!modelId) return NextResponse.json({ error: 'No model URL' }, { status: 400 });

    await supabaseAdmin.from('trainings').update({ status: 'generating', model_id: modelId }).eq('order_id', orderId);
    await supabaseAdmin.from('orders').update({ status: 'generating' }).eq('id', orderId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (siteUrl) {
      // FIX 5: Pass the Cron Secret to authorize the internal trigger
      fetch(`${siteUrl}/api/generate`, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json', 'x-truzot-secret': process.env.CRON_SECRET || '' }, 
        body: JSON.stringify({ orderId }),
      }).catch((err) => console.error('Server-side generation trigger failed:', err));
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
