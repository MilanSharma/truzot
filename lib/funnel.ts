/**
 * Anonymous step-level funnel instrumentation for the paid upload flow.
 *
 * Exists because 100% of /upload traffic was quitting before checkout with no
 * record of where. The page's pre-existing fbq/gtag calls only fire at two
 * points, are routinely blocked by ad blockers, and can't be queried from the
 * database side anyway - so drop-off location was pure guesswork.
 *
 * Identifies nobody: the session id is a random per-tab value used only to
 * stitch one visit's steps into a funnel, and /api/track-funnel drops any
 * metadata key outside a fixed allowlist. Never send emails, filenames, or
 * photo data through here.
 */

const SESSION_KEY = "truzot-funnel-session";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return existing;
    const id =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return id;
  } catch {
    // Private mode / storage disabled - degrade to an unstitched one-off id
    // rather than losing the event entirely.
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
}

export type FunnelEvent =
  | "upload_landed"
  | "upload_photos_added"
  | "upload_photos_rejected"
  | "upload_step1_blocked"
  | "upload_step1_complete"
  | "upload_checkout_clicked"
  | "upload_checkout_failed";

export function trackFunnel(
  event: FunnelEvent,
  metadata: Record<string, string | number | boolean> = {},
): void {
  if (typeof window === "undefined") return;
  const payload = JSON.stringify({
    event,
    sessionId: getSessionId(),
    metadata,
  });

  try {
    // sendBeacon survives the page unloading (e.g. the redirect to Stripe
    // right after upload_checkout_clicked), which a plain fetch would not.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/track-funnel",
        new Blob([payload], { type: "application/json" }),
      );
      return;
    }
    void fetch("/api/track-funnel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Instrumentation must never break the flow it measures.
  }
}
