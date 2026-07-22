import { Resend } from "resend";
import { createHmac } from "crypto";

function getResend() {
  if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");
  return new Resend(process.env.RESEND_API_KEY);
}

// Same HMAC scheme that /api/order-status and /api/download/token validate.
// Guest orders have no account, so the gallery link MUST carry this token or a
// guest clicking "View Full Gallery" lands unauthenticated — the gallery then
// falls back to a direct (RLS-blocked) DB read and errors, and Share/Download
// have no credential to present.
function makeEmailToken(orderId: string): string {
  const secret = process.env.CRON_SECRET;
  if (!secret) return "";
  return createHmac("sha256", secret).update(orderId).digest("hex").substring(0, 32);
}

async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (attempt === maxAttempts) break;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
}

const baseTemplate = (preview: string, title: string, content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #F9FAFB; color: #111827; margin: 0; padding: 0; -webkit-font-smoothing: antialiased;">
  <div style="display: none; max-height: 0px; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">${preview}</div>
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background: #F9FAFB; padding: 40px 20px;">
    <tr><td align="center">
      <table width="100%" max-width="600" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; background: #FFFFFF; border: 1px solid #E5E7EB; border-radius: 24px; overflow: hidden;">
        <tr><td style="padding: 40px;">
          ${content}
        </td></tr>
        <tr><td style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 1px solid #E5E7EB;">
          <p style="margin: 0; font-size: 12px; color: #6B7280;">
            © ${new Date().getFullYear()} Truzot AI Headshots<br/>
            <a href="${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe" style="color: #059669; text-decoration: none;">Manage Email Preferences</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>
`;

export async function sendHeadshotsReadyEmail(email: string, orderId: string, shotCount: number, shootName?: string | null, thumbnails?: string[]) {
  const emailToken = makeEmailToken(orderId);
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=${orderId}${emailToken ? `&email_token=${emailToken}` : ""}`;
  
  let thumbnailsHtml = "";
  if (thumbnails && thumbnails.length > 0) {
    thumbnailsHtml = `
      <div style="margin: 32px 0; text-align: center;">
        ${thumbnails.map(url => `<img src="${url}" width="120" height="120" style="border-radius: 12px; margin: 0 4px; object-fit: cover; border: 1px solid #E5E7EB;" alt="Headshot Preview" />`).join('')}
      </div>
    `;
  }

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Your headshots are ready.</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">We've successfully generated ${shotCount} studio-quality headshots${shootName ? ` for "${shootName}"` : ""}. Your private gallery is now unlocked.</p>
    ${thumbnailsHtml}
    <div style="text-align: center; margin: 32px 0;">
      <a href="${dashboardUrl}" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">View Full Gallery &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #6B7280;">For your privacy, all photos will be permanently deleted from our servers in 30 days. Please download your favorites before then.</p>
  `;

  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: `Your ${shotCount} headshots are ready`,
    html: baseTemplate("Your AI headshots have finished generating and are ready to view.", "Your Headshots are Ready", content),
  }));
}

export async function sendOrderConfirmationEmail(email: string, plan: string, amount: number) {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Order Confirmed.</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">Your <strong>${plan.toUpperCase()}</strong> plan order of $${(amount / 100).toFixed(2)} has been received and your AI model is now training.</p>
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; padding: 24px; border-radius: 16px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px; font-size: 15px; color: #374151;">⏱ <strong>Estimated delivery:</strong> 30–60 minutes</p>
      <p style="margin: 0 0 8px; font-size: 15px; color: #374151;">📧 <strong>Notification:</strong> We'll email you the moment they're ready</p>
      <p style="margin: 0; font-size: 15px; color: #374151;">🔒 <strong>Privacy:</strong> Your photos are encrypted and private</p>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">You can safely close the processing window. We'll handle the rest.</p>
  `;
  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Order confirmed — your headshots are processing",
    html: baseTemplate("We're training your custom AI model right now.", "Order Confirmed", content),
  }));
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Reset Password</h1>
    <p style="margin: 0 0 32px; font-size: 16px; line-height: 1.6; color: #4B5563;">We received a request to reset the password for your Truzot account. Click the button below to set a new password.</p>
    <div style="text-align: center; margin-bottom: 32px;">
      <a href="${resetUrl}" style="background: #A3E635; color: #000000; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Reset Password</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">If you didn't request this, you can safely ignore this email.</p>
  `;
  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Reset your Truzot password",
    html: baseTemplate("Click here to securely reset your Truzot account password.", "Reset Password", content),
  }));
}

export async function sendDiscountCodeEmail(email: string, discountCode: string) {
  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Your $5 discount is ready!</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">Thanks for signing up. Use this exclusive code at checkout to get $5 off your headshot plan:</p>
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/upload" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Redeem Now &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Code expires in 30 days. Valid on all plans.</p>
  `;
  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Your $5 discount code for Truzot headshots 🎁",
    html: baseTemplate("Your exclusive discount code is inside.", "Your Discount Code", content),
  }));
}
