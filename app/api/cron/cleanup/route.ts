import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";

const log = createLogger("cleanup");

/**
 * 30-day automatic data cleanup cron job.
 *
 * Privacy Policy compliance: deletes all user-uploaded images,
 * AI-generated headshots, training data, and order metadata for
 * orders older than 30 days.
 *
 * Also checks for stuck orders (generating > 4 hours) and
 * orders stuck in training > 2 hours, flagging them for review.
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

  const stuckResults = { flagged: 0, autoRefunded: 0 };

  // Check for stuck generating orders (> 4 hours)
  const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
  const { data: stuckGenerating } = await supabaseAdmin
    .from("orders")
    .select("id, stripe_payment_intent")
    .eq("status", "generating")
    .lt("created_at", fourHoursAgo);

  for (const order of stuckGenerating || []) {
    stuckResults.flagged++;
    if (order.stripe_payment_intent) {
      try {
        const stripe = getStripe();
        await stripe.refunds.create({
          payment_intent: order.stripe_payment_intent as string,
        });
        await supabaseAdmin
          .from("orders")
          .update({ status: "refunded" })
          .eq("id", order.id);
        stuckResults.autoRefunded++;
        log.info({ orderId: order.id }, "Auto-refunded stuck generating order");
      } catch (err) {
        log.error({ err, orderId: order.id }, "Failed to refund stuck order");
      }
    } else {
      await supabaseAdmin
        .from("orders")
        .update({ status: "failed" })
        .eq("id", order.id);
    }
  }

  // Abandoned checkout emails: orders pending > 1hr with no completed session
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: abandonedOrders } = await supabaseAdmin
    .from("orders")
    .select("id, user_id, plan")
    .eq("status", "pending")
    .lt("created_at", oneHourAgo)
    .limit(20);

  let abandonedNotified = 0;
  for (const order of abandonedOrders || []) {
    if (!order.user_id) continue;
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .eq("id", order.user_id)
      .single();
    if (!profile?.email) continue;
    // Skip if already unsubscribed
    const { data: prefs } = await supabaseAdmin
      .from("email_preferences")
      .select("unsubscribed")
      .eq("email", profile.email)
      .single();
    if (prefs?.unsubscribed) continue;
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(process.env.RESEND_API_KEY);
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
      await resend.emails.send({
        from: "Truzot <hello@truzot.com>",
        to: profile.email,
        subject: "You left something behind — your headshots are waiting",
        html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Finish your order</h1><p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">You started a <strong>${order.plan}</strong> order but didn't complete payment. Your photos are ready to go — just one step away.</p><a href="${siteUrl}/upload" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Complete your order →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you didn't start this order, just ignore this email. — The Truzot team</p></div>`,
      });
      abandonedNotified++;
    } catch (err) {
      log.error(
        { err, orderId: order.id },
        "Failed to send abandoned checkout email",
      );
    }
  }
  if (abandonedNotified > 0) {
    log.info({ count: abandonedNotified }, "Abandoned checkout emails sent");
  }

  // Check for stuck training orders (> 2 hours)
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data: stuckTraining } = await supabaseAdmin
    .from("orders")
    .select("id, stripe_payment_intent")
    .eq("status", "training")
    .lt("created_at", twoHoursAgo);

  for (const order of stuckTraining || []) {
    stuckResults.flagged++;
    await supabaseAdmin
      .from("orders")
      .update({ status: "failed" })
      .eq("id", order.id);
  }

  if (stuckResults.flagged > 0) {
    log.info(stuckResults, "Stuck order check complete");
    // Notify admin
    const adminEmail = (process.env.ADMIN_EMAILS || "").split(",")[0]?.trim();
    if (adminEmail) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "Truzot <hello@truzot.com>",
          to: adminEmail,
          subject: `⚠️ ${stuckResults.flagged} stuck order(s) flagged`,
          html: `<p>${stuckResults.flagged} stuck order(s) were flagged. ${stuckResults.autoRefunded} were auto-refunded.</p>`,
        });
      } catch (err) {
        log.error({ err }, "Failed to send stuck order admin notification");
      }
    }
  }

  try {
    const thirtyDaysAgo = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    // Find all orders older than 30 days
    const { data: expiredOrders, error: fetchError } = await supabaseAdmin
      .from("orders")
      .select("id, user_id, storage_path")
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

    let warningEmailsSent = 0;
    for (const order of expiredOrders) {
      try {
        // Send warning email before deletion
        if (order.user_id) {
          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("email")
            .eq("id", order.user_id)
            .single();
          if (profile?.email) {
            const { data: prefs } = await supabaseAdmin
              .from("email_preferences")
              .select("unsubscribed")
              .eq("email", profile.email)
              .single();
            if (!prefs?.unsubscribed) {
              try {
                const { Resend } = await import("resend");
                const resend = new Resend(process.env.RESEND_API_KEY);
                await resend.emails.send({
                  from: "Truzot <hello@truzot.com>",
                  to: profile.email,
                  subject: "Your Truzot headshots will be deleted in 24 hours",
                  html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Headshots expiring soon.</h1><p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">Your AI headshots were generated over 30 days ago. Per our privacy policy, we will permanently delete all your photos, headshots, and training data within 24 hours.</p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=${order.id}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Download before they're gone →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">After deletion, this cannot be undone. — The Truzot team</p></div>`,
                });
                warningEmailsSent++;
              } catch (err) {
                log.error({ err, orderId: order.id }, "Warning email failed");
              }
            }
          }
        }

        // 1. Delete headshot records
        await supabaseAdmin.from("headshots").delete().eq("order_id", order.id);

        // 2. Delete training records
        await supabaseAdmin.from("trainings").delete().eq("order_id", order.id);

        // 3. Delete uploaded files from storage
        const uploadFolder = order.storage_path
          ? order.storage_path.split("/")[0]
          : order.user_id;
        if (uploadFolder) {
          const { data: uploadFiles } = await supabaseAdmin.storage
            .from("uploads")
            .list(uploadFolder);

          if (uploadFiles && uploadFiles.length > 0) {
            const filePaths = uploadFiles.map(
              (f) => `${uploadFolder}/${f.name}`,
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
      stuckFlagged: stuckResults.flagged,
      stuckAutoRefunded: stuckResults.autoRefunded,
      abandonedNotified,
      errors: results.errors.length > 0 ? results.errors : undefined,
    });
  } catch (err) {
    log.error({ err }, "Unexpected cleanup error");
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
  }
});
