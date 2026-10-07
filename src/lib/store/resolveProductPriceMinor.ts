import {
  MagnetSizeNotAvailableError,
  resolveMagnetSizePriceMinor,
} from "@/lib/store/magnetSizes";
import type { StoreMaterialPricingLike } from "@/lib/store/materialAvailability";
import type { Material } from "@/types/signDesign";

export type ProductPricingInput = StoreMaterialPricingLike & {
  magnetSizes?: StoreMaterialPricingLike["magnetSizes"];
};

export function resolveProductPriceMinor(params: {
  pricing: ProductPricingInput;
  material: Material;
  magnetSizeId?: string | null;
}): number {
  const { pricing, material, magnetSizeId } = params;

  if (material === "wood") {
    const price = pricing.woodPriceMinor;
    if (
      price == null ||
      !Number.isInteger(price) ||
      pricing.woodEnabled === false
    ) {
      throw new Error("Material not available for checkout");
    }
    return price;
  }

  if (material === "magnet") {
    if (pricing.magnetEnabled === false) {
      throw new MagnetSizeNotAvailableError();
    }
    return resolveMagnetSizePriceMinor(pricing, magnetSizeId ?? "");
  }

  throw new Error("Material not available for checkout");
}
