import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import JSZip from 'jszip';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get('orderId');
    const imageUrl = searchParams.get('imageUrl');

    if (!orderId && !imageUrl) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Single image download
    if (imageUrl) {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          'Content-Type': blob.type,
          'Content-Disposition': 'attachment; filename="headshot.jpg"',
        },
      });
    }

    // Zip all headshots for an order
    if (orderId) {
      // Fetch the order context to verify ownership constraints
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', orderId)
        .single();

      if (!order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
      }

      // If order is linked to a registered account, enforce authentication check
      if (order.user_id) {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.split('https://')[1]?.split('.')[0] || 'sb';
        const cookieVal = cookieStore.get(`sb-${projectRef}-auth-token`)?.value;

        let authorized = false;
        if (cookieVal) {
          try {
            const session = JSON.parse(cookieVal);
            const { data: { user } } = await supabaseAdmin.auth.getUser(session.access_token);
            if (user && user.id === order.user_id) {
              authorized = true;
            }
          } catch (e) {
            console.error("IDOR validation parse error:", e);
          }
        }

        if (!authorized) {
          return NextResponse.json({ error: 'Unauthorized access to this order' }, { status: 403 });
        }
      }

      const { data: headshots } = await supabaseAdmin
        .from('headshots')
        .select('image_url')
        .eq('order_id', orderId);

      if (!headshots || headshots.length === 0) {
        return NextResponse.json({ error: 'No headshots found' }, { status: 404 });
      }

      const zip = new JSZip();
      
      // Fetch image buffers in parallel using Promise.all to avoid Vercel serverless function timeouts
      const fetchImageBuffer = async (url: string, index: number) => {
        const res = await fetch(url);
        const arrayBuffer = await res.arrayBuffer();
        return { index, arrayBuffer };
      };

      const results = await Promise.all(
        headshots.map((h, idx) => fetchImageBuffer(h.image_url, idx))
      );

      for (const item of results) {
        zip.file(`headshot_${item.index + 1}.jpg`, item.arrayBuffer);
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
      
      return new NextResponse(zipBuffer, {
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="truzot-headshots-${orderId}.zip"`,
        },
      });
    }
  } catch (err) {
    console.error('Download error:', err);
    return NextResponse.json({ error: 'Download failed' }, { status: 500 });
  }
}
