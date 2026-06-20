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
    const { email, password, name } = parsed.data!;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name || "" },
    });
    if (error) {
      return addCors(
        NextResponse.json(
          { error: error?.message ?? "Signup failed" },
          { status: 400 },
        ),
        origin,
      );
    }
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
