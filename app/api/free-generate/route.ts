import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { zipUrl } = await req.json();
    
    // Free tier uses high-quality placeholder images to avoid Fal.ai credit costs.
    // This acts as a perfect lead magnet to show users the quality they can expect.
    // Once you add credits to Fal.ai, you can replace this with a real image-to-image model call.
    const dummyUrls = Array.from({ length: 9 }, (_, i) => `https://picsum.photos/id/${i+100}/400/500`);
    
    return NextResponse.json({ urls: dummyUrls });
  } catch (err) {
    console.error('Free generate error:', err);
    return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
  }
}
