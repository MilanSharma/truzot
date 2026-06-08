import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("team-members");

export const GET = withContext(async (req: Request) => {
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

    const { data: members, error: listError } = await supabaseAdmin
      .from("team_members")
      .select(
        "id, member_email, member_user_id, role, status, joined_at, created_at",
      )
      .eq("team_owner_id", user.id)
      .order("created_at", { ascending: false });

    if (listError) {
      log.error({ err: listError }, "Failed to list members");
      return NextResponse.json(
        { error: "Failed to list members" },
        { status: 500 },
      );
    }

    return NextResponse.json(members || []);
  } catch (err) {
    log.error({ err }, "Members error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
