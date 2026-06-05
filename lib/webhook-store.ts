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
): Promise<boolean> {
  try {
    const { error: insertError } = await supabaseAdmin
      .from("webhook_events")
      .insert({
        source,
        event_id: eventId,
        type,
        payload,
        status,
        error,
      });
    if (insertError) {
      log.error(
        { err: insertError, source, type },
        "Failed to store webhook event",
      );
      return false;
    }
    return true;
  } catch (err) {
    log.error({ err, source, type }, "Failed to store webhook event");
    return false;
  }
}
