import { NextResponse } from 'next/server';
import { generateHeadshots, PLAN_SHOTS } from '@/lib/ai/fal-client';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendHeadshotsReadyEmail } from '@/lib/email';

export const maxDuration = 300;
const BATCH_SIZE = 10; 

export async function POST(req: Request) {
  const startTime = Date.now();
  try {
    const { orderId } = await req.json();
    if (!orderId) return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
    
    const { data: order } = await supabaseAdmin.from('orders').select('status, plan, email').eq('id', orderId).single();
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    
    if (order.status === 'completed' || order.status === 'failed') return NextResponse.json({ status: order.status });
    if (order.status !== 'generating') return NextResponse.json({ status: order.status });

    const { data: training } = await supabaseAdmin.from('trainings').select('model_id').eq('order_id', orderId).single();
    if (!training?.model_id) return NextResponse.json({ error: 'Model training not found' }, { status: 404 });

    const targetCount = PLAN_SHOTS[order.plan] ?? 40;
    
    let totalGenerated = (await supabaseAdmin.from('headshots').select('id', { count: 'exact', head: true }).eq('order_id', orderId)).count ?? 0;
    let consecutiveFailures = 0;

    while (totalGenerated < targetCount) {
      if (Date.now() - startTime > 270000) {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://truzot.com';
        fetch(`${siteUrl}/api/generate`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId }),
        }).catch(console.error);
        return NextResponse.json({ status: 'generating', count: totalGenerated, target: targetCount });
      }

      const results = await generateHeadshots(training.model_id, order.plan, totalGenerated, BATCH_SIZE);
      const headshotsToInsert = results.flatMap((res: any) => {
        const promptText = res.prompt ?? '';
        let category = 'corporate';
        if (promptText.toLowerCase().includes('casual')) category = 'casual';
        else if (promptText.toLowerCase().includes('creative')) category = 'creative';
        else if (promptText.toLowerCase().includes('studio')) category = 'studio';
        else if (promptText.toLowerCase().includes('outdoor')) category = 'outdoor';
        
        return (res.images ?? []).map((img: any) => ({ 
          order_id: orderId, 
          image_url: img.url, 
          style: promptText || 'ai-generated', 
          category 
        }));
      });

      if (headshotsToInsert.length === 0) {
        consecutiveFailures++;
        if (consecutiveFailures >= 3) {
          await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', orderId);
          return NextResponse.json({ status: 'failed', count: totalGenerated, target: targetCount });
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }

      consecutiveFailures = 0;
      const { error: insertError } = await supabaseAdmin.from('headshots').insert(headshotsToInsert);
      if (!insertError) {
        totalGenerated += headshotsToInsert.length;
      }
    }

    await supabaseAdmin.from('orders').update({ status: 'completed' }).eq('id', orderId);
    await supabaseAdmin.from('trainings').update({ status: 'completed' }).eq('order_id', orderId);
    if (order.email) {
      await sendHeadshotsReadyEmail(order.email, orderId, totalGenerated).catch(console.error);
    }
    
    return NextResponse.json({ status: 'completed', count: totalGenerated, target: targetCount });
  } catch (err) { 
    return NextResponse.json({ error: 'Generation execution failed' }, { status: 500 }); 
  }
}
