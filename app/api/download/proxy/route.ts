import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("download-proxy");

function isAllowedDomain(urlString: string): boolean {
  try {
    const parsedUrl = new URL(urlString);
    const hostname = parsedUrl.hostname.toLowerCase();
    const isFalMedia =
      hostname === "fal.media" || hostname.endsWith(".fal.media");
    let isSupabase = false;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      try {
        const supabaseUrl = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL);
        isSupabase =
          hostname === supabaseUrl.hostname ||
          hostname.endsWith("." + supabaseUrl.hostname);
      } catch {
        isSupabase =
          hostname.endsWith(".supabase.co") || hostname === "supabase.co";
      }
    } else {
      isSupabase =
        hostname.endsWith(".supabase.co") || hostname === "supabase.co";
    }
    return isFalMedia || isSupabase;
  } catch {
    return false;
  }
}

async function resolveUserIdFromDownloadToken(
  req: Request,
): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const downloadToken = searchParams.get("download_token");
  if (!downloadToken) return null;

  // Atomic check-and-set: only claim the token if it's still unused and not expired
  const { data: tokenRow } = await supabaseAdmin
    .from("download_tokens")
    .update({ used: true })
    .eq("id", downloadToken)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .select("user_id")
    .single();

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

  if (userId) {
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
    }
  }

  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": blob.type || "image/jpeg",
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
