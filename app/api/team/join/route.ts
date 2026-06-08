import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withContext } from "@/lib/request-context";

export const POST = withContext(async () => {
  return NextResponse.json({ error: "Not implemented" }, { status: 404 });
});
