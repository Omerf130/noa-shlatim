import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import {
  checkoutIntegratedFinalPreview,
  photoOrderDesignToSignDesignState,
} from "@/lib/checkout/orderDesignToSignPreview";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
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
  material: Material;
  materialLabel: string;
  backgroundName: string;
  styleName: string | null;
  design: SignDesignState;
  integratedFinalPreview: IntegratedFinalPreviewConfig;
  customer: CheckoutCustomerDto;
  notes: string;
};

export function buildCheckoutPageDto(params: {
  orderId: string;
  design: PhotoOrderDesignSnapshot;
  customer?: CheckoutCustomerDto | null;
  notes?: string | null;
}): CheckoutPageDto {
  const { orderId, design } = params;
  const artworkUrl = `/api/orders/${orderId}/artwork`;

  const customer = params.customer ?? {
    fullName: "",
    phone: "",
    email: "",
  };

  const materialLabel =
    design.material === "wood" ? "עץ" : design.material === "magnet" ? "מגנט" : "—";

  return {
    orderId,
    material: design.material,
    materialLabel,
    backgroundName: getBackgroundById(design.backgroundId)?.name ?? "—",
    styleName: getIllustrationStyleById(design.photoIllustrationStyleId)?.name ?? null,
    design: photoOrderDesignToSignDesignState(design),
    integratedFinalPreview: checkoutIntegratedFinalPreview(artworkUrl),
    customer: {
      fullName: customer.fullName ?? "",
      phone: customer.phone ?? "",
      email: customer.email ?? "",
    },
    notes: params.notes ?? "",
  };
}

export type CheckoutSaveResponseDto = {
  ok: true;
  customer: CheckoutCustomerDto;
  notes: string;
};

export function buildCheckoutSaveResponseDto(order: {
  customer?: CheckoutCustomerDto | null;
  notes?: string | null;
}): CheckoutSaveResponseDto {
  return {
    ok: true,
    customer: {
      fullName: order.customer?.fullName ?? "",
      phone: order.customer?.phone ?? "",
      email: order.customer?.email ?? "",
    },
    notes: order.notes ?? "",
  };
}
