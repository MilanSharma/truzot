import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createLogger } from "@/lib/logger";

const log = createLogger("waitlist");

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, source } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      );
    }

    const { data: existing } = await supabaseAdmin
      .from("waitlist")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { message: "Email already registered", alreadyExists: true },
        { status: 200 }
      );
    }

    const { error } = await supabaseAdmin
      .from("waitlist")
      .insert({
        email,
        source: source || "landing-page",
        created_at: new Date().toISOString(),
      });

    if (error) {
      log.error({ err: error, email }, "Waitlist insert failed");
      return NextResponse.json(
        { error: "Failed to register" },
        { status: 500 }
      );
    }

    log.info({ email, source }, "Waitlist signup successful");
    return NextResponse.json(
      { message: "Successfully registered", discount: "$5 off" },
      { status: 201 }
    );
  } catch (err) {
    log.error({ err }, "Waitlist API error");
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}