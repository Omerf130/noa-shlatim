import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
  CHECKOUT_SHIPPING_LINE_PENDING,
  CHECKOUT_STALE_SHIPPING_MESSAGE,
} from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import { photoOrderDesignSchema } from "@/lib/orders/orderDesignSchema";
import {
  resolveMaterialPriceMinor,
  resolveStoreConfigurationForCheckout,
} from "@/lib/store/resolveStoreConfigurationForCheckout";
import type { Material } from "@/types/signDesign";

export type CheckoutShippingMethodOptionDto = {
  methodId: string;
  displayName: string;
  amountMinor: number;
  displayAmount: string;
  instructions: string;
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
      product: {
        material: Material;
        materialLabel: string;
        amountMinor: number;
        displayAmount: string;
      };
      shippingMethods: CheckoutShippingMethodOptionDto[];
      selectedShippingMethodId: string | null;
      selectionValid: boolean;
      staleSelectionMessage: string | null;
      summary: CheckoutCommercialSummaryDto;
    };

function materialLabel(material: Material): string {
  return material === "wood" ? "עץ" : material === "magnet" ? "מגנט" : "—";
}

function buildSummary(params: {
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
  const designParsed = photoOrderDesignSchema.safeParse(params.design);
  if (!designParsed.success) {
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  const material = designParsed.data.material;
  const storeConfig = await resolveStoreConfigurationForCheckout();
  if (!storeConfig.ok) {
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  let productAmountMinor: number;
  try {
    productAmountMinor = resolveMaterialPriceMinor(storeConfig, material);
  } catch {
    return {
      available: false,
      message: CHECKOUT_COMMERCIAL_UNAVAILABLE_MESSAGE,
    };
  }

  const shippingMethods: CheckoutShippingMethodOptionDto[] =
    storeConfig.shippingMethods.map((m) => ({
      methodId: m.methodId,
      displayName: m.displayName,
      amountMinor: m.priceMinor,
      displayAmount: formatMinorForCheckoutDisplay(m.priceMinor),
      instructions: m.instructions,
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

  return {
    available: true,
    product: {
      material,
      materialLabel: materialLabel(material),
      amountMinor: productAmountMinor,
      displayAmount: formatMinorForCheckoutDisplay(productAmountMinor),
    },
    shippingMethods,
    selectedShippingMethodId,
    selectionValid,
    staleSelectionMessage,
    summary: buildSummary({
      materialLabel: materialLabel(material),
      productAmountMinor,
      selectedMethod,
    }),
  };
}

export function resolveSelectedShippingMethod(
  commercial: Extract<CheckoutCommercialDto, { available: true }>,
  methodId: string,
): CheckoutShippingMethodOptionDto | null {
  return commercial.shippingMethods.find((m) => m.methodId === methodId) ?? null;
}

export function buildCommercialSummaryForSelection(
  commercial: Extract<CheckoutCommercialDto, { available: true }>,
  selectedMethod: CheckoutShippingMethodOptionDto,
): CheckoutCommercialSummaryDto {
  return buildSummary({
    materialLabel: commercial.product.materialLabel,
    productAmountMinor: commercial.product.amountMinor,
    selectedMethod,
  });
}
