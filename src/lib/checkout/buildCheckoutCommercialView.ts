import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
  CHECKOUT_SHIPPING_LINE_PENDING,
  CHECKOUT_STALE_SHIPPING_MESSAGE,
} from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import { computeDraftOrderCommercialAmounts } from "@/lib/orders/computeOrderCommercial";
import { orderDesignSchema } from "@/lib/orders/orderDesignSchema";
import { formatCheckoutProductLabel } from "@/lib/checkout/formatProductLabelForCheckout";
import {
  findMagnetSizeInCatalog,
  MagnetSizeNotAvailableError,
  resolveMagnetSizeCatalog,
} from "@/lib/store/magnetSizes";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { resolveProductPriceMinor } from "@/lib/store/resolveProductPriceMinor";
import {
  isPricingReady,
  isShippingMethodCustomerReady,
} from "@/lib/store/storeSettingsCompleteness";
import type { Material } from "@/types/signDesign";

export type CheckoutShippingMethodOptionDto = {
  methodId: string;
  displayName: string;
  amountMinor: number;
  displayAmount: string;
  instructions: string;
};

export type CheckoutLineCommercialDto = {
  lineId: string;
  quantity: number;
  description: string;
  unitPriceMinor: number;
  lineTotalMinor: number;
  unitPriceDisplay: string;
  lineTotalDisplay: string;
};

export type CheckoutCommercialSummaryDto = {
  productLabel: string;
  productDisplay: string;
  shippingDisplay: string;
  totalDisplay: string | null;
  productAmountMinor: number;
  shippingAmountMinor: number | null;
  totalAmountMinor: number | null;
};

export type CheckoutCommercialDto =
  | {
      available: false;
      message: string;
    }
  | {
      available: true;
      pricingMode: "legacy";
      priceSource: "live" | "frozen";
      product: {
        material: Material;
        materialLabel: string;
        productDescription: string;
        amountMinor: number;
        displayAmount: string;
      };
      shippingMethods: CheckoutShippingMethodOptionDto[];
      selectedShippingMethodId: string | null;
      selectionValid: boolean;
      staleSelectionMessage: string | null;
      summary: CheckoutCommercialSummaryDto;
    }
  | {
      available: true;
      pricingMode: "multi_v2";
      priceSource: "live" | "frozen";
      lineItems: CheckoutLineCommercialDto[];
      shippingMethods: CheckoutShippingMethodOptionDto[];
      selectedShippingMethodId: string | null;
      selectionValid: boolean;
      staleSelectionMessage: string | null;
      summary: CheckoutCommercialSummaryDto;
    };

function materialLabel(material: Material): string {
  return material === "wood" ? "עץ" : material === "magnet" ? "מגנט" : "—";
}

export function buildSummary(params: {
  materialLabel: string;
  productAmountMinor: number;
  selectedMethod: CheckoutShippingMethodOptionDto | null;
}): CheckoutCommercialSummaryDto {
  const productDisplay = formatMinorForCheckoutDisplay(params.productAmountMinor);

  if (!params.selectedMethod) {
    return {
      productLabel: params.materialLabel,
      productDisplay,
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: params.productAmountMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  const totals = computeCheckoutTotals(
    params.productAmountMinor,
    params.selectedMethod.amountMinor,
  );
  if (!totals.ok) {
    return {
      productLabel: params.materialLabel,
      productDisplay,
      shippingDisplay: CHECKOUT_SHIPPING_LINE_PENDING,
      totalDisplay: null,
      productAmountMinor: params.productAmountMinor,
      shippingAmountMinor: null,
      totalAmountMinor: null,
    };
  }

  return {
    productLabel: params.materialLabel,
    productDisplay,
    shippingDisplay: formatMinorForCheckoutDisplay(params.selectedMethod.amountMinor),
    totalDisplay: formatMinorForCheckoutDisplay(totals.totalAmountMinor),
    productAmountMinor: totals.productAmountMinor,
    shippingAmountMinor: totals.shippingAmountMinor,
    totalAmountMinor: totals.totalAmountMinor,
  };
}

export async function buildCheckoutCommercialView(params: {
  design: unknown;
  savedShippingMethodId?: string | null;
}): Promise<CheckoutCommercialDto> {
  const designParsed = orderDesignSchema.safeParse(params.design);
  if (!designParsed.success) {
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  const material = designParsed.data.material;
  const doc = await loadStoreSettingsDocument();
  if (!doc || !isPricingReady({ ...doc.pricing, magnetSizes: doc.magnetSizes })) {
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  const pricingInput = { ...doc.pricing, magnetSizes: doc.magnetSizes };
  let productAmountMinor: number;
  try {
    productAmountMinor = resolveProductPriceMinor({
      pricing: pricingInput,
      material,
      magnetSizeId: designParsed.data.magnetSizeId,
    });
  } catch (err) {
    if (err instanceof MagnetSizeNotAvailableError) {
      return {
        available: false,
        message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
      };
    }
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  const shippingMethods: CheckoutShippingMethodOptionDto[] = doc.shippingMethods
    .filter(isShippingMethodCustomerReady)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      methodId: m.id,
      displayName: m.displayName.trim(),
      amountMinor: m.priceMinor!,
      displayAmount: formatMinorForCheckoutDisplay(m.priceMinor!),
      instructions: m.instructions?.trim() ?? "",
    }));

  const savedId = params.savedShippingMethodId?.trim() || null;
  const methodById = new Map(shippingMethods.map((m) => [m.methodId, m]));

  let selectionValid = false;
  let selectedShippingMethodId: string | null = null;
  let staleSelectionMessage: string | null = null;

  if (savedId && methodById.has(savedId)) {
    selectionValid = true;
    selectedShippingMethodId = savedId;
  } else if (savedId) {
    selectionValid = false;
    selectedShippingMethodId = null;
    staleSelectionMessage = CHECKOUT_STALE_SHIPPING_MESSAGE;
  }

  const selectedMethod = selectedShippingMethodId
    ? methodById.get(selectedShippingMethodId) ?? null
    : null;

  const materialLabelText = materialLabel(material);
  const magnetCatalog = resolveMagnetSizeCatalog(pricingInput);
  const selectedMagnetSize =
    material === "magnet" && designParsed.data.magnetSizeId
      ? findMagnetSizeInCatalog(magnetCatalog, designParsed.data.magnetSizeId)
      : null;
  const productDescription = formatCheckoutProductLabel({
    material,
    magnetSizeName: selectedMagnetSize?.name,
    magnetSizeDimensionsLabel: selectedMagnetSize?.dimensionsLabel,
  });
  let summary = buildSummary({
    materialLabel: productDescription,
    productAmountMinor,
    selectedMethod,
  });

  if (selectionValid && selectedShippingMethodId) {
    const computed = await computeDraftOrderCommercialAmounts({
      design: params.design,
      shippingMethodId: selectedShippingMethodId,
    });
    if (computed.ok) {
      const { amounts } = computed;
      const desc = formatCheckoutProductLabel({
        material: amounts.material,
        magnetSizeName: amounts.magnetSizeName,
        magnetSizeDimensionsLabel: amounts.magnetSizeDimensionsLabel,
      });
      summary = {
        productLabel: desc,
        productDisplay: formatMinorForCheckoutDisplay(amounts.productAmountMinor),
        shippingDisplay: formatMinorForCheckoutDisplay(amounts.shippingAmountMinor),
        totalDisplay: formatMinorForCheckoutDisplay(amounts.totalAmountMinor),
        productAmountMinor: amounts.productAmountMinor,
        shippingAmountMinor: amounts.shippingAmountMinor,
        totalAmountMinor: amounts.totalAmountMinor,
      };
    }
  }

  return {
    available: true,
    pricingMode: "legacy",
    priceSource: "live",
    product: {
      material,
      materialLabel: materialLabelText,
      productDescription,
      amountMinor: productAmountMinor,
      displayAmount: formatMinorForCheckoutDisplay(productAmountMinor),
    },
    shippingMethods,
    selectedShippingMethodId,
    selectionValid,
    staleSelectionMessage,
    summary,
  };
}

export async function loadCheckoutShippingMethodOptions(): Promise<
  CheckoutShippingMethodOptionDto[]
> {
  const doc = await loadStoreSettingsDocument();
  if (!doc) {
    return [];
  }
  return doc.shippingMethods
    .filter(isShippingMethodCustomerReady)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((m) => ({
      methodId: m.id,
      displayName: m.displayName.trim(),
      amountMinor: m.priceMinor!,
      displayAmount: formatMinorForCheckoutDisplay(m.priceMinor!),
      instructions: m.instructions?.trim() ?? "",
    }));
}

export function buildCommercialSummaryForMultiV2Selection(
  commercial: Extract<CheckoutCommercialDto, { available: true; pricingMode: "multi_v2" }>,
  selectedMethod: CheckoutShippingMethodOptionDto,
): CheckoutCommercialSummaryDto {
  return buildSummary({
    materialLabel: "מוצרים",
    productAmountMinor: commercial.summary.productAmountMinor,
    selectedMethod,
  });
}

export function resolveSelectedShippingMethod(
  commercial: Extract<CheckoutCommercialDto, { available: true }>,
  methodId: string,
): CheckoutShippingMethodOptionDto | null {
  return commercial.shippingMethods.find((m) => m.methodId === methodId) ?? null;
}

export function buildCommercialSummaryForSelection(
  commercial: Extract<CheckoutCommercialDto, { available: true; pricingMode: "legacy" }>,
  selectedMethod: CheckoutShippingMethodOptionDto,
): CheckoutCommercialSummaryDto {
  return buildSummary({
    materialLabel: commercial.product.productDescription,
    productAmountMinor: commercial.product.amountMinor,
    selectedMethod,
  });
}
