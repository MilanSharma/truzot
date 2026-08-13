import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("track-funnel");

// Allowlist, not free-form: this endpoint is unauthenticated by necessity
// (it has to record anonymous visitors before they identify themselves), so
// the only thing keeping the table from being filled with arbitrary junk is
// that anything not on this list is rejected outright.
const ALLOWED_EVENTS = new Set([
  "upload_landed",
  "upload_photos_added",
  "upload_photos_rejected",
  "upload_step1_blocked",
  "upload_step1_complete",
  "upload_checkout_clicked",
  "upload_checkout_failed",
]);

// Small, fixed set of non-identifying counters/flags. Anything else a client
// sends is dropped rather than stored, so this can't become a side channel for
// PII (emails, filenames, photo data) even by accident.
const ALLOWED_METADATA_KEYS = new Set([
  "reason",
  "count",
  "plan",
  "fromFreePreview",
]);

export const POST = withContext(async (req: Request) => {
  try {
    const body = (await req.json()) as {
      event?: string;
      sessionId?: string;
      metadata?: Record<string, unknown>;
    };

    const { event, sessionId } = body;

    if (!event || !ALLOWED_EVENTS.has(event)) {
      return NextResponse.json({ error: "Unknown event" }, { status: 400 });
    }
    if (!sessionId || typeof sessionId !== "string" || sessionId.length > 64) {
      return NextResponse.json({ error: "Invalid session" }, { status: 400 });
    }

    const metadata: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(body.metadata ?? {})) {
      if (!ALLOWED_METADATA_KEYS.has(k)) continue;
      // Cap string length so a rejected-photo `reason` can't smuggle in a long
      // filename or arbitrary payload.
      metadata[k] = typeof v === "string" ? v.slice(0, 120) : v;
    }

    const { error } = await supabaseAdmin
      .from("funnel_events")
      .insert({ event, session_id: sessionId, metadata });

    if (error) {
      log.error({ err: error, event }, "Failed to record funnel event");
    }

    // Always 204, even on a write failure: this is fire-and-forget
    // instrumentation and must never surface an error or block the checkout
    // flow it's measuring.
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
});
