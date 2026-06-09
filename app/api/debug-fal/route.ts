import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST() {
  try {
    const key =
      "d04cecf9-6381-4331-b71c-24b98aed854b:b07ac52fb679a7dff7c5c8518d2de5f5";
    const body = JSON.stringify({
      prompt:
        "A professional headshot of TOK, a person, professional attire, studio background, 8k",
      model_name: "dev",
      lora_url:
        "https://v3b.fal.media/files/b/0a9d8af8/DgfCgJOJEPn7Fh4n8G5Zy_pytorch_lora_weights.safetensors",
      image_size: "square_hd",
      num_images: 1,
    });

    const res = await fetch("https://fal.run/fal-ai/flux-lora", {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body,
    });

    const text = await res.text();
    const status = res.status;
    const contentType = res.headers.get("content-type") || "none";
    const preview = text.substring(0, 500);

    let jsonError = null;
    try {
      JSON.parse(text);
    } catch (e: any) {
      jsonError = e.message;
    }

    return NextResponse.json({
      status,
      contentType,
      bodyPreview: preview,
      bodyLength: text.length,
      jsonError,
      ok: res.ok,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message, stack: err.stack },
      { status: 500 },
    );
  }
}
