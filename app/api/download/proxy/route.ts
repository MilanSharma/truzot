import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { isAllowedDomain } from "@/lib/url-utils";
import { createHmac } from "crypto";

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
 const orderId = searchParams.get("orderId");
 const emailToken = searchParams.get("email_token");

 if (!url)
 return NextResponse.json({ error: "Missing url param" }, { status: 400 });

 if (!isAllowedDomain(url)) {
 return NextResponse.json({ error: "Forbidden domain" }, { status: 403 });
 }

 let isAuthorized = false;

 // 1. Verify via standard user token or download token
 const authHeader = req.headers.get("Authorization") ?? "";
 const bearerToken = authHeader.replace("Bearer ", "").trim();
 let userId: string | null = null;
 
 if (bearerToken) {
   const { data: { user } } = await supabaseAdmin.auth.getUser(bearerToken);
   userId = user?.id ?? null;
 }
 if (!userId) userId = await resolveUserIdFromDownloadToken(req);

 if (userId) {
   const { data: headshot } = await supabaseAdmin.from("headshots").select("order_id").eq("image_url", url).maybeSingle();
   if (headshot) {
     const { data: order } = await supabaseAdmin.from("orders").select("user_id").eq("id", headshot.order_id).single();
     if (order?.user_id && order.user_id === userId) isAuthorized = true;
   }
 }

 // 2. Verify via HMAC email_token (guest access)
 if (!isAuthorized && emailToken && orderId) {
   const expected = createHmac("sha256", process.env.CRON_SECRET!).update(orderId).digest("hex").substring(0, 32);
   if (emailToken === expected) {
     const { data: headshot } = await supabaseAdmin.from("headshots").select("id").eq("order_id", orderId).eq("image_url", url).maybeSingle();
     if (headshot) isAuthorized = true;
   }
 }

 if (!isAuthorized) {
   return NextResponse.json({ error: "Forbidden" }, { status: 403 });
 }

 try {
 // Generate a signed URL from Supabase and redirect to avoid 4MB Vercel payload limit
 // Extract the path from the Supabase URL
 const urlObj = new URL(url);
 const pathParts = urlObj.pathname.split('/');
 
 // Supabase URLs are typically: https://[project].supabase.co/storage/v1/object/[bucket]/[path]
 // We need to extract bucket and path
 if (pathParts.includes('object')) {
   const objectIndex = pathParts.indexOf('object');
   if (objectIndex >= 0 && objectIndex + 2 < pathParts.length) {
     // Public-bucket URLs insert a literal "public" segment between /object/
     // and the bucket name (/object/public/headshots/...) — skip it so we
     // sign against the real bucket instead of a bucket named "public".
     const shift = pathParts[objectIndex + 1] === 'public' ? 1 : 0;
     const bucket = pathParts[objectIndex + 1 + shift];
     const filePath = pathParts.slice(objectIndex + 2 + shift).join('/');
     
     const { data } = await supabaseAdmin.storage
       .from(bucket)
       .createSignedUrl(filePath, 3600);
     
     if (data?.signedUrl) {
       return NextResponse.redirect(data.signedUrl);
     }
   }
 }
 
 // Fallback: if we can't extract Supabase path, try streaming with size check
 const response = await fetch(url);
 const contentLength = response.headers.get('content-length');
 
 // If file is larger than 3MB (safe margin below 4MB limit), redirect
 if (contentLength && parseInt(contentLength) > 3 * 1024 * 1024) {
   return NextResponse.redirect(url);
 }
 
 // For smaller files, stream the response
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
