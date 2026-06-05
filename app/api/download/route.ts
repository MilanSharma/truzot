import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import JSZip from "jszip";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("download");

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

async function authenticateUser(req: Request): Promise<{
  userId: string | null;
  supabase: ReturnType<typeof getAuthenticatedClient>;
}> {
  const authHeader = req.headers.get("Authorization") ?? "";
  let accessToken = authHeader.replace("Bearer ", "").trim();
  if (!accessToken) {
    const { searchParams } = new URL(req.url);
    accessToken = searchParams.get("token") ?? "";
  }
  if (!accessToken)
    return { userId: null, supabase: getAuthenticatedClient("") };
  const supabase = getAuthenticatedClient(accessToken);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { userId: user?.id ?? null, supabase };
}

async function resolveUserIdFromDownloadToken(
  req: Request,
): Promise<string | null> {
  const { searchParams } = new URL(req.url);
  const downloadToken = searchParams.get("download_token");
  if (!downloadToken) return null;

  const { data: tokenRow } = await supabaseAdmin
    .from("download_tokens")
    .select("user_id, expires_at")
    .eq("id", downloadToken)
    .maybeSingle();
  if (!tokenRow) return null;
  if (new Date(tokenRow.expires_at) < new Date()) return null;

  return tokenRow.user_id;
}

export const OPTIONS = handleOptions;

export const GET = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    const imageUrl = searchParams.get("imageUrl");
    if (!orderId && !imageUrl)
      return addCors(
        NextResponse.json({ error: "Missing parameters" }, { status: 400 }),
        origin,
      );

    let userId = (await authenticateUser(req)).userId;
    if (!userId) userId = await resolveUserIdFromDownloadToken(req);

    if (imageUrl) {
      if (!isAllowedDomain(imageUrl)) {
        return addCors(
          NextResponse.json({ error: "Forbidden domain" }, { status: 403 }),
          origin,
        );
      }
      const { data: headshot } = await supabaseAdmin
        .from("headshots")
        .select("order_id")
        .eq("image_url", imageUrl)
        .maybeSingle();
      if (headshot) {
        const { data: order } = await supabaseAdmin
          .from("orders")
          .select("user_id")
          .eq("id", headshot.order_id)
          .single();
        if (order && order.user_id) {
          if (!userId || userId !== order.user_id) {
            return addCors(
              NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
              origin,
            );
          }
        }
      }
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      return new NextResponse(blob, {
        headers: {
          "Content-Type": blob.type,
          "Content-Disposition": 'attachment; filename="headshot.jpg"',
        },
      });
    }

    if (orderId) {
      const { data: order } = await supabaseAdmin
        .from("orders")
        .select("user_id")
        .eq("id", orderId)
        .single();
      if (!order)
        return addCors(
          NextResponse.json({ error: "Order not found" }, { status: 404 }),
          origin,
        );
      if (order.user_id) {
        if (!userId || userId !== order.user_id) {
          return addCors(
            NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
            origin,
          );
        }
      }
      const { data: headshots } = await supabaseAdmin
        .from("headshots")
        .select("image_url")
        .eq("order_id", orderId);
      if (!headshots || headshots.length === 0)
        return addCors(
          NextResponse.json({ error: "No headshots found" }, { status: 404 }),
          origin,
        );

      const zip = new JSZip();
      const results = await Promise.all(
        headshots.map(async (h, idx) => {
          const res = await fetch(h.image_url);
          const buf = await res.arrayBuffer();
          return { idx, buf };
        }),
      );
      for (const { idx, buf } of results)
        zip.file(`headshot_${idx + 1}.jpg`, buf);
      const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

      return new NextResponse(zipBuffer, {
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="truzot-headshots-${orderId}.zip"`,
        },
      });
    }
    return addCors(
      NextResponse.json({ error: "Missing parameters" }, { status: 400 }),
      origin,
    );
  } catch (err) {
    log.error({ err }, "Download failed");
    return addCors(
      NextResponse.json({ error: "Download failed" }, { status: 500 }),
      origin,
    );
  }
});

export const POST = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const { imageUrls, orderId } = await req.json();

    if (!Array.isArray(imageUrls) || imageUrls.length === 0 || !orderId) {
      return addCors(
        NextResponse.json(
          { error: "Missing imageUrls array or orderId" },
          { status: 400 },
        ),
        origin,
      );
    }
    if (imageUrls.length > 100) {
      return addCors(
        NextResponse.json(
          { error: "Too many images in selection (max 100)" },
          { status: 400 },
        ),
        origin,
      );
    }

    let userId = (await authenticateUser(req)).userId;
    if (!userId) userId = await resolveUserIdFromDownloadToken(req);
    if (!userId) {
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!order)
      return addCors(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        origin,
      );
    if (order.user_id && order.user_id !== userId) {
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 403 }),
        origin,
      );
    }

    const { data: validHeadshots } = await supabaseAdmin
      .from("headshots")
      .select("image_url")
      .eq("order_id", orderId)
      .in("image_url", imageUrls);

    const validUrls = new Set((validHeadshots ?? []).map((h) => h.image_url));
    const safeUrls = imageUrls.filter(
      (url) => validUrls.has(url) && isAllowedDomain(url),
    );

    if (safeUrls.length === 0) {
      return addCors(
        NextResponse.json(
          { error: "No valid images found for this selection" },
          { status: 404 },
        ),
        origin,
      );
    }

    const zip = new JSZip();
    const results = await Promise.all(
      safeUrls.map(async (url, idx) => {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        return { idx, buf };
      }),
    );

    for (const { idx, buf } of results) {
      zip.file(`headshot_${idx + 1}.jpg`, buf);
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(zipBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="truzot-selected-${safeUrls.length}.zip"`,
      },
    });
  } catch (err) {
    log.error({ err }, "Download selected failed");
    return addCors(
      NextResponse.json({ error: "Download failed" }, { status: 500 }),
      origin,
    );
  }
});
