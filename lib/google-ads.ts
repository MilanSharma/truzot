import { createLogger } from "@/lib/logger";

const log = createLogger("google-ads-conversion");

// Server-side backup for the client-side gtag conversion pixel in
// app/dashboard/page.tsx. That pixel has zero redundancy - any ad blocker
// or gtag load failure on the customer's end silently loses the conversion
// forever, which Google Ads' own diagnostics confirmed was happening (the
// primary conversion action was flagged "Misconfigured": no conversions
// recorded in 7+ days, despite real completed sales in that window).
//
// Neither ID below is a secret - same customer_id already passed directly
// in every Google Ads MCP tool call this session. Only the OAuth
// credentials (env vars) are sensitive.
const CUSTOMER_ID = "3275124919"; // Truzot's live Google Ads account
const LOGIN_CUSTOMER_ID = "5818593025"; // MCC manager account - required header for child accounts
const CONVERSION_ACTION_ID = "7696002850"; // "Purchase (1)" - the account's actual primary goal
const API_VERSION = "v18";

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedAccessToken && Date.now() < cachedAccessToken.expiresAt - 60_000) {
    return cachedAccessToken.token;
  }
  const clientId = process.env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_ADS_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Google Ads OAuth credentials not configured");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to refresh Google Ads OAuth token: ${res.status} ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

// Google Ads requires "yyyy-MM-dd HH:mm:ss+00:00" - not ISO 8601.
function formatConversionDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}+00:00`
  );
}

export async function uploadGoogleAdsClickConversion(params: {
  gclid: string;
  // Stripe checkout session ID - the same value the client-side gtag pixel
  // sends as transaction_id, so Google Ads dedupes this against that pixel
  // by order ID instead of double-counting when both happen to fire.
  orderId: string;
  valueDollars: number;
  currencyCode: string;
  conversionTime?: Date;
}): Promise<void> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;
  if (!developerToken) {
    log.warn(
      "GOOGLE_ADS_DEVELOPER_TOKEN not configured, skipping server-side conversion upload",
    );
    return;
  }

  try {
    const accessToken = await getAccessToken();
    const conversionDateTime = formatConversionDateTime(
      params.conversionTime ?? new Date(),
    );

    const res = await fetch(
      `https://googleads.googleapis.com/${API_VERSION}/customers/${CUSTOMER_ID}:uploadClickConversions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "developer-token": developerToken,
          "login-customer-id": LOGIN_CUSTOMER_ID,
        },
        body: JSON.stringify({
          conversions: [
            {
              gclid: params.gclid,
              conversionAction: `customers/${CUSTOMER_ID}/conversionActions/${CONVERSION_ACTION_ID}`,
              conversionDateTime,
              conversionValue: params.valueDollars,
              currencyCode: params.currencyCode.toUpperCase(),
              orderId: params.orderId,
            },
          ],
          partialFailure: true,
        }),
      },
    );

    const result = await res.json();
    if (!res.ok || result.partialFailureError) {
      log.error(
        { status: res.status, result, orderId: params.orderId },
        "Google Ads click conversion upload failed",
      );
      return;
    }
    log.info(
      { orderId: params.orderId, gclid: params.gclid },
      "Google Ads click conversion uploaded",
    );
  } catch (err) {
    // Never let a tracking failure affect the actual order - same posture
    // as sendMetaCAPIEvent's own try/catch.
    log.error({ err, orderId: params.orderId }, "Google Ads conversion upload threw");
  }
}
