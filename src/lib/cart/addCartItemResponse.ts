import { computeCartCounts } from "@/lib/cart/cartSummary";

export type AddCartItemSuccessDto = {
  ok: true;
  cartId: string;
  lineId: string;
  lineCount: number;
  totalQuantity: number;
  reused?: true;
};

export function buildAddCartItemSuccessDto(params: {
  cartId: string;
  lineId: string;
  items: Array<{ quantity?: unknown }> | null | undefined;
  reused?: boolean;
}): AddCartItemSuccessDto {
  const { lineCount, totalQuantity } = computeCartCounts(params.items);
  return {
    ok: true,
    cartId: params.cartId,
    lineId: params.lineId,
    lineCount,
    totalQuantity,
    ...(params.reused ? { reused: true as const } : {}),
  };
}

/** Ensures API payloads never leak storage paths or secrets. */
export function assertSafeAddCartItemResponse(body: AddCartItemSuccessDto): void {
  const json = JSON.stringify(body);
  if (/pathname|accessToken|tokenHash|access_token/i.test(json)) {
    throw new Error("Unsafe add-cart response");
  }
}
