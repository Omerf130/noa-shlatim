import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  assertSafeCartDetailDto,
  buildCartDetailDto,
  buildCartLineDetailDto,
  EMPTY_CART_DETAIL,
} from "@/lib/cart/cartDetailDto";
import { parseCartLineQuantity } from "@/lib/cart/validateCartLineQuantity";
import { CartError } from "@/lib/cart/cartErrors";
import { resolveCartLinePricing } from "@/lib/cart/resolveCartLinePricing";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { validateDesignProductAvailability } from "@/lib/orders/validateDesignForPurchase";
import { cartLineArtworkApiPath } from "@/lib/cart/cartLineArtworkUrl";
import { blobPathnamesForLineTest } from "@/lib/cart/removeCartLine.testHelpers";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

const woodDesign: OrderDesignSnapshot = {
  creationMode: "illustration",
  backgroundId: "bg-1",
  material: "wood",
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
};

const magnetSizeId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";

const pricing = {
  woodEnabled: true,
  magnetEnabled: true,
  woodPriceMinor: 12_000,
  magnetPriceMinor: 5_000,
  magnetSizes: [
    {
      id: magnetSizeId,
      name: "מגנט גדול",
      dimensionsLabel: "15×15",
      priceMinor: 7_500,
      enabled: true,
      sortOrder: 0,
    },
  ],
};

describe("empty cart detail", () => {
  it("CASE 1-2: no cart / empty returns empty DTO", () => {
    assert.equal(EMPTY_CART_DETAIL.status, "empty");
    assert.equal(EMPTY_CART_DETAIL.lines.length, 0);
    assert.equal(EMPTY_CART_DETAIL.canCheckout, false);
  });
});

describe("safe cart detail DTO", () => {
  it("CASE 3: does not expose secrets or pathnames", () => {
    const dto = buildCartDetailDto({
      status: "active",
      totalQuantity: 1,
      lines: [
        buildCartLineDetailDto({
          lineId: "22222222-2222-4222-8222-222222222222",
          quantity: 1,
          material: "wood",
          availability: "available",
          pricing: resolveCartLinePricing({
            design: woodDesign,
            pricingInput: pricing,
            quantity: 1,
          }),
        }),
      ],
    });
    assertSafeCartDetailDto(dto);
    assert.match(dto.lines[0]!.artworkUrl, /^\/api\/cart\/items\//);
    assert.doesNotMatch(JSON.stringify(dto), /pathname|addIdempotencyKey|accessToken/i);
  });
});

describe("live pricing", () => {
  it("CASE 4: wood line uses current wood price", () => {
    const p = resolveCartLinePricing({
      design: woodDesign,
      pricingInput: pricing,
      quantity: 1,
    });
    assert.equal(p.unitPriceMinor, 12_000);
    assert.equal(p.lineTotalMinor, 12_000);
  });

  it("CASE 5-6: magnet size price and quantity multiply", () => {
    const magnetDesign: OrderDesignSnapshot = {
      ...woodDesign,
      material: "magnet",
      magnetSizeId,
    };
    const p = resolveCartLinePricing({
      design: magnetDesign,
      pricingInput: pricing,
      quantity: 3,
    });
    assert.equal(p.unitPriceMinor, 7_500);
    assert.equal(p.lineTotalMinor, 22_500);
  });

  it("CASE 8: subtotal sums available line totals only", () => {
    const dto = buildCartDetailDto({
      status: "active",
      totalQuantity: 3,
      lines: [
        buildCartLineDetailDto({
          lineId: "a",
          quantity: 2,
          material: "wood",
          availability: "available",
          pricing: resolveCartLinePricing({
            design: woodDesign,
            pricingInput: pricing,
            quantity: 2,
          }),
        }),
        buildCartLineDetailDto({
          lineId: "b",
          quantity: 1,
          material: "wood",
          availability: "unavailable",
          unavailableReason: "x",
        }),
      ],
    });
    assert.equal(dto.subtotalMinor, 24_000);
  });
});

describe("availability", () => {
  it("CASE 9-12: disabled material marks unavailable without substitution", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(woodDesign, {
          ...pricing,
          woodEnabled: false,
        }),
    );
    const dto = buildCartDetailDto({
      status: "active",
      totalQuantity: 1,
      lines: [
        buildCartLineDetailDto({
          lineId: "x",
          quantity: 1,
          material: "wood",
          availability: "unavailable",
          unavailableReason: "חומר",
        }),
      ],
    });
    assert.equal(dto.canCheckout, false);
  });

  it("CASE 10-11: unavailable line blocks checkout", () => {
    const dto = buildCartDetailDto({
      status: "active",
      totalQuantity: 1,
      lines: [
        buildCartLineDetailDto({
          lineId: "x",
          quantity: 1,
          material: "magnet",
          availability: "unavailable",
          unavailableReason: "גודל",
        }),
      ],
    });
    assert.equal(dto.canCheckout, false);
  });
});

describe("quantity validation", () => {
  it("CASE 16-17: accepts 1..20 rejects invalid", () => {
    assert.equal(parseCartLineQuantity(1), 1);
    assert.equal(parseCartLineQuantity(20), 20);
    assert.throws(() => parseCartLineQuantity(0), CartError);
    assert.throws(() => parseCartLineQuantity(-1), CartError);
    assert.throws(() => parseCartLineQuantity(21), CartError);
    assert.throws(() => parseCartLineQuantity(1.5), CartError);
  });
});

describe("artwork API path", () => {
  it("CASE 15: artwork URL is cookie-authenticated route", () => {
    const lineId = "22222222-2222-4222-8222-222222222222";
    assert.equal(
      cartLineArtworkApiPath(lineId),
      `/api/cart/items/${lineId}/artwork`,
    );
  });
});

describe("remove line blob paths helper", () => {
  it("CASE 20-21: collects original and artwork paths for cleanup", () => {
    const paths = blobPathnamesForLineTest({
      lineId: "l",
      addIdempotencyKey: "k",
      quantity: 1,
      creationMode: "photo",
      design: {},
      addedAt: "",
      assets: {
        originalImage: {
          pathname: "carts/x/items/l/original.jpg",
          contentType: "image/jpeg",
          sizeBytes: 1,
        },
        finalArtwork: {
          pathname: "carts/x/items/l/artwork.png",
          contentType: "image/png",
          sizeBytes: 1,
        },
      },
    });
    assert.deepEqual(paths, [
      "carts/x/items/l/original.jpg",
      "carts/x/items/l/artwork.png",
    ]);
  });
});

describe("empty cart UX wiring", () => {
  it("CASE 24: empty state links to /create", () => {
    const src = readFileSync(
      join(repoRoot, "src/components/cart/CartPageClient.tsx"),
      "utf8",
    );
    assert.match(src, /הסל שלך עדיין ריק/);
    assert.match(src, /href="\/create"/);
  });
});

describe("Builder success link", () => {
  it("CASE 25: ReviewStep links to /cart", () => {
    const src = readFileSync(
      join(repoRoot, "src/components/builder/steps/ReviewStep.tsx"),
      "utf8",
    );
    assert.match(src, /מעבר לסל/);
    assert.match(src, /href="\/cart"/);
  });
});

describe("pricing trust", () => {
  it("CASE 26: client fetch does not send prices", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/fetchCartDetail.ts"),
      "utf8",
    );
    assert.doesNotMatch(src, /priceMinor[\s\S]*JSON\.stringify/);
    assert.match(src, /quantity/);
  });
});
