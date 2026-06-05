import { fal } from '@fal-ai/client';

function configureFal() {
  if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
  }
}

export const PLAN_SHOTS: Record<string, number> = { basic: 40, pro: 100, executive: 200 };

const getBasePrompts = (g: string, p: string, e: string) => [
  `A professional corporate headshot of TOK, a ${g} ${p} ${e}, wearing a tailored navy business suit, blurred modern office background, soft studio lighting, shot on 85mm lens, f/1.8, highly detailed, 8k resolution`,
  `A LinkedIn profile photo of TOK, a ${g} ${p} ${e}, business casual attire, clean light grey background, confident smile, sharp focus, professional photography, natural lighting`,
  `A professional headshot of TOK, a ${g} ${p} ${e}, crisp white dress shirt, neutral studio background, natural window light, photorealistic, 8k`,
  `A business portrait of TOK, a ${g} ${p} ${e}, dark navy blazer, outdoor urban background softly blurred, bright natural light, shallow depth of field`,
  `A creative studio portrait of TOK, a ${g} ${p} ${e}, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial magazine look, highly detailed`,
  `A casual professional photo of TOK, a ${g} ${p} ${e}, smart casual attire, outdoor park background softly blurred, golden hour lighting, warm tone`,
  `An executive corporate headshot of TOK, a ${g} ${p} ${e}, dark charcoal suit and subtle tie, luxury modern office background, professional rim lighting, 8k`,
  `A speaker profile photo of TOK, a ${g} ${p} ${e}, business formal, conference hall background softly blurred, authoritative and approachable pose`,
  `A startup founder photo of TOK, a ${g} ${p} ${e}, open collar light blue shirt, modern glass coworking space background, bright and airy, friendly casual expression`,
  `A creative director headshot of TOK, a ${g} ${p} ${e}, stylish smart outfit, creative studio with exposed brick background, artistic softbox lighting`,
];

const getExtendedPrompts = (g: string, p: string, e: string) => [
  `A high-fashion studio portrait of TOK, a ${g} ${p} ${e}, tailored grey suit, seamless grey background, editorial cinematic lighting, 85mm`,
  `A warm friendly casual headshot of TOK, a ${g} ${p} ${e}, casual linen shirt, bright airy home office background, natural daylight flowing in`,
  `A dramatic black-and-white creative headshot of TOK, a ${g} ${p} ${e}, strong jaw lighting, seamless white background, fashion magazine style, crisp contrast`,
  `A tech executive corporate photo of TOK, a ${g} ${p} ${e}, smart casual dark blazer, modern tech office background with soft neon, cool-toned studio light`,
  `A trustworthy professional studio portrait of TOK, a ${g} ${p} ${e}, smart attire, clean bright background, soft even lighting, realistic skin texture`,
  `A leadership corporate headshot of TOK, a ${g} ${p} ${e}, dark suit, wood-panelled office background softly out of focus, authoritative but warm expression`,
  `A real-estate agent corporate headshot of TOK, a ${g} ${p} ${e}, business smart attire, luxury property entrance outdoor background, confident welcoming smile, sunny`,
  `A creative consultant photo of TOK, a ${g} ${p} ${e}, relaxed stylish blazer, colourful abstract blurred background, soft portrait lighting`,
  `A financial advisor corporate portrait of TOK, a ${g} ${p} ${e}, navy pinstripe suit, financial district outdoor background softly blurred, golden hour`,
  `A remote-work professional casual photo of TOK, a ${g} ${p} ${e}, smart casual, stylish bookshelf background, warm ambient indoor light`,
];

function buildPrompts(plan: string, prefs?: any): string[] {
  const target = PLAN_SHOTS[plan] ?? 40;
  const pool: string[] = [];
  
  const g = prefs?.gender ? prefs.gender.toLowerCase() : 'person';
  const e = prefs?.eyeColor ? `with ${prefs.eyeColor.toLowerCase()} eyes` : '';
  const p = prefs?.profession ? prefs.profession.toLowerCase() : 'professional';

  const allUnique = [...getBasePrompts(g, p, e), ...getExtendedPrompts(g, p, e)];
  const suffixes = [
    ', looking directly at camera, slight smile',
    ', three-quarter angle, relaxed posture',
    ', looking slightly off-camera, thoughtful expression',
    ', front-facing, neutral confident expression, ultra-sharp',
    ', warm approachable smile, slightly turned head'
  ];
  
  let si = 0;
  while (pool.length < target) {
    for (const prompt of allUnique) {
      if (pool.length >= target) break;
      pool.push(prompt + suffixes[si % suffixes.length]);
    }
    si++;
  }
  return pool;
}

export const trainModel = async (imageUrl: string, orderId: string) => {
  configureFal();
  const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('FAL_WEBHOOK_SECRET is not configured');
  
  return await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: { images_data_url: imageUrl, steps: 1000, trigger_word: 'TOK' },
    webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${webhookSecret}`,
  });
};

export const generateHeadshots = async (modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: any) => {
  configureFal();
  const allPrompts = buildPrompts(plan, prefs);
  const targetShots = PLAN_SHOTS[plan] ?? 40;
  const prompts: { prompt: string; index: number }[] = [];
  
  for (let i = startIndex; i < Math.min(startIndex + limit, targetShots); i++) {
    prompts.push({ prompt: allPrompts[i], index: i });
  }
  
  const results = await Promise.allSettled(prompts.map(({ prompt }) => 
    fal.run('fal-ai/flux-lora', { 
      input: { 
        prompt, 
        loras: [{ path: modelId, scale: 0.85 }],
        num_inference_steps: 28, 
        guidance_scale: 3.5, 
        num_images: 1, 
        image_size: 'portrait_4_3', 
        output_format: 'jpeg' 
      } 
    }).then((res) => ({ ...res, prompt }))
  ));
  
  return results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value);
};
