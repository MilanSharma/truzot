import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .select('status')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  let headshots: { id: string; image_url: string; style: string }[] = [];
  if (order.status === 'completed') {
    const { data: shots } = await supabaseAdmin
      .from('headshots')
      .select('id, image_url, style')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true });
    headshots = shots || [];
  }

  return NextResponse.json({
    status: order.status,
    headshots,
  });
}
