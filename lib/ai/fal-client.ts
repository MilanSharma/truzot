import { fal } from "@fal-ai/client";

export const trainModel = async (imageUrl: string, userId: string) => {
  // 1. Start the Flux LoRA training
  const result = await fal.subscribe("fal-ai/flux-lora-fast-training", {
    input: {
      images_data_url: imageUrl,
      num_steps: 1000,
      trigger_word: "TOK",
    },
    webhook_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/fal?userId=${userId}`,
  });
  return result;
};

export const generateHeadshots = async (modelId: string) => {
  const prompts = [
    "A professional corporate headshot of TOK, wearing a suit, office background, 8k",
    "A creative studio portrait of TOK, black turtleneck, minimalist grey background",
    "A casual outdoor branding photo of TOK, natural sunlight, blurred city background"
  ];

  return Promise.all(prompts.map(prompt => 
    fal.run("fal-ai/flux-lora", {
      input: {
        prompt: prompt,
        model_name: modelId,
        num_inference_steps: 28,
        guidance_scale: 3.5
      }
    })
  ));
};