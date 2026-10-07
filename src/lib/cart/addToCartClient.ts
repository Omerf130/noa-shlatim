export const ADD_TO_CART_NETWORK_ERROR_MESSAGE =
  "לא הצלחנו להוסיף את השלט לסל. בדקו חיבור ונסו שוב.";

export type AddToCartSuccessResponse = {
  ok: true;
  cartId: string;
  lineId: string;
  lineCount: number;
  totalQuantity: number;
  reused?: true;
};

export type AddToCartErrorResponse = {
  ok: false;
  code: string;
  message: string;
};

export type AddToCartResponse = AddToCartSuccessResponse | AddToCartErrorResponse;

export function parseAddToCartResponse(json: unknown): AddToCartResponse | null {
  if (!json || typeof json !== "object") {
    return null;
  }
  const record = json as Record<string, unknown>;
  if (record.ok === true) {
    if (
      typeof record.cartId !== "string" ||
      typeof record.lineId !== "string" ||
      typeof record.lineCount !== "number" ||
      typeof record.totalQuantity !== "number"
    ) {
      return null;
    }
    return {
      ok: true,
      cartId: record.cartId,
      lineId: record.lineId,
      lineCount: record.lineCount,
      totalQuantity: record.totalQuantity,
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

/**
 * One UUID per intentional add; reused on retries until success consumes it.
 */
export class AddIdempotencyKeySession {
  private key: string | null = null;

  getOrCreate(): string {
    if (!this.key) {
      this.key = crypto.randomUUID();
    }
    return this.key;
  }

  peek(): string | null {
    return this.key;
  }

  consumeAfterSuccess(): void {
    this.key = null;
  }

  resetForNewSign(): void {
    this.key = null;
  }
}
