import { authorizeCartFromCookie } from "@/lib/cart/authorizeCartAccess";
import {
  assertSafeCartDetailDto,
  buildCartDetailDto,
  buildCartLineDetailDto,
  EMPTY_CART_DETAIL,
  type CartDetailDto,
} from "@/lib/cart/cartDetailDto";
import { parseCartLineDesign } from "@/lib/cart/parseCartLineDesign";
import { resolveCartLineAvailability } from "@/lib/cart/resolveCartLineAvailability";
import { resolveCartLinePricing } from "@/lib/cart/resolveCartLinePricing";
import { findMagnetSizeForDisplay } from "@/lib/cart/resolveMagnetSizeDisplay";
import { normalizedCartItemQuantity } from "@/lib/cart/cartSummary";
import { userMessageForOrderCode } from "@/lib/orders/errors";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import type { ProductPricingInput } from "@/lib/store/resolveProductPriceMinor";
import type { CartItemDocument } from "@/models/Cart";

async function lineToDto(
  item: CartItemDocument,
  pricingInput: ProductPricingInput,
) {
  const quantity = normalizedCartItemQuantity(item.quantity);
  const design = parseCartLineDesign(item.design);

  if (!design) {
    return buildCartLineDetailDto({
      lineId: item.lineId,
      quantity,
      material: "wood",
      availability: "unavailable",
      unavailableReason: userMessageForOrderCode("INVALID_DESIGN"),
    });
  }

  const magnetDisplay = findMagnetSizeForDisplay(pricingInput, design.magnetSizeId);
  const availabilityResult = await resolveCartLineAvailability({
    design,
    pricingInput,
  });

  if (availabilityResult.availability === "unavailable") {
    return buildCartLineDetailDto({
      lineId: item.lineId,
      quantity,
      material: design.material,
      magnetSizeId: design.magnetSizeId,
      magnetSizeName: magnetDisplay?.name,
      magnetSizeDimensionsLabel: magnetDisplay?.dimensionsLabel,
      availability: "unavailable",
      unavailableReason: availabilityResult.unavailableReason,
    });
  }

  const pricing = resolveCartLinePricing({
    design,
    pricingInput,
    quantity,
  });

  return buildCartLineDetailDto({
    lineId: item.lineId,
    quantity,
    material: design.material,
    magnetSizeId: design.magnetSizeId,
    magnetSizeName: magnetDisplay?.name ?? (design.material === "magnet" ? "מגנט" : undefined),
    magnetSizeDimensionsLabel: magnetDisplay?.dimensionsLabel,
    availability: "available",
    pricing,
  });
}

export async function getCartDetailForRequest(
  request?: Request,
): Promise<CartDetailDto> {
  const authorized = await authorizeCartFromCookie(request);
  if (!authorized) {
    return EMPTY_CART_DETAIL;
  }

  const items = authorized.cart.items ?? [];
  if (items.length === 0) {
    const status =
      authorized.cart.status === "converted" ? "converted" : "empty";
    return buildCartDetailDto({
      status: authorized.cart.status === "active" ? "empty" : status,
      lines: [],
      totalQuantity: 0,
    });
  }

  const settings = await loadStoreSettingsDocument();
  const pricingInput: ProductPricingInput = settings
    ? { ...settings.pricing, magnetSizes: settings.magnetSizes }
    : {};

  const lines = await Promise.all(items.map((item) => lineToDto(item, pricingInput)));

  let totalQuantity = 0;
  for (const item of items) {
    totalQuantity += normalizedCartItemQuantity(item.quantity);
  }

  const dto = buildCartDetailDto({
    status: authorized.cart.status,
    lines,
    totalQuantity,
  });
  assertSafeCartDetailDto(dto);
  return dto;
}
