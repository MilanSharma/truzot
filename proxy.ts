import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { Duration } from "@upstash/ratelimit";

// Standard Next.js config matcher
export const config = {
  matcher: [
    "/api/auth/signup",
    "/api/checkout",
    "/api/upload",
    "/api/free-generate",
  ],
};

interface RateLimitRule {
  max: number;
  window: Duration;
  windowMs: number;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  "/api/auth/signup": {
    max: 5,
    window: "60 s",
    windowMs: 60_000,
    "/api/feedback": { max: 20, window: "60 s", windowMs: 60000 },
    "/api/retry": { max: 5, window: "60 s", windowMs: 60000 },
    "/api/contact": { max: 10, window: "60 s", windowMs: 60000 },
  },
  "/api/checkout": { max: 10, window: "60 s", windowMs: 60_000 },
  "/api/upload": { max: 20, window: "60 s", windowMs: 60_000 },
  "/api/free-generate": { max: 3, window: "60 s", windowMs: 60_000 },
};

// Fallback in-memory rate limiter for local development when Redis env variables are absent
const localLimitMap = new Map<string, { count: number; resetAt: number }>();

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

  const ip = getIp(req);
  const key = `${ip}:${pathname}`;

  if (redisClient && limiters[pathname]) {
    try {
      const { success } = await limiters[pathname].limit(key);
      if (!success) {
        return NextResponse.json(
          { error: "Too many requests." },
          { status: 429 },
        );
      }
    } catch (err) {
      console.error(
        "Upstash ratelimit check failed, falling back to Next.js propagation",
        err,
      );
    }
  } else {
    // Local fallback in-memory rate limiter
    const now = Date.now();
    const entry = localLimitMap.get(key);
    if (!entry || now > entry.resetAt) {
      localLimitMap.set(key, { count: 1, resetAt: now + rule.windowMs });
    } else {
      entry.count += 1;
      if (entry.count > rule.max) {
        return NextResponse.json(
          { error: "Too many requests." },
          { status: 429 },
        );
      }
    }
  }

  return NextResponse.next();
}
