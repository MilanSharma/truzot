import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminUser } from "@/lib/admin";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("admin-flags");

export const OPTIONS = handleOptions;

export const GET = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!authHeader)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 const {
 data: { user },
 error: authError,
 } = await supabaseAdmin.auth.getUser(authHeader);
 if (authError || !user)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 if (!(await isAdminUser(user.id)))
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );

 const { data: flags } = await supabaseAdmin
 .from("headshot_flags")
 .select("*, orders!inner(email, plan, shoot_name)")
 .order("created_at", { ascending: false })
 .limit(100);

 return addCors(NextResponse.json({ flags: flags || [] }), origin);
 } catch (err) {
 log.error({ err }, "Failed to fetch flags");
 return addCors(
 NextResponse.json({ error: "Failed to fetch flags" }, { status: 500 }),
 origin,
 );
 }
});

export const DELETE = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
 if (!authHeader)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 const {
 data: { user },
 error: authError,
 } = await supabaseAdmin.auth.getUser(authHeader);
 if (authError || !user)
 return addCors(
 NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
 origin,
 );
 if (!(await isAdminUser(user.id)))
 return addCors(
 NextResponse.json({ error: "Forbidden" }, { status: 403 }),
 origin,
 );

 const { id } = await req.json();
 if (!id)
 return addCors(
 NextResponse.json({ error: "Missing flag id" }, { status: 400 }),
 origin,
 );

 await supabaseAdmin.from("headshot_flags").delete().eq("id", id);
 return addCors(NextResponse.json({ success: true }), origin);
 } catch (err) {
 log.error({ err }, "Failed to resolve flag");
 return addCors(
 NextResponse.json({ error: "Failed to resolve flag" }, { status: 500 }),
 origin,
 );
 }
});
