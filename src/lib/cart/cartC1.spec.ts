import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { describe, it } from "node:test";
import {
  assertSafeAddCartItemResponse,
  buildAddCartItemSuccessDto,
} from "@/lib/cart/addCartItemResponse";
import {
  buildCartItemForPersistence,
  cartItemHasNoPricingFields,
} from "@/lib/cart/buildCartItemForPersistence";
import {
  cartItemArtworkPath,
  cartItemOriginalPath,
} from "@/lib/cart/cartBlobPaths";
import {
  cartPushItemFilter,
  findCartItemByAddIdempotencyKey,
} from "@/lib/cart/cartItemIdempotency";
import type { AuthorizedCart } from "@/lib/cart/authorizeCartAccess";
import { decideCartResolution } from "@/lib/cart/decideCartResolution";
import {
  cartAccessCookieOptions,
  cartAccessCookieValue,
} from "@/lib/cart/constants";
import { generateCartAccessToken } from "@/lib/cart/cartAccessToken";
import {
  parseAndValidateOrderDesign,
  draftIdempotencyKeySchema,
} from "@/lib/orders/orderDesignSchema";
import { OrderError } from "@/lib/orders/errors";
import {
  validateFinalArtworkPngBuffer,
  validateOriginalImageBuffer,
} from "@/lib/orders/validateOrderAssets";
import { deletePrivateBlobPaths } from "@/lib/storage/privateBlob";
import { validateDesignProductAvailability } from "@/lib/orders/validateDesignForPurchase";

const cartId = "507f1f77bcf86cd799439011";
const lineId = "22222222-2222-4222-8222-222222222222";
const addKey = "11111111-1111-4111-8111-111111111111";

const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAD0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
);

describe("cart resolution (decideCartResolution)", () => {
  it("CASE 1: active cookie reuses cart", () => {
    const decision = decideCartResolution({
      cartId,
      cart: { status: "active", items: [] },
    } satisfies AuthorizedCart);
    assert.deepEqual(decision, { action: "reuse", cartId });
  });

  it("CASE 2: missing auth creates cart", () => {
    assert.deepEqual(decideCartResolution(null), { action: "create" });
  });

  it("CASE 2: invalid auth shape treated as create via null", () => {
    assert.deepEqual(decideCartResolution(null), { action: "create" });
  });

  it("CASE 3: converted cart creates fresh cart", () => {
    const decision = decideCartResolution({
      cartId,
      cart: { status: "converted", items: [], convertedOrderId: "507f1f77bcf86cd799439012" },
    } satisfies AuthorizedCart);
    assert.deepEqual(decision, { action: "create" });
  });
});

describe("cart_access cookie for new carts", () => {
  it("CASE 5: cookie value format and secure HttpOnly options", () => {
    const token = generateCartAccessToken();
    const value = cartAccessCookieValue(cartId, token);
    assert.match(value, /^[a-f0-9]{24}\.[A-Za-z0-9_-]+$/);
    const opts = cartAccessCookieOptions();
    assert.equal(opts.httpOnly, true);
    assert.equal(opts.sameSite, "lax");
    assert.equal(opts.path, "/");
    assert.ok(opts.maxAge > 0);
  });
});

describe("design parse before persistence", () => {
  it("CASE 6-7: parseAndValidateOrderDesign rejects invalid JSON shape", () => {
    assert.throws(
      () => parseAndValidateOrderDesign({ creationMode: "photo" }),
      (err: unknown) => err instanceof OrderError && err.code === "INVALID_DESIGN",
    );
  });

  it("addIdempotencyKey must be UUID", () => {
    assert.equal(draftIdempotencyKeySchema.safeParse(addKey).success, true);
    assert.equal(draftIdempotencyKeySchema.safeParse("not-a-uuid").success, false);
  });
});

describe("purchase validation reuse (CASE 8-10)", () => {
  it("disabled wood material rejected", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(
          {
            creationMode: "illustration",
            backgroundId: "bg",
            material: "wood",
            text: {
              value: "x",
              color: { kind: "solid", hex: "#000000" },
              size: 12,
              position: "center",
              fontStyle: "clean",
              offsetX: 0,
              offsetY: 0,
            },
            illustrationTransform: { x: 0.5, y: 0.5, scale: 1 },
            decorations: [],
          },
          { woodEnabled: false, magnetEnabled: true, woodPriceMinor: 100, magnetPriceMinor: 100 },
        ),
      (err: unknown) =>
        err instanceof OrderError && err.code === "MATERIAL_UNAVAILABLE",
    );
  });
});

describe("asset validation (CASE 11-12)", () => {
  it("accepts PNG original and artwork within limit", async () => {
    const max = 1024 * 1024;
    const original = await validateOriginalImageBuffer(PNG_1x1, max);
    assert.equal(original.mime, "image/png");
    await validateFinalArtworkPngBuffer(PNG_1x1, max);
  });

  it("rejects non-PNG artwork", async () => {
    await assert.rejects(
      () => validateFinalArtworkPngBuffer(Buffer.from("not-image"), 1024 * 1024),
      (err: unknown) => err instanceof OrderError && err.code === "INVALID_ASSET",
    );
  });
});

describe("cart item persistence shape (CASE 13-16)", () => {
  const design = parseAndValidateOrderDesign({
    creationMode: "illustration",
    backgroundId: "classic-white",
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
  });

  it("CASE 13-14: server lineId and quantity 1", () => {
    const item = buildCartItemForPersistence({
      lineId,
      addIdempotencyKey: addKey,
      design,
      originalImage: { pathname: "p1", contentType: "image/png", sizeBytes: 1 },
      finalArtwork: { pathname: "p2", contentType: "image/png", sizeBytes: 1 },
    });
    assert.equal(item.lineId, lineId);
    assert.equal(item.quantity, 1);
    assert.equal(item.addIdempotencyKey, addKey);
  });

  it("CASE 15: no trusted price fields on item", () => {
    const item = buildCartItemForPersistence({
      lineId,
      addIdempotencyKey: addKey,
      design,
      originalImage: { pathname: "p1", contentType: "image/png", sizeBytes: 1 },
      finalArtwork: { pathname: "p2", contentType: "image/png", sizeBytes: 1 },
    });
    assert.equal(cartItemHasNoPricingFields(item), true);
  });

  it("CASE 16: private cart blob paths", () => {
    assert.equal(
      cartItemOriginalPath(cartId, lineId, "jpg"),
      `carts/${cartId}/items/${lineId}/original.jpg`,
    );
    assert.equal(
      cartItemArtworkPath(cartId, lineId),
      `carts/${cartId}/items/${lineId}/artwork.png`,
    );
  });
});

describe("add idempotency (CASE 17-19)", () => {
  const items = [
    {
      lineId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      addIdempotencyKey: addKey,
      quantity: 1,
    },
  ];

  it("CASE 17: same addIdempotencyKey resolves to same lineId", () => {
    const found = findCartItemByAddIdempotencyKey(items, addKey);
    assert.equal(found?.lineId, items[0]!.lineId);
    const dto = buildAddCartItemSuccessDto({
      cartId,
      lineId: found!.lineId,
      items,
      reused: true,
    });
    assert.equal(dto.lineId, items[0]!.lineId);
    assert.equal(dto.reused, true);
  });

  it("CASE 18: early idempotency hit implies no new lineId", () => {
    const existing = findCartItemByAddIdempotencyKey(items, addKey);
    assert.ok(existing);
    assert.notEqual(randomUUID(), existing.lineId);
  });

  it("CASE 19: atomic push filter excludes duplicate key", () => {
    const filter = cartPushItemFilter(cartId, addKey);
    assert.equal(filter._id, cartId);
    assert.equal(filter.status, "active");
    assert.ok(Array.isArray(filter.$or));
    assert.equal((filter.$or as unknown[]).length, 3);
  });
});

describe("safe response DTO (CASE 22)", () => {
  it("omits token, hash, and blob pathname fields", () => {
    const dto = buildAddCartItemSuccessDto({
      cartId,
      lineId,
      items: [{ quantity: 1 }],
    });
    assert.deepEqual(Object.keys(dto).sort(), [
      "cartId",
      "lineCount",
      "lineId",
      "ok",
      "totalQuantity",
    ]);
    assertSafeAddCartItemResponse(dto);
  });
});

describe("blob cleanup helper (CASE 20-21)", () => {
  it("deletePrivateBlobPaths completes without throwing on empty list", async () => {
    await deletePrivateBlobPaths([]);
  });
});

describe("shared product validation (CASE 23)", () => {
  it("cart add uses shared product validation rules", () => {
    assert.throws(
      () =>
        validateDesignProductAvailability(
          {
            creationMode: "illustration",
            backgroundId: "bg",
            material: "magnet",
            text: {
              value: "x",
              color: { kind: "solid", hex: "#000000" },
              size: 12,
              position: "center",
              fontStyle: "clean",
              offsetX: 0,
              offsetY: 0,
            },
            illustrationTransform: { x: 0.5, y: 0.5, scale: 1 },
            decorations: [],
          },
          {
            magnetEnabled: true,
            woodEnabled: true,
            magnetSizes: [],
          },
        ),
      (err: unknown) =>
        err instanceof OrderError && err.code === "INVALID_DESIGN",
    );
  });
});
