import { fal } from '@fal-ai/client';

fal.config({ credentials: process.env.FAL_KEY });

export const PLAN_PROMPTS: Record<string, string[]> = {
  basic: [
    'A professional corporate headshot of TOK, wearing a navy business suit, blurred modern office background, soft studio lighting, 8k photo',
    'A LinkedIn profile photo of TOK, business casual attire, clean light grey background, confident smile, sharp focus, 8k',
    'A professional headshot of TOK, white dress shirt, neutral background, natural window light, photorealistic',
    'A business portrait of TOK, navy blazer, outdoor urban background softly blurred, natural light',
  ],
  pro: [
    'A professional corporate headshot of TOK, wearing a navy business suit, blurred modern office background, soft studio lighting, 8k photo',
    'A LinkedIn profile photo of TOK, business casual attire, clean light grey background, confident smile, sharp focus, 8k',
    'A creative studio portrait of TOK, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial look',
    'A casual professional photo of TOK, smart casual attire, outdoor park background softly blurred, golden hour lighting',
    'An executive headshot of TOK, dark suit and tie, luxury office background, professional lighting',
    'A speaker profile photo of TOK, business formal, conference hall background softly blurred, authoritative pose',
    'A startup founder photo of TOK, open collar shirt, modern coworking space background, approachable expression',
    'A creative director headshot of TOK, stylish outfit, creative studio with exposed brick, artistic lighting',
    'A tech professional photo of TOK, polo shirt, modern tech office background, natural light',
    'A consultant headshot of TOK, professional attire, clean white background, confident direct gaze',
    'A profile photo of TOK, smart casual, rooftop city background softly blurred, natural daylight',
    'A business casual portrait of TOK, blazer over t-shirt, light background, relaxed professional expression',
  ],
  executive: [
    'A C-suite executive headshot of TOK, premium dark suit, luxury boardroom background, professional studio lighting, ultra high quality',
    'A professional corporate headshot of TOK, wearing a navy business suit, blurred modern office background, soft studio lighting, 8k photo',
    'A LinkedIn profile photo of TOK, business casual attire, clean light grey background, confident smile, sharp focus, 8k',
    'A creative studio portrait of TOK, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial look',
    'A casual professional photo of TOK, smart casual attire, outdoor park background softly blurred, golden hour lighting',
    'An executive headshot of TOK, dark suit and tie, luxury office background, professional lighting',
    'A speaker keynote profile of TOK, formal attire, stage lighting effect, powerful presence',
    'A board member portrait of TOK, formal suit, dark wood paneled office, dignified expression',
    'A startup CEO photo of TOK, smart casual, modern minimalist office, confident and approachable',
    'A creative executive portrait of TOK, stylish blazer, creative studio setting, editorial magazine quality',
    'A tech executive headshot of TOK, business casual, glass and steel office background, modern look',
    'A consultant portrait of TOK, premium suit, clean white studio background, sharp professional look',
    'A casual executive photo of TOK, open collar dress shirt, outdoor garden background, relaxed confidence',
    'A personal brand photo of TOK, signature outfit, custom colored background, brand-aligned aesthetic',
    'A media kit headshot of TOK, professional attire, neutral gradient background, press-ready quality',
    'An award winner portrait of TOK, formal evening wear, dark dramatic background, celebration expression',
  ],
};

export const PLAN_SHOTS: Record<string, number> = {
  basic: 4,
  pro: 12,
  executive: 16,
};

export const trainModel = async (imageUrl: string, orderId: string) => {
  const result = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: imageUrl,
      steps: 1000,
      trigger_word: 'TOK',
      learning_rate: 0.0004,
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}`,
  });
  return result;
};

export const generateHeadshots = async (modelId: string, plan: string) => {
  const prompts = PLAN_PROMPTS[plan] ?? PLAN_PROMPTS.basic;

  const results = await Promise.allSettled(
    prompts.map((prompt) =>
      fal.run('fal-ai/flux-lora', {
        input: {
          prompt,
          loras: [{ path: modelId, scale: 0.9 }],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 1,
          image_size: 'portrait_4_3',
          output_format: 'jpeg',
        },
      })
    )
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<any>).value);
};
