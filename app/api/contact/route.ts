import { NextResponse } from "next/server";
import { Resend } from "resend";
import { contactSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("contact");

export const POST = withContext(async (req: Request) => {
  try {
    const body = await req.json();
    const parsed = validate(contactSchema, body);
    if (parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { name, email, subject, message, orderId } = parsed.data!;

    const sanitize = (s: string) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");

    if (!process.env.RESEND_API_KEY) {
      log.warn("RESEND_API_KEY not set; contact message not sent");
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    const subjectLine = subject
      ? `[Contact] ${subject} — from ${name}`
      : `[Contact] New message from ${name}`;

    await resend.emails.send({
      from: "Truzot <hello@truzot.com>",
      to: "hello@truzot.com",
      subject: subjectLine,
      html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <h2>New Contact Form Submission</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Name</td><td style="padding: 8px 0;">${sanitize(name)}</td></tr>
          <tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Email</td><td style="padding: 8px 0;">${sanitize(email)}</td></tr>
          ${subject ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Subject</td><td style="padding: 8px 0;">${sanitize(subject)}</td></tr>` : ""}
          ${orderId ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #333;">Order ID</td><td style="padding: 8px 0;">${sanitize(orderId)}</td></tr>` : ""}
        </table>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p style="font-size: 15px; line-height: 1.6; color: #333;">${sanitize(message).replace(/\n/g, "<br/>")}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 16px 0;" />
        <p style="color: #999; font-size: 13px;">Sent via Truzot contact form</p>
      </div>`,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Contact form failed");
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 },
    );
  }
});
