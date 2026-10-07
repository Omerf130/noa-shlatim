export type PricedLineForPromotions = {
  material: "wood" | "magnet";
  magnetSizeId?: string;
  quantity: number;
  unitPriceMinor: number;
  lineTotalMinor: number;
};

export type VariantInventory = {
  /** Wood and non-magnet lines — always at catalog line totals. */
  nonMagnetCatalogMinor: number;
  /** Aggregated magnet counts by magnetSizeId (promotion commercial key). */
  magnetCounts: Map<string, number>;
  /** Authoritative unit catalog prices per magnet size (from store settings). */
  unitPriceMinorByMagnetSizeId: Map<string, number>;
  catalogSubtotalMinor: number;
};

export function buildVariantInventory(
  lines: PricedLineForPromotions[],
): VariantInventory {
  let nonMagnetCatalogMinor = 0;
  const magnetCounts = new Map<string, number>();
  const unitPriceMinorByMagnetSizeId = new Map<string, number>();
  let catalogSubtotalMinor = 0;

  for (const line of lines) {
    catalogSubtotalMinor += line.lineTotalMinor;
    if (line.material === "magnet" && line.magnetSizeId) {
      const id = line.magnetSizeId.trim();
      magnetCounts.set(id, (magnetCounts.get(id) ?? 0) + line.quantity);
      unitPriceMinorByMagnetSizeId.set(id, line.unitPriceMinor);
    } else {
      nonMagnetCatalogMinor += line.lineTotalMinor;
    }
  }

  return {
    nonMagnetCatalogMinor,
    magnetCounts,
    unitPriceMinorByMagnetSizeId,
    catalogSubtotalMinor,
  };
}
