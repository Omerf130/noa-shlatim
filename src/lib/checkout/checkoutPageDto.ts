import type { SignBackground } from "@/types/signBackground";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { SignDesignState } from "@/types/signDesign";

export type CheckoutCustomerDto = {
  fullName: string;
  phone: string;
  email: string;
};

export type CheckoutLineItemDto = {
  quantity: number;
  materialLabel: string;
  backgroundName: string;
  styleName: string | null;
  magnetSizeName: string | null;
  magnetSizeDimensionsLabel: string | null;
  productLabel: string;
  design: SignDesignState | null;
  integratedFinalPreview: IntegratedFinalPreviewConfig | null;
  previewBackground: SignBackground | null;
  hasValidDesign: boolean;
  /** Authenticated API route only — not a private blob path. */
  artworkUrl: string;
  unitPriceDisplay: string | null;
  lineTotalDisplay: string | null;
};

export type CheckoutPageDto = {
  orderId: string;
  items: CheckoutLineItemDto[];
  hasValidDesign: boolean;
  customer: CheckoutCustomerDto;
  notes: string;
  commercial: CheckoutCommercialDto;
  canSaveCommercialCheckout: boolean;
  canInitiatePayment: boolean;
};

export type CheckoutSaveResponseDto = {
  ok: true;
  customer: CheckoutCustomerDto;
  notes: string;
  selectedShippingMethodId: string;
  commercial: Extract<CheckoutCommercialDto, { available: true }>;
};

export function buildCheckoutSaveResponseDto(params: {
  customer: CheckoutCustomerDto;
  notes: string;
  selectedShippingMethodId: string;
  commercial: Extract<CheckoutCommercialDto, { available: true }>;
}): CheckoutSaveResponseDto {
  return {
    ok: true,
    customer: params.customer,
    notes: params.notes,
    selectedShippingMethodId: params.selectedShippingMethodId,
    commercial: params.commercial,
  };
}
