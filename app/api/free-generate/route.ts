import { NextResponse } from 'next/server';
import { fal } from '@fal-ai/client';
fal.config({ credentials: process.env.FAL_KEY });
const FREE_PROMPTS = [
  'A professional LinkedIn headshot of a person, business casual attire, clean light grey background, confident smile, 8k photo',
  'A corporate headshot of a person, navy blazer, modern office background softly blurred, soft studio lighting',
  'A creative studio portrait of a person, black turtleneck, minimalist charcoal background, dramatic side lighting',
  'A casual professional photo of a person, smart casual attire, outdoor park background softly blurred, golden hour lighting',
  'An executive portrait of a person, dark suit, luxury office background, professional lighting, sharp focus',
  'A startup founder photo of a person, open collar shirt, modern coworking space background, approachable expression',
  'A speaker profile photo of a person, business formal, conference hall background softly blurred',
  'A creative director headshot of a person, stylish outfit, exposed brick studio, artistic lighting',
  'A professional headshot of a person, white dress shirt, neutral background, natural window light, photorealistic',
];
export async function POST(req: Request) {
  try {
    const { zipUrl } = await req.json();
    if (!zipUrl) return NextResponse.json({ error: 'Missing zipUrl' }, { status: 400 });
    const results = await Promise.allSettled(FREE_PROMPTS.map((prompt) => fal.run('fal-ai/flux/dev', { input: { prompt, image_url: zipUrl, num_inference_steps: 25, guidance_scale: 3.5, num_images: 1, image_size: 'portrait_4_3', output_format: 'jpeg' } })));
    const urls: string[] = results.filter((r) => r.status === 'fulfilled').flatMap((r) => ((r as PromiseFulfilledResult<any>).value.images ?? []).map((img: any) => img.url)).slice(0, 9);
    if (urls.length === 0) return NextResponse.json({ error: 'Generation produced no images' }, { status: 500 });
    return NextResponse.json({ urls });
  } catch (err: any) { return NextResponse.json({ error: 'Generation failed' }, { status: 500 }); }
}
