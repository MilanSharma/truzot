import { NextResponse } from "next/server";
import { getAuthenticatedClient } from "@/lib/supabase/authenticated";
import { PLAN_SHOTS } from "@/lib/plans";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

export const OPTIONS = handleOptions;

export const GET = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId)
    return addCors(
      NextResponse.json({ error: "Missing orderId" }, { status: 400 }),
      origin,
    );

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

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("status, plan, user_id")
    .eq("id", orderId)
    .single();

  if (orderError || !order)
    return addCors(
      NextResponse.json({ error: "Order not found" }, { status: 404 }),
      origin,
    );
  if (order.user_id !== user.id)
    return addCors(
      NextResponse.json({ error: "Forbidden" }, { status: 403 }),
      origin,
    );

  let headshots: {
    id: string;
    image_url: string;
    style: string;
    category: string;
  }[] = [];
  let count = 0;
  const target = PLAN_SHOTS[order.plan] ?? 40;

  if (order.status === "completed") {
    const { data: shots } = await supabase
      .from("headshots")
      .select("id, image_url, style, category")
      .eq("order_id", orderId)
      .order("created_at", { ascending: true });
    headshots = shots || [];
    count = headshots.length;
  } else if (order.status === "generating") {
    const { count: generatedCount } = await supabase
      .from("headshots")
      .select("id", { count: "exact", head: true })
      .eq("order_id", orderId);
    count = generatedCount ?? 0;
  }

  return addCors(
    NextResponse.json({ status: order.status, headshots, count, target }),
    origin,
  );
});
