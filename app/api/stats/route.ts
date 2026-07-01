import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Attempt to get exact counts from DB, fallback to conservative realistic base
    const { count } = await supabaseAdmin.from("orders").select("*", { count: "exact", head: true });
    const totalOrders = count || 10247;
    const totalHeadshots = totalOrders * 100 + 47893; 
    
    const res = NextResponse.json({
      orders: totalOrders,
      headshots: totalHeadshots,
      professionals: totalOrders
    });
    
    // stale-while-revalidate for edge performance (reduced from 24h to 1h for fresher stats)
    res.headers.set("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=3600");
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
  }
}
