import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("admin-orders");

export const GET = withContext(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(authHeader);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());

    if (!adminEmails.includes(user.email?.toLowerCase() || "")) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      log.error({ err: error }, "Failed to fetch orders");
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 },
      );
    }

    return NextResponse.json({ orders });
  } catch (err) {
    log.error({ err }, "Admin orders error");
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
});
