import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { waitUntil } from "@vercel/functions";
import { generateHeadshots } from "@/lib/ai/fal-client";
import { PLAN_SHOTS, GENERATION_CONFIG, resolveGenPlanKey } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendHeadshotsReadyEmail } from "@/lib/email";
import { generateTriggerSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";
import { failOrderAndRefund } from "@/lib/order-failure";

const log = createLogger("generate");
export const maxDuration = 800; // Vercel Pro max (GA). Raise to 1800 only if you've
                                 // opted into the extended-duration beta — see notes.
const LOCK_TTL_MS = 780_000; // slightly under maxDuration: if a lock is older than
                              // this, the invocation that set it is presumed dead.

async function enqueueNextBatch(orderId: string): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
  const cronSecret = process.env.CRON_SECRET;
  const qstashToken = process.env.QSTASH_TOKEN;

  if (!qstashToken) {
    log.error({ orderId }, "QSTASH_TOKEN missing - using inline fallback");
    waitUntil(
      fetch(`${siteUrl}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-truzot-secret": cronSecret || "" },
        body: JSON.stringify({ orderId }),
      }).catch((err) => log.error({ err, orderId }, "Inline fallback error")),
    );
    return true;
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`https://qstash.upstash.io/v2/publish/${siteUrl}/api/generate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${qstashToken}`,
          "Content-Type": "application/json",
          "Upstash-Forward-x-truzot-secret": cronSecret || "",
          "Upstash-Retries": "3",
          // NEW — fires when QStash itself exhausts retries, so a fully dead chain
          // still resolves the order instead of dying silently in the DLQ.
          "Upstash-Failure-Callback": `${siteUrl}/api/webhooks/qstash-failure`,
          "Upstash-Failure-Callback-Forward-x-truzot-secret": cronSecret || "",
        },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        log.info({ orderId, attempt }, "QStash enqueue successful");
        return true;
      }
      log.error({ status: res.status, attempt, orderId }, "QStash enqueue attempt failed");
    } catch (err) {
      log.error({ err, attempt, orderId }, "QStash enqueue attempt error");
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  log.error({ orderId }, "QStash enqueue exhausted all 3 attempts");
  return false;
}

/** Atomically claim the order for this invocation. Returns false if another
 * invocation already holds a fresh (non-stale) lock — meaning this call is a
 * QStash retry firing while the original attempt is still legitimately running. */
async function claimOrder(orderId: string): Promise<boolean> {
  const token = crypto.randomUUID();
  const staleThreshold = new Date(Date.now() - LOCK_TTL_MS).toISOString();

  const { data, error } = await supabaseAdmin
    .from("orders")
    .update({ batch_lock_at: new Date().toISOString(), batch_lock_token: token })
    .eq("id", orderId)
    .eq("status", "generating")
    .or(`batch_lock_at.is.null,batch_lock_at.lt.${staleThreshold}`)
    .select("id")
    .maybeSingle();

  if (error) {
    log.error({ err: error, orderId }, "claimOrder query failed — proceeding without lock");
    return true; // fail open: don't let a lock bug block real generation
  }
  return !!data;
}

async function releaseLock(orderId: string): Promise<void> {
  await supabaseAdmin.from("orders").update({ batch_lock_at: null }).eq("id", orderId);
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  const authSecret = req.headers.get("x-truzot-secret");
  const cronSecret = process.env.CRON_SECRET || (process.env.NODE_ENV === "development" ? "dev-secret" : null);
  if (!cronSecret || authSecret !== cronSecret) {
    return addCors(NextResponse.json({ error: "Unauthorized trigger call" }, { status: 401 }), origin);
  }

  let orderId: string | undefined;
  let lockAcquired = false;

  try {
    const body = await req.json() as Record<string, unknown>;
    const parsed = validate(generateTriggerSchema, body);
    if (parsed.error) return addCors(NextResponse.json({ error: parsed.error }, { status: 400 }), origin);
    orderId = parsed.data!.orderId;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status, plan, email, preferences, shoot_name")
      .eq("id", orderId)
      .single();
    if (!order) return addCors(NextResponse.json({ error: "Order not found" }, { status: 404 }), origin);

    if (order.status === "completed") return addCors(NextResponse.json({ status: "completed" }), origin);
    if (order.status === "failed") return addCors(NextResponse.json({ status: "failed" }), origin);
    if (order.status !== "generating") return addCors(NextResponse.json({ status: order.status }), origin);

    // --- Lock: bail out cleanly if another invocation is genuinely still running ---
    lockAcquired = await claimOrder(orderId);
    if (!lockAcquired) {
      log.info({ orderId }, "Order already locked by an in-flight invocation, skipping");
      return addCors(NextResponse.json({ status: "generating", note: "already in progress" }), origin);
    }

    const { data: training } = await supabaseAdmin.from("trainings").select("model_id").eq("order_id", orderId).single();
    if (!training?.model_id) {
      await releaseLock(orderId);
      return addCors(NextResponse.json({ error: "Model training not found" }, { status: 404 }), origin);
    }

    const targetCount = PLAN_SHOTS[order.plan] ?? 40;
    const { count: totalGenerated } = await supabaseAdmin
      .from("headshots").select("id", { count: "exact", head: true }).eq("order_id", orderId);
    const currentCount = totalGenerated ?? 0;

    if (currentCount >= targetCount) {
      await completeOrder(orderId, order, currentCount, targetCount);
      await releaseLock(orderId);
      return addCors(NextResponse.json({ status: "completed", count: currentCount, target: targetCount }), origin);
    }

    const planKey = resolveGenPlanKey(order.plan);
    const { batchSize: maxBatch, concurrency } = GENERATION_CONFIG[planKey];
    const batchSize = Math.min(maxBatch, targetCount - currentCount);

    let genResult;
    try {
      genResult = await generateHeadshots(training.model_id, order.plan, currentCount, batchSize, order.preferences, concurrency);
    } catch (genErr) {
      // CHANGED: no longer rethrown to the outer catch. A thrown error is treated
      // exactly like a zero-progress batch — it still enqueues the next attempt and
      // still counts toward the 3-strikes-and-refund threshold below.
      log.error({ err: genErr, orderId, modelId: training.model_id }, "generateHeadshots threw — treating as empty batch");
      genResult = { results: [], failures: [(genErr as Error).message || "unknown"], totalRequested: batchSize };
    }

    if (genResult.failures.length > 0 && genResult.results.length === 0) {
      log.error({ orderId, failures: genResult.failures.length }, "All headshots in batch failed");
    } else if (genResult.failures.length > 0) {
      log.warn({ orderId, failures: genResult.failures.length, succeeded: genResult.results.length }, "Partial headshot generation failure");
    }

    const headshotsToInsert = genResult.results.flatMap((res) => {
      const promptText = res.prompt ?? "";
      let category = "corporate";
      if (promptText.toLowerCase().includes("casual")) category = "casual";
      else if (promptText.toLowerCase().includes("creative")) category = "creative";
      else if (promptText.toLowerCase().includes("studio")) category = "studio";
      else if (promptText.toLowerCase().includes("outdoor")) category = "outdoor";
      return (res.images ?? []).map((img) => ({ order_id: orderId, image_url: img.url, style: promptText, category }));
    });

    if (headshotsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin.from("headshots").insert(headshotsToInsert);
      if (insertError && (insertError as any)?.code !== "23505") {
        log.error({ err: insertError, orderId }, "Failed to insert headshots");
      }
    }

    const { count: finalCount } = await supabaseAdmin
      .from("headshots").select("id", { count: "exact", head: true }).eq("order_id", orderId);
    const newTotal = finalCount ?? currentCount + headshotsToInsert.length;
    log.info({ orderId, batch: headshotsToInsert.length, total: newTotal, target: targetCount }, "Batch generated");

    if (newTotal >= targetCount) {
      await completeOrder(orderId, order, newTotal, targetCount);
      await releaseLock(orderId);
      return addCors(NextResponse.json({ status: "completed", count: newTotal, target: targetCount }), origin);
    }

    if (headshotsToInsert.length === 0) {
      const failed = await handleZeroProgress(orderId, order);
      await releaseLock(orderId);
      if (failed) {
        return addCors(NextResponse.json({ status: "failed", count: newTotal, target: targetCount }), origin);
      }
    } else {
      await releaseLock(orderId);
    }

    const enqueued = await enqueueNextBatch(orderId);
    return addCors(
      NextResponse.json(
        { status: enqueued ? "generating" : "generating_retry_later", count: newTotal, target: targetCount },
        { status: enqueued ? 200 : 503 },
      ),
      origin,
    );
  } catch (err) {
    if (orderId && lockAcquired) await releaseLock(orderId).catch(() => {});
    Sentry.captureException(err);
    log.error({ err }, "Generation execution failed");
    return addCors(NextResponse.json({ error: "Generation execution failed" }, { status: 500 }), origin);
  }
});

// --- helpers factored out so the failure-callback route (Task 5) can reuse them ---

async function completeOrder(orderId: string, order: any, count: number, target: number) {
  const prefs = (order.preferences as Record<string, any>) || {};
  await supabaseAdmin.from("orders")
    .update({ status: "completed", preferences: { ...prefs, generate_failures: 0 } })
    .eq("id", orderId).eq("status", "generating");
  await supabaseAdmin.from("trainings").update({ status: "completed" }).eq("order_id", orderId).in("status", ["training", "generating"]);
  if (order.email) {
    await sendHeadshotsReadyEmail(order.email, orderId, count, order.shoot_name)
      .catch((err) => log.error({ err, orderId }, "Email send failed"));
  }
  log.info({ orderId, count, target }, "Generation completed");
}

/** Returns true if the order was marked failed (caller should stop enqueueing). */
async function handleZeroProgress(orderId: string, order: any): Promise<boolean> {
  let newFailures = 1;
  try {
    const { data: rpcResult } = await supabaseAdmin.rpc("increment_order_failures", { order_id: orderId });
    newFailures = (rpcResult as number) ?? 1;
  } catch {
    const prefs = (order.preferences as Record<string, any>) || {};
    newFailures = ((prefs.generate_failures as number) || 0) + 1;
    await supabaseAdmin.from("orders").update({ preferences: { ...prefs, generate_failures: newFailures } }).eq("id", orderId);
  }
  if (newFailures >= 3) {
    await failOrderAndRefund(orderId);
    return true;
  }
  return false;
}
