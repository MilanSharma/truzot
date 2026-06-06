import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("feedback");

export const POST = withContext(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(authHeader);
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { orderId, imageUrl, reason, notes } = await req.json();
    if (!orderId || !imageUrl)
      return NextResponse.json(
        { error: "Missing orderId or imageUrl" },
        { status: 400 },
      );

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!order)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.user_id !== user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { error: insertError } = await supabaseAdmin
      .from("headshot_flags")
      .insert({
        order_id: orderId,
        image_url: imageUrl,
        user_id: user.id,
        reason: reason || "regenerate",
        notes: notes || null,
      });

    if (insertError) {
      log.error({ err: insertError }, "Failed to flag headshot");
      return NextResponse.json(
        { error: "Failed to flag headshot" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Feedback error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
