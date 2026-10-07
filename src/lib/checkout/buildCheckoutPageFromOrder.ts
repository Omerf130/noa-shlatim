import { loadBackgroundForRenderAsSignBackground } from "@/lib/backgrounds/loadBackgrounds";
import { isAllowedStyleId } from "@/lib/ai/illustrationPrompts";
import {
  buildCheckoutCommercialForOrder,
  mergeLineCommercialIntoCheckoutItems,
} from "@/lib/checkout/buildCheckoutCommercialForOrder";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import { CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE } from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { checkoutLineArtworkUrl } from "@/lib/checkout/checkoutArtworkUrl";
import type {
  CheckoutCustomerDto,
  CheckoutLineItemDto,
  CheckoutPageDto,
} from "@/lib/checkout/checkoutPageDto";
import { formatCheckoutProductLabel } from "@/lib/checkout/formatProductLabelForCheckout";
import {
  orderDesignSchema,
  type OrderDesignSnapshot,
} from "@/lib/orders/orderDesignSchema";
import { buildPersistedSignPreviewProps } from "@/lib/orders/persistedOrderSignPreview";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import type { OrderLikeForResolveItems } from "@/lib/orders/resolveOrderItems";
import {
  findMagnetSizeInCatalog,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { getIllustrationStyleById } from "@/data/illustrationStyles";

function parseLineDesign(raw: unknown): OrderDesignSnapshot | null {
  const parsed = orderDesignSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const design = parsed.data;
  if (
    design.creationMode === "photo" &&
    !isAllowedStyleId(design.photoIllustrationStyleId)
  ) {
    return null;
  }
  return design;
}

function styleNameFromDesign(design: OrderDesignSnapshot): string | null {
  if (design.creationMode !== "photo") {
    return null;
  }
  return getIllustrationStyleById(design.photoIllustrationStyleId)?.name ?? null;
}

function materialLabel(material: OrderDesignSnapshot["material"]): string {
  return material === "wood" ? "עץ" : material === "magnet" ? "מגנט" : "—";
}

async function buildCheckoutLineItemDto(params: {
  orderId: string;
  lineId: string;
  quantity: number;
  designRaw: unknown;
  magnetSizeName: string | null;
  magnetSizeDimensionsLabel: string | null;
  unitPriceDisplay: string | null;
  lineTotalDisplay: string | null;
}): Promise<CheckoutLineItemDto> {
  const design = parseLineDesign(params.designRaw);
  const artworkUrl = checkoutLineArtworkUrl(params.orderId, params.lineId);

  if (!design) {
    return {
      quantity: params.quantity,
      materialLabel: "—",
      backgroundName: "—",
      styleName: null,
      magnetSizeName: null,
      magnetSizeDimensionsLabel: null,
      productLabel: "—",
      design: null,
      integratedFinalPreview: null,
      previewBackground: null,
      hasValidDesign: false,
      artworkUrl,
      unitPriceDisplay: params.unitPriceDisplay,
      lineTotalDisplay: params.lineTotalDisplay,
    };
  }

  const previewBackground = await loadBackgroundForRenderAsSignBackground(
    design.backgroundId,
  );
  const previewProps = buildPersistedSignPreviewProps(design, artworkUrl);

  const productLabel = formatCheckoutProductLabel({
    material: design.material,
    magnetSizeName: params.magnetSizeName,
    magnetSizeDimensionsLabel: params.magnetSizeDimensionsLabel,
  });

  return {
    quantity: params.quantity,
    materialLabel: materialLabel(design.material),
    backgroundName: previewBackground?.name ?? "—",
    styleName: styleNameFromDesign(design),
    magnetSizeName: params.magnetSizeName,
    magnetSizeDimensionsLabel: params.magnetSizeDimensionsLabel,
    productLabel,
    design: previewProps.design,
    integratedFinalPreview: previewProps.integratedFinalPreview,
    previewBackground,
    hasValidDesign: true,
    artworkUrl,
    unitPriceDisplay: params.unitPriceDisplay,
    lineTotalDisplay: params.lineTotalDisplay,
  };
}

export { buildCheckoutCommercialForOrder } from "@/lib/checkout/buildCheckoutCommercialForOrder";

export async function buildCheckoutPageFromOrder(params: {
  orderId: string;
  order: OrderLikeForResolveItems & {
    customer?: { fullName?: string; phone?: string; email?: string } | null;
    notes?: string | null;
    checkoutSelection?: { shippingMethodId?: string } | null;
    commercialSnapshot?: unknown;
    status?: string;
  };
}): Promise<CheckoutPageDto> {
  const resolved = resolveOrderItems(params.order);

  const customer: CheckoutCustomerDto = {
    fullName: params.order.customer?.fullName ?? "",
    phone: params.order.customer?.phone ?? "",
    email: params.order.customer?.email ?? "",
  };

  if (resolved.length === 0) {
    const commercial: CheckoutCommercialDto = {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
    return {
      orderId: params.orderId,
      items: [],
      hasValidDesign: false,
      customer,
      notes: params.order.notes ?? "",
      commercial,
      canSaveCommercialCheckout: false,
      canInitiatePayment: false,
    };
  }

  const commercial = await buildCheckoutCommercialForOrder({
    order: params.order,
    savedShippingMethodId: params.order.checkoutSelection?.shippingMethodId,
  });

  const canSaveCommercialCheckout = commercial.available;
  const canInitiatePayment =
    commercial.available &&
    commercial.selectionValid &&
    Boolean(commercial.selectedShippingMethodId) &&
    (commercial.pricingMode === "multi_v2" ||
      commercial.pricingMode === "legacy") &&
    commercial.summary.totalAmountMinor !== null;

  const storeDoc = await loadStoreSettingsDocument();
  const magnetCatalog =
    storeDoc?.pricing && storeDoc.magnetSizes
      ? resolveMagnetSizeCatalog({
          ...storeDoc.pricing,
          magnetSizes: storeDoc.magnetSizes,
        })
      : null;

  const lineIds = resolved.map((l) => l.lineId);
  const priceByLineId = new Map(
    commercial.available && commercial.pricingMode === "multi_v2"
      ? commercial.lineItems.map((l) => [l.lineId, l] as const)
      : [],
  );

  const items: CheckoutLineItemDto[] = [];
  for (const line of resolved) {
    let magnetSizeName: string | null = null;
    let magnetSizeDimensionsLabel: string | null = null;
    const designParsed = parseLineDesign(line.design);
    if (
      designParsed?.material === "magnet" &&
      designParsed.magnetSizeId &&
      magnetCatalog
    ) {
      const size = findMagnetSizeInCatalog(magnetCatalog, designParsed.magnetSizeId);
      magnetSizeName = size?.name ?? null;
      magnetSizeDimensionsLabel = size?.dimensionsLabel ?? null;
    }

    const priced = priceByLineId.get(line.lineId);
    items.push(
      await buildCheckoutLineItemDto({
        orderId: params.orderId,
        lineId: line.lineId,
        quantity: line.quantity,
        designRaw: line.design,
        magnetSizeName,
        magnetSizeDimensionsLabel,
        unitPriceDisplay: priced?.unitPriceDisplay ?? null,
        lineTotalDisplay: priced?.lineTotalDisplay ?? null,
      }),
    );
  }

  void mergeLineCommercialIntoCheckoutItems(items, lineIds, commercial);

  const hasValidDesign = items.some((item) => item.hasValidDesign);

  return {
    orderId: params.orderId,
    items,
    hasValidDesign,
    customer,
    notes: params.order.notes ?? "",
    commercial,
    canSaveCommercialCheckout,
    canInitiatePayment,
  };
}
