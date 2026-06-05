import { NextResponse } from "next/server";
import { generateHeadshots } from "@/lib/ai/fal-client";
import { PLAN_SHOTS } from "@/lib/plans";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendHeadshotsReadyEmail } from "@/lib/email";
import { generateTriggerSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("generate");
export const maxDuration = 300;
const BATCH_SIZE = 10;

async function enqueueNextBatch(orderId: string): Promise<boolean> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
  const qstashToken = process.env.QSTASH_TOKEN;
  if (!qstashToken) {
    log.warn({ orderId }, "QSTASH_TOKEN missing, cannot enqueue next batch");
    return false;
  }
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://qstash.upstash.io/v2/publish/${siteUrl}/api/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${qstashToken}`,
            "Content-Type": "application/json",
            "x-truzot-secret": process.env.CRON_SECRET || "",
          },
          body: JSON.stringify({ orderId }),
        },
      );
      if (res.ok) return true;
      log.error(
        { status: res.status, attempt, orderId },
        "QStash enqueue attempt failed",
      );
    } catch (err) {
      log.error({ err, attempt, orderId }, "QStash enqueue attempt error");
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, 1000 * attempt));
  }
  log.error({ orderId }, "QStash enqueue exhausted all 3 attempts");
  return false;
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  const authSecret = req.headers.get("x-truzot-secret");
  const cronSecret =
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV === "development" ? "dev-secret" : null);
  if (!cronSecret || authSecret !== cronSecret) {
    return addCors(
      NextResponse.json(
        { error: "Unauthorized trigger call" },
        { status: 401 },
      ),
      origin,
    );
  }

  try {
    const body = await req.json();
    const parsed = validate(generateTriggerSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    const { orderId } = parsed.data!;

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("status, plan, email, preferences")
      .eq("id", orderId)
      .single();
    if (!order)
      return addCors(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        origin,
      );

    if (order.status === "completed")
      return addCors(NextResponse.json({ status: "completed" }), origin);
    if (order.status === "failed")
      return addCors(NextResponse.json({ status: "failed" }), origin);
    if (order.status !== "generating")
      return addCors(NextResponse.json({ status: order.status }), origin);

    const { data: training } = await supabaseAdmin
      .from("trainings")
      .select("model_id")
      .eq("order_id", orderId)
      .single();
    if (!training?.model_id)
      return addCors(
        NextResponse.json(
          { error: "Model training not found" },
          { status: 404 },
        ),
        origin,
      );

    const targetCount = PLAN_SHOTS[order.plan] ?? 40;
    const { count: totalGenerated } = await supabaseAdmin
      .from("headshots")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);
    const currentCount = totalGenerated ?? 0;

    if (currentCount >= targetCount) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);
      await supabaseAdmin
        .from("trainings")
        .update({ status: "completed" })
        .eq("order_id", orderId);
      if (order.email)
        await sendHeadshotsReadyEmail(order.email, orderId, currentCount).catch(
          (err) => log.error({ err, orderId }, "Email send failed"),
        );
      log.info(
        { orderId, count: currentCount, target: targetCount },
        "Generation completed",
      );
      return addCors(
        NextResponse.json({
          status: "completed",
          count: currentCount,
          target: targetCount,
        }),
        origin,
      );
    }

    const results = await generateHeadshots(
      training.model_id,
      order.plan,
      currentCount,
      BATCH_SIZE,
      order.preferences,
    );
    let headshotsToInsert = results.flatMap((res: any) => {
      const promptText = res.prompt ?? "";
      let category = "corporate";
      if (promptText.toLowerCase().includes("casual")) category = "casual";
      else if (promptText.toLowerCase().includes("creative"))
        category = "creative";
      else if (promptText.toLowerCase().includes("studio")) category = "studio";
      else if (promptText.toLowerCase().includes("outdoor"))
        category = "outdoor";
      return (res.images ?? []).map((img: any) => ({
        order_id: orderId,
        image_url: img.url,
        style: promptText || "ai-generated",
        category,
      }));
    });

    if (headshotsToInsert.length > 0) {
      const { count: dedupCheck } = await supabaseAdmin
        .from("headshots")
        .select("id", { count: "exact", head: true })
        .eq("order_id", orderId);
      if ((dedupCheck ?? 0) !== currentCount) {
        log.warn(
          { orderId, expected: currentCount, actual: dedupCheck },
          "Dedup: skipping batch, another instance already wrote headshots",
        );
        headshotsToInsert = [];
      } else {
        const { error: insertError } = await supabaseAdmin
          .from("headshots")
          .insert(headshotsToInsert);
        if (insertError)
          log.error(
            { err: insertError, orderId },
            "Failed to insert headshots",
          );
      }
    }

    const newTotal = currentCount + headshotsToInsert.length;
    log.info(
      {
        orderId,
        batch: headshotsToInsert.length,
        total: newTotal,
        target: targetCount,
      },
      "Batch generated",
    );

    if (newTotal >= targetCount) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "completed" })
        .eq("id", orderId);
      await supabaseAdmin
        .from("trainings")
        .update({ status: "completed" })
        .eq("order_id", orderId);
      if (order.email)
        await sendHeadshotsReadyEmail(order.email, orderId, newTotal).catch(
          (err) => log.error({ err, orderId }, "Email send failed"),
        );
      return addCors(
        NextResponse.json({
          status: "completed",
          count: newTotal,
          target: targetCount,
        }),
        origin,
      );
    }

    if (headshotsToInsert.length === 0) {
      const prefs = (order.preferences as Record<string, any>) || {};
      const failures = (prefs.generate_failures as number) || 0;
      const newFailures = failures + 1;
      if (newFailures >= 3) {
        await supabaseAdmin
          .from("orders")
          .update({ status: "failed" })
          .eq("id", orderId);
        log.error(
          { orderId },
          "Generation failed after 3 consecutive empty batches",
        );
        return addCors(
          NextResponse.json({
            status: "failed",
            count: newTotal,
            target: targetCount,
          }),
          origin,
        );
      }
      await supabaseAdmin
        .from("orders")
        .update({ preferences: { ...prefs, generate_failures: newFailures } })
        .eq("id", orderId);
    }

    const enqueued = await enqueueNextBatch(orderId);
    return addCors(
      NextResponse.json(
        {
          status: enqueued ? "generating" : "generating_retry_later",
          count: newTotal,
          target: targetCount,
        },
        { status: enqueued ? 200 : 503 },
      ),
      origin,
    );
  } catch (err) {
    log.error({ err }, "Generation execution failed");
    return addCors(
      NextResponse.json(
        { error: "Generation execution failed" },
        { status: 500 },
      ),
      origin,
    );
  }
});
