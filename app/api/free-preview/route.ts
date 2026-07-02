import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("free-preview");
fal.config({ credentials: process.env.FAL_KEY });

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

const PROMPTS = [
  "A professional corporate headshot, studio lighting, neutral background",
  "A creative headshot, soft natural light, slight smile",
  "A casual professional headshot, outdoor blurred background",
];

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
    
    if (!image) {
      return addCors(
        NextResponse.json({ error: "No image provided" }, { status: 400 }),
        origin
      );
    }

    // Convert image to base64 for Fal.ai
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const imageDataUrl = `data:${image.type};base64,${base64Image}`;

    // Generate previews using image-to-image (no training, just style transfer)
    const results = await Promise.all(
      PROMPTS.map((prompt) =>
        fal.run("fal-ai/flux/dev", {
          input: {
            prompt,
            image_url: imageDataUrl,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            image_size: "square_hd",
            output_format: "jpeg",
            strength: 0.7, // Controls how much the original image influences the output
          },
        })
      )
    );

    const urls = results.map((r) => (r as any).images[0].url);

    return addCors(NextResponse.json({ urls }), origin);
  } catch (err) {
    log.error({ err }, "Free preview generation failed");
    return addCors(
      NextResponse.json({ error: "Generation failed" }, { status: 500 }),
      origin
    );
  }
});
