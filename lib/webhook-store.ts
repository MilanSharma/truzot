import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";

const log = createLogger("webhook-store");

export async function storeWebhookEvent(
  source: string,
  eventId: string | null,
  type: string,
  payload: unknown,
  status: "received" | "processed" | "failed",
  error?: string,
) {
  try {
    await supabaseAdmin.from("webhook_events").insert({
      source,
      event_id: eventId,
      type,
      payload,
      status,
      error,
    });
  } catch (err) {
    log.error({ err, source, type }, "Failed to store webhook event");
  }
}
