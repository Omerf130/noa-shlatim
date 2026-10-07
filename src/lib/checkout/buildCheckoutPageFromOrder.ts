import { loadBackgroundForRenderAsSignBackground } from "@/lib/backgrounds/loadBackgrounds";
import { isAllowedStyleId } from "@/lib/ai/illustrationPrompts";
import {
  buildCheckoutCommercialView,
  buildCheckoutShippingOnlyCommercialView,
} from "@/lib/checkout/buildCheckoutCommercialView";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
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
import {
  orderHasPersistedCheckoutItems,
  resolveOrderItems,
} from "@/lib/orders/resolveOrderItems";
import type { OrderLikeForResolveItems } from "@/lib/orders/resolveOrderItems";
import {
  findMagnetSizeInCatalog,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { getIllustrationStyleById } from "@/data/illustrationStyles";

export const CHECKOUT_PAYMENT_DEFERRED_CUSTOMER_MESSAGE =
  "תשלום מקוון ייפתח בהמשך. ניתן להשלים כעת פרטי התקשרות ושיטת משלוח.";

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
  };
}

export async function buildCheckoutCommercialForOrder(params: {
  order: OrderLikeForResolveItems;
  savedShippingMethodId?: string | null;
}): Promise<CheckoutCommercialDto> {
  const cartOrigin = orderHasPersistedCheckoutItems(params.order);
  if (cartOrigin) {
    return buildCheckoutShippingOnlyCommercialView({
      savedShippingMethodId: params.savedShippingMethodId,
    });
  }

  const items = resolveOrderItems(params.order);
  const design = items[0]?.design;
  return buildCheckoutCommercialView({
    design,
    savedShippingMethodId: params.savedShippingMethodId,
  });
}

export async function buildCheckoutPageFromOrder(params: {
  orderId: string;
  order: OrderLikeForResolveItems & {
    customer?: { fullName?: string; phone?: string; email?: string } | null;
    notes?: string | null;
    checkoutSelection?: { shippingMethodId?: string } | null;
  };
}): Promise<CheckoutPageDto> {
  const resolved = resolveOrderItems(params.order);
  const cartOrigin = orderHasPersistedCheckoutItems(params.order);

  const customer: CheckoutCustomerDto = {
    fullName: params.order.customer?.fullName ?? "",
    phone: params.order.customer?.phone ?? "",
    email: params.order.customer?.email ?? "",
  };

  const commercial = await buildCheckoutCommercialForOrder({
    order: params.order,
    savedShippingMethodId: params.order.checkoutSelection?.shippingMethodId,
  });

  const canSaveCommercialCheckout = commercial.available;
  const canInitiatePayment =
    commercial.available && commercial.pricingMode === "legacy";

  if (resolved.length === 0) {
    return {
      orderId: params.orderId,
      items: [],
      hasValidDesign: false,
      customer,
      notes: params.order.notes ?? "",
      commercial,
      canSaveCommercialCheckout: false,
      canInitiatePayment: false,
      paymentDeferredMessage: null,
    };
  }

  const storeDoc = await loadStoreSettingsDocument();
  const magnetCatalog =
    storeDoc?.pricing && storeDoc.magnetSizes
      ? resolveMagnetSizeCatalog({
          ...storeDoc.pricing,
          magnetSizes: storeDoc.magnetSizes,
        })
      : null;

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

    items.push(
      await buildCheckoutLineItemDto({
        orderId: params.orderId,
        lineId: line.lineId,
        quantity: line.quantity,
        designRaw: line.design,
        magnetSizeName,
        magnetSizeDimensionsLabel,
      }),
    );
  }

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
    paymentDeferredMessage: cartOrigin ? CHECKOUT_PAYMENT_DEFERRED_CUSTOMER_MESSAGE : null,
  };
}
