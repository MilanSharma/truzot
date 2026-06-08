import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("free-generate");

fal.config({ credentials: process.env.FAL_KEY });

const hasRedisConfig =
  typeof process !== "undefined" &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

let rateLimiter: Ratelimit | null = null;
if (hasRedisConfig) {
  try {
    rateLimiter = new Ratelimit({
      redis: new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(3, "60 s"),
      prefix: "ratelimit:free-generate",
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
    // Rate limiting
    if (rateLimiter) {
      const ip = getIp(req);
      const { success } = await rateLimiter.limit(ip);
      if (!success) {
        return addCors(
          NextResponse.json(
            {
              error: "Too many requests. Please wait before generating again.",
            },
            { status: 429 },
          ),
          origin,
        );
      }
    }

    // Free tier generates generic style previews — no user photo needed
    const prompts = [
      "A professional corporate headshot, studio lighting, neutral background",
      "A creative headshot, soft natural light, slight smile",
      "A casual professional headshot, outdoor blurred background",
      "An executive headshot, dark suit, confident expression",
      "A friendly LinkedIn profile photo, warm smile, light background",
      "A creative studio portrait, artistic lighting, contemporary style",
      "A real estate agent headshot, professional and approachable",
      "A tech startup founder headshot, casual blazer, modern office",
      "A speaker headshot, authoritative pose, stage lighting",
    ];

    const results = await Promise.all(
      prompts.map((prompt) =>
        fal.run("fal-ai/flux/dev", {
          input: {
            prompt,
            num_inference_steps: 28,
            guidance_scale: 3.5,
            num_images: 1,
            image_size: "portrait_4_3",
            output_format: "jpeg",
          },
        }),
      ),
    );

    const urls = results.map((r) => (r as any).images[0].url);
    return addCors(NextResponse.json({ urls }), origin);
  } catch (err) {
    log.error({ err }, "Free generate failed");
    return addCors(
      NextResponse.json({ error: "Generation failed" }, { status: 500 }),
      origin,
    );
  }
});
