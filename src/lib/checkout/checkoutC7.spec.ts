import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { checkoutLineArtworkUrl } from "@/lib/checkout/checkoutArtworkUrl";
import { buildCheckoutPageFromOrder } from "@/lib/checkout/buildCheckoutPageFromOrder"; // CASE 15 only
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import {
  orderHasPersistedCheckoutItems,
  resolveOrderItems,
} from "@/lib/orders/resolveOrderItems";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const orderId = "507f1f77bcf86cd799439012";
const lineA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const lineB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const minimalDesign = {
  creationMode: "illustration" as const,
  backgroundId: "bg-1",
  text: { value: "שלום", fontId: "font-1", color: "#000" },
  illustrationTransform: { x: 0, y: 0, scale: 1, rotation: 0 },
  decorations: [],
  material: "wood" as const,
};

describe("resolveOrderItems checkout boundary", () => {
  it("CASE 1: legacy Order resolves to one Checkout item", () => {
    const items = resolveOrderItems({
      creationMode: "illustration",
      design: minimalDesign,
      assets: {
        finalArtwork: { pathname: "orders/x/artwork.png", contentType: "image/png", sizeBytes: 1 },
      },
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, LEGACY_ORDER_LINE_ID);
    assert.equal(items[0]!.quantity, 1);
  });

  it("CASE 2: items[] resolves to multiple lines", () => {
    const items = resolveOrderItems({
      items: [
        {
          lineId: lineA,
          quantity: 2,
          creationMode: "illustration",
          design: minimalDesign,
          assets: {},
        },
        {
          lineId: lineB,
          quantity: 1,
          creationMode: "illustration",
          design: { ...minimalDesign, text: { ...minimalDesign.text, value: "B" } },
          assets: {},
        },
      ],
    });
    assert.equal(items.length, 2);
    assert.equal(items[0]!.quantity, 2);
  });

  it("CASE 4: items[] wins over legacy top-level", () => {
    const items = resolveOrderItems({
      creationMode: "illustration",
      design: minimalDesign,
      items: [
        {
          lineId: lineA,
          quantity: 1,
          creationMode: "illustration",
          design: minimalDesign,
          assets: {},
        },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, lineA);
    assert.equal(orderHasPersistedCheckoutItems({ items: [{ lineId: lineA, quantity: 1, creationMode: "illustration", design: minimalDesign }] }), true);
  });
});

describe("checkout artwork URLs", () => {
  it("CASE 6-7: legacy vs item artwork routes", () => {
    assert.equal(
      checkoutLineArtworkUrl(orderId, LEGACY_ORDER_LINE_ID),
      `/api/orders/${orderId}/artwork`,
    );
    assert.equal(
      checkoutLineArtworkUrl(orderId, lineA),
      `/api/orders/${orderId}/items/${lineA}/artwork`,
    );
    assert.ok(!checkoutLineArtworkUrl(orderId, lineA).startsWith("orders/"));
  });
});

describe("checkout page DTO safety", () => {
  it("CASE 10: line DTO uses API artwork URLs only", () => {
    const dtoSrc = readFileSync(
      join(repoRoot, "src/lib/checkout/checkoutPageDto.ts"),
      "utf8",
    );
    assert.match(dtoSrc, /artworkUrl: string/);
    assert.doesNotMatch(dtoSrc, /pathname/);
    assert.equal(
      checkoutLineArtworkUrl(orderId, lineA).startsWith("/api/"),
      true,
    );
  });

  it("CASE 15: empty resolved items disables save", async () => {
    const dto = await buildCheckoutPageFromOrder({
      orderId,
      order: {},
    });
    assert.equal(dto.items.length, 0);
    assert.equal(dto.canSaveCommercialCheckout, false);
    assert.equal(dto.canInitiatePayment, false);
  });
});

describe("checkout UI wiring", () => {
  it("CASE 5: lineId not shown in product UI", () => {
    const ui = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutProductItems.tsx"),
      "utf8",
    );
    assert.doesNotMatch(ui, /lineId/);
    assert.doesNotMatch(ui, /legacy/);
  });

  it("CASE 13-14: single shipping + order-level terms", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /CheckoutShippingSelector/);
    assert.ok((form.match(/checkout-terms-accepted/g) ?? []).length >= 1);
  });
});

describe("payment gating", () => {
  it("CASE 16-17: cart_items payment init uses multi-item checkout source", () => {
    const route = readFileSync(
      join(repoRoot, "src/app/api/orders/[orderId]/payment/init/route.ts"),
      "utf8",
    );
    assert.doesNotMatch(route, /checkoutKind === "cart_items"/);
    assert.match(route, /checkoutSource\.items/);
  });

  it("CASE 17: client hides payment when canInitiatePayment false", () => {
    const form = readFileSync(
      join(repoRoot, "src/components/checkout/CheckoutCustomerForm.tsx"),
      "utf8",
    );
    assert.match(form, /canInitiatePayment/);
  });
});

describe("artwork authorization wiring", () => {
  it("CASE 7-9: item artwork uses authorizeCheckoutAccess + line match", () => {
    const route = readFileSync(
      join(repoRoot, "src/app/api/orders/[orderId]/items/[lineId]/artwork/route.ts"),
      "utf8",
    );
    assert.match(route, /authorizeCheckoutAccess/);
    assert.match(route, /item\.lineId === lineId/);
    assert.doesNotMatch(route, /searchParams\.get\("lineId"\)/);
  });

  it("CASE 18: checkout_access required on checkout page", () => {
    const page = readFileSync(
      join(repoRoot, "src/app/checkout/[orderId]/page.tsx"),
      "utf8",
    );
    assert.match(page, /authorizeCheckoutAccess/);
    assert.match(page, /resolveOrderItems|buildCheckoutPageFromOrder/);
  });
});
