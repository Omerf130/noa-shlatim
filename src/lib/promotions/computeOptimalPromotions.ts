import type { VariantInventory } from "@/lib/promotions/buildVariantInventory";
import {
  canApplyPromotionOnce,
  catalogMinorForOnePromotionApplication,
  subtractPromotionOnce,
} from "@/lib/promotions/loadEnabledPromotions";
import type {
  PromotionApplicationInternal,
  PromotionForEngine,
} from "@/lib/promotions/promotionEngineTypes";

/** Memo entries before falling back to catalog-only magnet pricing. */
export const PROMOTION_OPTIMIZATION_MAX_MEMO_STATES = 500_000;

type MagnetSolution = {
  magnetCostMinor: number;
  applications: PromotionApplicationInternal[];
};

function serializeMagnetCounts(magnetCounts: Map<string, number>): string {
  const parts: string[] = [];
  for (const [id, qty] of [...magnetCounts.entries()].sort((a, b) =>
    a[0].localeCompare(b[0]),
  )) {
    if (qty > 0) {
      parts.push(`${id}:${qty}`);
    }
  }
  return parts.join("|");
}

function magnetCatalogCostMinor(
  magnetCounts: Map<string, number>,
  unitPriceMinorByMagnetSizeId: Map<string, number>,
): number {
  let sum = 0;
  for (const [id, qty] of magnetCounts.entries()) {
    if (qty <= 0) continue;
    sum += qty * (unitPriceMinorByMagnetSizeId.get(id) ?? 0);
  }
  return sum;
}

function totalApplicationCount(apps: PromotionApplicationInternal[]): number {
  let n = 0;
  for (const a of apps) {
    n += a.applicationCount;
  }
  return n;
}

function applicationSignature(apps: PromotionApplicationInternal[]): string {
  return [...apps]
    .sort((a, b) => a.promotionId.localeCompare(b.promotionId))
    .map((a) => `${a.promotionId}=${a.applicationCount}`)
    .join(",");
}

function isBetterMagnetSolution(
  candidate: MagnetSolution,
  current: MagnetSolution,
): boolean {
  if (candidate.magnetCostMinor !== current.magnetCostMinor) {
    return candidate.magnetCostMinor < current.magnetCostMinor;
  }
  const candidateApps = totalApplicationCount(candidate.applications);
  const currentApps = totalApplicationCount(current.applications);
  if (candidateApps !== currentApps) {
    return candidateApps < currentApps;
  }
  return (
    applicationSignature(candidate.applications) <
    applicationSignature(current.applications)
  );
}

function incrementApplication(
  apps: PromotionApplicationInternal[],
  promo: PromotionForEngine,
): PromotionApplicationInternal[] {
  const next = apps.map((a) => ({ ...a }));
  const existing = next.find((a) => a.promotionId === promo.promotionId);
  if (existing) {
    existing.applicationCount += 1;
  } else {
    next.push({
      promotionId: promo.promotionId,
      internalName: promo.internalName,
      bannerText: promo.bannerText,
      applicationCount: 1,
    });
  }
  return next.sort((a, b) => a.promotionId.localeCompare(b.promotionId));
}

export type ComputeOptimalPromotionsResult = {
  catalogSubtotalMinor: number;
  discountMinor: number;
  productTotalMinor: number;
  applications: PromotionApplicationInternal[];
  optimizationFallback: boolean;
};

export function computeOptimalPromotions(params: {
  inventory: VariantInventory;
  promotions: PromotionForEngine[];
  /** Test hook — override memo state budget. */
  maxMemoStates?: number;
}): ComputeOptimalPromotionsResult {
  const { inventory, promotions } = params;
  const catalogSubtotalMinor = inventory.catalogSubtotalMinor;
  const sortedPromos = [...promotions].sort((a, b) =>
    a.promotionId.localeCompare(b.promotionId),
  );

  let memoStates = 0;
  let fallback = false;
  const memo = new Map<string, MagnetSolution>();
  const maxMemoStates =
    params.maxMemoStates ?? PROMOTION_OPTIMIZATION_MAX_MEMO_STATES;

  function dfs(magnetCounts: Map<string, number>): MagnetSolution | null {
    if (fallback) {
      return null;
    }

    const key = serializeMagnetCounts(magnetCounts);
    const cached = memo.get(key);
    if (cached) {
      return cached;
    }

    memoStates += 1;
    if (memoStates > maxMemoStates) {
      fallback = true;
      return null;
    }

    let best: MagnetSolution = {
      magnetCostMinor: magnetCatalogCostMinor(
        magnetCounts,
        inventory.unitPriceMinorByMagnetSizeId,
      ),
      applications: [],
    };

    for (const promo of sortedPromos) {
      if (!canApplyPromotionOnce(promo, magnetCounts)) {
        continue;
      }
      const bundleCatalog = catalogMinorForOnePromotionApplication(
        promo,
        inventory.unitPriceMinorByMagnetSizeId,
      );
      if (bundleCatalog == null || promo.bundlePriceMinor >= bundleCatalog) {
        continue;
      }

      const nextCounts = subtractPromotionOnce(promo, magnetCounts);
      const sub = dfs(nextCounts);
      if (sub == null) {
        continue;
      }
      const candidate: MagnetSolution = {
        magnetCostMinor: promo.bundlePriceMinor + sub.magnetCostMinor,
        applications: incrementApplication(sub.applications, promo),
      };
      if (isBetterMagnetSolution(candidate, best)) {
        best = candidate;
      }
    }

    memo.set(key, best);
    return best;
  }

  const magnetSolution = dfs(inventory.magnetCounts);

  if (fallback || magnetSolution == null) {
    return {
      catalogSubtotalMinor,
      discountMinor: 0,
      productTotalMinor: catalogSubtotalMinor,
      applications: [],
      optimizationFallback: true,
    };
  }

  const productTotalMinor =
    inventory.nonMagnetCatalogMinor + magnetSolution.magnetCostMinor;
  const discountMinor = Math.max(0, catalogSubtotalMinor - productTotalMinor);

  return {
    catalogSubtotalMinor,
    discountMinor,
    productTotalMinor,
    applications: magnetSolution.applications,
    optimizationFallback: false,
  };
}
