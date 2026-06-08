import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("team-join");

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

    const { data: invite, error: findError } = await supabaseAdmin
      .from("team_members")
      .select("id, team_owner_id, status")
      .eq("member_email", memberEmail.toLowerCase())
      .eq("status", "pending")
      .maybeSingle();

    if (findError || !invite) {
      return NextResponse.json(
        { error: "No pending invite found" },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("team_members")
      .update({
        member_user_id: user.id,
        status: "accepted",
        joined_at: new Date().toISOString(),
      })
      .eq("id", invite.id);

    if (updateError) {
      log.error({ err: updateError }, "Failed to accept invite");
      return NextResponse.json(
        { error: "Failed to join team" },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: "Joined team successfully" });
  } catch (err) {
    log.error({ err }, "Join error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
