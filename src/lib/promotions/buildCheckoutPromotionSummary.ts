import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import type {
  CheckoutCommercialSummaryDto,
  CheckoutPromotionSummaryLineDto,
  CheckoutShippingMethodOptionDto,
} from "@/lib/checkout/buildCheckoutCommercialView";
import { CHECKOUT_SHIPPING_LINE_PENDING } from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import type { OrderCommercialSnapshotV2 } from "@/lib/orders/commercialSnapshotV2";
import type { PromotionOptimizationResult } from "@/lib/promotions/promotionPricingTypes";

function promotionSummaryBase(params: {
  catalogMinor: number;
  discountMinor: number;
  netMinor: number;
  appliedPromotions: CheckoutPromotionSummaryLineDto[];
  promotionMessage: string | null;
}) {
  const { catalogMinor, discountMinor, netMinor, appliedPromotions, promotionMessage } =
    params;
  return {
    productLabel: "מוצרים",
    catalogProductDisplay: formatMinorForCheckoutDisplay(catalogMinor),
    catalogProductAmountMinor: catalogMinor,
    discountMinor,
    discountDisplay:
      discountMinor > 0
        ? `-${formatMinorForCheckoutDisplay(discountMinor)}`
        : formatMinorForCheckoutDisplay(0),
    netProductDisplay: formatMinorForCheckoutDisplay(netMinor),
    netProductAmountMinor: netMinor,
    appliedPromotions,
    promotionMessage,
  };
}

export function buildCheckoutCommercialSummaryWithPromotions(params: {
  promotionPricing: PromotionOptimizationResult;
  selectedMethod: CheckoutShippingMethodOptionDto | null;
}): CheckoutCommercialSummaryDto {
  const { promotionPricing, selectedMethod } = params;
  const catalogMinor = promotionPricing.catalogSubtotalMinor;
  const netMinor = promotionPricing.productTotalMinor;
  const discountMinor = promotionPricing.discountMinor;

  const appliedPromotions: CheckoutPromotionSummaryLineDto[] =
    promotionPricing.applications.map((a) => ({
      customerLabel: a.customerLabel,
      applicationCount: a.applicationCount,
      savingsDisplay: a.savingsLabel,
    }));

  const base = promotionSummaryBase({
    catalogMinor,
    discountMinor,
    netMinor,
    appliedPromotions,
    promotionMessage: promotionPricing.promotionMessage,
  });

  if (!selectedMethod) {
    return {
      ...base,
      productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: netMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  const totals = computeCheckoutTotals(netMinor, selectedMethod.amountMinor);
  if (!totals.ok) {
    return {
      ...base,
      productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: netMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  return {
    ...base,
    productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
    shippingDisplay: formatMinorForCheckoutDisplay(selectedMethod.amountMinor),
    totalDisplay: formatMinorForCheckoutDisplay(totals.totalAmountMinor),
    productAmountMinor: totals.productAmountMinor,
    shippingAmountMinor: totals.shippingAmountMinor,
    totalAmountMinor: totals.totalAmountMinor,
  };
}

export function buildCheckoutCommercialSummaryFromFrozenV2(params: {
  snapshot: OrderCommercialSnapshotV2;
  selectedMethod: CheckoutShippingMethodOptionDto | null;
  usePersistedShippingTotals: boolean;
}): CheckoutCommercialSummaryDto {
  const snap = params.snapshot;
  const catalogMinor = snap.productAmountMinor;
  const discountMinor = snap.discountAmountMinor ?? 0;
  const netMinor = catalogMinor - discountMinor;
  const appliedPromotions: CheckoutPromotionSummaryLineDto[] = (
    snap.promotionsApplied ?? []
  ).map((p) => ({
    customerLabel: p.customerLabel,
    applicationCount: p.applicationCount,
    savingsDisplay: `-${formatMinorForCheckoutDisplay(p.savingsMinor)}`,
  }));

  const primary = appliedPromotions[0]?.customerLabel ?? null;
  const promotionMessage =
    discountMinor > 0 && primary ? `${primary} הופעל 🎉` : null;

  const base = promotionSummaryBase({
    catalogMinor,
    discountMinor,
    netMinor,
    appliedPromotions,
    promotionMessage,
  });

  if (params.usePersistedShippingTotals) {
    return {
      ...base,
      productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
      shippingDisplay: formatMinorForCheckoutDisplay(snap.shippingAmountMinor),
      totalDisplay: formatMinorForCheckoutDisplay(snap.totalAmountMinor),
      productAmountMinor: netMinor,
      shippingAmountMinor: snap.shippingAmountMinor,
      totalAmountMinor: snap.totalAmountMinor,
    };
  }

  if (!params.selectedMethod) {
    return {
      ...base,
      productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: netMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  const totals = computeCheckoutTotals(netMinor, params.selectedMethod.amountMinor);
  if (!totals.ok) {
    return {
      ...base,
      productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: netMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  return {
    ...base,
    productDisplay: formatMinorForCheckoutDisplay(catalogMinor),
    shippingDisplay: formatMinorForCheckoutDisplay(params.selectedMethod.amountMinor),
    totalDisplay: formatMinorForCheckoutDisplay(totals.totalAmountMinor),
    productAmountMinor: totals.productAmountMinor,
    shippingAmountMinor: totals.shippingAmountMinor,
    totalAmountMinor: totals.totalAmountMinor,
  };
}
