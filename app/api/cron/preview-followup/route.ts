import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { sendPreviewFollowupEmail } from "@/lib/email";

const log = createLogger("preview-followup");

/**
 * Automated lead-nurture email: everyone who has used their free preview
 * (waitlist.free_preview_used_at set) and hasn't bought yet gets one email
 * pointing them at the paid product with their existing discount code.
 *
 * Delay: only targets previews at least 3 hours old, so it lands same-day
 * rather than the instant they leave the result page (where the same pitch
 * is already on-screen).
 *
 * Schedule: every 2 hours via Vercel Cron. Security: CRON_SECRET header.
 */
export const GET = withContext(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
  const { data: leads, error } = await supabaseAdmin
    .from("waitlist")
    .select("id, email, discount_code")
    .not("free_preview_used_at", "is", null)
    .lt("free_preview_used_at", threeHoursAgo)
    .is("preview_followup_sent_at", null)
    .eq("used", false)
    .limit(50);

  if (error) {
    log.error({ err: error }, "Failed to fetch free-preview leads");
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

      await sendPreviewFollowupEmail(lead.email, lead.discount_code ?? null);

      // Mark sent even if a later step fails — the email already went out,
      // so retrying would double-send rather than recover anything.
      const { error: markErr } = await supabaseAdmin
        .from("waitlist")
        .update({ preview_followup_sent_at: new Date().toISOString() })
        .eq("id", lead.id);
      if (markErr) {
        log.error({ err: markErr, email: lead.email }, "Failed to mark preview follow-up as sent");
      }
      sent++;
    } catch (err) {
      log.error({ err, email: lead.email }, "Failed to send preview follow-up email");
      failures.push(lead.email);
    }
  }

  if (sent > 0 || failures.length > 0) {
    log.info({ sent, skippedUnsubscribed, failed: failures.length }, "Preview follow-up run complete");
  }

  return NextResponse.json({
    message: "Preview follow-up complete",
    sent,
    skippedUnsubscribed,
    failed: failures.length,
  });
});
