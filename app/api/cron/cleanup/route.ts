import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";
import { getStripe } from "@/lib/stripe";
import { deleteFalFiles } from "@/lib/ai/fal-cleanup";

const log = createLogger("cleanup");

/**
 * 30-day automatic data cleanup cron job.
 *
 * Privacy Policy compliance: deletes all user-uploaded images,
 * AI-generated headshots, training data, and order metadata for
 * orders older than 30 days.
 *
 * Also checks for stuck orders (generating > 8 hours) and
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

 // Check for stuck generating orders (> 8 hours)
 const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
 const { data: stuckGenerating } = await supabaseAdmin
 .from("orders")
 .select("id, stripe_payment_intent, status")
 .eq("status", "generating")
 .lt("created_at", eightHoursAgo);

 for (const order of stuckGenerating || []) {
 // Check if training is still actively running
 const { data: activeTraining } = await supabaseAdmin
 .from("trainings")
 .select("status")
 .eq("order_id", order.id)
 .in("status", ["training", "generating"])
 .maybeSingle();
 if (activeTraining) {
 log.info(
 { orderId: order.id },
 "Skipping refund — training still active",
 );
 continue;
 }
 stuckResults.flagged++;
 if (order.stripe_payment_intent) {
          if (order.status === 'refunded') {
            log.warn({ orderId: order.id }, "Order already refunded, skipping");
            continue;
          }
          try {
            const stripe = getStripe();
            await stripe.refunds.create({
              payment_intent: order.stripe_payment_intent as string,
            }, {
              idempotencyKey: `auto-refund-${order.id}`
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
 .select("id, user_id, plan, created_at")
 .eq("status", "pending")
 .lt("created_at", oneHourAgo)
 .limit(20);

 let abandonedNotified = 0;
 for (const order of abandonedOrders || []) {
 if (!order.user_id) continue;
 const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
 order.user_id,
 );
 const userEmail = userData?.user?.email;
 if (!userEmail) continue;
 // Skip if already unsubscribed
 const { data: prefs } = await supabaseAdmin
 .from("email_preferences")
 .select("unsubscribed")
 .eq("email", userEmail)
 .single();

 // 🚀 BUG FIX: Skip if user has newer successful order
 const { data: newerOrders } = await supabaseAdmin
 .from("orders")
 .select("id, status")
 .or(`user_id.eq.${order.user_id},email.eq.${userEmail}`)
 .gt("created_at", order.created_at)
 .in("status", ["paid", "training", "generating", "completed"])
 .limit(1);
 if (newerOrders && newerOrders.length > 0) continue;

 if (prefs?.unsubscribed) continue;
 try {
 const { Resend } = await import("resend");
 const resend = new Resend(process.env.RESEND_API_KEY);
 const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";

 // 🔒 Add unsubscribe link
 const secret =
 process.env.UNSUBSCRIBE_SECRET ||
 process.env.CRON_SECRET ||
 "fallback-secret";
 const encoder = new TextEncoder();
 const data = encoder.encode(userEmail + secret);
 const hashBuffer = await crypto.subtle.digest("SHA-256", data);
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 const token = hashArray
 .map((b) => b.toString(16).padStart(2, "0"))
 .join("");
 const unsubscribeUrl = `${siteUrl}/unsubscribe?email=${encodeURIComponent(userEmail)}&token=${token}`;
 await resend.emails.send({
 from: "Truzot <hello@truzot.com>",
 to: userEmail,
 subject: "You left something behind — your headshots are waiting",
 html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Finish your order</h1><p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">You started a <strong>${order.plan}</strong> order but didn't complete payment. Your photos are ready to go — just one step away.</p><a href="${siteUrl}/upload" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Complete your order →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you didn't start this order, just ignore this email. — The Truzot team</p><p style="text-align: center; margin-top: 20px;"><a href="${unsubscribeUrl}" style="color: #9b9590; font-size: 12px; text-decoration: underline;">Unsubscribe</a></p></div>`,
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
 const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
 const { data: stuckTraining } = await supabaseAdmin
 .from("orders")
 .select("id, stripe_payment_intent, status")
 .eq("status", "training")
 .lt("created_at", fourHoursAgo);

 for (const order of stuckTraining || []) {
 stuckResults.flagged++;
 await supabaseAdmin
 .from("orders")
 .update({ status: "failed" })
 .eq("id", order.id);
 }

 // Anomaly detection: stale pending orders (> 24 hours)
 const twentyFourHoursAgo = new Date(
 Date.now() - 24 * 60 * 60 * 1000,
 ).toISOString();
 const { data: stalePending } = await supabaseAdmin
 .from("orders")
 .select("id, user_id, created_at")
 .eq("status", "pending")
 .lt("created_at", twentyFourHoursAgo)
 .limit(50);

 if (stalePending && stalePending.length > 0) {
 log.warn(
 { count: stalePending.length },
 "Stale pending orders detected (> 24 hours old)",
 );
 }

 // Anomaly detection: users with multiple pending orders (duplicate)
 const { data: pendingByUser } = await supabaseAdmin
 .from("orders")
 .select("user_id, id, created_at")
 .eq("status", "pending")
 .not("user_id", "is", null)
 .order("user_id", { ascending: true })
 .order("created_at", { ascending: false });

 if (pendingByUser && pendingByUser.length > 0) {
 const userCounts = new Map<
 string,
 { ids: string[]; createdAts: string[] }
 >();
 for (const o of pendingByUser) {
 const uid = o.user_id as string;
 if (!userCounts.has(uid)) {
 userCounts.set(uid, { ids: [], createdAts: [] });
 }
 userCounts.get(uid)!.ids.push(o.id);
 userCounts.get(uid)!.createdAts.push(o.created_at);
 }

 let duplicatesFlagged = 0;
 for (const [uid, data] of userCounts) {
 if (data.ids.length > 1) {
 log.warn(
 { userId: uid, count: data.ids.length },
 "User has multiple pending orders; marking older ones as failed",
 );
 // Keep most recent (first in desc-sorted array), fail the rest
 const toFail = data.ids.slice(1);
 for (const id of toFail) {
 await supabaseAdmin
 .from("orders")
 .update({ status: "failed" })
 .eq("id", id);
 duplicatesFlagged++;
 }
 }
 }

 if (duplicatesFlagged > 0) {
 log.info({ count: duplicatesFlagged }, "Duplicate pending orders failed");
 }
 }

 // Cleanup expired download tokens (older than 7 days)
 const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
 const { error: tokenDeleteError } = await supabaseAdmin
 .from("download_tokens")
 .delete()
 .lt("expires_at", sevenDaysAgo);

 if (tokenDeleteError) {
 log.error({ err: tokenDeleteError }, "Failed to cleanup expired download tokens");
 } else {
 log.info("Expired download tokens cleaned up");
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
 const now = Date.now();
 const twentyNineDaysAgo = new Date(
 now - 29 * 24 * 60 * 60 * 1000,
 ).toISOString();
 const thirtyDaysAgo = new Date(
 now - 30 * 24 * 60 * 60 * 1000,
 ).toISOString();

 // Phase 1: Send warning emails for orders between 29 and 30 days old
 const { data: warnOrders } = await supabaseAdmin
 .from("orders")
 .select("id, user_id, email, preferences")
 .lt("created_at", twentyNineDaysAgo)
 .gte("created_at", thirtyDaysAgo)
 .not("preferences->warning_sent", "eq", "true");

 let warningEmailsSent = 0;
 for (const order of warnOrders || []) {
 // Fallback to order email for guest checkouts
 let userEmail = order.email;
 if (order.user_id) {
 const { data: userData } = await supabaseAdmin.auth.admin.getUserById(
 order.user_id,
 );
 userEmail = userData?.user?.email || order.email;
 }
 if (!userEmail) continue;
 const { data: prefs } = await supabaseAdmin
 .from("email_preferences")
 .select("unsubscribed")
 .eq("email", userEmail)
 .single();
 if (prefs?.unsubscribed) continue;
 try {
 const { Resend } = await import("resend");
 const resend = new Resend(process.env.RESEND_API_KEY);
 await resend.emails.send({
 from: "Truzot <hello@truzot.com>",
 to: userEmail,
 subject: "Your Truzot headshots will be deleted in 24 hours",
 html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Headshots expiring soon.</h1><p style="color: #6b6560; font-size: 16px; line-height: 1.6; margin: 0 0 32px;">Your AI headshots were generated over 30 days ago. Per our privacy policy, we will permanently delete all your photos, headshots, and training data within 24 hours.</p><a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?order=${order.id}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">Download before they're gone →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">After deletion, this cannot be undone. — The Truzot team</p></div>`,
 });
 warningEmailsSent++;
 await supabaseAdmin.from("orders").update({ preferences: { ...(order.preferences as any), warning_sent: true } }).eq("id", order.id);
 } catch (err) {
 log.error({ err, orderId: order.id }, "Warning email failed");
 }
 }

 // Phase 2: Delete orders older than 30 days
 const { data: expiredOrders, error: fetchError } = await supabaseAdmin
 .from("orders")
 .select("id, user_id, email, preferences, discount_code")
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
 warningsSent: warningEmailsSent,
 });
 }

 const results = { deleted: 0, errors: [] as string[] };
 const BATCH_SIZE = 5;

 async function deleteOrder(
 order: NonNullable<typeof expiredOrders>[number],
 ) {
 // Delete Fal-hosted headshot images
 const { data: headshotUrls } = await supabaseAdmin
 .from("headshots")
 .select("image_url")
 .eq("order_id", order.id);
 const imageUrls: string[] = (headshotUrls || []).map(
 (h: any) => h.image_url,
 );
 const falResult = await deleteFalFiles(imageUrls);
 if (falResult.deleted > 0 || falResult.failed > 0) {
 log.info({ orderId: order.id, ...falResult }, "Fal file cleanup");
 }

 // Delete Fal training model
 const { data: trainings } = await supabaseAdmin
 .from("trainings")
 .select("model_id")
 .eq("order_id", order.id);
 const modelIds: string[] = (trainings || [])
 .map((t: any) => t.model_id)
 .filter(Boolean);
 if (modelIds.length > 0) {
 await deleteFalFiles(modelIds);
 }

 // Delete our persisted copies of the generated headshots (storage bucket
 // "headshots", one folder per order) — this is what actually fulfills the
 // "permanently deleted after 30 days" privacy promise now that images are
 // stored on our side rather than only on fal.media.
 try {
 const { data: persisted } = await supabaseAdmin.storage
 .from("headshots")
 .list(order.id, { limit: 1000 });
 if (persisted && persisted.length > 0) {
 await supabaseAdmin.storage
 .from("headshots")
 .remove(persisted.map((f) => `${order.id}/${f.name}`));
 }
 } catch (err) {
 log.error({ err, orderId: order.id }, "Failed to purge persisted headshots");
 }

 // Delete headshot records
 await supabaseAdmin.from("headshots").delete().eq("order_id", order.id);

 // Delete training records
 await supabaseAdmin.from("trainings").delete().eq("order_id", order.id);

 // Delete uploaded files from storage
 const prefs = (order.preferences as Record<string, any>) || {};
 const storagePath = prefs.storagePath as string | undefined;
 const uploadFolder = storagePath
 ? storagePath.split("/")[0]
 : order.user_id;
 if (uploadFolder) {
 const { data: uploadFiles } = await supabaseAdmin.storage
 .from("uploads")
 .list(uploadFolder);

 if (uploadFiles && uploadFiles.length > 0) {
 const filePaths = uploadFiles.map((f) => `${uploadFolder}/${f.name}`);
 await supabaseAdmin.storage.from("uploads").remove(filePaths);
 }
 }

 // Delete the order record itself
 // Release discount code back to the pool if it was used
 if (order.discount_code) {
 await supabaseAdmin
 .from("waitlist")
 .update({ used: false, used_at: null })
 .eq("discount_code", order.discount_code);
 }

 await supabaseAdmin.from("orders").delete().eq("id", order.id);
 }

 for (let i = 0; i < expiredOrders.length; i += BATCH_SIZE) {
 const batch = expiredOrders.slice(i, i + BATCH_SIZE);
 const outcomes = await Promise.allSettled(
 batch.map(async (order) => {
 try {
 await deleteOrder(order);
 results.deleted++;
 } catch (orderErr: any) {
 const msg = `Failed to clean order ${order.id}: ${orderErr?.message || orderErr}`;
 log.error({ msg }, "Cleanup order failed");
 results.errors.push(msg);
 }
 }),
 );
 outcomes.forEach((outcome, idx) => {
 if (outcome.status === "rejected") {
 const order = batch[idx];
 const msg = `Failed to clean order ${order.id}: ${outcome.reason}`;
 results.errors.push(msg);
 }
 });
 }

 log.info(
 { deleted: results.deleted, errors: results.errors.length },
 "Cleanup complete",
 );

 return NextResponse.json({
 message: "Cleanup complete",
 deleted: results.deleted,
 warningsSent: warningEmailsSent,
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
