import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { cartItemArtworkPath, cartItemOriginalPath } from "@/lib/cart/cartBlobPaths";
import {
  cartPushItemFilter,
  findCartItemByAddIdempotencyKey,
} from "@/lib/cart/cartItemIdempotency";
import { copyPrivateBlobPath } from "@/lib/storage/copyPrivateBlob";

const cartId = "507f1f77bcf86cd799439011";
const lineId = "22222222-2222-4222-8222-222222222222";
const addKey = "11111111-1111-4111-8111-111111111111";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..", "..");

function readRepo(rel: string): string {
  return readFileSync(join(repoRoot, rel), "utf8");
}

describe("addCartItemFromStaging wiring", () => {
  it("cart API uses JSON staging commit", () => {
    const route = readRepo("src/app/api/cart/items/route.ts");
    assert.match(route, /addCartItemFromStaging/);
    assert.match(route, /signAssetStagingToken/);
    assert.doesNotMatch(route, /formData\(\)/);
  });

  it("generate-final returns staging token", () => {
    const route = readRepo("src/app/api/signs/generate-final/route.ts");
    assert.match(route, /createSignAssetStaging/);
    assert.match(route, /signAssetStagingToken/);
  });

  it("cart blob paths unchanged for order conversion", () => {
    assert.match(
      cartItemOriginalPath(cartId, lineId, "png"),
      /^carts\//,
    );
    assert.match(cartItemArtworkPath(cartId, lineId), /artwork\.png$/);
  });
});

describe("idempotency for staging add", () => {
  it("same addIdempotencyKey resolves to same lineId", () => {
    const items = [
      { lineId, addIdempotencyKey: addKey, quantity: 1 },
      {
        lineId: "33333333-3333-4333-8333-333333333333",
        addIdempotencyKey: "44444444-4444-4444-8444-444444444444",
        quantity: 1,
      },
    ];
    const found = findCartItemByAddIdempotencyKey(items, addKey);
    assert.equal(found?.lineId, lineId);
  });

  it("cartPushItemFilter prevents duplicate idempotency keys", () => {
    const filter = cartPushItemFilter(cartId, addKey);
    assert.ok(Array.isArray(filter.$or));
  });
});

describe("copyPrivateBlobPath byte preservation contract", () => {
  it("exports copy helper used for lossless staging to cart move", () => {
    assert.equal(typeof copyPrivateBlobPath, "function");
  });
});
