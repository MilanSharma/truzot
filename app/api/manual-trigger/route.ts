import { NextResponse } from 'next/server';
import { trainModel } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';

// TEMPORARY ROUTE: Manually trigger Fal.ai training for a specific order
// DELETE THIS FILE AFTER USE!
export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId) {
      return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    }

    // 1. Fetch the order
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, status, zip_url, plan, email')
      .eq('id', orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Ensure order is marked as training
    await supabaseAdmin
      .from('orders')
      .update({ status: 'training' })
      .eq('id', orderId);

    // 3. Insert training row (now that the DB constraint is fixed)
    await supabaseAdmin
      .from('trainings')
      .upsert({ order_id: orderId, status: 'training' }, { onConflict: 'order_id' });

    // 4. Refresh the zip URL if it's an expired signed URL (common in testing)
    let freshZipUrl = order.zip_url;
    if (freshZipUrl && freshZipUrl.includes('/object/sign/')) {
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
        console.error('Failed to refresh zip URL', e);
      }
    }

    // 5. Kick off Fal.ai training
    if (freshZipUrl) {
      await trainModel(freshZipUrl, orderId);
      return NextResponse.json({ success: true, message: 'Training started successfully! Check your dashboard in a few minutes.' });
    } else {
      return NextResponse.json({ error: 'Order has no zip_url' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('Manual trigger error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
