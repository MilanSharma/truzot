import "server-only";
import pLimit from "p-limit";
import { createHmac } from "crypto";
import { PLAN_SHOTS } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import type {
  GenerateHeadshotsResult,
  GenerateHeadshotsResponse,
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

function buildPrompts(plan: string, prefs?: UserPreferences): string[] {
  if (plan === "custom_upsell" || prefs?.is_upsell) {
    const c = prefs?.clothing || "professional attire";
    const b = prefs?.background || "studio background";
    const basePrompt = `A high-end professional headshot of TOK, wearing ${c}, ${b}, 8k resolution, highly detailed, photorealistic`;
    const suffixes = [
      ", looking directly at camera, slight smile",
      ", three-quarter angle, relaxed posture",
      ", looking slightly off-camera, thoughtful expression",
      ", front-facing, neutral confident expression, ultra-sharp",
      ", warm approachable smile, slightly turned head",
    ];

    const target = PLAN_SHOTS[plan] ?? 20;
    const pool: string[] = [];
    for (let i = 0; i < target; i++) {
      pool.push(basePrompt + suffixes[i % suffixes.length]);
    }
    return pool;
  }

  const target = PLAN_SHOTS[plan] ?? 40;
  const pool: string[] = [];

  const DIVERSE_BASE_PROMPTS = [
    "A professional corporate headshot of TOK, wearing a tailored dark navy business suit, modern bright office background, soft studio lighting, 8k resolution, photorealistic",
    "A clean LinkedIn profile photo of TOK, wearing smart casual attire, bright airy background, approachable smile, natural window light",
    "A high-end studio portrait of TOK, wearing a crisp dress shirt, seamless grey backdrop, dramatic edge lighting, editorial look",
    "A relaxed professional photo of TOK, outdoor urban park setting, blurred greenery background, golden hour lighting",
    "A modern tech startup headshot of TOK, wearing a stylish solid dark t-shirt, glass coworking space background, cool-toned lighting",
    "A friendly casual headshot of TOK, wearing a light sweater, cozy modern indoor background, bright natural lighting",
    "An authoritative executive portrait of TOK, wearing a charcoal suit, wood-panelled boardroom background, cinematic lighting",
    "A creative industry headshot of TOK, wearing a minimalist black outfit, bold color studio backdrop, artistic softbox lighting",
    "A confident real estate agent photo of TOK, wearing a professional blazer, luxury home entrance background, sunny daylight",
    "A clean and modern headshot of TOK, wearing business casual clothing, abstract softly blurred background, flattering front lighting",
  ];

  const suffixes = [
    ", looking directly at camera",
    ", three-quarter angle, relaxed posture",
    ", looking slightly off-camera, thoughtful expression",
    ", front-facing, neutral confident expression",
    ", warm approachable smile, slightly turned head",
  ];

  let baseIndex = 0;
  let suffixIndex = 0;

  while (pool.length < target) {
    const base = DIVERSE_BASE_PROMPTS[baseIndex % DIVERSE_BASE_PROMPTS.length];
    const suffix = suffixes[suffixIndex % suffixes.length];
    pool.push(base + suffix);

    baseIndex++;
    if (baseIndex % DIVERSE_BASE_PROMPTS.length === 0) {
      suffixIndex++;
    }
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
          num_images: 1,
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
