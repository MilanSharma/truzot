import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("send-headshots");

export const POST = withContext(async (req: Request) => {
  try {
    const { orderId, email, imageUrls } = await req.json();
    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Missing orderId or email" },
        { status: 400 },
      );
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id, email")
      .eq("id", orderId)
      .single();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    let userId = null;
    if (authHeader) {
      const {
        data: { user },
      } = await supabaseAdmin.auth.getUser(authHeader);
      userId = user?.id || null;
    }

    if (order.user_id && order.user_id !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!order.user_id && order.email.toLowerCase() !== email.toLowerCase()) {
      return NextResponse.json(
        { error: "Forbidden: Email does not match order" },
        { status: 403 },
      );
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      // Generate a secure download token instead of heavy base64 attachments
      const tokenRes = await fetch(`${siteUrl}/api/download/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: req.headers.get("Authorization") || "",
        },
        body: JSON.stringify({ orderId }),
      });
      const { token: downloadToken } = await tokenRes.json().catch(() => ({}));
      const downloadUrl = downloadToken
        ? `${siteUrl}/dashboard?order=${orderId}&download_token=${downloadToken}`
        : `${siteUrl}/dashboard?order=${orderId}`;

      await resend.emails.send({
        from: "Truzot <hello@truzot.com>",
        to: email,
        subject: "Your Truzot AI Headshots are Ready! 📸",
        html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Your headshots are here!</h1><p style="color: #6b6560; font-size: 16px; margin: 0 0 32px;">We've generated ${imageUrls.length} professional headshots for you. Click the button below to view and download them all securely.</p><a href="${downloadUrl}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">View & Download Headshots →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you have any questions, reply to this email. — The Truzot team</p></div>`,
      });
    } else {
      await resend.emails.send({
        from: "Truzot <hello@truzot.com>",
        to: email,
        subject: "Your Truzot AI Headshots",
        html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Your headshots are ready!</h1><p style="color: #6b6560; font-size: 16px; margin: 0 0 32px;">Your AI headshots have been generated. Click the button below to view and download them.</p><a href="${siteUrl}/dashboard?order=${orderId}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">View in Dashboard →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you have any questions, reply to this email. — The Truzot team</p></div>`,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    log.error({ err }, "Send headshots failed");
    return NextResponse.json(
      { error: "Failed to send headshots" },
      { status: 500 },
    );
  }
});
