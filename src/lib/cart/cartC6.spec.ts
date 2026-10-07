import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { buildCartConversionDraftIdempotencyKey } from "@/lib/cart/cartConversionDraftIdempotencyKey";
import { hashCheckoutAccessToken } from "@/lib/checkout/checkoutAccessToken";
import {
  ConversionIdempotencyKeySession,
  parseCartConversionResponse,
} from "@/lib/cart/cartConversionClient";
import {
  orderItemArtworkPath,
  orderItemOriginalPath,
} from "@/lib/orders/orderItemBlobPaths";
import {
  CHECKOUT_ACCESS_COOKIE,
  checkoutAccessCookieOptions,
} from "@/lib/checkout/constants";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const cartId = "507f1f77bcf86cd799439011";
const orderId = "507f1f77bcf86cd799439012";
const lineId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const conversionKey = "11111111-1111-4111-8111-111111111111";

describe("cart conversion draftIdempotencyKey", () => {
  it("CASE 10: deterministic unique draft key", () => {
    const key = buildCartConversionDraftIdempotencyKey(cartId, conversionKey);
    assert.equal(key, `cart:${cartId}:${conversionKey}`);
    assert.notEqual(key, conversionKey);
  });
});

describe("conversion idempotency session", () => {
  it("CASE 11/26: reuses key until success consumes it", () => {
    const session = new ConversionIdempotencyKeySession();
    const a = session.getOrCreate();
    const b = session.getOrCreate();
    assert.equal(a, b);
    session.consumeAfterSuccess();
    const c = session.getOrCreate();
    assert.notEqual(c, a);
  });

  it("resetForNewAttempt after domain failure", () => {
    const session = new ConversionIdempotencyKeySession();
    const first = session.getOrCreate();
    session.resetForNewAttempt();
    assert.notEqual(session.getOrCreate(), first);
  });
});

describe("conversion response parsing", () => {
  it("CASE 23-24: safe success DTO without token", () => {
    const parsed = parseCartConversionResponse({
      ok: true,
      orderId,
      checkoutPath: `/checkout/${orderId}`,
    });
    assert.equal(parsed?.ok, true);
    if (parsed?.ok) {
      assert.equal(parsed.checkoutPath, `/checkout/${orderId}`);
    }
    assert.doesNotMatch(JSON.stringify(parsed), /checkoutToken|pathname/i);
  });
});

describe("order item blob paths for conversion", () => {
  it("CASE 14-15: destination paths include orderId and lineId", () => {
    assert.equal(
      orderItemOriginalPath(orderId, lineId, "jpg"),
      `orders/${orderId}/items/${lineId}/original.jpg`,
    );
    assert.equal(
      orderItemArtworkPath(orderId, lineId),
      `orders/${orderId}/items/${lineId}/artwork.png`,
    );
  });
});

describe("convert API route wiring", () => {
  it("CASE 22: sets HttpOnly checkout_access cookie on new token", () => {
    const route = readFileSync(
      join(repoRoot, "src/app/api/cart/convert/route.ts"),
      "utf8",
    );
    assert.match(route, /CHECKOUT_ACCESS_COOKIE/);
    assert.match(route, /checkoutAccessCookieOptions/);
    assert.doesNotMatch(route, /checkoutToken:/);
  });

  it("CASE 1: authorizes via cart_access not cartId body", () => {
    const route = readFileSync(
      join(repoRoot, "src/app/api/cart/convert/route.ts"),
      "utf8",
    );
    assert.match(route, /authorizeCartConversion/);
    assert.doesNotMatch(route, /cartId.*request\.json/);
  });

  it("CASE 1-3: every success sets checkout_access cookie", () => {
    const route = readFileSync(
      join(repoRoot, "src/app/api/cart/convert/route.ts"),
      "utf8",
    );
    assert.match(route, /response\.cookies\.set/);
    assert.doesNotMatch(route, /if \(result\.checkoutToken\)/);
  });
});

describe("convertCartToOrder behavior (source)", () => {
  it("CASE 9: does not set legacy top-level design", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(src, /items: orderItems/);
    assert.doesNotMatch(src, /\$set:[\s\S]*design:/);
    assert.doesNotMatch(src, /deletePrivateBlob.*cart/i);
  });

  it("CASE 16-17: cleans order blobs on failure", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(src, /deletePrivateBlobPaths\(copiedOrderPaths\)/);
  });

  it("CASE 12: reconciles cart when order already exists", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(src, /reconcileCartConverted/);
    assert.match(src, /draftIdempotencyKey/);
  });

  it("CASE 2-5/8-9: reuse paths grant checkout via successWithCheckoutAccess", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(src, /successWithCheckoutAccess/);
    assert.match(src, /grantCheckoutAccessForCartConversionOrder/);
    assert.match(src, /checkoutAccessTokenHash/);
    const successReturns = src.match(/return successWithCheckoutAccess/g) ?? [];
    assert.ok(successReturns.length >= 4, "all success paths grant checkout access");
  });

  it("CASE 4: grantCheckoutAccess rotates hash on Order", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(
      src,
      /\$set:\s*\{\s*checkoutAccessTokenHash\s*\}/,
    );
  });

  it("CASE 7: unrelated Order blocked by draftIdempotencyKey + cart prefix", () => {
    const src = readFileSync(
      join(repoRoot, "src/lib/cart/convertCartToOrder.ts"),
      "utf8",
    );
    assert.match(src, /draftIdempotencyKey: params\.expectedDraftIdempotencyKey/);
    assert.match(src, /cartPrefix/);
    assert.match(src, /conversionIdempotencyKey !== params\.conversionIdempotencyKey/);
  });
});

describe("grantCheckoutAccessForCartConversionOrder (hash helper)", () => {
  it("CASE 4: hash helper matches checkout token hash", () => {
    const token = "test-token-value";
    const hash = hashCheckoutAccessToken(token);
    assert.equal(hash.length, 64);
    assert.equal(hashCheckoutAccessToken(token), hash);
  });
});

describe("cart client checkout CTA", () => {
  it("CASE 27-29: converting state and navigation", () => {
    const client = readFileSync(
      join(repoRoot, "src/components/cart/CartPageClient.tsx"),
      "utf8",
    );
    assert.match(client, /\/api\/cart\/convert/);
    assert.match(client, /מכינים את ההזמנה/);
    assert.match(client, /router\.push/);
    assert.match(client, /setBadgeQuantity\(0\)/);
    assert.match(client, /CART_CHECKOUT_CONVERSION_ENABLED/);
  });
});

describe("checkout cookie options", () => {
  it("CASE 22: cookie is HttpOnly", () => {
    const opts = checkoutAccessCookieOptions(3600);
    assert.equal(opts.httpOnly, true);
    assert.equal(CHECKOUT_ACCESS_COOKIE, "checkout_access");
  });
});

describe("C12 — direct draft creation removed", () => {
  it("CASE 30: createDraftOrder module removed", () => {
    const path = join(repoRoot, "src/lib/orders/createDraftOrder.ts");
    assert.throws(() => readFileSync(path, "utf8"));
  });
});
