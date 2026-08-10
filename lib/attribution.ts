// Captures ad-click/campaign attribution (gclid + UTM params) the moment it
// shows up in any page's URL, and makes it recoverable later regardless of
// which page a visitor eventually converts on.
//
// Why this exists: every ad in this account's final URL is the homepage (or
// homepage#pricing), never /upload directly. The homepage's CTAs link to
// /upload with a bare href - no query string forwarding - so gclid and all 5
// UTM params were being silently dropped the instant someone clicked
// through, before /upload's own searchParams-based read ever saw them.
// Confirmed live: clicking "Create my headshots" from a URL carrying
// ?gclid=X&utm_source=google landed on /upload with no query string at all.
// This localStorage layer decouples capture (any page, on load) from usage
// (/upload, wherever the visitor eventually lands) to fix that.
const STORAGE_KEY = "truzot-attribution";
const TTL_MS = 90 * 24 * 60 * 60 * 1000; // matches Google Ads' typical 90-day click-through conversion window

export type Attribution = {
  gclid: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_term: string;
  utm_content: string;
};

const EMPTY: Attribution = {
  gclid: "",
  utm_source: "",
  utm_medium: "",
  utm_campaign: "",
  utm_term: "",
  utm_content: "",
};

export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const params = new URLSearchParams(window.location.search);
    const fresh: Attribution = {
      gclid: params.get("gclid") || "",
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
    };
    // Nothing new on this page load - leave any previously stored
    // attribution alone rather than overwriting it with blanks.
    if (Object.values(fresh).every((v) => !v)) return;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...fresh, capturedAt: Date.now() }),
    );
  } catch {
    // Best-effort only - never block page load over this.
  }
}

export function getStoredAttribution(): Attribution {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.capturedAt !== "number" ||
      Date.now() - parsed.capturedAt > TTL_MS
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return EMPTY;
    }
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}
