import { NextResponse } from "next/server";
import { Receiver } from "@upstash/qstash";
import { failOrderAndRefund } from "@/lib/order-failure";
import { createLogger } from "@/lib/logger";
import { withContext } from "@/lib/request-context";

const log = createLogger("qstash-failure");

export const POST = withContext(async (req: Request) => {
  const signature = req.headers.get("upstash-signature") || "";
  const rawBody = await req.text();

  const receiver = new Receiver({
    currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
    nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
  });

  const valid = await receiver.verify({ signature, body: rawBody }).catch(() => false);
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  // QStash wraps the original failed request; the original body (base64) is in `body`.
  const payload = JSON.parse(rawBody);
  let orderId: string | undefined;
  try {
    const originalBody = JSON.parse(Buffer.from(payload.body, "base64").toString("utf-8"));
    orderId = originalBody.orderId;
  } catch (err) {
    log.error({ err, payload }, "Could not parse failed message body");
  }

  if (!orderId) return NextResponse.json({ error: "No orderId in failed message" }, { status: 400 });

  log.error({ orderId }, "QStash exhausted retries for generate batch — failing order and refunding");
  await failOrderAndRefund(orderId);
  return NextResponse.json({ ok: true });
});
