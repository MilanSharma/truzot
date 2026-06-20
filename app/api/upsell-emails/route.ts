import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { orderId, email, plan } = await req.json();

    if (!orderId || !email) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Get order details
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("*, headshots(*)")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Determine upsell based on current plan
    let upsellContent = null;

    if (plan === "basic") {
      upsellContent = {
        subject: "🎨 Love your headshots? Get 3x more styles!",
        headline: "Upgrade to Pro & Unlock Creative Styles",
        body: "You've got great corporate headshots. Now imagine having casual, creative, and outdoor styles too!",
        cta: "Upgrade to Pro - 50% Off",
        benefits: [
          "3x more headshots (120 total)",
          "All 6 professional styles",
          "Priority rendering",
          "Commercial usage rights",
        ],
      };
    } else if (plan === "pro") {
      upsellContent = {
        subject: "👔 Ready for executive-level headshots?",
        headline: "Go Executive & Get the Ultimate Package",
        body: "You've got professional headshots. Now get the premium treatment with our Executive package.",
        cta: "Upgrade to Executive",
        benefits: [
          "200 premium headshots",
          "Custom style requests",
          "1-on-1 style consultation",
          "Lifetime updates",
          "VIP support",
        ],
      };
    }

    if (!upsellContent) {
      return NextResponse.json(
        { message: "No upsell available for this plan" },
        { status: 200 },
      );
    }

    // Send upsell email
    const { data, error: emailError } = await resend.emails.send({
      from: "Truzot <hello@truzot.com>",
      to: email,
      subject: upsellContent.subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${upsellContent.subject}</title>
          </head>
          <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f8fafc;">
            <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 48px 32px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">${upsellContent.headline}</h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 48px 32px;">
                <p style="font-size: 18px; line-height: 1.6; color: #334155; margin-bottom: 32px;">
                  ${upsellContent.body}
                </p>
                
                <!-- Benefits -->
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
                  <h2 style="margin: 0 0 16px 0; font-size: 20px; color: #0f172a;">What you'll get:</h2>
                  <ul style="margin: 0; padding-left: 20px;">
                    ${upsellContent.benefits.map((b) => `<li style="margin-bottom: 12px; color: #334155; font-size: 16px;">${b}</li>`).join("")}
                  </ul>
                </div>
                
                <!-- CTA Button -->
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL}/upgrade?order=${orderId}&from=${plan}" 
                     style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-weight: 700; font-size: 18px;">
                    ${upsellContent.cta}
                  </a>
                </div>
                
                <!-- Footer note -->
                <p style="margin-top: 32px; font-size: 14px; color: #64748b; text-align: center;">
                  Limited time offer. Upgrade within 7 days to lock in this price.
                </p>
              </div>
              
              <!-- Footer -->
              <div style="background-color: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; font-size: 14px; color: #64748b;">
                  Questions? Reply to this email or visit <a href="${process.env.NEXT_PUBLIC_SITE_URL}/contact" style="color: #3b82f6;">our support page</a>
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (emailError) {
      console.error("Failed to send upsell email:", emailError);
      return NextResponse.json(
        { error: "Failed to send email" },
        { status: 500 },
      );
    }

    // Log the upsell attempt
    await supabaseAdmin.from("upsell_emails").insert({
      order_id: orderId,
      email,
      current_plan: plan,
      sent_at: new Date().toISOString(),
      status: "sent",
    });

    return NextResponse.json({ success: true, messageId: data?.id });
  } catch (error) {
    console.error("Upsell email error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
