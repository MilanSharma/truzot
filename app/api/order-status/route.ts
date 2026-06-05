import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { PLAN_SHOTS } from '@/lib/ai/fal-client';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('status, plan')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  let headshots: { id: string; image_url: string; style: string; category: string }[] = [];
  let count = 0;
  const target = PLAN_SHOTS[order.plan] ?? 40;

  if (order.status === 'completed') {
    const { data: shots } = await supabaseAdmin
      .from('headshots')
      .select('id, image_url, style, category')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    headshots = shots || [];
    count = headshots.length;
  } else if (order.status === 'generating') {
    const { count: generatedCount } = await supabaseAdmin
      .from('headshots')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', orderId);
    count = generatedCount ?? 0;
  }

  return NextResponse.json({
    status: order.status,
    headshots,
    count,
    target
  });
}
