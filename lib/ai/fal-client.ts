import "server-only";
import pLimit from "p-limit";
import { createHmac } from "crypto";
import { PLAN_SHOTS, STYLE_CATEGORIES } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import type {
  GenerateHeadshotsResult,
  GenerateHeadshotsResponse,
  TrainModelResult,
  UserPreferences,
} from "@/lib/ai/types";

const log = createLogger("fal-client");

export function generateWebhookToken(orderId: string): string {
  const secret = process.env.FAL_WEBHOOK_SECRET;
  if (!secret) throw new Error("FAL_WEBHOOK_SECRET is not configured");
  return createHmac("sha256", secret)
    .update(orderId)
    .digest("hex")
    .substring(0, 32);
}

const FAL_KEY = process.env.FAL_KEY;
if (!FAL_KEY) {
  throw new Error("FAL_KEY is not configured");
}

async function falFetch(
  endpoint: string,
  input: Record<string, unknown>,
): Promise<{ data: any; requestId: string }> {
  const res = await fetch(`https://fal.run/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Key ${FAL_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`fal.ai HTTP ${res.status}: ${text.substring(0, 200)}`);
  }
  const data = await res.json();
  return { data, requestId: res.headers.get("x-fal-request-id") || "" };
}

const CLOTHING_MAP: Record<string, string> = {
  "business-formal": "tailored navy business suit with tie",
  "business-casual": "smart blazer with open collar, no tie",
  "smart-casual": "polished casual attire, clean neat look",
  creative: "stylish turtleneck, modern creative look",
};

const BACKGROUND_MAP: Record<string, string> = {
  studio: "clean seamless studio backdrop",
  office: "modern office workspace, blurred background",
  outdoor: "outdoor park setting, natural greenery softly blurred",
  city: "urban city skyline background, softly blurred",
};

const FRAMING_MAP: Record<string, string> = {
  closeup: "head and shoulders portrait",
  "half-body": "waist-up portrait",
};

type PromptBuilder = (prefs: {
  g: string;
  p: string;
  e: string;
  h: string;
  c: string;
  b: string;
  f: string;
}) => string;

const ALL_PROMPTS: Record<string, PromptBuilder> = {
  corporate: ({ g, p, e, h, c, b }) =>
    `A professional corporate headshot of TOK, a ${g} ${p} ${e} ${h}, wearing ${c}, ${b}, soft studio lighting, shot on 85mm lens, f/1.8, highly detailed, 8k resolution`,
  linkedin: ({ g, p, e, h, c, b }) =>
    `A LinkedIn profile photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, ${b}, confident smile, sharp focus, professional photography, natural lighting`,
  "white-shirt": ({ g, p, e, h, c, b }) =>
    `A professional headshot of TOK, a ${g} ${p} ${e} ${h}, crisp white dress shirt, ${b}, natural window light, photorealistic, 8k`,
  urban: ({ g, p, e, h, c, b }) =>
    `A business portrait of TOK, a ${g} ${p} ${e} ${h}, ${c}, ${b}, bright natural light, shallow depth of field`,
  "creative-studio": ({ g, p, e, h, c, b }) =>
    `A creative studio portrait of TOK, a ${g} ${p} ${e} ${h}, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial magazine look, highly detailed`,
  casual: ({ g, p, e, h, c, b }) =>
    `A casual professional photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, ${b}, golden hour lighting, warm tone`,
  executive: ({ g, p, e, h, c, b }) =>
    `An executive corporate headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, luxury modern office background, professional rim lighting, 8k`,
  speaker: ({ g, p, e, h, c, b }) =>
    `A speaker profile photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, conference hall background softly blurred, authoritative and approachable pose`,
  startup: ({ g, p, e, h, c, b }) =>
    `A startup founder photo of TOK, a ${g} ${p} ${e} ${h}, open collar light blue shirt, modern glass coworking space background, bright and airy, friendly casual expression`,
  "creative-director": ({ g, p, e, h, c, b }) =>
    `A creative director headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, creative studio with exposed brick background, artistic softbox lighting`,
  fashion: ({ g, p, e, h, c, b }) =>
    `A high-fashion studio portrait of TOK, a ${g} ${p} ${e} ${h}, ${c}, seamless grey background, editorial cinematic lighting, 85mm`,
  "friendly-casual": ({ g, p, e, h, c, b }) =>
    `A warm friendly casual headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, bright airy home office background, natural daylight flowing in`,
  "black-and-white": ({ g, p, e, h, c, b }) =>
    `A dramatic black-and-white creative headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, seamless white background, fashion magazine style, crisp contrast`,
  "tech-exec": ({ g, p, e, h, c, b }) =>
    `A tech executive corporate photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, modern tech office background with soft neon, cool-toned studio light`,
  "professional-studio": ({ g, p, e, h, c, b }) =>
    `A trustworthy professional studio portrait of TOK, a ${g} ${p} ${e} ${h}, ${c}, clean bright background, soft even lighting, realistic skin texture`,
  leadership: ({ g, p, e, h, c, b }) =>
    `A leadership corporate headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, wood-panelled office background softly out of focus, authoritative but warm expression`,
  realestate: ({ g, p, e, h, c, b }) =>
    `A real-estate agent corporate headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, luxury property entrance outdoor background, confident welcoming smile, sunny`,
  "creative-consultant": ({ g, p, e, h, c, b }) =>
    `A creative consultant photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, colourful abstract blurred background, soft portrait lighting`,
  "financial-advisor": ({ g, p, e, h, c, b }) =>
    `A financial advisor corporate portrait of TOK, a ${g} ${p} ${e} ${h}, ${c}, financial district outdoor background softly blurred, golden hour`,
  "remote-work": ({ g, p, e, h, c, b }) =>
    `A remote-work professional casual photo of TOK, a ${g} ${p} ${e} ${h}, ${c}, stylish bookshelf background, warm ambient indoor light`,
};

function getPromptsForStyles(
  selectedStyles: string[],
  prefs: {
    g: string;
    p: string;
    e: string;
    h: string;
    c: string;
    b: string;
    f: string;
  },
): string[] {
  const prompts: string[] = [];
  for (const [key, fn] of Object.entries(ALL_PROMPTS)) {
    const category = STYLE_CATEGORIES.find((c) =>
      c.promptKeywords.some((kw) => key.includes(kw)),
    );
    if (!category || selectedStyles.includes(category.id)) {
      prompts.push(fn(prefs));
    }
  }
  return prompts;
}

function buildPrompts(plan: string, prefs?: UserPreferences): string[] {
  const target = PLAN_SHOTS[plan] ?? 40;
  const pool: string[] = [];

  const genderRaw = prefs?.gender || "person";
  const g = genderRaw.toLowerCase();

  const e = prefs?.eyeColor ? `with ${prefs.eyeColor.toLowerCase()} eyes` : "";

  const p = "professional";

  const h = prefs?.hairColor
    ? `with ${prefs.hairColor.toLowerCase()} hair`
    : "";
  const c = CLOTHING_MAP[prefs?.clothing || ""] || "professional attire";
  const b = BACKGROUND_MAP[prefs?.background || ""] || "studio background";
  const f = FRAMING_MAP[prefs?.framing || ""] || "";

  const promptPrefs = { g, p, e, h, c, b, f };

  const selectedStyles =
    prefs?.selectedStyles || STYLE_CATEGORIES.map((c) => c.id);
  const allUnique = getPromptsForStyles(selectedStyles, promptPrefs);
  if (allUnique.length === 0) {
    allUnique.push(
      ...STYLE_CATEGORIES.slice(0, 3).map((c) =>
        ALL_PROMPTS[c.id]
          ? ALL_PROMPTS[c.id](promptPrefs)
          : `A professional headshot of TOK, a ${g} ${p} ${e} ${h}, ${c}, studio background, 8k`,
      ),
    );
  }
  const suffixes = [
    ", looking directly at camera, slight smile",
    ", three-quarter angle, relaxed posture",
    ", looking slightly off-camera, thoughtful expression",
    ", front-facing, neutral confident expression, ultra-sharp",
    ", warm approachable smile, slightly turned head",
  ];
  const framingSuffix = f ? `, ${f}` : "";
  const variants = [
    "",
    ", alternative composition",
    ", different pose",
    ", varied expression",
    ", subtle head tilt",
  ];

  let variantIndex = 0;
  while (pool.length < target) {
    for (const prompt of allUnique) {
      if (pool.length >= target) break;
      const suffixIndex = pool.length % suffixes.length;
      pool.push(
        prompt +
          framingSuffix +
          suffixes[suffixIndex] +
          variants[variantIndex % variants.length],
      );
    }
    variantIndex++;
  }
  return pool;
}

export const trainModel = async (
  imageUrl: string,
  orderId: string,
): Promise<{ request_id: string }> => {
  const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("FAL_WEBHOOK_SECRET is not configured");

  const token = generateWebhookToken(orderId);
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${token}`;

  const res = await fetch(
    `https://queue.fal.run/fal-ai/flux-lora-fast-training?fal_webhook=${encodeURIComponent(webhookUrl)}`,
    {
      method: "POST",
      headers: {
        Authorization: `Key ${FAL_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        images_data_url: imageUrl,
        steps: 500,
        trigger_word: "TOK",
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Training submit failed (HTTP ${res.status}): ${text.substring(0, 200)}`,
    );
  }
  return (await res.json()) as { request_id: string };
};

const concurrencyLimit = pLimit(3);

export const generateHeadshots = async (
  modelId: string,
  plan: string,
  startIndex: number = 0,
  limit: number = 10000,
  prefs?: UserPreferences,
): Promise<GenerateHeadshotsResponse> => {
  const allPrompts = buildPrompts(plan, prefs);
  const targetShots = PLAN_SHOTS[plan] ?? 40;
  const prompts: { prompt: string; index: number }[] = [];

  for (let i = startIndex; i < Math.min(startIndex + limit, targetShots); i++) {
    prompts.push({ prompt: allPrompts[i], index: i });
  }

  const results = await Promise.allSettled(
    prompts.map(({ prompt, index }) =>
      concurrencyLimit(() =>
        falFetch("fal-ai/flux-lora", {
          prompt,
          loras: [{ path: modelId, scale: 0.85 }],
          num_inference_steps: 28,
          guidance_scale: 3.5,
          num_images: 4,
          image_size:
            plan === "executive"
              ? "square_hd"
              : plan === "pro"
                ? "portrait_4_3"
                : "portrait_4_3",
          output_format: "jpeg",
        }).then((res) => ({ ...res.data, prompt, index })),
      ),
    ),
  );

  const fulfilled: GenerateHeadshotsResult[] = [];
  const failures: string[] = [];
  for (const r of results as PromiseSettledResult<GenerateHeadshotsResult>[]) {
    if (r.status === "fulfilled") {
      fulfilled.push(r.value);
    } else {
      failures.push(r.reason?.message || "Generation failed");
    }
  }

  if (failures.length > 0) {
    log.warn(
      { failures: failures.length, total: prompts.length },
      "Partial generation failure",
    );
  }

  return {
    results: fulfilled.sort((a, b) => a.index - b.index),
    failures,
    totalRequested: prompts.length,
  };
};
