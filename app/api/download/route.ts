import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
      const { data: headshots } = await supabaseAdmin
        .from('headshots')
        .select('image_url')
        .eq('order_id', orderId);

      if (!headshots || headshots.length === 0) {
        return NextResponse.json({ error: 'No headshots found' }, { status: 404 });
      }

      // Fetch all images and create zip
      const JSZip = require('jszip');
      const zip = new JSZip();
      
      for (let i = 0; i < headshots.length; i++) {
        const response = await fetch(headshots[i].image_url);
        const buffer = await response.arrayBuffer();
        zip.file(`headshot_${i + 1}.jpg`, buffer);
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
