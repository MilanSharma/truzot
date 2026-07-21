import "server-only";
import { createHmac, createHash, randomUUID } from "crypto";
import { PLAN_SHOTS } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

// ---------------------------------------------------------------------------
// Combinatorial prompt engine.
//
// The old version had ~29 base prompts × 4 suffixes ≈ 116 unique strings, so a
// 150-shot Executive order literally could not be filled with distinct prompts —
// it wrapped around and re-used them. This builds each prompt from independent
// dimensions (scene → background → outfit + shared lighting/expression pools),
// so every tier's images are genuinely varied and no (scene+bg+outfit+lighting+
// expression) combination repeats until the whole space is exhausted. Even the
// smallest category's space (≈ 5 bg × 5 outfit × 4 light × 4 expr = 400) dwarfs
// the 150-image Executive plan, and generation also passes a unique random seed
// per image (see generateOne) so no two outputs are identical.
// ---------------------------------------------------------------------------
type Scene = { label: string; backgrounds: string[]; outfits: string[] };

const SCENES: Record<string, Scene> = {
  corporate: {
    label: "a premium corporate headshot",
    backgrounds: [
      "in a brightly lit modern office with floor-to-ceiling windows",
      "against a solid seamless grey studio backdrop",
      "in a sophisticated wood-panelled boardroom",
      "against a softly blurred open-plan office background",
      "against a clean neutral off-white wall",
    ],
    outfits: [
      "wearing a tailored charcoal suit with a crisp white shirt",
      "wearing an elegant navy blazer over a light dress shirt",
      "wearing a refined dark business suit and tie",
      "wearing a smart grey blazer and a subtle patterned shirt",
      "wearing professional business attire in a muted tone",
    ],
  },
  linkedin: {
    label: "a polished LinkedIn profile headshot",
    backgrounds: [
      "against a bright airy light-toned background",
      "against a solid muted blue background",
      "in a softly blurred modern office",
      "against a clean white studio background",
      "against a warm neutral beige backdrop",
    ],
    outfits: [
      "wearing smart business casual attire",
      "wearing a fitted blazer over a plain top",
      "wearing a professional collared shirt",
      "wearing a tasteful knit sweater over a collar",
      "wearing a simple well-fitted blouse or shirt",
    ],
  },
  creative: {
    label: "a creative-industry editorial portrait",
    backgrounds: [
      "against a raw concrete wall with dramatic shadows",
      "in a bright modern art gallery",
      "against an exposed brick wall with warm ambient light",
      "in a sunlit glass coworking space",
      "against a moody dark textured backdrop",
    ],
    outfits: [
      "wearing stylish minimalist contemporary fashion",
      "wearing a fashionable dark turtleneck",
      "wearing an effortless layered designer outfit",
      "wearing a modern well-cut casual blazer",
      "wearing a clean monochrome creative outfit",
    ],
  },
  casual: {
    label: "a relaxed casual-professional portrait",
    backgrounds: [
      "against a blurred green urban park in golden-hour light",
      "at a bright outdoor cafe",
      "against a blurred city street in soft daylight",
      "in a cozy modern coffee shop with shallow depth of field",
      "against a sunlit natural outdoor background",
    ],
    outfits: [
      "wearing a casual button-down shirt",
      "wearing a comfortable but polished light jacket",
      "wearing a smart crew-neck sweater",
      "wearing a relaxed open collared shirt",
      "wearing an approachable everyday smart-casual outfit",
    ],
  },
  actor: {
    label: "an industry-standard actor headshot",
    backgrounds: [
      "against a plain seamless neutral background",
      "against a solid mid-grey studio backdrop",
      "against a soft light-grey background",
      "against an evenly lit muted backdrop",
      "against a clean dark grey background",
    ],
    outfits: [
      "wearing simple well-fitted clothing in a solid neutral color",
      "wearing a plain dark top",
      "wearing a muted-tone casual top",
      "wearing an unadorned fitted shirt",
      "wearing a simple flattering solid-color top",
    ],
  },
  dating: {
    label: "a natural, candid lifestyle portrait",
    backgrounds: [
      "in soft outdoor golden-hour light",
      "against a blurred park background",
      "against a warm blurred city background",
      "in bright natural daylight outdoors",
      "against a soft sunlit background with gentle bokeh",
    ],
    outfits: [
      "wearing relaxed casual everyday clothing",
      "wearing a comfortable stylish casual outfit",
      "wearing a simple flattering top",
      "wearing an easygoing weekend outfit",
      "wearing a soft-textured casual sweater",
    ],
  },
  model: {
    label: "a high-fashion editorial portrait",
    backgrounds: [
      "against a minimalist seamless studio backdrop",
      "against a clean bright beauty-lit background",
      "against a solid bold-colored backdrop",
      "against a moody dark studio background",
      "against a neutral high-fashion seamless background",
    ],
    outfits: [
      "wearing sleek modern tailored clothing",
      "wearing simple elegant high-fashion attire",
      "wearing a sharp contemporary designer look",
      "wearing a refined minimalist ensemble",
      "wearing a polished editorial outfit",
    ],
  },
};

const LIGHTING = [
  "soft natural window lighting",
  "flattering three-point studio lighting",
  "gentle Rembrandt lighting",
  "bright even softbox lighting",
];

const EXPRESSIONS = [
  "with a warm, confident smile, looking directly at the camera",
  "with a calm, approachable expression, facing the camera",
  "with a subtle, self-assured closed-mouth smile",
  "with a relaxed, genuine and friendly expression",
];

function buildPrompts(plan: string, prefs: UserPreferences | undefined, count: number): string[] {
  // --- Gender-aware subject tag -------------------------------------------
  // Every occurrence of the raw trigger word "TOK" gets replaced with a
  // gendered subject tag so the LoRA has an explicit anchor and doesn't drift
  // toward the wrong gender in business wear.
  const gender = (prefs as any)?.gender as string | undefined;
  const genderWord =
    gender === "male" ? "a man" :
    gender === "female" ? "a woman" :
    "a person";

  // Eye/hair color anchors reduce drift under stylized lighting.
  const colorDescriptors: string[] = [];
  if (prefs?.eyeColor) colorDescriptors.push(`${prefs.eyeColor} eyes`);
  if (prefs?.hairColor) colorDescriptors.push(`${prefs.hairColor} hair`);
  const subject = colorDescriptors.length
    ? `${genderWord} with ${colorDescriptors.join(" and ")}`
    : genderWord;
  const finish = " Shot on an 85mm lens, professional photography, photorealistic, sharp focus on the eyes, natural skin texture." + FRAMING_CLAUSE;

  // Upsell / custom pack: honor the customer's explicit clothing/background but
  // still vary lighting + expression so a 20-pack isn't 20 identical frames.
  if (plan === "custom_upsell" || prefs?.is_upsell) {
    const c = prefs?.clothing || "professional attire";
    const b = prefs?.background || "a clean studio background";
    const pool: string[] = [];
    for (let i = 0; i < count; i++) {
      const light = LIGHTING[i % LIGHTING.length];
      const expr = EXPRESSIONS[Math.floor(i / LIGHTING.length) % EXPRESSIONS.length];
      pool.push(`A premium professional portrait of TOK, ${subject}, wearing ${c}, against ${b}. ${light}, ${expr}.${finish}`);
    }
    return pool;
  }

  const availableCategories = Object.keys(SCENES);
  const requested = (prefs?.selectedStyles || []).filter((id: string) => SCENES[id]);
  const activeCategories = requested.length > 0 ? requested : availableCategories;

  // Build a distinct combo list per category (mixed-radix counter over
  // background × outfit × lighting × expression), then interleave categories
  // round-robin so the delivered gallery spreads variety instead of showing all
  // of one look before the next.
  const perCategory: string[][] = activeCategories.map((cat: string) => {
    const scene = SCENES[cat];
    const combos: string[] = [];
    const nb = scene.backgrounds.length, no = scene.outfits.length, nl = LIGHTING.length, ne = EXPRESSIONS.length;
    const total = nb * no * nl * ne;
    // Only generate as many as we could plausibly need from this category.
    const need = Math.ceil(count / activeCategories.length) + 4;
    for (let i = 0; i < Math.min(total, need); i++) {
      const bg = scene.backgrounds[i % nb];
      const outfit = scene.outfits[Math.floor(i / nb) % no];
      const light = LIGHTING[Math.floor(i / (nb * no)) % nl];
      const expr = EXPRESSIONS[Math.floor(i / (nb * no * nl)) % ne];
      combos.push(`${scene.label} of TOK, ${subject}, ${outfit}, ${bg}. ${light}, ${expr}.${finish}`);
    }
    return combos;
  });

  const pool: string[] = [];
  let round = 0;
  while (pool.length < count) {
    let addedThisRound = 0;
    for (const combos of perCategory) {
      if (round < combos.length) {
        pool.push(combos[round]);
        addedThisRound++;
        if (pool.length >= count) break;
      }
    }
    round++;
    // Safety: if every category is exhausted (only possible when count exceeds
    // the entire combinatorial space — it never does for our plans), stop.
    if (addedThisRound === 0) break;
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

/** Download the generated image once, then reuse the bytes for BOTH the
 * duplicate check (SHA-256 over the full body) AND persistence to our own
 * Supabase storage. Persistence matters because fal.media output files expire
 * after ~7 days by default, while we promise customers a 30-day gallery — if
 * we only stored fal URLs, a customer returning on day 10 would find every
 * photo dead. Storage paths are unguessable ({orderId}/{uuid}.jpg) in a
 * public-read bucket — the same effective access model as the fal.media URLs
 * they replace. Fails open: if download or upload fails, the fal URL is kept
 * so the batch still delivers (the customer just relies on fal's retention). */
async function fetchHashAndPersist(
  falUrl: string,
  orderId: string | undefined,
  isDuplicate: (hash: string) => boolean,
): Promise<{ hash: string | null; url: string; duplicate: boolean }> {
  try {
    const res = await fetch(falUrl);
    if (!res.ok) return { hash: null, url: falUrl, duplicate: false };
    const buffer = Buffer.from(await res.arrayBuffer());
    const hash = createHash("sha256").update(buffer).digest("hex");
    // Reject duplicates BEFORE uploading so we never store orphaned copies.
    if (isDuplicate(hash)) return { hash, url: falUrl, duplicate: true };

    if (orderId) {
      const path = `${orderId}/${randomUUID()}.jpg`;
      const { error: upErr } = await supabaseAdmin.storage
        .from("headshots")
        .upload(path, buffer, { contentType: "image/jpeg", upsert: false });
      if (!upErr) {
        const { data } = supabaseAdmin.storage.from("headshots").getPublicUrl(path);
        if (data?.publicUrl) return { hash, url: data.publicUrl, duplicate: false };
      } else {
        log.warn({ err: upErr, orderId }, "Headshot persist to storage failed — keeping fal URL");
      }
    }
    return { hash, url: falUrl, duplicate: false };
  } catch {
    return { hash: null, url: falUrl, duplicate: false }; // fail open: never block delivery
  }
}

export const generateHeadshots = async (
  modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: UserPreferences,
  orderId?: string, // enables persistence of outputs to our own storage (see fetchHashAndPersist)
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
          // fal-ai/flux-lora has NO top-level width/height param — it takes
          // `image_size` (object or preset string, default "landscape_4_3").
          // Sending bare width/height is silently ignored, so every image was
          // generated at the API's landscape default instead of our portrait
          // framing. Confirmed via a live end-to-end test order: images came
          // back 1024x768 despite this code specifying 832x1216.
          image_size: { width: profile.baseWidth, height: profile.baseHeight },
          seed: Math.floor(Math.random() * 2_147_483_647), // unique per image so no two outputs collide
          output_format: "jpeg",
          enable_safety_checker: true,
          acceleration: "none", // prioritize quality over speed
        }));

        const falUrl = res.data.images[0].url;

        // One download serves the dedupe hash AND persistence to our storage
        // (fal.media URLs expire in ~7 days; our gallery promise is 30).
        const { hash, url: imgUrl, duplicate } = await fetchHashAndPersist(
          falUrl, orderId, (h) => seenHashes.has(h),
        );
        if (duplicate) throw new Error("Duplicate image detected, rejecting.");
        if (hash) seenHashes.add(hash);

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

/** Generate a single replacement image for the dashboard's per-photo
 * "Regenerate" action. Reuses the exact same negative prompt / LoRA scale /
 * guidance / resolution as the main batch pipeline (via QUALITY_PROFILE) so a
 * regenerated photo is never lower quality than the rest of the delivered set. */
export async function regenerateOne(
  modelId: string, plan: string, prompt: string, orderId?: string,
): Promise<{ url: string }> {
  const profile = QUALITY_PROFILE[resolvePlanKey(plan)];
  const { data } = await falFetch("fal-ai/flux-lora", {
    prompt,
    negative_prompt: NEGATIVE_PROMPT,
    loras: [{ path: modelId, scale: 0.85 }],
    num_inference_steps: profile.inferenceSteps,
    guidance_scale: 3.5,
    num_images: 1,
    image_size: { width: profile.baseWidth, height: profile.baseHeight }, // see generateOne for why this must be image_size, not width/height
    seed: Math.floor(Math.random() * 2_147_483_647), // fresh seed so a regen differs from the original
    output_format: "jpeg",
    enable_safety_checker: true,
    acceleration: "none",
  });
  // Persist like the main pipeline so a regenerated photo outlives fal's ~7-day
  // retention just like the rest of the customer's set.
  const { url } = await fetchHashAndPersist(data.images[0].url, orderId, () => false);
  return { url };
}

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