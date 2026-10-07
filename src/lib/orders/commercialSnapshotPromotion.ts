import type { CommercialSnapshotPromotionApplied } from "@/lib/orders/commercialSnapshotV2";

export type { CommercialSnapshotPromotionApplied };

/** Proportional catalog-line gross after promotion discount (integer agorot). */
export function allocateDiscountedProductGrossParts(params: {
  lines: Array<{
    description: string;
    lineTotalMinor: number;
    quantity: number;
  }>;
  productAmountMinor: number;
  discountAmountMinor: number;
}): Array<{ name: string; grossMinor: number; quantity: number }> {
  const { lines, productAmountMinor, discountAmountMinor } = params;
  if (discountAmountMinor <= 0) {
    return lines.map((line) => ({
      name: line.description,
      grossMinor: line.lineTotalMinor,
      quantity: line.quantity,
    }));
  }

  const targetProductGrossMinor = productAmountMinor - discountAmountMinor;
  if (targetProductGrossMinor < 0) {
    throw new Error("COMMERCIAL_SNAPSHOT_NEGATIVE_NET_PRODUCT");
  }
  if (productAmountMinor <= 0) {
    throw new Error("COMMERCIAL_SNAPSHOT_INVALID_PRODUCT");
  }

  let allocated = 0;
  return lines.map((line, index) => {
    let grossMinor: number;
    if (index === lines.length - 1) {
      grossMinor = targetProductGrossMinor - allocated;
    } else {
      grossMinor = Math.floor(
        (targetProductGrossMinor * line.lineTotalMinor) / productAmountMinor,
      );
      allocated += grossMinor;
    }
    if (grossMinor < 0) {
      throw new Error("COMMERCIAL_SNAPSHOT_NEGATIVE_LINE_GROSS");
    }
    return {
      name: line.description,
      grossMinor,
      quantity: line.quantity,
    };
  });
}
