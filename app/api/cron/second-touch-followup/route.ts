import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { sendSecondTouchFollowupEmail } from "@/lib/email";

const log = createLogger("second-touch-followup");

/**
 * Second automated lead-nurture touch: everyone who already received the
 * single preview-followup email (see /api/cron/preview-followup) and still
 * hasn't bought gets one more email, at least 3 days after the first,
 * taking a different angle (authenticity objection + competitor price
 * comparison) instead of repeating the first pitch.
 *
 * Schedule: once daily via Vercel Cron. Security: CRON_SECRET header.
 */
export const GET = withContext(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await supabaseAdmin
    .from("waitlist")
    .select("id, email, discount_code")
    .not("preview_followup_sent_at", "is", null)
    .lt("preview_followup_sent_at", threeDaysAgo)
    .is("second_touch_sent_at", null)
    .eq("used", false)
    .limit(50);

  if (error) {
    log.error({ err: error }, "Failed to fetch second-touch leads");
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

      await sendSecondTouchFollowupEmail(lead.email, lead.discount_code ?? null);

      const { error: markErr } = await supabaseAdmin
        .from("waitlist")
        .update({ second_touch_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      if (markErr) {
        log.error({ err: markErr, email: lead.email }, "Failed to mark second touch as sent");
      }
      sent++;
    } catch (err) {
      log.error({ err, email: lead.email }, "Failed to send second-touch email");
      failures.push(lead.email);
    }
  }

  if (sent > 0 || failures.length > 0) {
    log.info({ sent, skippedUnsubscribed, failed: failures.length }, "Second-touch run complete");
  }

  return NextResponse.json({
    message: "Second-touch follow-up complete",
    sent,
    skippedUnsubscribed,
    failed: failures.length,
  });
});
