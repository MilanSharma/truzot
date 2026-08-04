import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { sendColdWaitlistNudgeEmail, sendSecondTouchFollowupEmail } from "@/lib/email";

const log = createLogger("send-lead-nudge");

// ONE-TIME manual send, triggered once then deleted (same pattern as the
// removed WELCOME10 coupon-creation route). Not CRON_SECRET-gated since this
// runs standalone, outside the cron system — gated by its own single-use
// literal secret instead.
const ONE_TIME_SECRET = "a0197e527acb9eefc4aa2677a7531eb6a9787bc4adddb019";

const COLD_LEADS = [
  { email: "teresab1964@hotmail.com", discount_code: "TRUZOT-TTUHVQVU" },
  { email: "ammarhusnain97@gmail.com", discount_code: "TRUZOT-TASP6CJH" },
  { email: "teamsparkymosquito@gmail.com", discount_code: "TRUZOT-S66G5HCT" },
  { email: "sakshisharma854@gmail.com", discount_code: "TRUZOT-HJY5M7QF" },
];

const WARM_LEADS = [
  { email: "susanmail103@gmail.com", discount_code: "TRUZOT-UXGHBSBQ" },
  { email: "Kapila8750@yahoo.com", discount_code: "TRUZOT-PEA3VMQM" },
  { email: "my4kings84@yahoo.com", discount_code: "TRUZOT-SMEXFVWN" },
  { email: "abdelbasetahmed2@gmail.com", discount_code: "TRUZOT-TFACDXP5" },
  { email: "johncesar453@gmail.com", discount_code: "TRUZOT-KGS53RYU" },
];

export const POST = withContext(async (req: Request) => {
  const secret = req.headers.get("x-truzot-secret");
  if (secret !== ONE_TIME_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let sent = 0;
  let skippedUnsubscribed = 0;
  const failures: string[] = [];

  for (const lead of [...COLD_LEADS, ...WARM_LEADS]) {
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

      const isCold = COLD_LEADS.some((l) => l.email === lead.email);
      if (isCold) {
        await sendColdWaitlistNudgeEmail(lead.email, lead.discount_code);
      } else {
        await sendSecondTouchFollowupEmail(lead.email, lead.discount_code);
      }
      sent++;
    } catch (err) {
      log.error({ err, email: lead.email }, "Failed to send lead nudge email");
      failures.push(lead.email);
    }
  }

  log.info({ sent, skippedUnsubscribed, failed: failures.length }, "Lead nudge send complete");
  return NextResponse.json({ sent, skippedUnsubscribed, failed: failures });
});
