import { NextResponse } from "next/server";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("image-proxy");

const ALLOWED_DOMAINS = ["fal.media", "storage.fal.ai"];

function isAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.some(
      (d) => parsed.hostname === d || parsed.hostname.endsWith("." + d),
    );
  } catch {
    return false;
  }
}

export const GET = withContext(async (req: Request) => {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) return new NextResponse("Missing url", { status: 400 });
    if (!isAllowed(imageUrl))
      return new NextResponse("Domain not allowed", { status: 403 });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "Truzot/1.0", Accept: "image/*" },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      log.warn(
        { status: response.status, url: imageUrl },
        "Upstream fetch failed",
      );
      return new NextResponse("Upstream error", { status: 502 });
    }

    const maxAge = 86400;
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/jpeg",
        "Cache-Control": `public, max-age=${maxAge}, s-maxage=${maxAge}, immutable`,
        "Access-Control-Allow-Origin": "*",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    log.error({ err }, "Image proxy error");
    return new NextResponse("Internal error", { status: 500 });
  }
});
