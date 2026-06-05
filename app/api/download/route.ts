import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import JSZip from 'jszip';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId  = searchParams.get('orderId');
    const imageUrl = searchParams.get('imageUrl');
    if (!orderId && !imageUrl) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    if (imageUrl) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new NextResponse(blob, { headers: { 'Content-Type': blob.type, 'Content-Disposition': 'attachment; filename="headshot.jpg"' } });
    }

    if (orderId) {
      const { data: order } = await supabaseAdmin.from('orders').select('user_id').eq('id', orderId).single();
      if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

      if (order.user_id) {
        const authHeader = req.headers.get('Authorization') ?? '';
        const accessToken = authHeader.replace('Bearer ', '').trim();
        let authorized = false;
        if (accessToken) {
          const { data: { user } } = await supabaseAdmin.auth.getUser(accessToken);
          if (user && user.id === order.user_id) authorized = true;
        }
        if (!authorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      const { data: headshots } = await supabaseAdmin.from('headshots').select('image_url').eq('order_id', orderId);
      if (!headshots || headshots.length === 0) return NextResponse.json({ error: 'No headshots found' }, { status: 404 });

      const zip = new JSZip();
      const results = await Promise.all(headshots.map(async (h, idx) => {
        const res = await fetch(h.image_url);
        const buf = await res.arrayBuffer();
        return { idx, buf };
      }));
      for (const { idx, buf } of results) zip.file(`headshot_${idx + 1}.jpg`, buf);
      const zipBuffer = await zip.generateAsync({ type: 'arraybuffer' });

      return new NextResponse(zipBuffer, { headers: { 'Content-Type': 'application/zip', 'Content-Disposition': `attachment; filename="truzot-headshots-${orderId}.zip"` } });
    }
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
