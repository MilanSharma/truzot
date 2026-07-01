import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendPasswordResetEmail } from "@/lib/email";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("reset-password");

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const body = await req.json();
 const { email } = body as { email?: string };

 if (!email || typeof email !== "string") {
 return addCors(
 NextResponse.json(
 { error: "Valid email is required" },
 { status: 400 },
 ),
 origin,
 );
 }

 const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

 const { data, error } = await supabaseAdmin.auth.admin.generateLink({
 type: "recovery",
 email,
 options: { redirectTo: `${siteUrl}/reset-password` },
 });

 if (error || !data?.properties?.action_link) {
 log.warn({ err: error, email }, "Failed to generate recovery link");
 // Always return success to prevent user enumeration
 return addCors(
 NextResponse.json({
 success: true,
 message: "If an account exists with this email, a password reset link will be sent.",
 }),
 origin,
 );
 }

 const actionLink = data.properties.action_link;

 await sendPasswordResetEmail(email, actionLink);

 return addCors(
 NextResponse.json({
 success: true,
 message: "Password reset email sent.",
 }),
 origin,
 );
 } catch (err: any) {
 log.error({ err }, "Custom reset password API error");
 return addCors(
 NextResponse.json(
 { error: err.message || "Internal server error" },
 { status: 500 },
 ),
 origin,
 );
 }
});
