import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("export");

export const OPTIONS = handleOptions;

export const GET = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return addCors(
        NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
        origin,
      );

    const [ordersRes, profileRes] = await Promise.all([
      supabase
        .from("orders")
        .select(
          "id, plan, status, amount_cents, created_at, shoot_name, preferences",
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("headshots")
        .select("id, image_url, style, order_id, created_at")
        .in(
          "order_id",
          (
            await supabase.from("orders").select("id").eq("user_id", user.id)
          ).data?.map((o) => o.id) || [],
        ),
    ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at,
      },
      orders: ordersRes.data || [],
      headshots: profileRes.data || [],
    };

    return addCors(
      new NextResponse(JSON.stringify(exportData, null, 2), {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="truzot-export-${user.id.slice(0, 8)}.json"`,
        },
      }),
      origin,
    );
  } catch (err) {
    log.error({ err }, "Export failed");
    return addCors(
      NextResponse.json({ error: "Export failed" }, { status: 500 }),
      origin,
    );
  }
});
