import "server-only";
import { fal } from "@fal-ai/client";
import pLimit from "p-limit";
import { PLAN_SHOTS, STYLE_CATEGORIES } from "@/lib/plans";
import type {
  GenerateHeadshotsResult,
  TrainModelResult,
  UserPreferences,
} from "@/lib/ai/types";

function configureFal() {
  if (process.env.FAL_KEY) {
    fal.config({ credentials: process.env.FAL_KEY });
  }
}

const ALL_PROMPTS: Record<string, (g: string, p: string, e: string) => string> =
  {
    corporate: (g, p, e) =>
      `A professional corporate headshot of TOK, a ${g} ${p} ${e}, wearing a tailored navy business suit, blurred modern office background, soft studio lighting, shot on 85mm lens, f/1.8, highly detailed, 8k resolution`,
    linkedin: (g, p, e) =>
      `A LinkedIn profile photo of TOK, a ${g} ${p} ${e}, business casual attire, clean light grey background, confident smile, sharp focus, professional photography, natural lighting`,
    "white-shirt": (g, p, e) =>
      `A professional headshot of TOK, a ${g} ${p} ${e}, crisp white dress shirt, neutral studio background, natural window light, photorealistic, 8k`,
    urban: (g, p, e) =>
      `A business portrait of TOK, a ${g} ${p} ${e}, dark navy blazer, outdoor urban background softly blurred, bright natural light, shallow depth of field`,
    "creative-studio": (g, p, e) =>
      `A creative studio portrait of TOK, a ${g} ${p} ${e}, black turtleneck, minimalist charcoal background, dramatic side lighting, editorial magazine look, highly detailed`,
    casual: (g, p, e) =>
      `A casual professional photo of TOK, a ${g} ${p} ${e}, smart casual attire, outdoor park background softly blurred, golden hour lighting, warm tone`,
    executive: (g, p, e) =>
      `An executive corporate headshot of TOK, a ${g} ${p} ${e}, dark charcoal suit and subtle tie, luxury modern office background, professional rim lighting, 8k`,
    speaker: (g, p, e) =>
      `A speaker profile photo of TOK, a ${g} ${p} ${e}, business formal, conference hall background softly blurred, authoritative and approachable pose`,
    startup: (g, p, e) =>
      `A startup founder photo of TOK, a ${g} ${p} ${e}, open collar light blue shirt, modern glass coworking space background, bright and airy, friendly casual expression`,
    "creative-director": (g, p, e) =>
      `A creative director headshot of TOK, a ${g} ${p} ${e}, stylish smart outfit, creative studio with exposed brick background, artistic softbox lighting`,
    fashion: (g, p, e) =>
      `A high-fashion studio portrait of TOK, a ${g} ${p} ${e}, tailored grey suit, seamless grey background, editorial cinematic lighting, 85mm`,
    "friendly-casual": (g, p, e) =>
      `A warm friendly casual headshot of TOK, a ${g} ${p} ${e}, casual linen shirt, bright airy home office background, natural daylight flowing in`,
    "black-and-white": (g, p, e) =>
      `A dramatic black-and-white creative headshot of TOK, a ${g} ${p} ${e}, strong jaw lighting, seamless white background, fashion magazine style, crisp contrast`,
    "tech-exec": (g, p, e) =>
      `A tech executive corporate photo of TOK, a ${g} ${p} ${e}, smart casual dark blazer, modern tech office background with soft neon, cool-toned studio light`,
    "professional-studio": (g, p, e) =>
      `A trustworthy professional studio portrait of TOK, a ${g} ${p} ${e}, smart attire, clean bright background, soft even lighting, realistic skin texture`,
    leadership: (g, p, e) =>
      `A leadership corporate headshot of TOK, a ${g} ${p} ${e}, dark suit, wood-panelled office background softly out of focus, authoritative but warm expression`,
    realestate: (g, p, e) =>
      `A real-estate agent corporate headshot of TOK, a ${g} ${p} ${e}, business smart attire, luxury property entrance outdoor background, confident welcoming smile, sunny`,
    "creative-consultant": (g, p, e) =>
      `A creative consultant photo of TOK, a ${g} ${p} ${e}, relaxed stylish blazer, colourful abstract blurred background, soft portrait lighting`,
    "financial-advisor": (g, p, e) =>
      `A financial advisor corporate portrait of TOK, a ${g} ${p} ${e}, navy pinstripe suit, financial district outdoor background softly blurred, golden hour`,
    "remote-work": (g, p, e) =>
      `A remote-work professional casual photo of TOK, a ${g} ${p} ${e}, smart casual, stylish bookshelf background, warm ambient indoor light`,
  };

function getPromptsForStyles(
  selectedStyles: string[],
  g: string,
  p: string,
  e: string,
): string[] {
  const prompts: string[] = [];
  for (const [key, fn] of Object.entries(ALL_PROMPTS)) {
    const category = STYLE_CATEGORIES.find((c) =>
      c.promptKeywords.some((kw) => key.includes(kw)),
    );
    if (!category || selectedStyles.includes(category.id)) {
      prompts.push(fn(g, p, e));
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

  let p = "professional";
  if (prefs?.profession) {
    const prof = prefs.profession.toLowerCase();
    if (prof.includes("corporate") || prof.includes("executive")) {
      p = "business professional";
    } else if (prof.includes("creative") || prof.includes("casual")) {
      p = "creative professional";
    } else if (prof.includes("real estate")) {
      p = "real estate agent";
    } else if (prof.includes("acting") || prof.includes("modeling")) {
      p = g === "female" ? "actress/model" : "actor/model";
    } else {
      p = prof;
    }
  }

  const selectedStyles =
    prefs?.selectedStyles || STYLE_CATEGORIES.map((c) => c.id);
  const allUnique = getPromptsForStyles(selectedStyles, g, p, e);
  if (allUnique.length === 0) {
    allUnique.push(
      ...STYLE_CATEGORIES.slice(0, 3).map((c) =>
        ALL_PROMPTS[c.id]
          ? ALL_PROMPTS[c.id](g, p, e)
          : `A professional headshot of TOK, a ${g} ${p} ${e}, studio background, 8k`,
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
  configureFal();
  const webhookSecret = process.env.FAL_WEBHOOK_SECRET;
  if (!webhookSecret) throw new Error("FAL_WEBHOOK_SECRET is not configured");

  const result = await fal.queue.submit("fal-ai/flux-lora-fast-training", {
    input: { images_data_url: imageUrl, steps: 1000, trigger_word: "TOK" },
    webhookUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?orderId=${orderId}&token=${webhookSecret}`,
  });
  return result as { request_id: string };
};

const concurrencyLimit = pLimit(3);

export const generateHeadshots = async (
  modelId: string,
  plan: string,
  startIndex: number = 0,
  limit: number = 10000,
  prefs?: UserPreferences,
): Promise<GenerateHeadshotsResult[]> => {
  configureFal();
  const allPrompts = buildPrompts(plan, prefs);
  const targetShots = PLAN_SHOTS[plan] ?? 40;
  const prompts: { prompt: string; index: number }[] = [];

  for (let i = startIndex; i < Math.min(startIndex + limit, targetShots); i++) {
    prompts.push({ prompt: allPrompts[i], index: i });
  }

  const results = await Promise.allSettled(
    prompts.map(({ prompt, index }) =>
      concurrencyLimit(() =>
        fal
          .run("fal-ai/flux-lora", {
            input: {
              prompt,
              loras: [{ path: modelId, scale: 0.85 }],
              num_inference_steps: 28,
              guidance_scale: 3.5,
              num_images: 1,
              image_size: "portrait_4_3",
              output_format: "jpeg",
            },
          })
          .then((res) => ({ ...res, prompt, index })),
      ),
    ),
  );

  return (results as PromiseSettledResult<GenerateHeadshotsResult>[])
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<GenerateHeadshotsResult>).value)
    .sort((a, b) => a.index - b.index);
};
