import { NextResponse } from "next/server";
import { freeGenerateSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("free-generate");

const EXAMPLE_STYLES = [
  "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&sig=2",
  "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=500&fit=crop",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop",
];

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
    return addCors(NextResponse.json({ urls: EXAMPLE_STYLES }), origin);
  } catch (err) {
    log.error({ err }, "Free generate failed");
    return addCors(
      NextResponse.json({ error: "Generation failed" }, { status: 500 }),
      origin,
    );
  }
});
