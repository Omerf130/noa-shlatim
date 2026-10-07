import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { resolveProductPriceMinor } from "@/lib/store/resolveProductPriceMinor";
import type { ProductPricingInput } from "@/lib/store/resolveProductPriceMinor";

export type CartLinePricing = {
  unitPriceMinor: number;
  lineTotalMinor: number;
  unitPriceLabel: string;
  lineTotalLabel: string;
};

export function resolveCartLinePricing(params: {
  design: OrderDesignSnapshot;
  pricingInput: ProductPricingInput;
  quantity: number;
}): CartLinePricing {
  const unitPriceMinor = resolveProductPriceMinor({
    pricing: params.pricingInput,
    material: params.design.material,
    magnetSizeId: params.design.magnetSizeId,
  });
  const lineTotalMinor = unitPriceMinor * params.quantity;
  return {
    unitPriceMinor,
    lineTotalMinor,
    unitPriceLabel: formatMinorForCheckoutDisplay(unitPriceMinor),
    lineTotalLabel: formatMinorForCheckoutDisplay(lineTotalMinor),
  };
}
