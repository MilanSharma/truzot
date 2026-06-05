import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("cleanup");

/**
 * 30-day automatic data cleanup cron job.
 *
 * Privacy Policy compliance: deletes all user-uploaded images,
 * AI-generated headshots, training data, and order metadata for
 * orders older than 30 days.
 *
 * Schedule: Run daily via Vercel Cron or external scheduler.
 * Security: Protected by CRON_SECRET header.
 */
export const GET = withContext(async (req: Request) => {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Find all orders older than 30 days
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id")
      .lt("created_at", thirtyDaysAgo);

    if (fetchError) {
      log.error({ err: fetchError }, "Failed to fetch expired orders");
      return NextResponse.json(
        { error: "Failed to fetch expired orders" },
        { status: 500 },
      );
    }

    if (!expiredOrders || expiredOrders.length === 0) {
      return NextResponse.json({
        message: "No expired orders to clean up",
        deleted: 0,
      });
    }

    const results = { deleted: 0, errors: [] as string[] };

    for (const order of expiredOrders) {
      try {
        // 1. Delete headshot records
        await supabaseAdmin.from("headshots").delete().eq("order_id", order.id);

        // 2. Delete training records
        await supabaseAdmin.from("trainings").delete().eq("order_id", order.id);

        // 3. Delete uploaded files from storage (user's upload directory)
        if (order.user_id) {
          const { data: uploadFiles } = await supabaseAdmin.storage
            .from("uploads")
            .list(order.user_id);

          if (uploadFiles && uploadFiles.length > 0) {
            const filePaths = uploadFiles.map(
              (f) => `${order.user_id}/${f.name}`,
            );
            await supabaseAdmin.storage.from("uploads").remove(filePaths);
          }
        }

        // 4. Delete the order record itself
        await supabaseAdmin.from("orders").delete().eq("id", order.id);

        results.deleted++;
      } catch (orderErr: any) {
        const msg = `Failed to clean order ${order.id}: ${orderErr?.message || orderErr}`;
        log.error({ msg }, "Cleanup order failed");
        results.errors.push(msg);
      }
    }

    log.info(
      { deleted: results.deleted, errors: results.errors.length },
      "Cleanup complete",
    );

    return NextResponse.json({
      message: "Cleanup complete",
      deleted: results.deleted,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (err) {
    log.error({ err }, "Unexpected cleanup error");
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
});
