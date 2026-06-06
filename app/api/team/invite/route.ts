import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Resend } from "resend";
import { withContext } from "@/lib/request-context";

export const POST = withContext(async (req: Request) => {
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(token);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { email, role = "member" } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Check if user is admin of a team (simplified: create a team on first invite)
    // For MVP, we'll store team members in a new table "team_members"
    const { error: insertError } = await supabaseAdmin
      .from("team_members")
      .insert({
        team_owner_id: user.id,
        member_email: email,
        role,
        status: "pending",
      });
    if (insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 });

    // Send invite email via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Truzot <hello@truzot.com>",
      to: email,
      subject: "You've been invited to join a Truzot team",
      html: `<p>You've been invited to join a Truzot team. <a href="${process.env.NEXT_PUBLIC_SITE_URL}/team/join?email=${email}">Click here to accept</a></p>`,
    });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
