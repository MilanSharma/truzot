import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { withContext } from "@/lib/request-context";
import { createLogger } from "@/lib/logger";

const log = createLogger("team-brand-settings");

const VALID_STYLES = ["Corporate Executive", "LinkedIn Pro", "Creative Studio", "Outdoor Natural"];

async function authenticate(req: Request) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export const GET = withContext(async (req: Request) => {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("brand_style")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    log.error({ err: error }, "Failed to load brand style");
    return NextResponse.json({ error: "Failed to load brand settings" }, { status: 500 });
  }

  return NextResponse.json({ brandStyle: data?.brand_style || "Corporate Executive" });
});

export const POST = withContext(async (req: Request) => {
  const user = await authenticate(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { brandStyle } = await req.json() as { brandStyle?: string };
  if (!brandStyle || !VALID_STYLES.includes(brandStyle)) {
    return NextResponse.json({ error: "Invalid brand style" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ brand_style: brandStyle })
    .eq("id", user.id);

  if (error) {
    log.error({ err: error }, "Failed to save brand style");
    return NextResponse.json({ error: "Failed to save brand settings" }, { status: 500 });
  }

  return NextResponse.json({ message: "Saved" });
});
