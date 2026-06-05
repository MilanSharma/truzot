import { fal } from '@fal-ai/client';
fal.config({ credentials: process.env.FAL_KEY });

const BASE_PROMPTS: string[] = [
  'A professional corporate headshot of TOK, wearing a navy business suit, blurred modern office background, soft studio lighting, 8k photo',
  'A LinkedIn profile photo of TOK, business casual attire, clean light grey background, confident smile, sharp focus, 8k',
  'A professional headshot of TOK, white dress shirt, neutral background, natural window light, photorealistic',
  'A business portrait of TOK, navy blazer, outdoor urban background softly blurred, natural light',
  'A creative studio portrait of TOK, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial look',
  'A casual professional photo of TOK, smart casual attire, outdoor park background softly blurred, golden hour lighting',
  'An executive headshot of TOK, dark suit and tie, luxury office background, professional lighting',
  'A speaker profile photo of TOK, business formal, conference hall background softly blurred, authoritative pose',
  'A startup founder photo of TOK, open collar shirt, modern coworking space background, approachable expression',
  'A creative director headshot of TOK, stylish outfit, creative studio with exposed brick, artistic lighting',
];
const EXTENDED_PROMPTS: string[] = [
  'A high-fashion portrait of TOK, tailored charcoal suit, rooftop city background at dusk, editorial lighting',
  'A warm friendly headshot of TOK, casual linen shirt, bright airy home office background, natural daylight',
  'A dramatic black-and-white headshot of TOK, strong jaw lighting, seamless white background, fashion magazine style',
  'A tech executive photo of TOK, smart casual blazer, modern glass office background, cool-toned studio light',
  'A healthcare professional portrait of TOK, white coat, clean clinical background, trustworthy expression',
  'A legal professional headshot of TOK, dark suit, wood-panelled office background, authoritative expression',
  'A real-estate agent headshot of TOK, business smart attire, luxury property entrance background, confident smile',
  'A creative consultant photo of TOK, relaxed blazer over t-shirt, colourful abstract mural background',
  'A financial advisor portrait of TOK, navy pinstripe suit, financial district background softly blurred',
  'A remote-work professional photo of TOK, smart casual, home bookshelf background, warm ambient light',
];

function buildPrompts(plan: string): string[] {
  const target = PLAN_SHOTS[plan] ?? 40;
  const pool: string[] = [];
  const allUnique = [...BASE_PROMPTS, ...EXTENDED_PROMPTS];
  const suffixes = ['', ', slight smile, direct eye contact', ', three-quarter angle, relaxed posture', ', looking slightly off-camera, thoughtful expression', ', front-facing, neutral expression, ultra-sharp', ', warm smile, slightly turned head'];
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

export const PLAN_PROMPTS: Record<string, string[]> = { basic: buildPrompts('basic'), pro: buildPrompts('pro'), executive: buildPrompts('executive') };
export const PLAN_SHOTS: Record<string, number> = { basic: 40, pro: 100, executive: 200 };

export const trainModel = async (imageUrl: string, orderId: string) => {
  const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error('FAL_WEBHOOK_SECRET is not configured');
  return await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: { images_data_url: imageUrl, steps: 1000, trigger_word: 'TOK' },
    webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${webhookSecret}`,
  });
};

export const generateHeadshots = async (modelId: string, plan: string, startIndex: number = 0, limit: number = 10000) => {
  const allPrompts = PLAN_PROMPTS[plan] ?? PLAN_PROMPTS.basic;
  const targetShots = PLAN_SHOTS[plan] ?? 40;
  const prompts: { prompt: string; index: number }[] = [];
  for (let i = startIndex; i < Math.min(startIndex + limit, targetShots); i++) prompts.push({ prompt: allPrompts[i], index: i });
  const results = await Promise.allSettled(prompts.map(({ prompt }) => fal.run('fal-ai/flux-lora', { input: { prompt, loras: [{ path: modelId, scale: 0.9 }], num_inference_steps: 28, guidance_scale: 3.5, num_images: 1, image_size: 'portrait_4_3', output_format: 'jpeg' } }).then((res) => ({ ...res, prompt }))));
  return results.filter((r) => r.status === 'fulfilled').map((r) => (r as PromiseFulfilledResult<any>).value);
};
