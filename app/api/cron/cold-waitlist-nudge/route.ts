import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { sendColdWaitlistNudgeEmail } from "@/lib/email";

const log = createLogger("cold-waitlist-nudge");

/**
 * Nudge for waitlist leads who claimed a discount code but never tried the
 * free preview at all — the preview-followup cron can't reach them since
 * it's gated on free_preview_used_at being set. Targets signups at least
 * 24 hours old so it doesn't compete with the on-page pitch they just saw.
 *
 * Schedule: once daily via Vercel Cron. Security: CRON_SECRET header.
 */
export const GET = withContext(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await supabaseAdmin
    .from("waitlist")
    .select("id, email, discount_code")
    .is("free_preview_used_at", null)
    .is("cold_nudge_sent_at", null)
    .lt("created_at", oneDayAgo)
    .eq("used", false)
    .limit(50);

  if (error) {
    log.error({ err: error }, "Failed to fetch cold waitlist leads");
    return NextResponse.json({ error: "Failed to fetch leads" }, { status: 500 });
  }

  let sent = 0;
  let skippedUnsubscribed = 0;
  const failures: string[] = [];

  for (const lead of leads || []) {
    if (!lead.email) continue;
    try {
      const { data: prefs } = await supabaseAdmin
        .from("email_preferences")
        .select("unsubscribed")
        .eq("email", lead.email)
        .maybeSingle();
      if (prefs?.unsubscribed) {
        skippedUnsubscribed++;
        continue;
      }

      await sendColdWaitlistNudgeEmail(lead.email, lead.discount_code ?? null);

      const { error: markErr } = await supabaseAdmin
        .from("waitlist")
        .update({ cold_nudge_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      if (markErr) {
        log.error({ err: markErr, email: lead.email }, "Failed to mark cold nudge as sent");
      }
      sent++;
    } catch (err) {
      log.error({ err, email: lead.email }, "Failed to send cold waitlist nudge");
      failures.push(lead.email);
    }
  }

  if (sent > 0 || failures.length > 0) {
    log.info({ sent, skippedUnsubscribed, failed: failures.length }, "Cold nudge run complete");
  }

  return NextResponse.json({
    message: "Cold waitlist nudge complete",
    sent,
    skippedUnsubscribed,
    failed: failures.length,
  });
});
