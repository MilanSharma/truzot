import "server-only";
import pLimit from "p-limit";
import { createHmac, createHash } from "crypto";
import { PLAN_SHOTS } from "@/lib/plans";
import { createLogger } from "@/lib/logger";
import type { GenerateHeadshotsResult, GenerateHeadshotsResponse, UserPreferences } from "@/lib/ai/types";

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

function buildPrompts(plan: string, prefs?: UserPreferences): string[] {
  const target = PLAN_SHOTS[plan] ?? 40;
  const pool: string[] = [];
  
  if (plan === "custom_upsell" || prefs?.is_upsell) {
    const c = prefs?.clothing || "professional attire";
    const b = prefs?.background || "studio background";
    const basePrompt = `A high-end professional headshot of TOK, wearing ${c}, ${b}, 8k resolution, highly detailed, photorealistic`;
    const suffixes = [
      ", looking directly at camera, slight smile", ", three-quarter angle, relaxed posture", 
      ", looking slightly off-camera", ", front-facing, neutral confident expression", ", warm approachable smile"
    ];
    for (let i = 0; i < target; i++) pool.push(basePrompt + suffixes[i % suffixes.length]);
    return pool;
  }

  // Expanded to 40 Base Prompts with more diversity
  const DIVERSE_BASE_PROMPTS = [
    // Corporate & Executive
    "A professional corporate headshot of TOK, wearing a tailored dark navy business suit, modern bright office background, soft studio lighting",
    "An authoritative executive portrait of TOK, wearing a charcoal suit, wood-panelled boardroom background, cinematic lighting",
    "A confident CEO headshot of TOK, standing in a high-rise glass office overlooking the city, wearing professional business attire",
    "A classic corporate headshot of TOK, wearing a crisp white dress shirt and blazer, neutral office background, bright lighting",
    "A modern finance professional headshot of TOK, wearing a tailored suit, abstract blurred office background",
    // Studio Locked (Style Consistency)
    "A high-end studio portrait of TOK, wearing formal attire, solid white background, dramatic edge lighting",
    "A timeless studio headshot of TOK, wearing business professional clothing, solid seamless grey background, rembrandt lighting",
    "A premium studio portrait of TOK, wearing smart casual clothes, solid dark background, moody cinematic lighting",
    "A clean studio headshot of TOK, wearing business attire, solid light grey background, softbox lighting",
    "A minimalist studio portrait of TOK, wearing professional clothing, solid white background, butterfly lighting",
    // LinkedIn (Forward facing forced)
    "A highly engaging LinkedIn profile photo of TOK, looking directly at camera, confident forward-facing pose, wearing smart casual attire, bright airy background",
    "A professional LinkedIn headshot of TOK, looking directly at camera, confident forward-facing pose, warm approachable smile, natural window light",
    "A modern networking profile photo of TOK, looking directly at camera, confident forward-facing pose, solid color background",
    "A trustworthy LinkedIn portrait of TOK, looking directly at camera, professional smile, neutral background",
    "A polished LinkedIn headshot of TOK, looking directly at camera, confident expression, modern office background",
    // Creative & Editorial
    "A creative industry headshot of TOK, wearing a minimalist black turtleneck, bold color studio backdrop, artistic softbox lighting",
    "An editorial portrait of TOK, wearing stylish modern fashion, concrete wall background, dramatic shadows",
    "A vibrant creative director headshot of TOK, wearing colorful smart casual, art gallery background, natural light",
    "An artistic professional photo of TOK, wearing layered clothing, exposed brick background, warm ambient lighting",
    "A modern designer headshot of TOK, wearing a sleek outfit, minimalist studio background, soft diffused lighting",
    "A fashion-forward creative portrait of TOK, wearing contemporary style, geometric background, colorful lighting",
    "An innovative tech creative headshot of TOK, wearing modern casual, startup office background",
    // Startup & Tech
    "A modern tech startup headshot of TOK, wearing a stylish solid dark t-shirt, glass coworking space background",
    "A relaxed founder portrait of TOK, wearing a casual hoodie, standing near a standing desk with monitors in background",
    "An approachable software engineer headshot of TOK, wearing a casual button-down, modern coffee shop background",
    "A dynamic tech entrepreneur photo of TOK, wearing a blazer over a t-shirt, industrial open-office background",
    "A tech-focused professional headshot of TOK, wearing clean minimalist clothing, server room blurred background",
    "A product manager headshot of TOK, wearing smart casual, whiteboard background with diagrams",
    "A developer advocate photo of TOK, wearing tech casual, conference background",
    // Casual & Outdoor
    "A relaxed professional photo of TOK, outdoor urban park setting, blurred greenery background, golden hour lighting",
    "A friendly casual headshot of TOK, wearing a light sweater, cozy modern indoor background, bright natural lighting",
    "A sunny outdoor portrait of TOK, wearing a casual jacket, blurred city street background, bright daylight",
    "An approachable lifestyle headshot of TOK, wearing comfortable natural fabrics, outdoor cafe setting",
    "A warm outdoor professional photo of TOK, wearing a light-colored top, blurred nature background, soft morning light",
    "A casual weekend headshot of TOK, wearing relaxed attire, outdoor garden background, natural light",
    "A friendly outdoor portrait of TOK, wearing casual business, park bench background",
    // Medical & Real Estate
    "A trustworthy doctor headshot of TOK, wearing a white lab coat, clean modern clinic background, bright lighting",
    "A confident real estate agent photo of TOK, wearing a professional blazer, luxury home entrance background, sunny daylight",
    "A friendly healthcare professional headshot of TOK, wearing scrubs, soft blurred hospital background",
    "A premium real estate broker portrait of TOK, wearing high-end business attire, modern luxury kitchen background",
    "A compassionate nurse headshot of TOK, wearing scrubs, hospital corridor background",
    "A professional dentist portrait of TOK, wearing clinical attire, modern dental office background",
    // Additional Angles & Lighting
    "A three-quarter angle portrait of TOK, wearing business attire, studio lighting, professional background",
    "A profile view headshot of TOK, wearing formal clothing, dramatic side lighting, dark background",
    "An over-the-shoulder portrait of TOK, wearing business casual, modern office background",
    "A candid headshot of TOK, slight smile, natural lighting, blurred urban background",
    "A close-up portrait of TOK, detailed facial features, professional lighting, neutral background"
  ];

  const suffixes = [
    ", highly detailed, 8k resolution, photorealistic, perfect skin texture, visible pores, natural skin tone",
    ", sharp focus, hyper-realistic, 8k, detailed facial features, accurate eye color, natural hair texture",
    ", dslr photography, 85mm lens, f/1.8, professional lighting, realistic skin details, authentic facial structure",
    ", professional photography, perfect lighting, 4k, natural complexion, detailed iris patterns, realistic hair"
  ];

  let bIdx = 0, sIdx = 0;
  while (pool.length < target) {
    pool.push(DIVERSE_BASE_PROMPTS[bIdx % DIVERSE_BASE_PROMPTS.length] + suffixes[sIdx % suffixes.length]);
    if (++bIdx % DIVERSE_BASE_PROMPTS.length === 0) sIdx++;
  }
  return pool;
}

export const trainModel = async (imageUrl: string, orderId: string): Promise<{ request_id: string }> => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${generateWebhookToken(orderId)}`;
  const res = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      images_data_url: imageUrl, 
      steps: 500, // Optimized for cost-effectiveness while maintaining quality
      trigger_word: "TOK" 
    }),
  });
  if (!res.ok) throw new Error(`Training submit failed (HTTP ${res.status})`);
  return await res.json();
};

const concurrencyLimit = pLimit(3);
const NEGATIVE_PROMPT = "blurry, low quality, distorted, extra fingers, bad anatomy, watermark, text, logo, cartoon, illustration, drawing";

export const generateHeadshots = async (
  modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: UserPreferences
): Promise<GenerateHeadshotsResponse> => {
  const allPrompts = buildPrompts(plan, prefs);
  const targetShots = Math.min(startIndex + limit, PLAN_SHOTS[plan] ?? 40);
  const prompts = Array.from({ length: targetShots - startIndex }, (_, i) => ({ prompt: allPrompts[startIndex + i], index: startIndex + i }));

  // LoRA scale tuning based on plan - increased for better facial resemblance
  const loraScale = plan === "executive" ? 0.95 : plan === "pro" ? 0.92 : 0.88;
  
  let consecutiveFailures = 0;
  const seenHashes = new Set<string>();

  const results = await Promise.allSettled(
    prompts.map(({ prompt, index }) =>
      concurrencyLimit(async () => {
        let attempt = 0;
        while (attempt < 2) {
          if (consecutiveFailures > 4) {
            log.warn("Circuit breaker activated. Pausing generation requests for 15s.");
            await new Promise(r => setTimeout(r, 15000));
            consecutiveFailures = 0;
          }
          try {
            const res = await falFetch("fal-ai/flux-lora", {
              prompt, 
              negative_prompt: NEGATIVE_PROMPT,
              loras: [{ path: modelId, scale: loraScale }],
              num_inference_steps: 40, // Increased from 28 to 40 for higher quality
              guidance_scale: 3.5, 
              num_images: 1, 
              image_size: "portrait_4_3", 
              output_format: "jpeg",
            });
            
            const imgUrl = res.data.images[0].url;
            
            // Post-Processing: Duplicate Detection via Hashing first 1000 bytes
            try {
              const imgStream = await fetch(imgUrl, { headers: { Range: "bytes=0-1000" } });
              const buffer = await imgStream.arrayBuffer();
              const hash = createHash('sha256').update(Buffer.from(buffer)).digest('hex');
              if (seenHashes.has(hash)) throw new Error("Duplicate image detected, rejecting.");
              seenHashes.add(hash);
            } catch (hashErr: any) {
              if (hashErr.message.includes("Duplicate")) throw hashErr;
            }

            consecutiveFailures = 0;
            return { ...res.data, prompt, index };
          } catch (e: any) {
            consecutiveFailures++;
            if (e.message.includes("not found")) throw e; // Fatal error
            attempt++;
            if (attempt >= 2) throw e;
            await new Promise(r => setTimeout(r, 2000 * attempt));
          }
        }
      })
    )
  );

  const fulfilled: GenerateHeadshotsResult[] = [];
  const failures: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") fulfilled.push(r.value);
    else failures.push(r.reason?.message || "Generation failed");
  }

  return { results: fulfilled.sort((a, b) => a.index - b.index), failures, totalRequested: prompts.length };
};
