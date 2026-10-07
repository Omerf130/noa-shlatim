export const CART_CONVERSION_NETWORK_ERROR_MESSAGE =
  "לא הצלחנו להכין את ההזמנה. בדקו חיבור ונסו שוב.";

export type CartConversionSuccessResponse = {
  ok: true;
  orderId: string;
  checkoutPath: string;
  reused?: true;
};

export type CartConversionErrorResponse = {
  ok: false;
  code: string;
  message: string;
};

export type CartConversionResponse =
  | CartConversionSuccessResponse
  | CartConversionErrorResponse;

const CHECKOUT_PATH = /^\/checkout\/[a-f0-9]{24}$/i;

export function parseCartConversionResponse(json: unknown): CartConversionResponse | null {
  if (!json || typeof json !== "object") {
    return null;
  }
  const record = json as Record<string, unknown>;
  if (record.ok === true && typeof record.orderId === "string") {
    const checkoutPath =
      typeof record.checkoutPath === "string" &&
      CHECKOUT_PATH.test(record.checkoutPath)
        ? record.checkoutPath
        : `/checkout/${record.orderId}`;
    return {
      ok: true,
      orderId: record.orderId,
      checkoutPath,
      ...(record.reused === true ? { reused: true as const } : {}),
    };
  }
  if (record.ok === false && typeof record.message === "string") {
    return {
      ok: false,
      code: typeof record.code === "string" ? record.code : "UNKNOWN",
      message: record.message,
    };
  }
  return null;
}

/** One UUID per intentional conversion; reused on network retries. */
export class ConversionIdempotencyKeySession {
  private key: string | null = null;

  getOrCreate(): string {
    if (!this.key) {
      this.key = crypto.randomUUID();
    }
    return this.key;
  }

  consumeAfterSuccess(): void {
    this.key = null;
  }

  resetForNewAttempt(): void {
    this.key = null;
  }
}
