import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { signupSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { Resend } from "resend";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("signup");

function getResend() {
  if (!process.env.RESEND_API_KEY)
    throw new Error("RESEND_API_KEY is not configured");
  return new Resend(process.env.RESEND_API_KEY);
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const body = await req.json();
    const parsed = validate(signupSchema, body);
    if (parsed.error)
      return addCors(
        NextResponse.json({ error: parsed.error }, { status: 400 }),
        origin,
      );
    const { email, password } = parsed.data!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: { redirectTo: `${siteUrl}/login?confirmed=true` },
    });
    if (error || !data?.properties?.action_link) {
      return addCors(
        NextResponse.json(
          { error: error?.message ?? "Signup generation failed" },
          { status: 400 },
        ),
        origin,
      );
    }
    const actionLink = data.properties.action_link;
    const resend = getResend();
    await resend.emails.send({
      from: "Truzot <hello@truzot.com>",
      to: email,
      subject: "Confirm your Truzot Account",
      html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a; line-height: 1.6;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 16px;">Welcome to Truzot.</h1><p style="color: #6b6560; font-size: 16px; margin: 0 0 32px;">Thank you for signing up! Please click the button below to confirm your email and activate your account.</p><a href="${actionLink}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Confirm My Account →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you did not sign up for this account, you can safely ignore this email. — The Truzot team</p></div>`,
    });
    return addCors(
      NextResponse.json({ success: true, message: "Confirmation email sent!" }),
      origin,
    );
  } catch (err) {
    log.error({ err }, "Custom signup API error");
    return addCors(
      NextResponse.json({ error: "Internal server error" }, { status: 500 }),
      origin,
    );
  }
});
