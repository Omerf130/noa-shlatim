import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  materialLabelForSnapshot,
  type OrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshot";
import { orderDesignSchema } from "@/lib/orders/orderDesignSchema";
import {
  resolveMaterialPriceMinor,
  resolveStoreConfigurationForCheckout,
} from "@/lib/store/resolveStoreConfigurationForCheckout";

export type ComputeLiveCommercialFailureReason =
  | "INVALID_DESIGN"
  | "STORE_NOT_READY"
  | "SHIPPING_NOT_SELECTED"
  | "SHIPPING_UNAVAILABLE"
  | "INVALID_TOTAL";

export type ComputeLiveCommercialResult =
  | { ok: true; snapshot: OrderCommercialSnapshot }
  | { ok: false; reason: ComputeLiveCommercialFailureReason };

export type DraftOrderCommercialAmounts = {
  material: OrderCommercialSnapshot["material"];
  productAmountMinor: number;
  shippingMethodId: string;
  shippingLabel: string;
  shippingAmountMinor: number;
  totalAmountMinor: number;
};

/**
 * Live StoreSettings pricing for a draft order (no persistence).
 * Used by checkout DTO and future payment-init reservation (Batch B).
 */
export async function computeDraftOrderCommercialAmounts(params: {
  design: unknown;
  shippingMethodId: string | null | undefined;
}): Promise<
  | { ok: true; amounts: DraftOrderCommercialAmounts }
  | { ok: false; reason: ComputeLiveCommercialFailureReason }
> {
  const designParsed = orderDesignSchema.safeParse(params.design);
  if (!designParsed.success) {
    return { ok: false, reason: "INVALID_DESIGN" };
  }

  const shippingId = params.shippingMethodId?.trim();
  if (!shippingId) {
    return { ok: false, reason: "SHIPPING_NOT_SELECTED" };
  }

  const storeConfig = await resolveStoreConfigurationForCheckout();
  if (!storeConfig.ok) {
    return { ok: false, reason: "STORE_NOT_READY" };
  }

  const material = designParsed.data.material;
  let productAmountMinor: number;
  try {
    productAmountMinor = resolveMaterialPriceMinor(storeConfig, material);
  } catch {
    return { ok: false, reason: "STORE_NOT_READY" };
  }

  const shippingMethod = storeConfig.shippingMethods.find((m) => m.methodId === shippingId);
  if (!shippingMethod) {
    return { ok: false, reason: "SHIPPING_UNAVAILABLE" };
  }

  const totals = computeCheckoutTotals(productAmountMinor, shippingMethod.priceMinor);
  if (!totals.ok) {
    return { ok: false, reason: "INVALID_TOTAL" };
  }

  return {
    ok: true,
    amounts: {
      material,
      productAmountMinor: totals.productAmountMinor,
      shippingMethodId: shippingId,
      shippingLabel: shippingMethod.displayName,
      shippingAmountMinor: totals.shippingAmountMinor,
      totalAmountMinor: totals.totalAmountMinor,
    },
  };
}

/** Build snapshot-shaped object for persistence at payment boundary (Batch B). */
export function buildCommercialSnapshotFromAmounts(
  amounts: DraftOrderCommercialAmounts,
  capturedAt: string = new Date().toISOString(),
): OrderCommercialSnapshot {
  return {
    currency: "ILS",
    capturedAt,
    material: amounts.material,
    productAmountMinor: amounts.productAmountMinor,
    shippingMethodId: amounts.shippingMethodId,
    shippingLabel: amounts.shippingLabel,
    shippingAmountMinor: amounts.shippingAmountMinor,
    totalAmountMinor: amounts.totalAmountMinor,
  };
}

export async function computeLiveCommercialSnapshotForDraftOrder(params: {
  design: unknown;
  shippingMethodId: string | null | undefined;
  capturedAt?: string;
}): Promise<ComputeLiveCommercialResult> {
  const amounts = await computeDraftOrderCommercialAmounts(params);
  if (!amounts.ok) {
    return amounts;
  }

  return {
    ok: true,
    snapshot: buildCommercialSnapshotFromAmounts(
      amounts.amounts,
      params.capturedAt ?? new Date().toISOString(),
    ),
  };
}

export { materialLabelForSnapshot };
