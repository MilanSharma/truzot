import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("free-preview");

// Hard cap on the free preview's longest edge. fal's image-to-image endpoint
// has no size/width/height param — it just preserves the input image's
// dimensions — so a phone selfie (often 3000px+) would otherwise pass through
// at full resolution, undermining both the "low-resolution" promise and
// blowing up fal cost per free, unauthenticated preview (fal bills per output
// megapixel). Downscaling the INPUT guarantees a genuinely low-res output.
const PREVIEW_MAX_EDGE = 640;

// Composited server-side after generation, not left to the model to render
// as prompt text. AI-drawn text is unreliable (garbled, illegible, or simply
// skipped depending on what else is competing for the model's attention) —
// this guarantees every preview is unmistakably marked regardless of what
// the diffusion model does with the prompt.
async function watermark(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  const fontSize = Math.round(width / 11);
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { fill: rgba(255,255,255,0.55); font-family: sans-serif; font-weight: 900;
              font-size: ${fontSize}px; }
      </style>
      <g transform="rotate(-30 ${width / 2} ${height / 2})">
        <text class="wm" x="50%" y="35%" text-anchor="middle">TRUZOT PREVIEW</text>
        <text class="wm" x="50%" y="65%" text-anchor="middle">TRUZOT PREVIEW</text>
      </g>
    </svg>`;
  return sharp(imageBuffer)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 80 })
    .toBuffer();
}

// Initialize FAL configuration if available
if (process.env.FAL_KEY) {
  fal.config({ credentials: process.env.FAL_KEY });
}

const hasRedisConfig =
  typeof process !== "undefined" &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

let redisClient: Redis | null = null;
let rateLimiter: Ratelimit | null = null;

if (hasRedisConfig) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    rateLimiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      prefix: "ratelimit:free-preview",
      ephemeralCache: new Map(),
    });
  } catch (err) {
    log.error({ err }, "Failed to init rate limiter");
  }
}

function getIp(req: Request): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  
  try {
    if (rateLimiter) {
      const ip = getIp(req);
      const { success } = await rateLimiter.limit(ip);
      if (!success) {
        return addCors(
          NextResponse.json(
            { error: "Too many requests. Please wait before generating again." },
            { status: 429 }
          ),
          origin
        );
      }
    }

    const formData = await req.formData();
    const image = formData.get("image") as File;
    const style = formData.get("style") as string || "Corporate office";
    const outfit = formData.get("outfit") as string || "Business suit";
    const hairstyle = formData.get("hairstyle") as string || "Neat and professional";
    
    if (!image) {
      return addCors(
        NextResponse.json({ error: "No image provided" }, { status: 400 }),
        origin
      );
    }

    // Downscale BEFORE sending to fal — image-to-image has no size param and
    // otherwise preserves the input's resolution verbatim (see PREVIEW_MAX_EDGE
    // comment above).
    const arrayBuffer = await image.arrayBuffer();
    const resized = sharp(Buffer.from(arrayBuffer)).rotate(); // rotate() applies EXIF orientation
    const resizedBuffer = await resized
      .resize({ width: PREVIEW_MAX_EDGE, height: PREVIEW_MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
    const base64Image = `data:image/jpeg;base64,${resizedBuffer.toString("base64")}`;

    const prompt = `A professional portrait of the person, wearing ${outfit}, ${hairstyle} hair, ${style} background. High quality photography, professional lighting.`;

    const result = await fal.run("fal-ai/flux/dev/image-to-image", {
      input: {
        image_url: base64Image,
        prompt: prompt,
        strength: 0.85,
        num_inference_steps: 20, // Lowered for a faster "preview" look
        guidance_scale: 3.5,
        output_format: "jpeg",
      },
    });

    const falUrl = (result as any).images[0].url;
    const genRes = await fetch(falUrl);
    const genBuffer = Buffer.from(await genRes.arrayBuffer());
    const meta = await sharp(genBuffer).metadata();
    const watermarked = await watermark(genBuffer, meta.width ?? PREVIEW_MAX_EDGE, meta.height ?? PREVIEW_MAX_EDGE);
    const url = `data:image/jpeg;base64,${watermarked.toString("base64")}`;

    return addCors(NextResponse.json({ url }), origin);
  } catch (err) {
    log.error({ err }, "Free preview generation failed");
    return addCors(
      NextResponse.json({ error: "Generation failed. The AI provider might be experiencing high load." }, { status: 500 }),
      origin
    );
  }
});
