import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("unsubscribe");

export const POST = withContext(async (req: Request) => {
  try {
    const { email, token } = await req.json();
    if (!email || !token)
      return NextResponse.json(
        { error: "Missing email or token" },
        { status: 400 },
      );

    // Simple token validation: SHA-256 of email + CRON_SECRET
    const encoder = new TextEncoder();
    const data = encoder.encode(email + (process.env.CRON_SECRET || ""));
    const hash = await crypto.subtle.digest("SHA-256", data);
    const expectedToken = Array.from(new Uint8Array(hash))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    if (token !== expectedToken)
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });

    const { error } = await supabaseAdmin
      .from("email_preferences")
      .upsert(
        { email, unsubscribed: true, updated_at: new Date().toISOString() },
        { onConflict: "email" },
      );
    if (error) {
      log.error({ err: error }, "Failed to save unsubscribe");
      return NextResponse.json(
        { error: "Failed to save preference" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Unsubscribe error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
