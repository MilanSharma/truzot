import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
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

    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    // Verify the email matches the authenticated user
    if (user.email?.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Email does not match your account" },
        { status: 403 },
      );
    }

    // Update the pending invite to accepted
    const { data: member, error: findError } = await supabaseAdmin
      .from("team_members")
      .select("id, team_owner_id")
      .eq("member_email", email.toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (findError || !member) {
      return NextResponse.json(
        { error: "No pending invite found for this email" },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("team_members")
      .update({
        status: "accepted",
        member_user_id: user.id,
        joined_at: new Date().toISOString(),
      })
      .eq("id", member.id);

    if (updateError)
      return NextResponse.json(
        { error: "Failed to accept invite" },
        { status: 500 },
      );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
