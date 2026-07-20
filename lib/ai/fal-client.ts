import "server-only";
import { createHmac, createHash } from "crypto";
import { PLAN_SHOTS } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import type { GenerateHeadshotsResult, GenerateHeadshotsResponse, UserPreferences } from "@/lib/ai/types";
import { withFalSlot } from "@/lib/fal-concurrency";

const log = createLogger("fal-client");

export function generateWebhookToken(orderId: string): string {
  const secret = process.env.FAL_WEBHOOK_SECRET;
  if (!secret) throw new Error("FAL_WEBHOOK_SECRET is not configured");
  return createHmac("sha256", secret).update(orderId).digest("hex").substring(0, 32);
}

const FAL_KEY = process.env.FAL_KEY;

async function falFetch(endpoint: string, input: Record<string, unknown>): Promise<{ data: any; requestId: string }> {
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai HTTP ${res.status}: ${text.substring(0, 200)}`);
  }
  return { data: await res.json(), requestId: res.headers.get("x-fal-request-id") || "" };
}

// ---------------------------------------------------------------------------
// Negative prompt: this is the single biggest lever against the "obviously AI"
// look (plastic/waxy skin, uncanny symmetry, melted hands, watermark artifacts).
// flux-lora supports negative_prompt natively - it was previously unused.
// ---------------------------------------------------------------------------
const NEGATIVE_PROMPT =
  "plastic skin, waxy skin, airbrushed, over-smoothed skin, beauty filter, cgi, 3d render, " +
  "video game character, cartoon, illustration, painting, doll-like, uncanny valley, " +
  "asymmetrical eyes, cross-eyed, extra fingers, fused fingers, mutated hands, deformed face, " +
  "distorted features, blurry, out of focus, low resolution, jpeg artifacts, oversharpened, " +
  "harsh direct flash, overexposed, underexposed, watermark, text, logo, signature, frame, border, " +
  "duplicate face, extra limbs, bad anatomy, grain, noise, " +
  "side profile, back of head, looking away, looking down, looking up, closed eyes, eyes closed, " +
  "squinting, head turned, tilted head at extreme angle, full body, wide shot, distant subject";

// Applied to every generated prompt, regardless of category, so "front-facing
// close-up headshot" is a guarantee rather than something left to whichever
// suffix happened to get picked in rotation (one of the old suffixes never
// mentioned facing the camera at all).
const FRAMING_CLAUSE =
  " The framing is a tight head-and-shoulders close-up headshot, subject facing the camera directly, " +
  "both eyes open and clearly visible, centered composition, tack-sharp focus on the eyes.";

// ---------------------------------------------------------------------------
// Per-plan technical quality profile.
// Steps/guidance are tuned per your original notes (guidance >4.0 breaks Flux
// into "plastic" territory; loraScale 0.85 keeps likeness without dragging in
// the selfie's bad lighting/background).
//
// Resolution & COST: fal-ai/flux-lora bills $0.035 PER MEGAPIXEL of output, not
// per image. We standardize every tier on a ~1MP portrait (832x1216 = 1.01 MP),
// so each image costs a predictable ~$0.0354 regardless of plan. There is NO
// upscale pass — the old clarityai/crystal-upscaler step (2.5x/4x) multiplied
// output megapixels 6-16x, which would have cost $0.22-0.58 per image and blown
// the per-image cost target. Native ~1MP Flux is sharp and more than sufficient
// for web/LinkedIn/print-at-small-size headshots. Tiers differ by shot count and
// style variety, not resolution. Higher tiers get more inference steps for
// marginally finer detail — inference steps do NOT affect fal cost (only output
// megapixels do), so this is a free quality lever, costing only a little latency.
// ---------------------------------------------------------------------------
type PlanKey = "basic" | "pro" | "executive";

// 832x1216 is divisible by 16 (Flux requirement) and lands at 1.01 MP → ~$0.0354/image.
const GEN_WIDTH = 832;
const GEN_HEIGHT = 1216;
const MEGAPIXELS_PER_IMAGE = (GEN_WIDTH * GEN_HEIGHT) / 1_000_000; // ~1.012

const QUALITY_PROFILE: Record<PlanKey, {
  inferenceSteps: number;
  baseWidth: number;
  baseHeight: number;
}> = {
  basic:     { inferenceSteps: 30, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
  pro:       { inferenceSteps: 34, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
  executive: { inferenceSteps: 38, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
};

function resolvePlanKey(plan: string): PlanKey {
  if (plan === "executive") return "executive";
  if (plan === "pro" || plan === "custom_upsell") return "pro";
  return "basic";
}

function buildPrompts(plan: string, prefs: UserPreferences | undefined, count: number): string[] {
  const pool: string[] = [];

  // --- Gender-aware subject tag -------------------------------------------
  // The training comments claimed this already existed ("a man TOK" / "a
  // woman TOK") to stop the LoRA drifting toward the wrong gender in business
  // wear - but it was never actually wired in. Every occurrence of the raw
  // trigger word "TOK" below gets replaced with a gendered subject tag so the
  // model has an explicit anchor.
  const gender = (prefs as any)?.gender as string | undefined;
  const genderWord =
    gender === "male" ? "a man" :
    gender === "female" ? "a woman" :
    "a person";

  // Eye/hair color are on UserPreferences but were previously never read -
  // the LoRA alone should capture these from the training selfies, but an
  // explicit prompt anchor reduces drift, especially in stylized lighting
  // (studio/editorial setups) that can otherwise wash out eye color.
  const colorDescriptors: string[] = [];
  if (prefs?.eyeColor) colorDescriptors.push(`${prefs.eyeColor} eyes`);
  if (prefs?.hairColor) colorDescriptors.push(`${prefs.hairColor} hair`);
  const subjectTag = colorDescriptors.length
    ? `TOK, ${genderWord} with ${colorDescriptors.join(" and ")},`
    : `TOK, ${genderWord},`;
  const applySubject = (s: string) => s.replace(/\bTOK\b/g, subjectTag) + FRAMING_CLAUSE;

  if (plan === "custom_upsell" || prefs?.is_upsell) {
    const c = prefs?.clothing || "professional attire";
    const b = prefs?.background || "studio background";
    const basePrompt = `A premium professional portrait photograph of TOK wearing ${c}. The photo is taken with a ${b} background. Shot on medium format camera, 85mm lens, highly detailed, photorealistic.`;
    const suffixes = [
      " The subject is looking directly at the camera with a subtle, confident smile.",
      " The subject is facing forward with a warm, approachable expression.",
      " The subject is captured in a relaxed, natural pose looking at the lens.",
      " The portrait features flawless professional retouching while maintaining authentic facial features."
    ];
    for (let i = 0; i < count; i++) pool.push(applySubject(basePrompt + suffixes[i % suffixes.length]));
    return pool;
  }

  // Pure, conversational English prompts, keyed by category id so a customer's
  // selected styles (prefs.selectedStyles, matched against HEADSHOT_CATEGORIES
  // in lib/plans.ts) actually change what gets generated. Previously every
  // customer got the same corporate/studio/LinkedIn rotation regardless of
  // what they picked, and 3 of the 7 advertised categories (Actor, Dating &
  // Social, Model) had no prompt content at all.
  const suffixes = [
    " The subject is looking directly at the camera with a subtle, confident smile.",
    " The subject is facing forward with a warm, approachable expression.",
    " The subject is captured in a relaxed, natural pose looking at the lens.",
    " The portrait features flawless professional retouching while maintaining authentic facial features."
  ];

  const STYLE_POOLS: Record<string, string[]> = {
    corporate: [
      "A premium corporate headshot of TOK wearing elegant business attire. The portrait is taken in a brightly lit modern office with large windows. Shot on medium format camera, 85mm lens, soft natural lighting, shallow depth of field, highly detailed, professional photography.",
      "An authoritative executive portrait of TOK wearing refined corporate wear. Standing in a sophisticated wood-panelled boardroom. Professional studio lighting, cinematic composition, photorealistic, sharp focus.",
      "A modern finance professional headshot of TOK wearing a tailored blazer. Abstract blurred office background, clean lighting, 8k resolution, photorealistic portrait.",
      "A classic corporate photograph of TOK wearing professional clothing. Neutral office background with bright, flattering lighting. High quality corporate photography.",
      "A high-end studio portrait of TOK wearing business professional clothing. Solid seamless grey background, flattering rembrandt lighting, sharp focus, unretouched natural skin texture.",
    ],
    linkedin: [
      "A highly engaging LinkedIn profile picture of TOK looking directly at the camera with a warm, confident smile. Wearing professional business attire. Bright airy background, natural daylight, DSLR photography.",
      "A trustworthy professional networking portrait of TOK looking directly at the camera. Smart casual wear, solid muted color background, approachable and friendly expression, high quality.",
      "A polished LinkedIn headshot of TOK looking directly at the camera. Confident expression, modern office background, photorealistic portrait.",
      "A clean, minimalist studio headshot of TOK wearing smart casual attire. Solid white background, soft butterfly lighting, professional photography, crisp details, highly realistic.",
    ],
    creative: [
      "A creative industry portrait of TOK wearing stylish minimalist fashion. Concrete wall background with dramatic shadows. Editorial magazine photography, artistic softbox lighting.",
      "A vibrant creative director headshot of TOK wearing contemporary clothing. Art gallery background, natural light, shallow depth of field, bokeh, highly detailed.",
      "An artistic professional photo of TOK wearing layered clothing. Exposed brick background, warm ambient lighting, highly detailed photography.",
      "A modern tech startup founder headshot of TOK wearing a stylish dark t-shirt. Glass coworking space background, bright natural lighting, relaxed but professional, 85mm lens.",
    ],
    casual: [
      "A relaxed professional outdoor photograph of TOK. Blurred urban park background, golden hour lighting, natural authentic expression, crisp focus.",
      "A friendly lifestyle headshot of TOK wearing comfortable but polished clothing. Outdoor cafe setting, bright daylight, candid professional photography.",
      "A sunny outdoor portrait of TOK wearing a casual jacket. Blurred city street background, bright daylight, highly detailed photography.",
      "An approachable software engineer portrait of TOK wearing a casual button-down shirt. Modern coffee shop background, shallow depth of field, candid and authentic, photorealistic.",
    ],
    actor: [
      "A classic actor headshot of TOK wearing simple, well-fitted clothing in a solid neutral color. Plain seamless background, even soft lighting, sharp focus on the eyes, industry-standard casting photography.",
      "A theatrical headshot of TOK with a natural, engaged expression, wearing simple dark clothing. Solid grey backdrop, three-point studio lighting, crisp detail, no distracting elements.",
      "An authentic commercial-print style headshot of TOK, warm genuine expression, wearing a simple top in a muted tone. Soft neutral background, flattering catchlight in the eyes, high-resolution casting photography.",
      "A versatile talent headshot of TOK with a confident, open expression. Plain light-grey background, clean even lighting, sharp focus, minimal retouching to preserve authentic detail.",
    ],
    dating: [
      "A natural, candid lifestyle portrait of TOK with a genuine warm smile, wearing casual everyday clothing. Soft outdoor golden-hour light, relaxed authentic pose, high quality photography.",
      "A friendly, approachable portrait of TOK laughing naturally, wearing a comfortable casual outfit. Blurred park or city background, natural daylight, candid and unposed feel.",
      "An inviting lifestyle headshot of TOK with a relaxed, genuine expression, wearing a simple flattering outfit. Warm natural lighting, soft background blur, authentic and personable.",
      "A cheerful casual portrait of TOK enjoying an everyday moment, natural smile, comfortable stylish clothing. Bright natural light, candid composition, high quality photography.",
    ],
    model: [
      "A high-fashion editorial portrait of TOK wearing sleek modern clothing. Bold studio lighting with dramatic shadow, minimalist background, sharp focus, magazine-quality photography.",
      "A striking beauty portrait of TOK with polished styling, wearing simple elegant clothing. Clean studio background, professional beauty lighting, crisp detail, photorealistic.",
      "A contemporary fashion portfolio shot of TOK wearing stylish contemporary clothing. Neutral seamless backdrop, directional studio lighting, sharp focus, editorial composition.",
      "An editorial portrait of TOK with a strong, confident expression, wearing tailored modern clothing. Moody studio lighting, solid dark background, high-fashion photography.",
    ],
  };

  const availableCategories = Object.keys(STYLE_POOLS);
  const requested = (prefs?.selectedStyles || []).filter((id: string) => STYLE_POOLS[id]);
  const activeCategories = requested.length > 0 ? requested : availableCategories;
  const maxPoolLen = Math.max(...activeCategories.map((c: string) => STYLE_POOLS[c].length));

  let catIdx = 0, promptIdx = 0, sIdx = 0;
  while (pool.length < count) {
    const category = activeCategories[catIdx % activeCategories.length];
    const categoryPrompts = STYLE_POOLS[category];
    const base = categoryPrompts[promptIdx % categoryPrompts.length];
    pool.push(applySubject(base + suffixes[sIdx % suffixes.length]));

    catIdx++;
    if (catIdx % activeCategories.length === 0) {
      promptIdx++;
      if (promptIdx % maxPoolLen === 0) sIdx++;
    }
  }
  return pool;
}

export const trainModel = async (imageUrl: string, orderId: string, imageCount?: number): Promise<{ request_id: string }> => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${generateWebhookToken(orderId)}`;

  // Trainer: fal-ai/flux-lora-portrait-trainer — purpose-built for faces
  // (brighter highlights, better prompt-following, more facial detail) than the
  // generic flux-lora-fast-training we used before. Its LoRA output
  // (diffusers_lora_file) is the same format the fal webhook already parses and
  // is used identically at inference by fal-ai/flux-lora.
  //
  // Step count scales with how much training data actually came in. The trainer
  // defaults to 2500 steps, which (a) is expensive and (b) badly overfits the
  // small datasets we accept — with only a handful of selfies, a high step count
  // memorizes each photo's exact pose/background instead of generalizing the
  // face. We keep it conservative: ~120 steps per image, floored at 500 and
  // capped at 1400. This controls fal cost and produces a better-generalizing
  // LoRA for small datasets. (Quality still improves most from MORE input
  // photos — the onboarding flow now asks for at least 2 and nudges toward 6+.)
  const imgs = imageCount && imageCount > 0 ? imageCount : 4;
  const steps = Math.min(1400, Math.max(500, imgs * 120));

  const res = await fetch(`https://queue.fal.run/fal-ai/flux-lora-portrait-trainer?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      images_data_url: imageUrl,
      steps,
      trigger_phrase: "TOK",   // portrait trainer uses trigger_phrase (fast-trainer used trigger_word)
      subject_crop: true,       // auto-crop to the face/subject — better for headshot datasets
      create_masks: true,       // face-segmentation mask weighting
      multiresolution_training: true,
    }),
  });

  if (!res.ok) throw new Error(`Training submit failed (HTTP ${res.status})`);
  return await res.json();
};

/** SHA-256 over the full image body - the old code only hashed the first 1000
 * bytes (the Range request), which mostly captures the JPEG header. Since every
 * image in a batch is generated with identical encoder settings, two genuinely
 * different photos can share an identical header and get hashed the same way -
 * causing valid, unique photos to be wrongly discarded as duplicates. That
 * silently shrank the delivered pack below what the customer paid for. */
async function hashImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
  } catch {
    return null; // fail open: never block delivery because a hash check failed
  }
}

export const generateHeadshots = async (
  modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: UserPreferences
): Promise<GenerateHeadshotsResponse> => {
  const planKey = resolvePlanKey(plan);
  const profile = QUALITY_PROFILE[planKey];
  const promisedTotal = PLAN_SHOTS[plan] ?? 40;
  const targetShots = Math.min(startIndex + limit, promisedTotal);
  const batchSize = targetShots - startIndex;

  // Hard cap on total generations to prevent cost overruns
  const MAX_RETRY_MULTIPLIER = 1.5; // Never exceed 150% of promised count
  const maxAttempts = Math.ceil(promisedTotal * MAX_RETRY_MULTIPLIER);

  // Build extra prompts beyond the batch so we have fresh, never-before-tried
  // material to backfill with if some generations fail or get flagged as dupes -
  // guaranteeing the customer actually receives the count they paid for.
  const BACKFILL_BUFFER = Math.max(10, Math.ceil(batchSize * 0.3));
  const allPrompts = buildPrompts(plan, prefs, Math.min(targetShots + BACKFILL_BUFFER, maxAttempts));

  const loraScale = 0.85; // sweet spot for likeness without dragging in selfie lighting/pose
  const guidanceScale = 3.5; // Flux Dev breaks (plastic look, artifacts) above ~4.0

  let consecutiveFailures = 0;
  const seenHashes = new Set<string>();
  let totalMegapixels = 0;
  const COST_PER_MEGAPIXEL = 0.035; // fal-ai/flux-lora: $0.035 per output megapixel

  // Per-invocation spend ceiling, derived from what THIS batch is responsible for
  // (batchSize images at ~1 MP each) plus a 60% buffer to cover legitimate
  // retries/backfill. With upscale removed, cost is now fully predictable, so this
  // is a tight, plan-aware guard against any runaway loop — not the loose flat $5
  // it used to be. Basic ≈ $2.3, Pro ≈ $5.7, Executive ≈ $8.5.
  const MAX_GENERATION_COST = batchSize * 1.6 * MEGAPIXELS_PER_IMAGE * COST_PER_MEGAPIXEL;

  const generateOne = (prompt: string, index: number) => (async () => {
    let attempt = 0;
    while (attempt < 2) {
      if (consecutiveFailures > 4) {
        log.warn("Circuit breaker activated. Pausing generation requests for 15s.");
        await new Promise(r => setTimeout(r, 15000));
        consecutiveFailures = 0;
      }

      // Cost tracking: stop before exceeding this batch's spend ceiling.
      const currentCost = totalMegapixels * COST_PER_MEGAPIXEL;
      const estimatedNextCost = currentCost + MEGAPIXELS_PER_IMAGE * COST_PER_MEGAPIXEL;

      if (estimatedNextCost > MAX_GENERATION_COST) {
        log.warn({ currentCost, maxCost: MAX_GENERATION_COST }, "Approaching cost limit, stopping generation");
        throw new Error("Cost limit exceeded for generation batch");
      }

      try {
        const res = await withFalSlot(() => falFetch("fal-ai/flux-lora", {
          prompt,
          negative_prompt: NEGATIVE_PROMPT,
          loras: [{ path: modelId, scale: loraScale }],
          num_inference_steps: profile.inferenceSteps,
          guidance_scale: guidanceScale,
          num_images: 1,
          width: profile.baseWidth,
          height: profile.baseHeight,
          output_format: "jpeg",
          enable_safety_checker: true,
          acceleration: "none", // prioritize quality over speed
        }));

        const imgUrl = res.data.images[0].url;

        const hash = await hashImage(imgUrl);
        if (hash) {
          if (seenHashes.has(hash)) throw new Error("Duplicate image detected, rejecting.");
          seenHashes.add(hash);
        }

        consecutiveFailures = 0;
        totalMegapixels += MEGAPIXELS_PER_IMAGE; // real output MP for accurate cost tracking
        return { ...res.data, images: [{ ...res.data.images[0], url: imgUrl }], prompt, index };
      } catch (e: any) {
        consecutiveFailures++;
        if (e.message?.includes("not found")) throw e; // fatal error, don't retry
        attempt++;
        if (attempt >= 2) throw e;
        await new Promise(r => setTimeout(r, 2000 * attempt));
      }
    }
  })();

  const initialPrompts = Array.from({ length: batchSize }, (_, i) => ({ prompt: allPrompts[startIndex + i], index: startIndex + i }));
  const initialResults = await Promise.allSettled(initialPrompts.map(({ prompt, index }) => generateOne(prompt, index)));

  const fulfilled: GenerateHeadshotsResult[] = [];
  const failures: string[] = [];
  for (const r of initialResults) {
    if (r.status === "fulfilled" && r.value) fulfilled.push(r.value);
    else if (r.status === "rejected") failures.push(r.reason?.message || "Generation failed");
  }

  // --- Backfill: guarantee the promised count ------------------------------
  // If any slot failed (or got flagged as a duplicate), replace it with a
  // fresh prompt/index from the buffer instead of just shipping a short pack.
  let shortfall = batchSize - fulfilled.length;
  let backfillCursor = targetShots; // first index beyond the original batch
  const maxBackfillRounds = 2;

  for (let round = 0; round < maxBackfillRounds && shortfall > 0 && backfillCursor < allPrompts.length; round++) {
    const backfillPrompts = Array.from(
      { length: Math.min(shortfall, allPrompts.length - backfillCursor) },
      (_, i) => ({ prompt: allPrompts[backfillCursor + i], index: backfillCursor + i })
    );
    backfillCursor += backfillPrompts.length;

    const backfillResults = await Promise.allSettled(backfillPrompts.map(({ prompt, index }) => generateOne(prompt, index)));
    for (const r of backfillResults) {
      if (r.status === "fulfilled" && r.value) fulfilled.push(r.value);
      else if (r.status === "rejected") failures.push(r.reason?.message || "Generation failed");
    }
    shortfall = batchSize - fulfilled.length;
  }

  if (shortfall > 0) {
    log.warn(`Could not fully backfill shortfall for order using model ${modelId}: ${shortfall} shots short of promised ${batchSize}.`);
  }

  // Re-sequence indices 0..N so downstream pagination/display stays contiguous
  // regardless of which original slots succeeded vs got backfilled.
  const sequenced = fulfilled
    .sort((a, b) => a.index - b.index)
    .map((r, i) => ({ ...r, index: startIndex + i }));

  return { results: sequenced, failures, totalRequested: batchSize };
};

// ---------------------------------------------------------------------------
// OPERATIONAL NOTE (not code):
// One fal.ai call per image now (upscale pass removed), each ~1 MP. With the
// global concurrency semaphore at 8 (lib/fal-concurrency.ts), an Executive
// order (150 images) runs ~19 sequential waves. Measure real p95 turnaround
// against the pricing-page delivery claims ("2 hours"/"1 hour"/"30 minutes")
// before trusting them, and raise the semaphore only up to your actual fal.ai
// account-level concurrency limit. Per-image cost is now a predictable
// ~$0.0354 (1.012 MP × $0.035), so a full order costs roughly:
//   Basic 40 → ~$1.42 + training   Pro 100 → ~$3.54 + training   Exec 150 → ~$5.31 + training
// ---------------------------------------------------------------------------