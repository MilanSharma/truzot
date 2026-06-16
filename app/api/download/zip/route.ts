import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import JSZip from "jszip";
import { withContext } from "@/lib/request-context";

export const POST = withContext(async (req: Request) => {
  try {
    const { imageUrls, orderId } = await req.json();
    if (!Array.isArray(imageUrls) || imageUrls.length === 0 || !orderId) {
      return NextResponse.json(
        { error: "Missing imageUrls or orderId" },
        { status: 400 },
      );
    }

    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId: string | null = null;
    if (authHeader) {
      const supabase = getAuthenticatedClient(authHeader);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();

    if (!order || (order.user_id && order.user_id !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const zip = new JSZip();
    const CONCURRENCY = 5;

    // Fetch images in batches to avoid overwhelming the server
    for (let i = 0; i < imageUrls.length; i += CONCURRENCY) {
      const batch = imageUrls.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (url: string, idx: number) => {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const buf = await res.arrayBuffer();
              zip.file(`headshot_${i + idx + 1}.jpg`, buf);
            }
          } catch (e) {
            console.error("Failed to fetch image for ZIP", url);
          }
        }),
      );
    }

    const zipBuffer = await zip.generateAsync({ type: "arraybuffer" });

    return new NextResponse(Buffer.from(zipBuffer), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="truzot-headshots-${orderId}.zip"`,
      },
    });
  } catch (err) {
    console.error("ZIP generation failed", err);
    return NextResponse.json(
      { error: "ZIP generation failed" },
      { status: 500 },
    );
  }
});
