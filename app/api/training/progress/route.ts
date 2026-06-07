import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { addCors } from "@/lib/cors";
import { fal } from "@/lib/ai/fal-client-module";

const log = createLogger("training-progress");

export const GET = withContext(async (req: Request) => {
  const origin = req.headers.get("origin");
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("orderId");
    if (!orderId)
      return addCors(
        NextResponse.json({ error: "Missing orderId" }, { status: 400 }),
        origin,
      );

    const { data: training, error } = await supabaseAdmin
      .from("trainings")
      .select("*")
      .eq("order_id", orderId)
      .maybeSingle();

    if (error)
      return addCors(
        NextResponse.json({ error: "Database error" }, { status: 500 }),
        origin,
      );
    if (!training) return addCors(NextResponse.json({ progress: 0 }), origin);

    if (training.status === "generating" || training.status === "completed") {
      return addCors(NextResponse.json({ progress: 100 }), origin);
    }
    if (training.status === "failed") {
      return addCors(
        NextResponse.json({ progress: 0, status: "failed" }),
        origin,
      );
    }
    if (training.status !== "training") {
      return addCors(NextResponse.json({ progress: 0 }), origin);
    }

    if (training.request_id) {
      try {
        const status = await fal.queue.status(
          "fal-ai/flux-lora-fast-training",
          {
            requestId: training.request_id,
            logs: true,
          },
        );

        if (status.status === "COMPLETED")
          return addCors(NextResponse.json({ progress: 100 }), origin);

        if (status.status === "IN_QUEUE") {
          const queuePosition =
            "queue_position" in status ? (status as any).queue_position : 0;
          return addCors(
            NextResponse.json({
              progress: Math.max(1, 10 - queuePosition * 2),
              status: "in_queue",
              queuePosition,
            }),
            origin,
          );
        }

        if (status.status === "IN_PROGRESS") {
          const logs = (status as any).logs || [];
          for (const entry of logs) {
            const msg =
              typeof entry === "string" ? entry : entry?.message || "";
            const stepMatch = msg.match(/Step\s*(\d+)\s*[\/|of]\s*(\d+)/i);
            if (stepMatch) {
              const step = parseInt(stepMatch[1]);
              const total = parseInt(stepMatch[2]);
              return addCors(
                NextResponse.json({
                  progress: Math.round((step / total) * 100),
                  status: "in_progress",
                  step,
                  total,
                }),
                origin,
              );
            }
          }
          return addCors(
            NextResponse.json({ progress: 50, status: "in_progress" }),
            origin,
          );
        }
      } catch (err) {
        log.warn({ err, orderId }, "FAL queue status check failed");
      }
    }

    return addCors(NextResponse.json({ progress: 0 }), origin);
  } catch (err) {
    log.error({ err }, "Training progress error");
    return addCors(
      NextResponse.json({ error: "Internal error" }, { status: 500 }),
      origin,
    );
  }
});
