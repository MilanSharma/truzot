import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  "https://truzot.com",
  "https://www.truzot.com",
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  let allowOrigin = ALLOWED_ORIGINS[0];

  if (origin) {
    if (ALLOWED_ORIGINS.includes(origin)) {
      allowOrigin = origin;
    } else {
      try {
        const url = new URL(origin);
        // Allow all localhost/127.0.0.1 in dev
          if (
process.env.NODE_ENV !== "production" &&
(url.hostname === "localhost" || url.hostname === "127.0.0.1")
) {
          allowOrigin = origin;
        }
        // Allow vercel preview deployments
        if (url.hostname.endsWith(".vercel.app")) {
          allowOrigin = origin;
        }
      } catch {
        // ignore invalid URLs
      }
    }
  }

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, Idempotency-Key",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  };
}

export function handleOptions(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: corsHeaders(origin) });
}

export function addCors(
  res: NextResponse,
  origin?: string | null,
): NextResponse {
  const headers = corsHeaders(origin);
  Object.entries(headers ?? {}).forEach(([key, value]) =>
    res.headers.set(key, value),
  );
  return res;
}
