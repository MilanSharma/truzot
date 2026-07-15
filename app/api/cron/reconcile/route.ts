import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { failOrderAndRefund } from "@/lib/order-failure";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("reconcile-cron");
const STALL_THRESHOLD_MIN = 6;   // no updated_at movement in 6 min while "generating" = stuck
const MAX_RETRY_KICKS = 2;       // re-trigger at most twice before giving up and refunding

export const GET = withContext(async (req: Request) => {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staleBefore = new Date(Date.now() - STALL_THRESHOLD_MIN * 60_000).toISOString();
  const { data: stalled } = await supabaseAdmin
    .from("orders")
    .select("id, preferences")
    .eq("status", "generating")
    .lt("updated_at", staleBefore);

  if (!stalled?.length) return NextResponse.json({ checked: 0 });

  const results = [];
  for (const order of stalled) {
    const prefs = (order.preferences as Record<string, any>) || {};
    const reconcileKicks = (prefs.reconcile_kicks as number) || 0;

    if (reconcileKicks >= MAX_RETRY_KICKS) {
      log.error({ orderId: order.id }, "Reconciler exhausted retries, failing order");
      await failOrderAndRefund(order.id);
      results.push({ orderId: order.id, action: "failed" });
      continue;
    }

    await supabaseAdmin.from("orders")
      .update({ preferences: { ...prefs, reconcile_kicks: reconcileKicks + 1 }, batch_lock_at: null })
      .eq("id", order.id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    await fetch(`${siteUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-truzot-secret": process.env.CRON_SECRET || "" },
      body: JSON.stringify({ orderId: order.id }),
    }).catch((err) => log.error({ err, orderId: order.id }, "Reconcile re-kick failed"));

    results.push({ orderId: order.id, action: "re-kicked" });
  }

  log.info({ count: results.length }, "Reconcile pass complete");
  return NextResponse.json({ checked: stalled.length, results });
});
