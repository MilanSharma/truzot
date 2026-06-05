import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  "https://truzot.com",
];

export function corsHeaders(origin?: string | null): Record<string, string> {
  const allowOrigin =
    origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, Idempotency-Key",
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
  Object.entries(headers).forEach(([key, value]) =>
    res.headers.set(key, value),
  );
  return res;
}
