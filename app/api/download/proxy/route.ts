import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("download-proxy");

function isAllowedDomain(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isFalMedia =
      hostname === "fal.media" || hostname.endsWith(".fal.media");
    let isSupabase = false;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        isSupabase =
          hostname === supabaseUrl.hostname ||
          hostname.endsWith("." + supabaseUrl.hostname);
      } catch {
        isSupabase =
          hostname.endsWith(".supabase.co") || hostname === "supabase.co";
      }
    } else {
      isSupabase =
        hostname.endsWith(".supabase.co") || hostname === "supabase.co";
    }
    return isFalMedia || isSupabase;
  } catch {
    return false;
  }
}

export const GET = withContext(async (req: Request) => {
  const { searchParams } = new URL(req.url);
  const url = searchParams.get("url");
  if (!url)
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });

  if (!isAllowedDomain(url)) {
    return NextResponse.json({ error: "Forbidden domain" }, { status: 403 });
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type || "image/jpeg",
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (err) {
    log.error({ err, url }, "Failed to proxy image");
    return NextResponse.json(
      { error: "Failed to fetch image" },
      { status: 502 },
    );
  }
});
