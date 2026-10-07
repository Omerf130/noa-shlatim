import {
  findMagnetSizeInCatalog,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
import type { ProductPricingInput } from "@/lib/store/resolveProductPriceMinor";
import { Promotion } from "@/models/Promotion";
import type { PromotionForEngine } from "@/lib/promotions/promotionEngineTypes";
import type { VariantInventory } from "@/lib/promotions/buildVariantInventory";

export function catalogMinorForOnePromotionApplication(
  promo: PromotionForEngine,
  unitPriceMinorByMagnetSizeId: Map<string, number>,
): number | null {
  let sum = 0;
  for (const req of promo.requirements) {
    const unit = unitPriceMinorByMagnetSizeId.get(req.magnetSizeId.trim());
    if (unit == null) {
      return null;
    }
    sum += unit * req.quantity;
  }
  return sum;
}

export function canApplyPromotionOnce(
  promo: PromotionForEngine,
  magnetCounts: Map<string, number>,
): boolean {
  for (const req of promo.requirements) {
    const have = magnetCounts.get(req.magnetSizeId.trim()) ?? 0;
    if (have < req.quantity) {
      return false;
    }
  }
  return true;
}

export function subtractPromotionOnce(
  promo: PromotionForEngine,
  magnetCounts: Map<string, number>,
): Map<string, number> {
  const next = new Map(magnetCounts);
  for (const req of promo.requirements) {
    const id = req.magnetSizeId.trim();
    next.set(id, (next.get(id) ?? 0) - req.quantity);
  }
  return next;
}

export function filterRuntimeEligiblePromotions(params: {
  promotions: PromotionForEngine[];
  pricingInput: ProductPricingInput;
  inventory: VariantInventory;
}): PromotionForEngine[] {
  const catalog = resolveMagnetSizeCatalog(params.pricingInput);
  const eligible: PromotionForEngine[] = [];

  for (const promo of params.promotions) {
    if (promo.requirements.length < 1) {
      continue;
    }

    let requirementsOk = true;
    for (const req of promo.requirements) {
      if (!findMagnetSizeInCatalog(catalog, req.magnetSizeId)) {
        requirementsOk = false;
        break;
      }
      if (!Number.isInteger(req.quantity) || req.quantity < 1 || req.quantity > 20) {
        requirementsOk = false;
        break;
      }
    }
    if (!requirementsOk) {
      continue;
    }

    const bundleCatalog = catalogMinorForOnePromotionApplication(
      promo,
      params.inventory.unitPriceMinorByMagnetSizeId,
    );
    if (bundleCatalog == null || promo.bundlePriceMinor >= bundleCatalog) {
      continue;
    }

    if (!canApplyPromotionOnce(promo, params.inventory.magnetCounts)) {
      continue;
    }

    eligible.push(promo);
  }

  return eligible.sort((a, b) => a.promotionId.localeCompare(b.promotionId));
}

export async function loadEnabledPromotionsFromDb(): Promise<PromotionForEngine[]> {
  const docs = await Promotion.find({ enabled: true })
    .select(
      "promotionId internalName bannerText bundlePriceMinor requirements",
    )
    .lean();

  const result: PromotionForEngine[] = [];
  for (const doc of docs) {
    if (!doc.promotionId || !Array.isArray(doc.requirements) || doc.requirements.length < 1) {
      continue;
    }
    result.push({
      promotionId: String(doc.promotionId).trim(),
      internalName: String(doc.internalName ?? "").trim(),
      bannerText: String(doc.bannerText ?? "").trim(),
      bundlePriceMinor: doc.bundlePriceMinor,
      requirements: doc.requirements.map((r: { magnetSizeId: string; quantity: number }) => ({
        magnetSizeId: String(r.magnetSizeId).trim(),
        quantity: r.quantity,
      })),
    });
  }

  return result.sort((a, b) => a.promotionId.localeCompare(b.promotionId));
}
