import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { addCors, handleOptions } from "@/lib/cors";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("orders-delete");

export const OPTIONS = handleOptions;

export const DELETE = withContext(async (req: Request) => {
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

    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("id");
    if (!orderId)
      return addCors(
        NextResponse.json({ error: "Missing order id" }, { status: 400 }),
        origin,
      );

    const { data: order } = await supabase
      .from("orders")
      .select("id, user_id, preferences")
      .eq("id", orderId)
      .single();

    if (!order)
      return addCors(
        NextResponse.json({ error: "Order not found" }, { status: 404 }),
        origin,
      );
    if (order.user_id !== user.id)
      return addCors(
        NextResponse.json({ error: "Forbidden" }, { status: 403 }),
        origin,
      );

    const prefs = (order.preferences as Record<string, any>) || {};
    const storagePath = prefs.storagePath as string | undefined;

    if (storagePath) {
      try {
        await supabaseAdmin.storage.from("uploads").remove([storagePath]);
      } catch (e) {
        log.warn({ err: e, orderId }, "Failed to delete storage file");
      }
    }

    const { error: deleteError } = await supabaseAdmin
      .from("orders")
      .delete()
      .eq("id", orderId);

    if (deleteError)
      return addCors(
        NextResponse.json({ error: "Failed to delete order" }, { status: 500 }),
        origin,
      );

    return addCors(NextResponse.json({ success: true }), origin);
  } catch (err) {
    log.error({ err }, "Order delete failed");
    return addCors(
      NextResponse.json({ error: "Failed to delete order" }, { status: 500 }),
      origin,
    );
  }
});
