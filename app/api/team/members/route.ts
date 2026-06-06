import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withContext } from "@/lib/request-context";

export const GET = withContext(async (req: Request) => {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: members } = await supabaseAdmin
    .from("team_members")
    .select("*")
    .eq("team_owner_id", user.id);
  return NextResponse.json(members || []);
});
