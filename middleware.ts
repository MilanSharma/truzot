import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_RULES: Record<string, { windowMs: number; max: number }> = {
  '/api/auth/signup': { windowMs: 60_000, max: 5 },
  '/api/checkout': { windowMs: 60_000, max: 10 },
  '/api/upload': { windowMs: 60_000, max: 20 },
  '/api/free-generate': { windowMs: 60_000, max: 3 },
};
function getIp(req: NextRequest): string { return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'; }
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const rule = RATE_LIMIT_RULES[pathname];
  if (rule) {
    const ip = getIp(req); const key = `${ip}:${pathname}`; const now = Date.now();
    const entry = rateLimitMap.get(key);
    if (!entry || now > entry.resetAt) { rateLimitMap.set(key, { count: 1, resetAt: now + rule.windowMs }); } 
    else { entry.count += 1; if (entry.count > rule.max) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 }); }
  }
  return NextResponse.next();
}
export const config = { matcher: ['/api/auth/signup', '/api/checkout', '/api/upload', '/api/free-generate'] };
