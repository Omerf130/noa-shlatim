import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  applyPromotionPricingToCartDetail,
  assertSafeCartDetailDto,
  buildCartDetailDto,
  buildCartLineDetailDto,
} from "@/lib/cart/cartDetailDto";
import { resolveCartLinePricing } from "@/lib/cart/resolveCartLinePricing";
import { buildCheckoutCommercialSummaryWithPromotions } from "@/lib/promotions/buildCheckoutPromotionSummary";
import { resolveLivePromotionPricing } from "@/lib/promotions/resolvePromotionPricing";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import type { PromotionForEngine } from "@/lib/promotions/promotionEngineTypes";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const magnetSizeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
const magnetSizeSmall = "bbbbbbbb-bbbb-cccc-dddd-eeeeeeeeeeee";

const pricingInput = {
  woodEnabled: true,
  magnetEnabled: true,
  woodPriceMinor: 12_000,
  magnetPriceMinor: 5_000,
  magnetSizes: [
    {
      id: magnetSizeId,
      name: "גדול",
      dimensionsLabel: "",
      priceMinor: 8_900,
      enabled: true,
      sortOrder: 0,
    },
    {
      id: magnetSizeSmall,
      name: "קטן",
      dimensionsLabel: "",
      priceMinor: 6_900,
      enabled: true,
      sortOrder: 1,
    },
  ],
};

const magnetDesign = (sizeId: string): OrderDesignSnapshot => ({
  creationMode: "illustration",
  backgroundId: "bg-1",
  material: "magnet",
  magnetSizeId: sizeId,
  text: {
    value: "שלום",
    color: { kind: "solid", hex: "#112233" },
    size: 24,
    position: "center",
    fontStyle: "clean",
    offsetX: 0,
    offsetY: 0,
  },
  illustrationTransform: { x: 0.5, y: 0.5, scale: 1 },
  decorations: [],
});

const familyPromo = (): PromotionForEngine => ({
  promotionId: "family-1",
  internalName: "internal-family",
  bannerText: "מבצע משפחתי",
  bundlePriceMinor: 14_900,
  requirements: [
    { magnetSizeId, quantity: 2 },
    { magnetSizeId: magnetSizeSmall, quantity: 1 },
  ],
});

describe("cart live promotion pricing", () => {
  it("25-29: qualifying cart receives correct totals", async () => {
    const lineLarge = buildCartLineDetailDto({
      lineId: "11111111-1111-4111-8111-111111111111",
      quantity: 2,
      material: "magnet",
      magnetSizeId,
      availability: "available",
      pricing: resolveCartLinePricing({
        design: magnetDesign(magnetSizeId),
        pricingInput,
        quantity: 2,
      }),
    });
    const lineSmall = buildCartLineDetailDto({
      lineId: "22222222-2222-4222-8222-222222222222",
      quantity: 1,
      material: "magnet",
      magnetSizeId: magnetSizeSmall,
      availability: "available",
      pricing: resolveCartLinePricing({
        design: magnetDesign(magnetSizeSmall),
        pricingInput,
        quantity: 1,
      }),
    });
    let dto = buildCartDetailDto({
      status: "active",
      totalQuantity: 3,
      lines: [lineLarge, lineSmall],
    });

    const pricedLines = dto.lines
      .filter((l) => l.availability === "available")
      .map((l) => ({
        material: l.material as "magnet",
        magnetSizeId: l.magnetSizeId,
        quantity: l.quantity,
        unitPriceMinor: l.unitPriceMinor!,
        lineTotalMinor: l.lineTotalMinor!,
      }));

    const promo = await resolveLivePromotionPricing({
      lines: pricedLines,
      pricingInput,
      promotionsOverride: [familyPromo()],
    });

    dto = applyPromotionPricingToCartDetail(dto, {
      catalogSubtotalMinor: promo.catalogSubtotalMinor,
      discountMinor: promo.discountMinor,
      productTotalMinor: promo.productTotalMinor,
      applications: promo.applications.map((a) => ({
        customerLabel: a.customerLabel,
        applicationCount: a.applicationCount,
        savingsLabel: a.savingsLabel,
      })),
      promotionMessage: promo.promotionMessage,
    });

    assert.equal(dto.catalogSubtotalMinor, 8_900 * 2 + 6_900);
    assert.equal(dto.productTotalMinor, 14_900);
    assert.ok(dto.discountMinor > 0);
    assertSafeCartDetailDto(dto);
    assert.doesNotMatch(JSON.stringify(dto), /promotionId|internalName|internal-family/i);
  });

  it("26: non-qualifying quantity yields zero discount", async () => {
    const promo = await resolveLivePromotionPricing({
      lines: [
        {
          material: "magnet",
          magnetSizeId,
          quantity: 1,
          unitPriceMinor: 8_900,
          lineTotalMinor: 8_900,
        },
      ],
      pricingInput,
      promotionsOverride: [familyPromo()],
    });
    assert.equal(promo.discountMinor, 0);
  });
});

describe("checkout live promotion summary", () => {
  it("38-44: summary uses net product for shipping total", async () => {
    const promo = await resolveLivePromotionPricing({
      lines: [
        {
          material: "magnet",
          magnetSizeId,
          quantity: 2,
          unitPriceMinor: 8_900,
          lineTotalMinor: 17_800,
        },
        {
          material: "magnet",
          magnetSizeId: magnetSizeSmall,
          quantity: 1,
          unitPriceMinor: 6_900,
          lineTotalMinor: 6_900,
        },
      ],
      pricingInput,
      promotionsOverride: [familyPromo()],
    });

    const summary = buildCheckoutCommercialSummaryWithPromotions({
      promotionPricing: promo,
      selectedMethod: {
        methodId: "ship-1",
        displayName: "דואר",
        amountMinor: 2_000,
        displayAmount: "₪20",
        instructions: "",
      },
    });

    assert.equal(summary.netProductAmountMinor, 14_900);
    assert.equal(summary.totalAmountMinor, 14_900 + 2_000);
    assert.ok((summary.discountMinor ?? 0) > 0);
  });

  it("49: CheckoutOrderSummary does not compute promotion eligibility", () => {
    const src = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutOrderSummary.tsx"),
      "utf8",
    );
    assert.doesNotMatch(src, /resolveLivePromotionPricing|computeOptimalPromotions/);
    assert.match(src, /catalogProductDisplay|netProductAmountMinor/);
  });

  it("53: payment init route does not use Phase 2 promotion block", () => {
    const src = readFileSync(
      join(repoRoot, "src/app/api/orders/[orderId]/payment/init/route.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /assertPromotionPaymentAllowed/);
    assert.match(src, /acknowledgedTotalAmountMinor/);
  });
});
