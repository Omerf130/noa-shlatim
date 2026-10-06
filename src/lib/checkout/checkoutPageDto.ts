import { getIllustrationStyleById } from "@/data/illustrationStyles";
import type { SignBackground } from "@/types/signBackground";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import { buildPersistedSignPreviewProps } from "@/lib/orders/persistedOrderSignPreview";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { SignDesignState } from "@/types/signDesign";
import type { Material } from "@/types/signDesign";

export type CheckoutCustomerDto = {
  fullName: string;
  phone: string;
  email: string;
};

export type CheckoutPageDto = {
  orderId: string;
  hasValidDesign: boolean;
  material: Material;
  materialLabel: string;
  backgroundName: string;
  styleName: string | null;
  design: SignDesignState | null;
  integratedFinalPreview: IntegratedFinalPreviewConfig | null;
  previewBackground: SignBackground | null;
  customer: CheckoutCustomerDto;
  notes: string;
  commercial: CheckoutCommercialDto;
  canSaveCommercialCheckout: boolean;
};

function styleNameFromOrderDesign(design: OrderDesignSnapshot): string | null {
  if (design.creationMode !== "photo") {
    return null;
  }
  return getIllustrationStyleById(design.photoIllustrationStyleId)?.name ?? null;
}

export function buildCheckoutPageDto(params: {
  orderId: string;
  design: OrderDesignSnapshot;
  customer?: CheckoutCustomerDto | null;
  notes?: string | null;
  commercial: CheckoutCommercialDto;
  previewBackground: SignBackground | null;
  backgroundName: string;
}): CheckoutPageDto {
  const { orderId, design, commercial } = params;
  const artworkUrl = `/api/orders/${orderId}/artwork`;

  const customer = params.customer ?? {
    fullName: "",
    phone: "",
    email: "",
  };

  const materialLabel =
    design.material === "wood" ? "עץ" : design.material === "magnet" ? "מגנט" : "—";

  const previewProps = buildPersistedSignPreviewProps(design, artworkUrl);

  return {
    orderId,
    hasValidDesign: true,
    material: design.material,
    materialLabel,
    backgroundName: params.backgroundName,
    styleName: styleNameFromOrderDesign(design),
    design: previewProps.design,
    integratedFinalPreview: previewProps.integratedFinalPreview,
    previewBackground: params.previewBackground,
    customer: {
      fullName: customer.fullName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    },
    notes: params.notes ?? "",
    commercial,
    canSaveCommercialCheckout: commercial.available,
  };
}

export function buildCheckoutPageDtoWithoutDesign(params: {
  orderId: string;
  customer?: CheckoutCustomerDto | null;
  notes?: string | null;
  commercial: CheckoutCommercialDto;
}): CheckoutPageDto {
  const customer = params.customer ?? {
    fullName: "",
    phone: "",
    email: "",
  };

  return {
    orderId: params.orderId,
    hasValidDesign: false,
    material: "wood",
    materialLabel: "—",
    backgroundName: "—",
    styleName: null,
    design: null,
    integratedFinalPreview: null,
    previewBackground: null,
    customer: {
      fullName: customer.fullName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    },
    notes: params.notes ?? "",
    commercial: params.commercial,
    canSaveCommercialCheckout: false,
  };
}

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
