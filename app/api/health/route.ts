import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { corsHeaders, addCors } from "@/lib/cors";
import { getEnv } from "@/lib/env";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("health");

export const GET = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 const start = Date.now();
 const checks: Record<string, string> = {};

 try {
 const env = getEnv();
 checks.env = "ok";
 } catch (e: any) {
 checks.env = `fail: ${e.message}`;
 }

 try {
 const anonClient = createClient(
 process.env.NEXT_PUBLIC_SUPABASE_URL!,
 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 );
 const { error } = await anonClient
 .from("orders")
 .select("id", { count: "exact", head: true })
 .limit(1);
 checks.supabase = error ? `fail: ${error.message}` : "ok";
 } catch (e: any) {
 checks.supabase = `fail: ${e.message}`;
 }

 try {
 if (process.env.STRIPE_SECRET_KEY) {
 const stripe = getStripe();
 await stripe.balance.retrieve();
 checks.stripe = "ok";
 } else {
 checks.stripe = "skipped: no key";
 }
 } catch (e: any) {
 checks.stripe = `fail: ${e.message}`;
 }

 try {
 if (process.env.FAL_KEY) {
 // rest.fal.ai/v1/health was never a real fal.ai endpoint - this always
 // 404'd regardless of actual account health, silently marking the whole
 // health check "degraded" since whenever this route was added. fal's
 // real platform API base is api.fal.ai/v1 (confirmed against fal's own
 // docs); /meta is a real, lightweight, key-authenticated endpoint with
 // no side effects, so a 200 here actually means the key and connectivity
 // are good - unlike the old check, which never meant anything.
 const res = await fetch("https://api.fal.ai/v1/meta", {
 headers: { Authorization: `Key ${process.env.FAL_KEY}` },
 });
 checks.fal = res.ok ? "ok" : `fail: status ${res.status}`;
 } else {
 checks.fal = "skipped: no key";
 }
 } catch (e: any) {
 checks.fal = `fail: ${e.message}`;
 }

 const elapsed = Date.now() - start;
 const allOk = Object.values(checks).every((v) => v === "ok");
 const status = allOk ? "healthy" : "degraded";

 log.info({ status, checks, elapsed }, "Health check");

 const res = NextResponse.json(
 {
 status,
 checks,
 elapsed_ms: elapsed,
 timestamp: new Date().toISOString(),
 },
 { status: allOk ? 200 : 503 },
 );
 res.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
  return addCors(res, origin);
});

export const OPTIONS = (req: Request) =>
 new NextResponse(null, {
 status: 204,
 headers: corsHeaders(req.headers.get("origin")),
 });
