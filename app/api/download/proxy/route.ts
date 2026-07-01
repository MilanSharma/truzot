import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { isAllowedDomain } from "@/lib/url-utils";

const log = createLogger("download-proxy");

async function resolveUserIdFromDownloadToken(
  req: Request,
): Promise<string | null> {
 const { searchParams } = new URL(req.url);
 const downloadToken = searchParams.get("download_token");
 if (!downloadToken) return null;

 // Allow multiple uses for shared links - only check if token is valid and not expired
 // Changed from marking as used to allow team members to access shared galleries
 const { data: tokenRow } = await supabaseAdmin
 .from("download_tokens")
 .select("user_id")
 .eq("id", downloadToken)
 .gt("expires_at", new Date().toISOString())
 .maybeSingle();

 if (!tokenRow) return null;
 return tokenRow.user_id;
}

export const GET = withContext(async (req: Request) => {
 const { searchParams } = new URL(req.url);
 const url = searchParams.get("url");
 if (!url)
 return NextResponse.json({ error: "Missing url param" }, { status: 400 });

 if (!isAllowedDomain(url)) {
 return NextResponse.json({ error: "Forbidden domain" }, { status: 403 });
 }

 // Resolve userId from (in order of preference): Authorization header, download_token, token param
 const authHeader = req.headers.get("Authorization") ?? "";
 const bearerToken = authHeader.replace("Bearer ", "").trim();
 let userId: string | null = null;
 if (bearerToken) {
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(bearerToken);
 userId = user?.id ?? null;
 }
 if (!userId) userId = await resolveUserIdFromDownloadToken(req);
 if (!userId) {
 const tokenParam = searchParams.get("token");
 if (tokenParam) {
 const {
 data: { user },
 } = await supabaseAdmin.auth.getUser(tokenParam);
 userId = user?.id ?? null;
 }
 }

 if (!userId) {
 return NextResponse.json(
 { error: "Authentication required" },
 { status: 401 },
 );
 }

 // Verify the requesting user actually owns this headshot
 const { data: headshot } = await supabaseAdmin
 .from("headshots")
 .select("order_id")
 .eq("image_url", url)
 .maybeSingle();
 if (headshot) {
 const { data: order } = await supabaseAdmin
 .from("orders")
 .select("user_id")
 .eq("id", headshot.order_id)
 .single();
 if (order?.user_id && order.user_id !== userId) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
 }
 } else {
 // URL doesn't match any known headshot — reject to prevent open proxy abuse
 return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 try {
 // Stream the response instead of buffering to avoid memory issues
 const response = await fetch(url);
 return new NextResponse(response.body, {
 headers: {
 "Content-Type": response.headers.get("Content-Type") || "image/jpeg",
 "Access-Control-Allow-Origin": "*",
 "Cache-Control": "public, max-age=86400",
 },
 });
 } catch (err) {
 log.error({ err, url }, "Failed to proxy image");
 return NextResponse.json(
 { error: "Failed to fetch image" },
 { status: 502 },
 );
 }
});
