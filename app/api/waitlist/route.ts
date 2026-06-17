import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";
import { sendDiscountCodeEmail } from "@/lib/email";

const log = createLogger("waitlist");

function generateDiscountCode(): string {
  // Exclude easily confused characters (O, 0, I, 1, L)
  const chars = "ABCDEFGHJKMNPQRSTUVWXY3456789";
  let code = "TRUZOT-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, source } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 },
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("waitlist")
      .select("id, discount_code")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        {
          message: "Email already registered",
          alreadyExists: true,
          discountCode: existing.discount_code,
        },
        { status: 200 },
      );
    }

    const discountCode = generateDiscountCode();

    const { error } = await supabaseAdmin.from("waitlist").insert({
      email,
      source: source || "landing-page",
      discount_code: discountCode,
      created_at: new Date().toISOString(),
    });

    if (error) {
      log.error({ err: error, email }, "Waitlist insert failed");
      return NextResponse.json(
        { error: "Failed to register" },
        { status: 500 },
      );
    }

    log.info({ email, source, discountCode }, "Waitlist signup successful");

    // Await the email send to ensure it completes before the function exits
    try {
      await sendDiscountCodeEmail(email, discountCode);
      log.info({ email }, "Discount code email sent successfully");
    } catch (err) {
      log.error({ err, email }, "Failed to send discount code email");
    }

    return NextResponse.json(
      { message: "Successfully registered", discount: "$5 off", discountCode },
      { status: 201 },
    );
  } catch (err) {
    log.error({ err }, "Waitlist API error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
