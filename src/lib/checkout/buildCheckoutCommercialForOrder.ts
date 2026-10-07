import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  buildSummary,
  loadCheckoutShippingMethodOptions,
  type CheckoutCommercialDto,
  type CheckoutCommercialSummaryDto,
  type CheckoutLineCommercialDto,
  type CheckoutShippingMethodOptionDto,
} from "@/lib/checkout/buildCheckoutCommercialView";
import {
  CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
  CHECKOUT_SHIPPING_LINE_PENDING,
  CHECKOUT_STALE_SHIPPING_MESSAGE,
} from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import {
  parseOrderCommercialSnapshot,
  type ParsedCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import {
  buildCheckoutCommercialSummaryFromFrozenV2,
  buildCheckoutCommercialSummaryWithPromotions,
} from "@/lib/promotions/buildCheckoutPromotionSummary";
import { resolveLivePromotionPricing } from "@/lib/promotions/resolvePromotionPricing";
import { computeLiveCheckoutLinePricing } from "@/lib/orders/computeLiveCheckoutLinePricing";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import type { OrderCommercialSnapshotV2 } from "@/lib/orders/commercialSnapshotV2";
import { productDescriptionForSnapshot } from "@/lib/orders/commercialSnapshot";
import type { OrderLikeForResolveItems } from "@/lib/orders/resolveOrderItems";
import { materialLabelForSnapshot } from "@/lib/orders/commercialSnapshot";

function resolveShippingSelection(
  shippingMethods: CheckoutShippingMethodOptionDto[],
  savedShippingMethodId?: string | null,
) {
  const savedId = savedShippingMethodId?.trim() || null;
  const methodById = new Map(shippingMethods.map((m) => [m.methodId, m]));
  let selectionValid = false;
  let selectedShippingMethodId: string | null = null;
  let staleSelectionMessage: string | null = null;

  if (savedId && methodById.has(savedId)) {
    selectionValid = true;
    selectedShippingMethodId = savedId;
  } else if (savedId) {
    staleSelectionMessage = CHECKOUT_STALE_SHIPPING_MESSAGE;
  }

  const selectedMethod = selectedShippingMethodId
    ? methodById.get(selectedShippingMethodId) ?? null
    : null;

  return {
    selectionValid,
    selectedShippingMethodId,
    staleSelectionMessage,
    selectedMethod,
  };
}

function lineDtosFromV2(snapshot: OrderCommercialSnapshotV2): CheckoutLineCommercialDto[] {
  return snapshot.lines.map((line) => ({
    lineId: line.lineId,
    quantity: line.quantity,
    description: line.description,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
    unitPriceDisplay: formatMinorForCheckoutDisplay(line.unitPriceMinor),
    lineTotalDisplay: formatMinorForCheckoutDisplay(line.lineTotalMinor),
  }));
}

function summaryForMultiV2(params: {
  productAmountMinor: number;
  selectedMethod: CheckoutShippingMethodOptionDto | null;
}): CheckoutCommercialSummaryDto {
  return buildSummary({
    materialLabel: "מוצרים",
    productAmountMinor: params.productAmountMinor,
    selectedMethod: params.selectedMethod,
  });
}

function buildMultiV2Dto(params: {
  snapshot: OrderCommercialSnapshotV2;
  shippingMethods: CheckoutShippingMethodOptionDto[];
  selectionValid: boolean;
  selectedShippingMethodId: string | null;
  staleSelectionMessage: string | null;
  selectedMethod: CheckoutShippingMethodOptionDto | null;
  priceSource: "live" | "frozen";
}): Extract<CheckoutCommercialDto, { available: true; pricingMode: "multi_v2" }> {
  const useFrozenTotals = params.priceSource === "frozen" && params.selectedMethod;
  const hasFrozenPromotion =
    (params.snapshot.discountAmountMinor ?? 0) > 0 ||
    (params.snapshot.promotionsApplied?.length ?? 0) > 0;

  const summary =
    params.priceSource === "frozen" && hasFrozenPromotion
      ? buildCheckoutCommercialSummaryFromFrozenV2({
          snapshot: params.snapshot,
          selectedMethod: params.selectedMethod,
          usePersistedShippingTotals: Boolean(useFrozenTotals),
        })
      : useFrozenTotals
        ? {
            productLabel: "מוצרים",
            productDisplay: formatMinorForCheckoutDisplay(
              params.snapshot.productAmountMinor,
            ),
            shippingDisplay: formatMinorForCheckoutDisplay(
              params.snapshot.shippingAmountMinor,
            ),
            totalDisplay: formatMinorForCheckoutDisplay(
              params.snapshot.totalAmountMinor,
            ),
            productAmountMinor: params.snapshot.productAmountMinor,
            shippingAmountMinor: params.snapshot.shippingAmountMinor,
            totalAmountMinor: params.snapshot.totalAmountMinor,
          }
        : summaryForMultiV2({
            productAmountMinor: params.snapshot.productAmountMinor,
            selectedMethod: params.selectedMethod,
          });

  return {
    available: true,
    pricingMode: "multi_v2",
    priceSource: params.priceSource,
    lineItems: lineDtosFromV2(params.snapshot),
    shippingMethods: params.shippingMethods,
    selectedShippingMethodId: params.selectedShippingMethodId,
    selectionValid: params.selectionValid,
    staleSelectionMessage: params.staleSelectionMessage,
    summary,
  };
}

function buildLegacyFrozenV1(
  parsed: Extract<ParsedCommercialSnapshot, { version: 1 }>,
  shippingMethods: CheckoutShippingMethodOptionDto[],
  savedShippingMethodId?: string | null,
): CheckoutCommercialDto {
  const s = parsed.snapshot;
  const { selectionValid, selectedShippingMethodId, staleSelectionMessage, selectedMethod } =
    resolveShippingSelection(shippingMethods, savedShippingMethodId);

  const productDescription = productDescriptionForSnapshot(s);
  const summary = selectedMethod
    ? {
        productLabel: productDescription,
        productDisplay: formatMinorForCheckoutDisplay(s.productAmountMinor),
        shippingDisplay: formatMinorForCheckoutDisplay(s.shippingAmountMinor),
        totalDisplay: formatMinorForCheckoutDisplay(s.totalAmountMinor),
        productAmountMinor: s.productAmountMinor,
        shippingAmountMinor: s.shippingAmountMinor,
        totalAmountMinor: s.totalAmountMinor,
      }
    : buildSummary({
        materialLabel: productDescription,
        productAmountMinor: s.productAmountMinor,
        selectedMethod: null,
      });

  return {
    available: true,
    pricingMode: "legacy",
    priceSource: "frozen",
    product: {
      material: s.material,
      materialLabel: materialLabelForSnapshot(s.material),
      productDescription,
      amountMinor: s.productAmountMinor,
      displayAmount: formatMinorForCheckoutDisplay(s.productAmountMinor),
    },
    shippingMethods,
    selectedShippingMethodId,
    selectionValid,
    staleSelectionMessage,
    summary,
  };
}

export async function buildCheckoutCommercialForOrder(params: {
  order: OrderLikeForResolveItems & {
    commercialSnapshot?: unknown;
    status?: string;
  };
  savedShippingMethodId?: string | null;
}): Promise<CheckoutCommercialDto> {
  const shippingMethods = await loadCheckoutShippingMethodOptions();
  if (!shippingMethods.length) {
    return { available: false, message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE };
  }

  const parsed = parseOrderCommercialSnapshot(params.order.commercialSnapshot);
  const isDraft = !params.order.status || params.order.status === "draft";

  if (parsed && !isDraft) {
    if (parsed.version === 2) {
      const { selectionValid, selectedShippingMethodId, staleSelectionMessage, selectedMethod } =
        resolveShippingSelection(shippingMethods, params.savedShippingMethodId);
      return buildMultiV2Dto({
        snapshot: parsed.snapshot,
        shippingMethods,
        selectionValid,
        selectedShippingMethodId,
        staleSelectionMessage,
        selectedMethod,
        priceSource: "frozen",
      });
    }
    return buildLegacyFrozenV1(parsed, shippingMethods, params.savedShippingMethodId);
  }

  const livePricing = await computeLiveCheckoutLinePricing({ order: params.order });
  if (!livePricing.ok) {
    return { available: false, message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE };
  }

  const { selectionValid, selectedShippingMethodId, staleSelectionMessage, selectedMethod } =
    resolveShippingSelection(shippingMethods, params.savedShippingMethodId);

  const storeDoc = await loadStoreSettingsDocument();
  const pricingInput = storeDoc
    ? { ...storeDoc.pricing, magnetSizes: storeDoc.magnetSizes }
    : null;

  const lineItems: CheckoutLineCommercialDto[] = livePricing.lines.map((line) => ({
    lineId: line.lineId,
    quantity: line.quantity,
    description: line.description,
    unitPriceMinor: line.unitPriceMinor,
    lineTotalMinor: line.lineTotalMinor,
    unitPriceDisplay: formatMinorForCheckoutDisplay(line.unitPriceMinor),
    lineTotalDisplay: formatMinorForCheckoutDisplay(line.lineTotalMinor),
  }));

  const promotionPricing =
    pricingInput != null
      ? await resolveLivePromotionPricing({
          lines: livePricing.lines.map((line) => ({
            material: line.material,
            magnetSizeId: line.magnetSizeId,
            quantity: line.quantity,
            unitPriceMinor: line.unitPriceMinor,
            lineTotalMinor: line.lineTotalMinor,
          })),
          pricingInput,
        })
      : null;

  const summary =
    promotionPricing != null
      ? buildCheckoutCommercialSummaryWithPromotions({
          promotionPricing,
          selectedMethod,
        })
      : {
          productLabel: "מוצרים",
          productDisplay: formatMinorForCheckoutDisplay(livePricing.productAmountMinor),
          shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
          totalDisplay: selectedMethod
            ? null
            : null,
          productAmountMinor: livePricing.productAmountMinor,
          shippingAmountMinor: null as number | null,
          totalAmountMinor: null as number | null,
        };

  if (promotionPricing == null && selectedMethod) {
    const totals = computeCheckoutTotals(
      livePricing.productAmountMinor,
      selectedMethod.amountMinor,
    );
    if (totals.ok) {
      Object.assign(summary, {
        shippingDisplay: formatMinorForCheckoutDisplay(selectedMethod.amountMinor),
        totalDisplay: formatMinorForCheckoutDisplay(totals.totalAmountMinor),
        productAmountMinor: totals.productAmountMinor,
        shippingAmountMinor: totals.shippingAmountMinor,
        totalAmountMinor: totals.totalAmountMinor,
      });
    }
  }

  return {
    available: true,
    pricingMode: "multi_v2",
    priceSource: "live",
    lineItems,
    shippingMethods,
    selectedShippingMethodId,
    selectionValid,
    staleSelectionMessage,
    summary,
  };
}

export function mergeLineCommercialIntoCheckoutItems<
  T extends { artworkUrl: string },
>(
  items: T[],
  resolvedLineIds: string[],
  commercial: CheckoutCommercialDto,
): Array<
  T & {
    unitPriceDisplay: string | null;
    lineTotalDisplay: string | null;
  }
> {
  if (!commercial.available || commercial.pricingMode !== "multi_v2") {
    return items.map((item) => ({
      ...item,
      unitPriceDisplay: null,
      lineTotalDisplay: null,
    }));
  }
  const byLineId = new Map(commercial.lineItems.map((l) => [l.lineId, l]));
  return items.map((item, index) => {
    const lineId = resolvedLineIds[index]!;
    const line = byLineId.get(lineId);
    return {
      ...item,
      unitPriceDisplay: line?.unitPriceDisplay ?? null,
      lineTotalDisplay: line?.lineTotalDisplay ?? null,
    };
  });
}
