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

// Same SHA-256(email + secret) scheme /api/unsubscribe and the abandoned-cart
// email in /api/cron/cleanup already use — must match exactly or the link 404s
// with "Invalid token" when the recipient clicks it.
async function buildUnsubscribeUrl(email: string): Promise<string> {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "fallback-secret";
  const encoder = new TextEncoder();
  const data = encoder.encode(email + secret);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const token = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("");
  return `${process.env.NEXT_PUBLIC_SITE_URL}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
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

// Marketing (not transactional) email — needs a real, working unsubscribe
// link, unlike baseTemplate's footer link which drops straight to /unsubscribe
// with no email/token and can't actually unsubscribe anyone.
const baseTemplateWithUnsubscribe = (preview: string, title: string, content: string, unsubscribeUrl: string) => `
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
            <a href="${unsubscribeUrl}" style="color: #059669; text-decoration: none;">Unsubscribe</a>
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
    <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #6B7280;">For your privacy, all photos will be permanently deleted from our servers in 30 days. Please download your favorites before then.</p>
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; padding: 20px 24px; border-radius: 16px;">
      <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #374151;">Know someone who needs a better headshot? Share your link and earn <strong>40% commission</strong> on every order — <a href="${process.env.NEXT_PUBLIC_SITE_URL}/affiliates" style="color: #059669; font-weight: 600;">join the affiliate program</a>.</p>
    </div>
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
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Your 20% discount is ready!</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">Thanks for signing up. Use this exclusive code at checkout to get 20% off your headshot plan:</p>
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/upload?coupon=${encodeURIComponent(discountCode)}" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Redeem Now &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Code expires in 30 days. Valid on all plans.</p>
  `;
  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Your 20% discount code for Truzot headshots 🎁",
    html: baseTemplate("Your exclusive discount code is inside.", "Your Discount Code", content),
  }));
}

export async function sendPreviewFollowupEmail(email: string, discountCode: string | null) {
  const unsubscribeUrl = await buildUnsubscribeUrl(email);
  const discountBlock = discountCode
    ? `
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">Your 20% code (still active):</p>
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>`
    : "";
  // Carries the code straight into checkout instead of leaving the reader
  // to copy-paste it themselves - one less place to drop off.
  const uploadHref = discountCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/upload?coupon=${encodeURIComponent(discountCode)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/upload`;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">That was the low-res version.</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">You just got a free preview of your AI headshot — small, watermarked, and deliberately held back from full quality. It's real proof the tech works on your actual face, not a demo.</p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">The paid version trains a custom model on you and delivers 40–150 full-resolution, watermark-free headshots across multiple styles — ready for LinkedIn, a resume, or a company site.</p>
    ${discountBlock}
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${uploadHref}" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Get My Real Headshots &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Backed by a 30-day money-back guarantee — full refund, no questions, if it's not you.</p>
  `;

  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "That preview was the low-res version",
    html: baseTemplateWithUnsubscribe("The full-quality version is one upload away.", "Your Free Preview", content, unsubscribeUrl),
  }));
}

// Fires immediately after a free-preview generation succeeds. The
// free-preview page promises "We'll email you your preview" right next to
// the email field, but until now nothing ever actually sent one — the only
// email in that flow was the 3-hour-delayed sales pitch. Sent as a real
// attachment rather than an inline data: URI, since inline base64 images
// are stripped or unreliable in several major email clients.
export async function sendFreePreviewResultEmail(
  email: string,
  imageBase64: string,
  discountCode: string | null,
) {
  const unsubscribeUrl = await buildUnsubscribeUrl(email);
  const discountBlock = discountCode
    ? `
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">Your 20% code:</p>
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>`
    : "";
  const uploadHref = discountCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/upload?coupon=${encodeURIComponent(discountCode)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/upload`;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Here's your free preview.</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">Attached — small, watermarked, and deliberately held back from full quality, but it's real proof the AI works on your actual face, not a demo.</p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">The paid version trains a custom model on you and delivers 40–150 full-resolution, watermark-free headshots across multiple styles.</p>
    ${discountBlock}
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${uploadHref}" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Get My Real Headshots &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Backed by a 30-day money-back guarantee — full refund, no questions, if it's not you.</p>
  `;

  const base64Data = imageBase64.startsWith("data:")
    ? imageBase64.split(",")[1]
    : imageBase64;

  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Your free AI headshot preview is attached",
    html: baseTemplateWithUnsubscribe("Your free preview is attached to this email.", "Your Free Preview", content, unsubscribeUrl),
    attachments: [
      {
        filename: "truzot-free-preview.jpg",
        content: base64Data,
      },
    ],
  }));
}

// One-time manual nudge for waitlist leads who claimed a discount code but
// never actually tried the free preview — the automated preview-followup
// cron can't reach them since it's gated on free_preview_used_at being set.
export async function sendColdWaitlistNudgeEmail(email: string, discountCode: string | null) {
  const unsubscribeUrl = await buildUnsubscribeUrl(email);
  const discountBlock = discountCode
    ? `
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">Your 20% code (still active):</p>
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>`
    : "";

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Your free preview is still waiting.</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">You grabbed a spot and a 20%-off code, but never actually tried the free preview — takes about 10 seconds and shows you a real AI-generated headshot of <em>your</em> face, not a demo. No card required.</p>
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${process.env.NEXT_PUBLIC_SITE_URL}/free-preview" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">See My Free Preview &rarr;</a>
    </div>
    ${discountBlock}
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Your 20% code is still active whenever you're ready for the full-resolution set.</p>
  `;

  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Your free preview is still waiting",
    html: baseTemplateWithUnsubscribe("See a real AI headshot of your own face in 10 seconds.", "Your Free Preview", content, unsubscribeUrl),
  }));
}

// One-time manual second-touch for leads who already tried the preview and
// received the single automated preview-followup email, but still haven't
// bought. Different angle from the first email: addresses the #1 objection
// (authenticity) and adds the concrete competitor price comparison instead
// of repeating the "low-res vs high-res" pitch they already saw.
export async function sendSecondTouchFollowupEmail(email: string, discountCode: string | null) {
  const unsubscribeUrl = await buildUnsubscribeUrl(email);
  const discountBlock = discountCode
    ? `
    <div style="background: rgba(163,230,53,0.1); border: 2px dashed #A3E635; border-radius: 16px; padding: 24px; text-align: center; margin: 32px 0;">
      <p style="margin: 0 0 8px; font-size: 14px; color: #4B5563;">Your 20% code (still active):</p>
      <span style="font-size: 32px; font-weight: 900; color: #A3E635; letter-spacing: 4px; font-family: monospace;">${discountCode}</span>
    </div>`
    : "";
  const uploadHref = discountCode
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/upload?coupon=${encodeURIComponent(discountCode)}`
    : `${process.env.NEXT_PUBLIC_SITE_URL}/upload`;

  const content = `
    <h1 style="margin: 0 0 16px; font-size: 28px; font-weight: 900; color: #111827;">Is it really you, or just... AI?</h1>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">That's the #1 question people ask before buying — fair one. Truzot trains a private model on your actual face, not a generic filter, which is why your preview looked like <em>you</em>, just sharper.</p>
    <p style="margin: 0 0 24px; font-size: 16px; line-height: 1.6; color: #4B5563;">Quick numbers, since you're probably comparing options: Truzot starts at <strong>$29 for 40 photos</strong>. HeadshotPro's cheapest plan is also $29 but gives you 30. Aragon starts at $35. InstaHeadshots starts at $49. You already found the cheapest one — with more photos than any of them.</p>
    ${discountBlock}
    <div style="text-align: center; margin-bottom: 24px;">
      <a href="${uploadHref}" style="background: #A3E635; color: #000000; padding: 16px 32px; border-radius: 12px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">Get My Real Headshots &rarr;</a>
    </div>
    <p style="margin: 0; font-size: 14px; color: #6B7280;">Backed by a 30-day money-back guarantee — full refund, no questions, if it's not you.</p>
  `;

  await withRetry(() => getResend().emails.send({
    from: "Truzot <hello@truzot.com>",
    to: email,
    subject: "Is it really you, or just... AI?",
    html: baseTemplateWithUnsubscribe("Why the preview actually looked like you, and how the price compares.", "Still deciding?", content, unsubscribeUrl),
  }));
}
