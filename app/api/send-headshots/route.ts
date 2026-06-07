import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("send-headshots");

export const POST = withContext(async (req: Request) => {
  try {
    const authHeader = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const {
      data: { user },
    } = await supabaseAdmin.auth.getUser(authHeader);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, email, imageUrls } = await req.json();
    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Missing orderId or email" },
        { status: 400 },
      );
    }

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id")
      .eq("id", orderId)
      .single();
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://truzot.com";
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (Array.isArray(imageUrls) && imageUrls.length > 0) {
      const attachments = await Promise.all(
        imageUrls.slice(0, 10).map(async (url: string, idx: number) => {
          const res = await fetch(url);
          const buf = await res.arrayBuffer();
          return {
            filename: `headshot_${idx + 1}.jpg`,
            content: Buffer.from(buf).toString("base64"),
          };
        }),
      );
      await resend.emails.send({
        from: "Truzot <hello@truzot.com>",
        to: email,
        subject: "Your Truzot AI Headshots",
        html: `<div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #0a0a0a;"><div style="padding: 40px 0 20px;"><h1 style="font-size: 28px; font-weight: 900; margin: 0 0 8px;">Your headshots are here!</h1><p style="color: #6b6560; font-size: 16px; margin: 0 0 32px;">Attached are your AI-generated professional headshots. You can also download them anytime from your dashboard.</p><a href="${siteUrl}/dashboard?order=${orderId}" style="background: #0a0a0a; color: #f5f0e8; padding: 14px 32px; border-radius: 2px; text-decoration: none; font-size: 15px; font-weight: 500; display: inline-block;">View in Dashboard →</a></div><hr style="border: none; border-top: 1px solid #e8e4dc; margin: 32px 0;" /><p style="color: #9b9590; font-size: 13px;">If you have any questions, reply to this email. — The Truzot team</p></div>`,
        attachments,
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
