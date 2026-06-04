import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { zipUrl } = await req.json();
    // In production, call fal.ai to generate 9 styles from one photo
    // For now, return placeholder images from unsplash or a static set.
    const dummyUrls = Array.from({ length: 9 }, (_, i) => `https://picsum.photos/id/${i+100}/400/500`);
    return NextResponse.json({ urls: dummyUrls });
  } catch (err) {
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
