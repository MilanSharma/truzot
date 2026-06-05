import { Resend } from 'resend';

// Lazy-load Resend to prevent build-time crashes when RESEND_API_KEY is missing
let resendInstance: Resend | null = null;
function getResend() {
  if (!resendInstance) {
    resendInstance = new Resend(process.env.RESEND_API_KEY);
  }
  return resendInstance;
}

export async function sendHeadshotsReadyEmail(
  email: string,
  orderId: string,
  shotCount: number
) {
  const resend = getResend();
  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=${orderId}`;
  await resend.emails.send({
    from: 'Truzot <hello@truzot.com>',
    to: email,
    subject: `Your ${shotCount} headshots are ready ✨`,
    html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;">
<div style="padding: 40px 0 20px;">
<h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Your headshots are ready.</h1>
<p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
We've generated ${shotCount} professional headshots for you. Click below to view and download them all.
</p>
<a href="${dashboardUrl}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">
View my headshots →
</a>
</div>
<hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" />
<p style="color: #9b9590; font-size: 13px; line-height: 1.6;">
Your photos will be available for 30 days, then permanently deleted from our servers. Download them soon! — The Truzot team
</p>
</div>
`,
  });
}

export async function sendOrderConfirmationEmail(email: string, plan: string, amount: number) {
  const resend = getResend();
  await resend.emails.send({
    from: 'Truzot <hello@truzot.com>',
    to: email,
    subject: 'Order confirmed — your headshots are being generated',
    html: `
<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;">
<div style="padding: 40px 0 20px;">
<h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Order confirmed.</h1>
<p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
Your <strong>${plan.charAt(0).toUpperCase() + plan.slice(1)} plan</strong> order of $${(amount / 100).toFixed(2)} has been received.
</p>
<p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">
We're now training your AI model. You'll get another email the moment your headshots are ready — usually within 60 minutes.
</p>
<div style="background: #f5f0e8; padding: 20px; border-radius: 4px;">
<p style="margin: 0; font-size: 14px; color: #6b6560;">
⏱ Estimated delivery: 30–60 minutes<br/>
📧 We'll email you when they're ready<br/>
🔒 Your photos are encrypted and private
</p>
</div>
</div>
<hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" />
<p style="color: #9b9590; font-size: 13px;">
Questions? Reply to this email. — The Truzot team
</p>
</div>
`,
  });
}
