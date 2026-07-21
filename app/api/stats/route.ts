import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { count: totalOrders } = await supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "completed");
    const { count: totalHeadshots } = await supabaseAdmin.from("headshots").select("*", { count: "exact", head: true });

    const res = NextResponse.json({
      orders: totalOrders ?? 0,
      headshots: totalHeadshots ?? 0,
      professionals: totalOrders ?? 0,
    });
    
    // stale-while-revalidate for edge performance (reduced from 24h to 1h for fresher stats)
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
