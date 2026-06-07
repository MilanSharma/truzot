import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { createLogger } from "@/lib/logger";

const log = createLogger("retry-generation");

export async function POST(req: Request) {
  try {
    const { orderId } = await req.json();
    if (!orderId)
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });

    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!token)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const supabase = getAuthenticatedClient(token);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: order } = await supabase
      .from("orders")
      .select("user_id, status, preferences")
      .eq("id", orderId)
      .single();
    if (!order || order.user_id !== user.id)
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status !== "failed")
      return NextResponse.json(
        { error: "Order is not in failed status" },
        { status: 400 },
      );

    const existingPrefs = (order.preferences as Record<string, any>) || {};
    await supabaseAdmin
      .from("orders")
      .update({
        status: "generating",
        preferences: { ...existingPrefs, generate_failures: 0 },
      })
      .eq("id", orderId);

    const cronSecret =
      process.env.CRON_SECRET ||
      (process.env.NODE_ENV === "development" ? "dev-secret" : null);
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

    if (cronSecret) {
      fetch(`${siteUrl}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-truzot-secret": cronSecret,
        },
        body: JSON.stringify({ orderId }),
      }).catch((err) => log.error({ err, orderId }, "Retry trigger failed"));
    }

    return NextResponse.json({ status: "retrying" });
  } catch (err) {
    log.error({ err }, "Retry generation failed");
    return NextResponse.json(
      { error: "Failed to retry generation" },
      { status: 500 },
    );
  }
}
