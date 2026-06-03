import { NextResponse } from "next/server";
import { generateHeadshots } from "@/lib/ai/fal-client";
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin access
);

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const data = await req.json();

  if (data.status === "COMPLETED") {
    const modelId = data.diff_url; // The trained LoRA model

    // 1. Update training status
    await supabaseAdmin
      .from('trainings')
      .update({ status: 'generating', model_id: modelId })
      .eq('user_id', userId);

    // 2. Generate the headshots
    const results = await generateHeadshots(modelId);
    
    // 3. Save generated images to DB
    const headshotsToInsert = results.map((res: any) => ({
      user_id: userId,
      image_url: res.images[0].url,
    }));

    await supabaseAdmin.from('headshots').insert(headshotsToInsert);
    
    // 4. Update status to completed
    await supabaseAdmin
      .from('trainings')
      .update({ status: 'completed' })
      .eq('user_id', userId);
  }

  return NextResponse.json({ ok: true });
}