import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import { resolveLivePromotionPricing } from "@/lib/promotions/resolvePromotionPricing";
import { formatCheckoutProductLabel } from "@/lib/checkout/formatProductLabelForCheckout";
import type { OrderCommercialSnapshotV2 } from "@/lib/orders/commercialSnapshotV2";
import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import type { OrderLikeForResolveItems } from "@/lib/orders/resolveOrderItems";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import { validateResolvedOrderItemsForPayment } from "@/lib/orders/validateOrderItemsForPayment";
import {
  findMagnetSizeInCatalog,
  MagnetSizeNotAvailableError,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
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
  | "MAGNET_SIZE_UNAVAILABLE"
  | "EMPTY_ORDER";

export type ComputeLiveCommercialResult =
  | { ok: true; snapshot: OrderCommercialSnapshotV2 }
  | { ok: false; reason: ComputeLiveCommercialFailureReason };

export async function computeLiveCommercialSnapshotV2ForOrder(params: {
  order: OrderLikeForResolveItems;
  shippingMethodId: string | null | undefined;
  capturedAt?: string;
}): Promise<ComputeLiveCommercialResult> {
  const lines = resolveOrderItems(params.order);
  if (lines.length === 0) {
    return { ok: false, reason: "EMPTY_ORDER" };
  }

  try {
    await validateResolvedOrderItemsForPayment(lines);
  } catch {
    return { ok: false, reason: "INVALID_DESIGN" };
  }

  const shippingId = params.shippingMethodId?.trim() || null;

  const doc = await loadStoreSettingsDocument();
  if (!doc || !isPricingReady({ ...doc.pricing, magnetSizes: doc.magnetSizes })) {
    return { ok: false, reason: "STORE_NOT_READY" };
  }

  const pricingInput = { ...doc.pricing, magnetSizes: doc.magnetSizes };
  const magnetCatalog = resolveMagnetSizeCatalog(pricingInput);

  const shippingMethod = shippingId
    ? doc.shippingMethods
        .filter(isShippingMethodCustomerReady)
        .find((m) => m.id === shippingId)
    : null;
  if (shippingId && !shippingMethod) {
    return { ok: false, reason: "SHIPPING_UNAVAILABLE" };
  }

  const snapshotLines: OrderCommercialSnapshotV2["lines"] = [];
  let productAmountMinor = 0;

  for (const item of lines) {
    const design = parseCartLineDesign(item.design);
    if (!design) {
      return { ok: false, reason: "INVALID_DESIGN" };
    }

    let unitPriceMinor: number;
    try {
      unitPriceMinor = resolveProductPriceMinor({
        pricing: pricingInput,
        material: design.material,
        magnetSizeId: design.magnetSizeId,
      });
    } catch (err) {
      if (err instanceof MagnetSizeNotAvailableError) {
        return { ok: false, reason: "MAGNET_SIZE_UNAVAILABLE" };
      }
      return { ok: false, reason: "STORE_NOT_READY" };
    }

    const lineTotalMinor = unitPriceMinor * item.quantity;
    if (!Number.isSafeInteger(lineTotalMinor)) {
      return { ok: false, reason: "INVALID_TOTAL" };
    }

    let magnetSizeId: string | undefined;
    let magnetSizeName: string | undefined;
    let magnetSizeDimensionsLabel: string | undefined;
    if (design.material === "magnet" && design.magnetSizeId) {
      const size = findMagnetSizeInCatalog(magnetCatalog, design.magnetSizeId);
      if (size) {
        magnetSizeId = size.id;
        magnetSizeName = size.name.trim();
        const dims = size.dimensionsLabel?.trim();
        if (dims) {
          magnetSizeDimensionsLabel = dims;
        }
      }
    }

    const description = formatCheckoutProductLabel({
      material: design.material,
      magnetSizeName,
      magnetSizeDimensionsLabel,
    });

    snapshotLines.push({
      lineId: item.lineId,
      quantity: item.quantity,
      material: design.material,
      unitPriceMinor,
      lineTotalMinor,
      description,
      ...(magnetSizeId
        ? {
            magnetSizeId,
            magnetSizeName,
            ...(magnetSizeDimensionsLabel ? { magnetSizeDimensionsLabel } : {}),
          }
        : {}),
    });

    productAmountMinor += lineTotalMinor;
  }

  const shippingIdRequired = params.shippingMethodId?.trim();
  if (!shippingIdRequired) {
    return { ok: false, reason: "SHIPPING_NOT_SELECTED" };
  }
  if (!shippingMethod) {
    return { ok: false, reason: "SHIPPING_UNAVAILABLE" };
  }

  const pricedLines = snapshotLines.map((line) => ({
    material: line.material,
    magnetSizeId: line.magnetSizeId,
    quantity: line.quantity,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
  }));

  const promotionPricing = await resolveLivePromotionPricing({
    lines: pricedLines,
    pricingInput,
  });

  const discountAmountMinor = promotionPricing.discountMinor;
  const netProductMinor = promotionPricing.productTotalMinor;

  const totals = computeCheckoutTotals(
    netProductMinor,
    shippingMethod.priceMinor!,
  );
  if (!totals.ok) {
    return { ok: false, reason: "INVALID_TOTAL" };
  }

  const snapshot: OrderCommercialSnapshotV2 = {
    version: 2,
    currency: "ILS",
    capturedAt: params.capturedAt ?? new Date().toISOString(),
    lines: snapshotLines,
    productAmountMinor,
    discountAmountMinor,
    promotionsApplied: promotionPricing.frozenApplications,
    shippingMethodId: shippingIdRequired,
    shippingLabel: shippingMethod.displayName.trim(),
    shippingAmountMinor: totals.shippingAmountMinor,
    totalAmountMinor: totals.totalAmountMinor,
  };

  return { ok: true, snapshot };
}
