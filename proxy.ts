import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Duration } from "@upstash/ratelimit";

export const config = {
  matcher: [
    "/api/auth/signup",
    "/api/checkout",
    "/api/upload",
    "/api/free-generate",
    "/api/feedback",
    "/api/retry",
    "/api/regenerate",
    "/api/contact",
    "/api/order-status",
    "/api/download",
    "/api/download/token",
  ],
};

interface RateLimitRule {
  max: number;
  window: Duration;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  "/api/auth/signup": { max: 5, window: "60 s" },
  "/api/checkout": { max: 10, window: "60 s" },
  "/api/upload": { max: 20, window: "60 s" },
  "/api/free-generate": { max: 3, window: "60 s" },
  "/api/feedback": { max: 20, window: "60 s" },
  "/api/retry": { max: 5, window: "60 s" },
  "/api/regenerate": { max: 10, window: "60 s" },
  "/api/contact": { max: 10, window: "60 s" },
  "/api/order-status": { max: 30, window: "60 s" },
  "/api/download": { max: 30, window: "60 s" },
  "/api/download/token": { max: 10, window: "60 s" },
};

function getIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

let redisClient: Redis | null = null;
const limiters: Record<string, Ratelimit> = {};

const hasRedisConfig =
  typeof process !== "undefined" &&
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN;

if (hasRedisConfig) {
  try {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
    for (const [path, rule] of Object.entries(RATE_LIMIT_RULES)) {
      limiters[path] = new Ratelimit({
        redis: redisClient,
        limiter: Ratelimit.slidingWindow(rule.max, rule.window),
        prefix: `ratelimit:${path}`,
        ephemeralCache: new Map(),
      });
    }
  } catch (error) {
    console.error("Failed to initialize Upstash Redis ratelimiter:", error);
  }
}

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RATE_LIMIT_RULES[pathname];

  if (!rule) {
    return NextResponse.next();
  }

  if (!redisClient || !limiters[pathname]) {
    return NextResponse.next();
  }

  const ip = getIp(req);
  const key = `${ip}:${pathname}`;

  try {
    const { success } = await limiters[pathname].limit(key);
    if (!success) {
      return NextResponse.json(
        { error: "Too many requests." },
        { status: 429 },
      );
    }
  } catch (err) {
    console.error("Upstash ratelimit check failed, failing open:", err);
  }

  return NextResponse.next();
}
