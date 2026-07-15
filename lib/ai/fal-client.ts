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
    const basePrompt = `A premium professional portrait photograph of TOK wearing ${c}. The photo is taken with a ${b} background. Shot on medium format camera, 85mm lens, highly detailed, photorealistic.`;
    const suffixes = [
      " The subject is looking directly at the camera with a subtle, confident smile.",
      " The subject is facing forward with a warm, approachable expression.",
      " The subject is captured in a relaxed, natural pose looking at the lens.",
      " The portrait features flawless professional retouching while maintaining authentic facial features."
    ];
    for (let i = 0; i < target; i++) pool.push(basePrompt + suffixes[i % suffixes.length]);
    return pool;
  }

  // Pure, conversational English prompts. Flux hates keyword spam and comma-salads.
  // We use gender-neutral clothing to ensure the LoRA naturally dictates the gender.
  const FLUX_PROMPTS = [
    // Corporate & Executive
    "A premium corporate headshot of TOK wearing elegant business attire. The portrait is taken in a brightly lit modern office with large windows. Shot on medium format camera, 85mm lens, soft natural lighting, shallow depth of field, highly detailed, professional photography.",
    "An authoritative executive portrait of TOK wearing refined corporate wear. Standing in a sophisticated wood-panelled boardroom. Professional studio lighting, cinematic composition, photorealistic, sharp focus.",
    "A modern finance professional headshot of TOK wearing a tailored blazer. Abstract blurred office background, clean lighting, 8k resolution, photorealistic portrait.",
    "A classic corporate photograph of TOK wearing professional clothing. Neutral office background with bright, flattering lighting. High quality corporate photography.",
    
    // Studio
    "A high-end studio portrait of TOK wearing business professional clothing. Solid seamless grey background, flattering rembrandt lighting, sharp focus, unretouched natural skin texture.",
    "A clean, minimalist studio headshot of TOK wearing smart casual attire. Solid white background, soft butterfly lighting, professional photography, crisp details, highly realistic.",
    "A timeless studio headshot of TOK wearing elegant attire. Solid dark background, moody cinematic lighting, medium format photography.",
    
    // LinkedIn
    "A highly engaging LinkedIn profile picture of TOK looking directly at the camera with a warm, confident smile. Wearing professional business attire. Bright airy background, natural daylight, DSLR photography.",
    "A trustworthy professional networking portrait of TOK looking directly at the camera. Smart casual wear, solid muted color background, approachable and friendly expression, high quality.",
    "A polished LinkedIn headshot of TOK looking directly at the camera. Confident expression, modern office background, photorealistic portrait.",
    
    // Creative & Editorial
    "A creative industry portrait of TOK wearing stylish minimalist fashion. Concrete wall background with dramatic shadows. Editorial magazine photography, artistic softbox lighting.",
    "A vibrant creative director headshot of TOK wearing contemporary clothing. Art gallery background, natural light, shallow depth of field, bokeh, highly detailed.",
    "An artistic professional photo of TOK wearing layered clothing. Exposed brick background, warm ambient lighting, highly detailed photography.",
    
    // Startup & Tech
    "A modern tech startup founder headshot of TOK wearing a stylish dark t-shirt. Glass coworking space background, bright natural lighting, relaxed but professional, 85mm lens.",
    "An approachable software engineer portrait of TOK wearing a casual button-down shirt. Modern coffee shop background, shallow depth of field, candid and authentic, photorealistic.",
    "A dynamic tech entrepreneur photo of TOK wearing a blazer over a t-shirt. Industrial open-office background, realistic details, sharp focus.",
    
    // Casual & Outdoor
    "A relaxed professional outdoor photograph of TOK. Blurred urban park background, golden hour lighting, natural authentic expression, crisp focus.",
    "A friendly lifestyle headshot of TOK wearing comfortable but polished clothing. Outdoor cafe setting, bright daylight, candid professional photography.",
    "A sunny outdoor portrait of TOK wearing a casual jacket. Blurred city street background, bright daylight, highly detailed photography."
  ];

  const suffixes = [
    " The subject is looking directly at the camera with a subtle, confident smile.",
    " The subject is facing forward with a warm, approachable expression.",
    " The subject is captured in a relaxed, natural pose looking at the lens.",
    " The portrait features flawless professional retouching while maintaining authentic facial features."
  ];

  let bIdx = 0, sIdx = 0;
  while (pool.length < target) {
    pool.push(FLUX_PROMPTS[bIdx % FLUX_PROMPTS.length] + suffixes[sIdx % suffixes.length]);
    if (++bIdx % FLUX_PROMPTS.length === 0) sIdx++;
  }
  return pool;
}

export const trainModel = async (imageUrl: string, orderId: string): Promise<{ request_id: string }> => {
  const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${generateWebhookToken(orderId)}`;
  
  // 800 steps is the absolute sweet spot for 1-5 selfies on Flux without deep-frying / overfitting.
  const res = await fetch(`https://queue.fal.run/fal-ai/flux-lora-fast-training?fal_webhook=${encodeURIComponent(webhookUrl)}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ 
      images_data_url: imageUrl, 
      steps: 800,
      trigger_word: "TOK" 
    }),
  });
  
  if (!res.ok) throw new Error(`Training submit failed (HTTP ${res.status})`);
  return await res.json();
};

const concurrencyLimit = pLimit(3);

export const generateHeadshots = async (
  modelId: string, plan: string, startIndex: number = 0, limit: number = 10000, prefs?: UserPreferences
): Promise<GenerateHeadshotsResponse> => {
  const allPrompts = buildPrompts(plan, prefs);
  const targetShots = Math.min(startIndex + limit, PLAN_SHOTS[plan] ?? 40);
  const prompts = Array.from({ length: targetShots - startIndex }, (_, i) => ({ prompt: allPrompts[startIndex + i], index: startIndex + i }));

  // Flux LoRA scale - kept at 0.85 to allow the AI freedom to build high-quality environments 
  // without distorting the facial structure.
  const loraScale = 0.85; 
  
  // Flux Dev optimal guidance scale is STRICTLY 3.5. 
  // Higher scales (like 7.5 used previously) cause severe artifacts, intense contrast, and "plastic" looks.
  const guidanceScale = 3.5;
  
  // Inference steps scaling by package tier
  const inferenceSteps = plan === "executive" ? 40 : plan === "pro" ? 35 : 28;
  
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
              loras: [{ path: modelId, scale: loraScale }],
              num_inference_steps: inferenceSteps,
              guidance_scale: guidanceScale,
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
