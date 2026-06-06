import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();
    if (
      !orderId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId,
      )
    ) {
      return NextResponse.json({ error: "Invalid order ID." }, { status: 400 });
    }

    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: { persistSession: false, autoRefreshToken: false },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: "Unable to verify identity." },
        { status: 401 },
      );
    }

    const { data: order, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("email, user_id")
      .eq("id", orderId)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    if (order.user_id) {
      return NextResponse.json(
        { error: "This order has already been claimed." },
        { status: 409 },
      );
    }

    if (order.email !== user.email) {
      return NextResponse.json(
        {
          error:
            "This order was placed with a different email address. Please use the email you used during checkout.",
        },
        { status: 403 },
      );
    }

    const { error: updateError } = await supabaseAdmin
      .from("orders")
      .update({ user_id: user.id })
      .eq("id", orderId)
      .is("user_id", null);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to claim order. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
