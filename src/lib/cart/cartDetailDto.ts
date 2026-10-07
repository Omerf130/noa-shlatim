import { cartLineArtworkApiPath } from "@/lib/cart/cartLineArtworkUrl";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import type { CartStatus } from "@/models/Cart";
import type { Material } from "@/types/signDesign";

export type CartDetailStatus = "empty" | CartStatus;

export type CartLineAvailability = "available" | "unavailable";

export type CartLineDetailDto = {
  lineId: string;
  quantity: number;
  artworkUrl: string;
  material: Material;
  magnetSizeId?: string;
  magnetSizeName?: string;
  magnetSizeDimensionsLabel?: string;
  unitPriceMinor?: number;
  unitPriceLabel?: string;
  lineTotalMinor?: number;
  lineTotalLabel?: string;
  availability: CartLineAvailability;
  unavailableReason?: string;
};

export type CartDetailDto = {
  ok: true;
  status: CartDetailStatus;
  lines: CartLineDetailDto[];
  lineCount: number;
  totalQuantity: number;
  subtotalMinor: number;
  subtotalLabel: string;
  currency: "ILS";
  canCheckout: boolean;
};

export const EMPTY_CART_DETAIL: CartDetailDto = {
  ok: true,
  status: "empty",
  lines: [],
  lineCount: 0,
  totalQuantity: 0,
  subtotalMinor: 0,
  subtotalLabel: formatMinorForCheckoutDisplay(0),
  currency: "ILS",
  canCheckout: false,
};

export function buildCartDetailDto(params: {
  status: CartDetailStatus;
  lines: CartLineDetailDto[];
  totalQuantity: number;
}): CartDetailDto {
  let subtotalMinor = 0;
  for (const line of params.lines) {
    if (line.availability === "available" && line.lineTotalMinor != null) {
      subtotalMinor += line.lineTotalMinor;
    }
  }

  const hasAvailableLine = params.lines.some((l) => l.availability === "available");
  const canCheckout =
    params.status === "active" &&
    params.lines.length > 0 &&
    hasAvailableLine &&
    params.lines.every((l) => l.availability === "available");

  return {
    ok: true,
    status: params.status,
    lines: params.lines,
    lineCount: params.lines.length,
    totalQuantity: params.totalQuantity,
    subtotalMinor,
    subtotalLabel: formatMinorForCheckoutDisplay(subtotalMinor),
    currency: "ILS",
    canCheckout,
  };
}

export function buildCartLineDetailDto(params: {
  lineId: string;
  quantity: number;
  material: Material;
  magnetSizeId?: string;
  magnetSizeName?: string;
  magnetSizeDimensionsLabel?: string;
  availability: CartLineAvailability;
  unavailableReason?: string;
  pricing?: {
    unitPriceMinor: number;
    lineTotalMinor: number;
    unitPriceLabel: string;
    lineTotalLabel: string;
  };
}): CartLineDetailDto {
  return {
    lineId: params.lineId,
    quantity: params.quantity,
    artworkUrl: cartLineArtworkApiPath(params.lineId),
    material: params.material,
    ...(params.magnetSizeId ? { magnetSizeId: params.magnetSizeId } : {}),
    ...(params.magnetSizeName ? { magnetSizeName: params.magnetSizeName } : {}),
    ...(params.magnetSizeDimensionsLabel
      ? { magnetSizeDimensionsLabel: params.magnetSizeDimensionsLabel }
      : {}),
    ...(params.pricing
      ? {
          unitPriceMinor: params.pricing.unitPriceMinor,
          unitPriceLabel: params.pricing.unitPriceLabel,
          lineTotalMinor: params.pricing.lineTotalMinor,
          lineTotalLabel: params.pricing.lineTotalLabel,
        }
      : {}),
    availability: params.availability,
    ...(params.unavailableReason ? { unavailableReason: params.unavailableReason } : {}),
  };
}

const FORBIDDEN_DTO_KEYS =
  /accessToken|tokenHash|pathname|addIdempotencyKey|access_token/i;

/** Ensures cart detail JSON never leaks storage or auth internals. */
export function assertSafeCartDetailDto(dto: CartDetailDto): void {
  const json = JSON.stringify(dto);
  if (FORBIDDEN_DTO_KEYS.test(json)) {
    throw new Error("Unsafe cart detail DTO");
  }
}
