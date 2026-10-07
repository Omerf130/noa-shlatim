import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  orderArtworkPath,
  orderOriginalPath,
} from "@/lib/orders/orderBlobPaths";
import {
  orderItemArtworkPath,
  orderItemOriginalPath,
} from "@/lib/orders/orderItemBlobPaths";
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import {
  assertValidOrderItemQuantity,
  isValidOrderItemQuantity,
} from "@/lib/orders/validateOrderItemQuantity";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";

const orderId = "507f1f77bcf86cd799439011";
const lineA = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const lineB = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const sampleDesign: OrderDesignSnapshot = {
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

describe("resolveOrderItems — items[]", () => {
  it("CASE 1: returns persisted items", () => {
    const items = resolveOrderItems({
      items: [
        {
          lineId: lineA,
          quantity: 2,
          creationMode: "illustration",
          design: sampleDesign,
          assets: {},
        },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, lineA);
    assert.equal(items[0]!.quantity, 2);
  });

  it("CASE 7: two items remain separate", () => {
    const items = resolveOrderItems({
      items: [
        {
          lineId: lineA,
          quantity: 1,
          creationMode: "photo",
          design: { ...sampleDesign, creationMode: "photo", photoIllustrationStyleId: "style-soft" },
          assets: {},
        },
        {
          lineId: lineB,
          quantity: 3,
          creationMode: "illustration",
          design: sampleDesign,
          assets: {},
        },
      ],
    });
    assert.equal(items.length, 2);
    assert.equal(items[1]!.quantity, 3);
  });
});

describe("resolveOrderItems — legacy", () => {
  it("CASE 2-4: synthesizes legacy item", () => {
    const items = resolveOrderItems({
      creationMode: "illustration",
      design: sampleDesign,
      assets: {
        finalArtwork: {
          pathname: `orders/${orderId}/artwork.png`,
          contentType: "image/png",
          sizeBytes: 1,
        },
      },
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, LEGACY_ORDER_LINE_ID);
    assert.equal(items[0]!.quantity, 1);
    assert.equal(items[0]!.creationMode, "illustration");
  });
});

describe("resolveOrderItems — precedence", () => {
  it("CASE 5: items[] wins when both shapes exist", () => {
    const items = resolveOrderItems({
      creationMode: "photo",
      design: sampleDesign,
      items: [
        {
          lineId: lineA,
          quantity: 1,
          creationMode: "illustration",
          design: sampleDesign,
          assets: {},
        },
      ],
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, lineA);
    assert.notEqual(items[0]!.lineId, LEGACY_ORDER_LINE_ID);
  });

  it("CASE 6: empty order returns []", () => {
    assert.deepEqual(resolveOrderItems({}), []);
    assert.deepEqual(
      resolveOrderItems({ items: [{ lineId: "", quantity: 1, creationMode: "photo", design: {} }] }),
      [],
    );
  });
});

describe("order item quantity validation", () => {
  it("CASE 9-11: rejects invalid quantities", () => {
    assert.equal(isValidOrderItemQuantity(0), false);
    assert.equal(isValidOrderItemQuantity(21), false);
    assert.equal(isValidOrderItemQuantity(1.5), false);
    assert.throws(() => assertValidOrderItemQuantity(0));
  });

  it("CASE 12: accepts 1..20", () => {
    assert.equal(assertValidOrderItemQuantity(1), 1);
    assert.equal(assertValidOrderItemQuantity(20), 20);
  });
});

describe("order blob paths", () => {
  it("CASE 15: legacy paths unchanged", () => {
    assert.equal(orderOriginalPath(orderId, "jpg"), `orders/${orderId}/original.jpg`);
    assert.equal(orderArtworkPath(orderId), `orders/${orderId}/artwork.png`);
  });

  it("CASE 13-14: multi-item paths include orderId and lineId", () => {
    assert.equal(
      orderItemOriginalPath(orderId, lineA, "webp"),
      `orders/${orderId}/items/${lineA}/original.webp`,
    );
    assert.equal(
      orderItemArtworkPath(orderId, lineA),
      `orders/${orderId}/items/${lineA}/artwork.png`,
    );
  });
});

describe("Order model items schema", () => {
  it("CASE 8: quantity preserved on resolved item", () => {
    const items = resolveOrderItems({
      items: [
        {
          lineId: lineA,
          quantity: 5,
          creationMode: "illustration",
          design: sampleDesign,
          assets: {},
        },
      ],
    });
    assert.equal(items[0]!.quantity, 5);
  });
});
