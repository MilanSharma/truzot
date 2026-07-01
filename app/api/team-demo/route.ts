import { NextResponse } from "next/server";
import { Resend } from "resend";
import { teamDemoSchema, validate } from "@/lib/validations";
import { createLogger } from "@/lib/logger";
import { addCors, handleOptions } from "@/lib/cors";
import { withContext } from "@/lib/request-context";

const log = createLogger("team-demo");

function getResend() {
 if (!process.env.RESEND_API_KEY)
 throw new Error("RESEND_API_KEY is not configured");
 return new Resend(process.env.RESEND_API_KEY);
}

export const OPTIONS = handleOptions;

export const POST = withContext(async (req: Request) => {
 const origin = req.headers.get("origin");
 try {
 const body = await req.json();
 const parsed = validate(teamDemoSchema, body);
 if (parsed.error)
 return addCors(
 NextResponse.json({ error: parsed.error }, { status: 400 }),
 origin,
 );

 const { email, company, employees } = parsed.data!;
 const resend = getResend();

 await resend.emails.send({
 from: "Truzot <hello@truzot.com>",
 to: "hello@truzot.com",
 subject: `New Team Demo Request from ${email}`,
 html: `<div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
 <h2>New Team Demo Request</h2>
 <p><strong>Email:</strong> ${email}</p>
 <p><strong>Company:</strong> ${company || "Not specified"}</p>
 <p><strong>Employees:</strong> ${employees ? `~${employees}` : "Not specified"}</p>
 <hr />
 <p style="color: #6b6560; font-size: 13px;">Sent via Truzot team demo form</p>
 </div>`,
 });

 return addCors(NextResponse.json({ success: true }), origin);
 } catch (err) {
 log.error({ err }, "Team demo request failed");
 return addCors(
 NextResponse.json({ error: "Failed to send request" }, { status: 500 }),
 origin,
 );
 }
});
