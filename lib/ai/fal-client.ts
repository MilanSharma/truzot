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

// Highly optimized negative prompt to strip out the "plastic AI sheen"
const NEGATIVE_PROMPT =
  "plastic, waxy, smooth skin, airbrushed, retouched, CGI, 3D render, digital art, illustration, painting, doll-like, uncanny valley, " +
  "asymmetrical eyes, extra fingers, mutated hands, deformed face, distorted features, blurry, out of focus, jpeg artifacts, " +
  "harsh direct flash, overexposed, watermark, logo, duplicate face, bad anatomy, grain, noise, side profile, looking away";

const FRAMING_CLAUSE =
  " The framing is a tight head-and-shoulders close-up headshot. Medium format photography, shot on 85mm lens f/1.8, raw unedited photo, authentic, highly detailed, realistic natural skin texture, visible fine pores.";

type PlanKey = "basic" | "pro" | "executive";
const GEN_WIDTH = 832;
const GEN_HEIGHT = 1216;
const MEGAPIXELS_PER_IMAGE = (GEN_WIDTH * GEN_HEIGHT) / 1_000_000;

const QUALITY_PROFILE: Record<PlanKey, { inferenceSteps: number; baseWidth: number; baseHeight: number; }> = {
  basic:     { inferenceSteps: 30, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
  pro:       { inferenceSteps: 35, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
  executive: { inferenceSteps: 40, baseWidth: GEN_WIDTH, baseHeight: GEN_HEIGHT },
};

function resolvePlanKey(plan: string): PlanKey {
  if (plan === "executive") return "executive";
  if (plan === "pro" || plan === "custom_upsell") return "pro";
  return "basic";
}

// --- MASSIVE COMBINATORIAL VARIETY DATA ---
type Scene = { label: string; backgrounds: string[] };

const SCENES: Record<string, Scene> = {
  corporate: {
    label: "a corporate headshot",
    backgrounds: [
      "in a brightly lit modern glass office with city views",
      "against a solid seamless dark charcoal studio backdrop",
      "in a sophisticated mahogany wood-panelled boardroom",
      "against a softly blurred bright corporate lobby",
      "against a clean neutral light-grey office wall",
    ],
  },
  linkedin: {
    label: "a polished LinkedIn profile headshot",
    backgrounds: [
      "against a bright airy white background",
      "against a solid muted navy blue studio backdrop",
      "in a softly blurred creative agency office",
      "against a clean textured beige backdrop",
      "standing in a modern glass hallway",
    ],
  },
  creative: {
    label: "a creative-industry editorial portrait",
    backgrounds: [
      "against a raw exposed brick wall",
      "in a bright modern art studio",
      "against a dark dramatic concrete wall",
      "in a vibrant colorful coworking space",
      "against a seamless mustard yellow studio backdrop",
    ],
  },
  casual: {
    label: "a relaxed casual-professional portrait",
    backgrounds: [
      "against a blurred green urban park",
      "at a bright sunlit outdoor cafe",
      "against a blurred city streetscape",
      "in a cozy modern coffee shop with shallow depth of field",
      "against a natural wooden fence outdoors",
    ],
  },
  actor: {
    label: "an industry-standard actor headshot",
    backgrounds: [
      "against a plain seamless white backdrop",
      "against a solid mid-grey studio backdrop",
      "against a dramatic black studio background",
      "against a soft pastel blue backdrop",
      "against a textured canvas studio backdrop",
    ],
  },
  dating: {
    label: "a natural, candid lifestyle portrait",
    backgrounds: [
      "in soft outdoor golden-hour sunlight",
      "against a blurred lush green park background",
      "against a warm blurred city skyline at dusk",
      "in bright natural daylight on a city sidewalk",
      "relaxing at an outdoor restaurant patio",
    ],
  },
  model: {
    label: "a high-fashion editorial portrait",
    backgrounds: [
      "against a minimalist seamless studio backdrop",
      "against a clean bright beauty-lit background",
      "against a solid bold crimson-colored backdrop",
      "against a moody dark fashion studio background",
      "against a highly textured artistic plaster wall",
    ],
  },
};

const POSES = [
  "facing the camera directly with squared shoulders",
  "with shoulders angled in a subtle 3/4 turn, head turned to face the lens",
  "in a dynamic over-the-shoulder pose, looking back at the camera",
  "leaning slightly forward, engaging directly with the camera",
  "with a relaxed posture and slightly dropped shoulders, looking straight ahead"
];

const LIGHTING = [
  "soft, diffused window light from the side",
  "dramatic cinematic lighting with a subtle rim light",
  "bright, clean, flat studio lighting",
  "warm golden hour sunlight",
  "moody, high-contrast Rembrandt lighting"
];

const EXPRESSIONS = [
  "with a warm, approachable smile showing teeth",
  "with a confident, closed-mouth smile",
  "with a serious, focused, and professional expression",
  "with a relaxed, candid, and friendly demeanor",
  "with a subtle, knowing smirk"
];

// Strict gender-specific wardrobe with explicit colors and styles to guarantee variety
function getOutfitsForGenderAndScene(gender: string | undefined, scene: string): string[] {
  const isFemale = gender === "female";
  const isMale = gender === "male";

  if (scene === "corporate" || scene === "linkedin") {
    if (isFemale) return [
      "wearing a navy blue tailored blazer over a white silk blouse", 
      "wearing a charcoal grey professional business dress", 
      "wearing a light beige suit jacket", 
      "wearing a burgundy structured office blouse",
      "wearing a classic black blazer with a subtle necklace"
    ];
    if (isMale) return [
      "wearing a tailored navy suit with a crisp white shirt and light blue tie", 
      "wearing a charcoal grey suit with no tie", 
      "wearing a light grey blazer over a black dress shirt", 
      "wearing a classic black suit with a silver tie",
      "wearing a crisp, well-fitted white button-down dress shirt"
    ];
    return [
      "wearing professional dark business attire", 
      "wearing a smart light-grey corporate blazer", 
      "wearing a crisp white button-down", 
      "wearing formal navy office attire",
      "wearing a charcoal sweater over a collared shirt"
    ];
  }
  
  if (scene === "creative" || scene === "startup") {
    if (isFemale) return [
      "wearing a stylish black turtleneck sweater", 
      "wearing an olive green casual blazer", 
      "wearing a mustard yellow knit top", 
      "wearing a crisp oversized white button-down shirt"
    ];
    if (isMale) return [
      "wearing a fitted black turtleneck", 
      "wearing a navy blue smart-casual sweater", 
      "wearing an olive green bomber jacket over a t-shirt", 
      "wearing a casual denim overshirt"
    ];
    return [
      "wearing stylish minimalist contemporary fashion", 
      "wearing a fashionable black turtleneck", 
      "wearing an olive green casual jacket",
      "wearing a clean monochrome creative outfit"
    ];
  }

  // Casual / Actor / Dating / Default
  if (isFemale) return [
    "wearing a cream oversized knit sweater", 
    "wearing a denim jacket over a white tee", 
    "wearing a light blue linen shirt", 
    "wearing a camel colored cardigan"
  ];
  if (isMale) return [
    "wearing a grey marl crew-neck sweater", 
    "wearing a light blue denim shirt", 
    "wearing a navy bomber jacket", 
    "wearing a burgundy casual pullover"
  ];
  return [
    "wearing relaxed casual everyday clothing", 
    "wearing a comfortable grey sweater", 
    "wearing a light denim jacket",
    "wearing a simple flattering top"
  ];
}

function buildPrompts(plan: string, prefs: UserPreferences | undefined, count: number): string[] {
  const gender = (prefs as any)?.gender as string | undefined;
  
  const age = prefs?.age ? `${prefs.age} year old ` : "";
  const ethnicity = prefs?.ethnicity ? `${prefs.ethnicity} ` : "";
  const genderWord = gender === "male" ? "man" : gender === "female" ? "woman" : "person";
  const baseSubject = `${age}${ethnicity}${genderWord}`.trim();

  const colorDescriptors: string[] = [];
  if (prefs?.eyeColor) colorDescriptors.push(`${prefs.eyeColor} eyes`);
  if (prefs?.hairColor) colorDescriptors.push(`${prefs.hairColor} hair`);
  const subject = colorDescriptors.length ? `${baseSubject} with ${colorDescriptors.join(" and ")}` : baseSubject;

  if (plan === "custom_upsell" || prefs?.is_upsell) {
    const c = prefs?.clothing || "professional attire";
    const b = prefs?.background || "a clean studio background";
    const pool: string[] = [];
    for (let i = 0; i < count; i++) {
      const pose = POSES[i % POSES.length];
      const light = LIGHTING[Math.floor(i / POSES.length) % LIGHTING.length];
      const expr = EXPRESSIONS[Math.floor(i / (POSES.length * LIGHTING.length)) % EXPRESSIONS.length];
      pool.push(`Raw unedited photograph of TOK, a ${subject}, ${pose}, wearing ${c}, against ${b}. ${light}, ${expr}.${FRAMING_CLAUSE}`);
    }
    return pool;
  }

  const availableCategories = Object.keys(SCENES);
  const requested = (prefs?.selectedStyles || []).filter((id: string) => SCENES[id]);
  const activeCategories = requested.length > 0 ? requested : availableCategories;

  const perCategory: string[][] = activeCategories.map((cat: string) => {
    const scene = SCENES[cat];
    const outfits = getOutfitsForGenderAndScene(gender, cat);
    const combos: string[] = [];
    
    // Total combinatorial space per category: 5 BGs * 5 Outfits * 5 Poses * 5 Lights * 5 Exprs = 3125 unique combinations
    const nb = scene.backgrounds.length, no = outfits.length, np = POSES.length, nl = LIGHTING.length, ne = EXPRESSIONS.length;
    const total = nb * no * np * nl * ne;
    
    const need = Math.ceil(count / activeCategories.length) + 10; // Pad for backfills
    for (let i = 0; i < Math.min(total, need); i++) {
      const bg = scene.backgrounds[i % nb];
      const outfit = outfits[Math.floor(i / nb) % no];
      const pose = POSES[Math.floor(i / (nb * no)) % np];
      const light = LIGHTING[Math.floor(i / (nb * no * np)) % nl];
      const expr = EXPRESSIONS[Math.floor(i / (nb * no * np * nl)) % ne];
      
      combos.push(`Raw unedited photograph of TOK, a ${subject}, ${pose}, ${outfit}, ${bg}. ${light}, ${expr}.${FRAMING_CLAUSE}`);
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
    if (addedThisRound === 0) break;
  }
  return pool;
}

export const trainModel = async (imageUrl: string, orderId: string, imageCount?: number): Promise<{ request_id: string }> => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${generateWebhookToken(orderId)}`;

  // Fast-training endpoint: Does not hallucinate faces/genders
  const imgs = imageCount && imageCount > 0 ? imageCount : 4;
  const iter = Math.min(1000, Math.max(700, imgs * 120)); 

  const res = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      images_data_url: imageUrl,
      iter,
      trigger_word: "TOK",
      is_style: false
    }),
  });

  if (!res.ok) throw new Error(`Training submit failed (HTTP ${res.status})`);
  return await res.json();
};

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
    return { hash: null, url: falUrl, duplicate: false }; 
  }
}

export const generateHeadshots = async (
  modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: UserPreferences,
  orderId?: string,
): Promise<GenerateHeadshotsResponse> => {
  const planKey = resolvePlanKey(plan);
  const profile = QUALITY_PROFILE[planKey];
  const promisedTotal = PLAN_SHOTS[plan] ?? 40;
  const targetShots = Math.min(startIndex + limit, promisedTotal);
  const batchSize = targetShots - startIndex;

  const MAX_RETRY_MULTIPLIER = 1.5; 
  const maxAttempts = Math.ceil(promisedTotal * MAX_RETRY_MULTIPLIER);

  const BACKFILL_BUFFER = Math.max(10, Math.ceil(batchSize * 0.3));
  const allPrompts = buildPrompts(plan, prefs, Math.min(targetShots + BACKFILL_BUFFER, maxAttempts));

  const loraScale = 1.0; // Locked 1.0 ensures maximum likeness binding
  const guidanceScale = 2.5; // Dropped to 2.5 (forces photorealism over waxy AI smoothness)

  let consecutiveFailures = 0;
  const seenHashes = new Set<string>();
  let totalMegapixels = 0;
  const COST_PER_MEGAPIXEL = 0.035; 
  const MAX_GENERATION_COST = batchSize * 1.6 * MEGAPIXELS_PER_IMAGE * COST_PER_MEGAPIXEL;

  const generateOne = (prompt: string, index: number) => (async () => {
    let attempt = 0;
    while (attempt < 2) {
      if (consecutiveFailures > 4) {
        await new Promise(r => setTimeout(r, 15000));
        consecutiveFailures = 0;
      }
      const currentCost = totalMegapixels * COST_PER_MEGAPIXEL;
      const estimatedNextCost = currentCost + MEGAPIXELS_PER_IMAGE * COST_PER_MEGAPIXEL;

      if (estimatedNextCost > MAX_GENERATION_COST) throw new Error("Cost limit exceeded for generation batch");

      try {
        const res = await withFalSlot(() => falFetch("fal-ai/flux-lora", {
          prompt,
          negative_prompt: NEGATIVE_PROMPT,
          loras: [{ path: modelId, scale: loraScale }],
          num_inference_steps: profile.inferenceSteps,
          guidance_scale: guidanceScale,
          num_images: 1,
          image_size: { width: profile.baseWidth, height: profile.baseHeight },
          seed: Math.floor(Math.random() * 2_147_483_647), 
          output_format: "jpeg",
          enable_safety_checker: true,
          acceleration: "none", 
        }));

        const falUrl = res.data.images[0].url;
        const { hash, url: imgUrl, duplicate } = await fetchHashAndPersist(falUrl, orderId, (h) => seenHashes.has(h));
        if (duplicate) throw new Error("Duplicate image detected, rejecting.");
        if (hash) seenHashes.add(hash);

        consecutiveFailures = 0;
        totalMegapixels += MEGAPIXELS_PER_IMAGE; 
        return { ...res.data, images: [{ ...res.data.images[0], url: imgUrl }], prompt, index };
      } catch (e: any) {
        consecutiveFailures++;
        if (e.message?.includes("not found")) throw e; 
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

  let shortfall = batchSize - fulfilled.length;
  let backfillCursor = targetShots; 
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

  const sequenced = fulfilled.sort((a, b) => a.index - b.index).map((r, i) => ({ ...r, index: startIndex + i }));
  return { results: sequenced, failures, totalRequested: batchSize };
};

export async function regenerateOne(modelId: string, plan: string, prompt: string, orderId?: string): Promise<{ url: string }> {
  const profile = QUALITY_PROFILE[resolvePlanKey(plan)];
  const { data } = await falFetch("fal-ai/flux-lora", {
    prompt,
    negative_prompt: NEGATIVE_PROMPT,
    loras: [{ path: modelId, scale: 1.0 }],
    num_inference_steps: profile.inferenceSteps,
    guidance_scale: 2.5,
    num_images: 1,
    image_size: { width: profile.baseWidth, height: profile.baseHeight },
    seed: Math.floor(Math.random() * 2_147_483_647), 
    output_format: "jpeg",
    enable_safety_checker: true,
    acceleration: "none",
  });
  const { url } = await fetchHashAndPersist(data.images[0].url, orderId, () => false);
  return { url };
}