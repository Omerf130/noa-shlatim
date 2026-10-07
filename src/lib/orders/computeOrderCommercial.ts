import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  findMagnetSizeInCatalog,
  MagnetSizeNotAvailableError,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
import {
  materialLabelForSnapshot,
  type OrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshot";
import { orderDesignSchema } from "@/lib/orders/orderDesignSchema";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { resolveProductPriceMinor } from "@/lib/store/resolveProductPriceMinor";
import {
  isPricingReady,
  isShippingMethodCustomerReady,
} from "@/lib/store/storeSettingsCompleteness";

export type ComputeLiveCommercialFailureReason =
  | "INVALID_DESIGN"
  | "STORE_NOT_READY"
  | "SHIPPING_NOT_SELECTED"
  | "SHIPPING_UNAVAILABLE"
  | "INVALID_TOTAL"
  | "MAGNET_SIZE_UNAVAILABLE";

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
  magnetSizeId?: string;
  magnetSizeName?: string;
  magnetSizeDimensionsLabel?: string;
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

  const doc = await loadStoreSettingsDocument();
  if (!doc || !isPricingReady({ ...doc.pricing, magnetSizes: doc.magnetSizes })) {
    return { ok: false, reason: "STORE_NOT_READY" };
  }

  const pricingInput = { ...doc.pricing, magnetSizes: doc.magnetSizes };
  const material = designParsed.data.material;
  let productAmountMinor: number;
  let magnetSizeId: string | undefined;
  let magnetSizeName: string | undefined;
  let magnetSizeDimensionsLabel: string | undefined;

  try {
    productAmountMinor = resolveProductPriceMinor({
      pricing: pricingInput,
      material,
      magnetSizeId: designParsed.data.magnetSizeId,
    });
  } catch (err) {
    if (err instanceof MagnetSizeNotAvailableError) {
      return { ok: false, reason: "MAGNET_SIZE_UNAVAILABLE" };
    }
    return { ok: false, reason: "STORE_NOT_READY" };
  }

  if (material === "magnet" && designParsed.data.magnetSizeId) {
    const catalog = resolveMagnetSizeCatalog(pricingInput);
    const size = findMagnetSizeInCatalog(catalog, designParsed.data.magnetSizeId);
    if (size) {
      magnetSizeId = size.id;
      magnetSizeName = size.name.trim();
      const dims = size.dimensionsLabel?.trim();
      if (dims) {
        magnetSizeDimensionsLabel = dims;
      }
    }
  }

  const shippingMethod = doc.shippingMethods
    .filter(isShippingMethodCustomerReady)
    .find((m) => m.id === shippingId);
  if (!shippingMethod) {
    return { ok: false, reason: "SHIPPING_UNAVAILABLE" };
  }

  const totals = computeCheckoutTotals(
    productAmountMinor,
    shippingMethod.priceMinor!,
  );
  if (!totals.ok) {
    return { ok: false, reason: "INVALID_TOTAL" };
  }

  return {
    ok: true,
    amounts: {
      material,
      productAmountMinor: totals.productAmountMinor,
      shippingMethodId: shippingId,
      shippingLabel: shippingMethod.displayName.trim(),
      shippingAmountMinor: totals.shippingAmountMinor,
      totalAmountMinor: totals.totalAmountMinor,
      ...(magnetSizeId
        ? {
            magnetSizeId,
            magnetSizeName,
            ...(magnetSizeDimensionsLabel
              ? { magnetSizeDimensionsLabel }
              : {}),
          }
        : {}),
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
    ...(amounts.magnetSizeId
      ? {
          magnetSizeId: amounts.magnetSizeId,
          magnetSizeName: amounts.magnetSizeName,
          ...(amounts.magnetSizeDimensionsLabel
            ? { magnetSizeDimensionsLabel: amounts.magnetSizeDimensionsLabel }
            : {}),
        }
      : {}),
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
