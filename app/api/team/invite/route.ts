import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("team-invite");

export const POST = withContext(async (req: Request) => {
 try {
 const token = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!token) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }
 const {
 data: { user },
 error: authError,
 } = await supabaseAdmin.auth.getUser(token);
 if (authError || !user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 const { email: memberEmail } = await req.json();
 if (!memberEmail || typeof memberEmail !== "string") {
 return NextResponse.json({ error: "Email is required" }, { status: 400 });
 }

 const { data: existing } = await supabaseAdmin
 .from("team_members")
 .select("id, status")
 .eq("team_owner_id", user.id)
 .eq("member_email", memberEmail.toLowerCase())
 .maybeSingle();

 if (existing) {
 if (existing.status === "accepted") {
 return NextResponse.json(
 { error: "Already a team member" },
 { status: 409 },
 );
 }
 return NextResponse.json({ message: "Invite already sent" });
 }

 const { error: insertError } = await supabaseAdmin
 .from("team_members")
 .insert({
 team_owner_id: user.id,
 member_email: memberEmail.toLowerCase(),
 role: "member",
 status: "pending",
 });

 if (insertError) {
 log.error({ err: insertError }, "Failed to create invite");
 return NextResponse.json(
 { error: "Failed to send invite" },
 { status: 500 },
 );
 }

 try {
 const resend = new Resend(process.env.RESEND_API_KEY);
 const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
 await resend.emails.send({
 from: "Truzot <hello@truzot.com>",
 to: memberEmail,
 subject: "You've been invited to a Truzot team",
 html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Team invitation</h1><p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">You've been invited to join a team on Truzot. Click below to accept.</p><a href="${siteUrl}/team/join?email=${encodeURIComponent(memberEmail)}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Accept Invitation →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you weren't expecting this invitation, you can ignore this email. — The Truzot team</p></div>`,
 });
 } catch (emailErr) {
 log.warn({ err: emailErr }, "Failed to send invite email");
 }

 return NextResponse.json({ message: "Invite sent" });
 } catch (err) {
 log.error({ err }, "Invite error");
 return NextResponse.json({ error: "Internal error" }, { status: 500 });
 }
});
