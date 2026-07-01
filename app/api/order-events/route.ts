import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  if (!orderId) return new NextResponse("Missing orderId", { status: 400 });

  const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!authHeader) return new NextResponse("Unauthorized", { status: 401 });

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader);
  if (authError || !user) return new NextResponse("Unauthorized", { status: 401 });

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("user_id")
    .eq("id", orderId)
    .single();

  if (!order || order.user_id !== user.id) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection heartbeat
      controller.enqueue(`data: ${JSON.stringify({ type: "connected" })}\n\n`);
      
      const channel = supabaseAdmin.channel(`server-order-${orderId}`)
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` }, (payload) => {
          controller.enqueue(`data: ${JSON.stringify({ status: payload.new.status })}\n\n`);
        })
        .subscribe();

      req.signal.addEventListener("abort", () => {
        supabaseAdmin.removeChannel(channel);
        controller.close();
      });
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
