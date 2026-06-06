import { NextResponse } from "next/server";
import { fal } from "@fal-ai/client";
import { freeGenerateSchema, validate } from "@/lib/validations";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

fal.config({ credentials: process.env.FAL_KEY });

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const body = await req.json();
    const parsed = validate(freeGenerateSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    const { zipUrl } = parsed.data!;

    // For free tier, we generate 9 preview images using a generic headshot model
    // that does not require training. We'll use fal-ai/flux-lora with a generic prompt.
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
        fal.run("fal-ai/flux-lora", {
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

    const urls = results.map((r) => r.images[0].url);
    return addCors(NextResponse.json({ urls }), origin);
  } catch (err) {
    console.error("Free generate error:", err);
    return addCors(
      NextResponse.json({ error: "Generation failed" }, { status: 500 }),
      origin,
    );
  }
});
