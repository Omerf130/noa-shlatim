import { handlePayPlusCallback } from "@/lib/orders/handlePayPlusCallback";
import { runPostPaidOrderSideEffects } from "@/lib/orders/runPostPaidOrderSideEffects";
import { getPayPlusConfig } from "@/lib/payplus/env";
import { parsePayPlusCallbackPayload } from "@/lib/payplus/parseCallbackPayload";
import { verifyPayPlusRequestHash } from "@/lib/payplus/verifyPayPlusRequestHash";
import { after } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const config = getPayPlusConfig();
  if (!config) {
    console.error("[api/payplus/callback] PayPlus not configured");
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const hashHeader = request.headers.get("hash");
  const userAgent = request.headers.get("user-agent");

  const verified = verifyPayPlusRequestHash({
    rawBody,
    hashHeader,
    userAgent,
    secretKey: config.secretKey,
  });

  if (!verified) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const parsed = parsePayPlusCallbackPayload(rawBody);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    const result = await handlePayPlusCallback(parsed.payload);
    if (!result.ok) {
      return NextResponse.json({ ok: false }, { status: result.httpStatus });
    }
    if (result.triggerFinbotIssuance) {
      after(async () => {
        await runPostPaidOrderSideEffects(result.orderId);
      });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[api/payplus/callback]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
