import {
  buildVariantInventory,
  type PricedLineForPromotions,
} from "@/lib/promotions/buildVariantInventory";
import { computeOptimalPromotions } from "@/lib/promotions/computeOptimalPromotions";
import {
  catalogMinorForOnePromotionApplication,
  filterRuntimeEligiblePromotions,
  loadEnabledPromotionsFromDb,
} from "@/lib/promotions/loadEnabledPromotions";
import type { PromotionForEngine } from "@/lib/promotions/promotionEngineTypes";
import type {
  FrozenPromotionApplication,
  PromotionOptimizationResult,
} from "@/lib/promotions/promotionPricingTypes";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import type { ProductPricingInput } from "@/lib/store/resolveProductPriceMinor";

function customerLabelForPromotion(promo: {
  internalName: string;
  bannerText: string;
}): string {
  const banner = promo.bannerText.trim();
  return banner.length > 0 ? banner : promo.internalName.trim();
}

function formatDiscountDisplay(minor: number): string {
  if (minor <= 0) {
    return formatMinorForCheckoutDisplay(0);
  }
  return `-${formatMinorForCheckoutDisplay(minor)}`;
}

function applicationsToDisplay(
  applications: ReturnType<typeof computeOptimalPromotions>["applications"],
  promotionsById: Map<string, PromotionForEngine>,
  unitPriceMinorByMagnetSizeId: Map<string, number>,
) {
  return applications.map((app) => {
    const promo = promotionsById.get(app.promotionId);
    const perAppCatalog =
      promo != null
        ? catalogMinorForOnePromotionApplication(promo, unitPriceMinorByMagnetSizeId)
        : null;
    const savingsMinor =
      perAppCatalog != null
        ? Math.max(0, (perAppCatalog - (promo?.bundlePriceMinor ?? 0)) * app.applicationCount)
        : 0;
    return {
      customerLabel: customerLabelForPromotion(app),
      applicationCount: app.applicationCount,
      savingsMinor,
      savingsLabel: formatDiscountDisplay(savingsMinor),
      frozen: {
        promotionId: app.promotionId,
        internalName: app.internalName,
        customerLabel: customerLabelForPromotion(app),
        applicationCount: app.applicationCount,
        savingsMinor,
      } satisfies FrozenPromotionApplication,
    };
  });
}

export async function resolveLivePromotionPricing(params: {
  lines: PricedLineForPromotions[];
  pricingInput: ProductPricingInput;
  /** When set, skips DB load (tests). */
  promotionsOverride?: PromotionForEngine[];
}): Promise<PromotionOptimizationResult> {
  const inventory = buildVariantInventory(params.lines);
  const loaded =
    params.promotionsOverride ?? (await loadEnabledPromotionsFromDb());
  const eligible = filterRuntimeEligiblePromotions({
    promotions: loaded,
    pricingInput: params.pricingInput,
    inventory,
  });

  const promotionsById = new Map(eligible.map((p) => [p.promotionId, p]));
  const optimized = computeOptimalPromotions({
    inventory,
    promotions: eligible,
  });

  const applications = applicationsToDisplay(
    optimized.applications,
    promotionsById,
    inventory.unitPriceMinorByMagnetSizeId,
  );

  const primaryLabel =
    applications.length > 0 ? applications[0]!.customerLabel : null;
  const promotionMessage =
    optimized.discountMinor > 0 && primaryLabel
      ? `${primaryLabel} הופעל 🎉`
      : null;

  return {
    catalogSubtotalMinor: optimized.catalogSubtotalMinor,
    discountMinor: optimized.discountMinor,
    productTotalMinor: optimized.productTotalMinor,
    applications: applications.map(({ frozen, ...display }) => {
      void frozen;
      return display;
    }),
    frozenApplications: applications.map((a) => a.frozen),
    promotionMessage,
    optimizationFallback: optimized.optimizationFallback,
  };
}
