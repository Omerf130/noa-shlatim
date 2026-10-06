import { createHmac, timingSafeEqual } from "node:crypto";
import { PAYPLUS_CALLBACK_USER_AGENT } from "@/lib/payplus/constants";

export type PayPlusHashVerificationInput = {
  rawBody: string;
  hashHeader: string | null | undefined;
  userAgent: string | null | undefined;
  secretKey: string;
};

/**
 * PayPlus signing message per official docs (Validate Requests Received from PayPlus):
 * JSON.stringify(parsed JSON body) — not the raw HTTP bytes.
 */
export function payPlusHashMessageFromRawBody(rawBody: string): string | null {
  if (!rawBody.length) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    return null;
  }

  if (parsed === null || typeof parsed !== "object") {
    return null;
  }

  return JSON.stringify(parsed);
}

function computePayPlusRequestHashFromMessage(message: string, secretKey: string): string {
  return createHmac("sha256", secretKey).update(message, "utf8").digest("base64");
}

/**
 * Verify PayPlus server callback authenticity.
 * HMAC-SHA256(secretKey, JSON.stringify(parsedBody)) → base64 vs `hash` header.
 * User-Agent must be exactly `PayPlus`.
 */
export function verifyPayPlusRequestHash(input: PayPlusHashVerificationInput): boolean {
  if (input.userAgent !== PAYPLUS_CALLBACK_USER_AGENT) {
    return false;
  }

  const hashHeader = input.hashHeader?.trim();
  if (!hashHeader || !input.secretKey) {
    return false;
  }

  const message = payPlusHashMessageFromRawBody(input.rawBody);
  if (!message) {
    return false;
  }

  const expected = computePayPlusRequestHashFromMessage(message, input.secretKey);

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(hashHeader, "utf8");
  if (a.length !== b.length) {
    return false;
  }

  return timingSafeEqual(a, b);
}

/** Test helper: sign a callback the way PayPlus documents (stringify after parse). */
export function computePayPlusRequestHash(rawBody: string, secretKey: string): string {
  const message = payPlusHashMessageFromRawBody(rawBody);
  if (!message) {
    throw new Error("Invalid PayPlus callback JSON for hash");
  }
  return computePayPlusRequestHashFromMessage(message, secretKey);
}

/** Test helper: sign from an already-parsed callback object. */
export function computePayPlusRequestHashFromParsedBody(
  parsedBody: Record<string, unknown>,
  secretKey: string,
): string {
  return computePayPlusRequestHashFromMessage(JSON.stringify(parsedBody), secretKey);
}
