import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import sharp from "sharp";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";
import { WATERMARK_PATTERN_PNG_BASE64 } from "@/lib/assets/watermark-pattern";
import { supabaseAdmin } from "@/lib/supabase/admin";

const watermarkPatternBuffer = Buffer.from(WATERMARK_PATTERN_PNG_BASE64, "base64");

const log = createLogger("free-preview");

// Hard cap on the free preview's longest edge. fal's image-to-image endpoint
// has no size/width/height param — it just preserves the input image's
// dimensions — so a phone selfie (often 3000px+) would otherwise pass through
// at full resolution, undermining both the "low-resolution" promise and
// blowing up fal cost per free, unauthenticated preview (fal bills per output
// megapixel). Downscaling the INPUT guarantees a genuinely low-res output.
// Deliberately small — this must look enough like the real product to prove
// the tech works, but be unusable as an actual headshot (no LinkedIn/resume
// use), so the paid product is the only way to get something usable.
const PREVIEW_MAX_EDGE = 480;

// Composited server-side after generation, not left to the model to render
// as prompt text. AI-drawn text is unreliable (garbled, illegible, or simply
// skipped depending on what else is competing for the model's attention) —
// this guarantees every preview is unmistakably marked regardless of what
// the diffusion model does with the prompt.
//
// Tiled full-bleed, not two centered lines — a sparse watermark leaves clean,
// croppable margins a free preview could just be used as-is. No gap anywhere
// in the frame is left unmarked, regardless of the image's aspect ratio, so
// it can't be cropped around.
//
// This composites a PRE-RENDERED PNG, not SVG <text> rasterized at request
// time. Vercel's serverless runtime has no system fonts / fontconfig
// ("Fontconfig error: Cannot load default config file" is live in
// production logs on every generation) — that held true even for a font
// embedded via @font-face data: URI (confirmed live: still rendered as
// empty boxes instead of throwing), so text-based SVG can't be made to
// render here at all. The pattern below was rasterized locally, where
// fonts exist, once — see lib/assets/watermark-pattern.ts.
async function watermark(imageBuffer: Buffer, width: number, height: number): Promise<Buffer> {
  const overlay = await sharp(watermarkPatternBuffer)
    .resize(width, height, { fit: "cover" })
    .toBuffer();
  return sharp(imageBuffer)
    .composite([{ input: overlay, top: 0, left: 0 }])
    .jpeg({ quality: 65 })
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
    const email = (formData.get("email") as string || "").trim();

    if (!image) {
      return addCors(
        NextResponse.json({ error: "No image provided" }, { status: 400 }),
        origin
      );
    }
    if (!email || !email.includes("@")) {
      return addCors(
        NextResponse.json({ error: "A valid email is required." }, { status: 400 }),
        origin
      );
    }

    // One free preview per email, forever — not just a burst rate limit.
    // A usable-looking free result with no purchase required is exactly what
    // undermines the funnel; capping generation itself (not just watermarking
    // the output) also avoids re-billing fal for repeat "free" attempts from
    // the same person. Case-insensitive so Name@x.com and name@x.com collide.
    const { data: waitlistEntry, error: waitlistLookupErr } = await supabaseAdmin
      .from("waitlist")
      .select("id, free_preview_used_at")
      .ilike("email", email)
      .maybeSingle();

    if (waitlistLookupErr) {
      log.error({ err: waitlistLookupErr, email }, "Waitlist lookup failed");
      return addCors(
        NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 }),
        origin
      );
    }
    if (!waitlistEntry) {
      return addCors(
        NextResponse.json({ error: "Please submit your email first." }, { status: 400 }),
        origin
      );
    }
    if (waitlistEntry.free_preview_used_at) {
      return addCors(
        NextResponse.json(
          { error: "You've already used your free preview. Upgrade to get your full, watermark-free set." },
          { status: 403 }
        ),
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

    const falUrl = (result as any).data.images[0].url;
    const genRes = await fetch(falUrl);
    const genBuffer = Buffer.from(await genRes.arrayBuffer());
    const meta = await sharp(genBuffer).metadata();
    const watermarked = await watermark(genBuffer, meta.width ?? PREVIEW_MAX_EDGE, meta.height ?? PREVIEW_MAX_EDGE);
    const url = `data:image/jpeg;base64,${watermarked.toString("base64")}`;

    // Only spend the one-time allowance on an actual delivered result — a
    // transient fal failure above hits the catch block and skips this, so a
    // real error doesn't lock someone out of the free preview they never got.
    const { error: markUsedErr } = await supabaseAdmin
      .from("waitlist")
      .update({ free_preview_used_at: new Date().toISOString() })
      .eq("id", waitlistEntry.id);
    if (markUsedErr) {
      log.error({ err: markUsedErr, email }, "Failed to mark free preview as used");
    }

    return addCors(NextResponse.json({ url }), origin);
  } catch (err) {
    log.error({ err }, "Free preview generation failed");
    return addCors(
      NextResponse.json({ error: "Generation failed. The AI provider might be experiencing high load." }, { status: 500 }),
      origin
    );
  }
});
