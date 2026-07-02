import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("free-preview");

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

    // Convert image to base64 Data URL
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = image.type || 'image/jpeg';
    const base64Image = `data:${mimeType};base64,${buffer.toString('base64')}`;

    const prompt = `A professional portrait of the person, wearing ${outfit}, ${hairstyle} hair, ${style} background. High quality photography, professional lighting. Large watermark text "FREE PREVIEW" across the center of the image.`;

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

    const url = (result as any).images[0].url;

    return addCors(NextResponse.json({ url }), origin);
  } catch (err) {
    log.error({ err }, "Free preview generation failed");
    return addCors(
      NextResponse.json({ error: "Generation failed. The AI provider might be experiencing high load." }, { status: 500 }),
      origin
    );
  }
});
