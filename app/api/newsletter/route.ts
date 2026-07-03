import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const { email } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 },
      );
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from("newsletter_subscribers")
      .select("email")
      .eq("email", email)
      .single();

    if (existing) {
      return NextResponse.json(
        { message: "Already subscribed" },
        { status: 200 },
      );
    }

    // Add to newsletter subscribers
    const { error } = await supabase.from("newsletter_subscribers").insert({
      email,
      subscribed_at: new Date().toISOString(),
      source: "homepage",
    });

    if (error) {
      console.error("Newsletter subscription error:", error);
      return NextResponse.json(
        { error: "Failed to subscribe" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: "Successfully subscribed" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Newsletter API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
