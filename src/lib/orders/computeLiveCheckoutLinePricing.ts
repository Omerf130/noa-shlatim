import { formatCheckoutProductLabel } from "@/lib/checkout/formatProductLabelForCheckout";
import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import type { CommercialSnapshotV2Line } from "@/lib/orders/commercialSnapshotV2";
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
import { isPricingReady } from "@/lib/store/storeSettingsCompleteness";

export type LiveCheckoutLinePricing = {
  lineId: string;
  quantity: number;
  description: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
  material: "wood" | "magnet";
  magnetSizeId?: string;
  magnetSizeName: string | null;
  magnetSizeDimensionsLabel: string | null;
};

export async function computeLiveCheckoutLinePricing(params: {
  order: OrderLikeForResolveItems;
}): Promise<
  | { ok: true; lines: LiveCheckoutLinePricing[]; productAmountMinor: number }
  | { ok: false }
> {
  const resolved = resolveOrderItems(params.order);
  if (!resolved.length) {
    return { ok: false };
  }

  try {
    await validateResolvedOrderItemsForPayment(resolved);
  } catch {
    return { ok: false };
  }

  const doc = await loadStoreSettingsDocument();
  if (!doc || !isPricingReady({ ...doc.pricing, magnetSizes: doc.magnetSizes })) {
    return { ok: false };
  }

  const pricingInput = { ...doc.pricing, magnetSizes: doc.magnetSizes };
  const magnetCatalog = resolveMagnetSizeCatalog(pricingInput);

  const lines: LiveCheckoutLinePricing[] = [];
  let productAmountMinor = 0;

  for (const item of resolved) {
    const design = parseCartLineDesign(item.design);
    if (!design) {
      return { ok: false };
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
        return { ok: false };
      }
      return { ok: false };
    }

    const lineTotalMinor = unitPriceMinor * item.quantity;
    let magnetSizeName: string | null = null;
    let magnetSizeDimensionsLabel: string | null = null;
    if (design.material === "magnet" && design.magnetSizeId) {
      const size = findMagnetSizeInCatalog(magnetCatalog, design.magnetSizeId);
      magnetSizeName = size?.name ?? null;
      magnetSizeDimensionsLabel = size?.dimensionsLabel ?? null;
    }

    lines.push({
      lineId: item.lineId,
      quantity: item.quantity,
      description: formatCheckoutProductLabel({
        material: design.material,
        magnetSizeName,
        magnetSizeDimensionsLabel,
      }),
      unitPriceMinor,
      lineTotalMinor,
      material: design.material,
      ...(design.material === "magnet" && design.magnetSizeId
        ? { magnetSizeId: design.magnetSizeId }
        : {}),
      magnetSizeName,
      magnetSizeDimensionsLabel,
    });
    productAmountMinor += lineTotalMinor;
  }

  return { ok: true, lines, productAmountMinor };
}

export function liveLinesToV2LineShape(
  lines: LiveCheckoutLinePricing[],
): CommercialSnapshotV2Line[] {
  return lines.map((line) => ({
    lineId: line.lineId,
    quantity: line.quantity,
    material: line.material,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
    description: line.description,
    ...(line.magnetSizeName
      ? {
          magnetSizeName: line.magnetSizeName,
          ...(line.magnetSizeDimensionsLabel
            ? { magnetSizeDimensionsLabel: line.magnetSizeDimensionsLabel }
            : {}),
        }
      : {}),
  }));
}
