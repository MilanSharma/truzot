import { supabaseAdmin } from "@/lib/supabase/admin";

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}
