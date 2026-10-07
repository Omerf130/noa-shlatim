import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isValidCartId } from "@/lib/cart/assertValidCartId";
import {
  generateCartAccessToken,
  hashCartAccessToken,
  verifyCartAccessToken,
} from "@/lib/cart/cartAccessToken";
import {
  cartAccessCookieValue,
  parseCartAccessCookieValue,
} from "@/lib/cart/constants";
import {
  CHECKOUT_ACCESS_COOKIE,
  parseCheckoutAccessCookieValue,
} from "@/lib/checkout/constants";
import { parseCartAccessFromCookieValue } from "@/lib/cart/authorizeCartAccess";
import {
  buildCartSummaryDto,
  computeCartCounts,
  EMPTY_CART_SUMMARY,
  normalizedCartItemQuantity,
} from "@/lib/cart/cartSummary";

describe("cart access token", () => {
  it("generates a non-empty raw token", () => {
    const token = generateCartAccessToken();
    assert.ok(token.length >= 32);
  });

  it("persists only hash for verification", () => {
    const token = generateCartAccessToken();
    const hash = hashCartAccessToken(token);
    assert.notEqual(token, hash);
    assert.match(hash, /^[a-f0-9]{64}$/i);
    assert.equal(verifyCartAccessToken(token, hash), true);
  });

  it("rejects wrong token", () => {
    const hash = hashCartAccessToken(generateCartAccessToken());
    assert.equal(verifyCartAccessToken("wrong-token", hash), false);
  });
});

describe("cart_access cookie", () => {
  const cartId = "507f1f77bcf86cd799439011";

  it("round-trips cart id and token", () => {
    const token = generateCartAccessToken();
    const value = cartAccessCookieValue(cartId, token);
    const parsed = parseCartAccessCookieValue(value);
    assert.deepEqual(parsed, { cartId, token });
  });

  it("rejects malformed cookie values", () => {
    assert.equal(parseCartAccessCookieValue(""), null);
    assert.equal(parseCartAccessCookieValue("nodot"), null);
    assert.equal(parseCartAccessCookieValue(".tokenonly"), null);
    assert.equal(parseCartAccessCookieValue("idonly."), null);
  });

  it("rejects invalid cart id in parseCartAccessFromCookieValue", () => {
    const token = generateCartAccessToken();
    assert.equal(
      parseCartAccessFromCookieValue(cartAccessCookieValue("not-an-id", token)),
      null,
    );
  });

  it("accepts valid cart id in parseCartAccessFromCookieValue", () => {
    const token = generateCartAccessToken();
    const parsed = parseCartAccessFromCookieValue(
      cartAccessCookieValue(cartId, token),
    );
    assert.deepEqual(parsed, { cartId, token });
  });
});

describe("cart id validation", () => {
  it("accepts 24-char hex ObjectId", () => {
    assert.equal(isValidCartId("507f1f77bcf86cd799439011"), true);
  });

  it("rejects invalid ids", () => {
    assert.equal(isValidCartId("legacy-magnet"), false);
    assert.equal(isValidCartId(""), false);
  });
});

describe("cart summary counts", () => {
  it("empty cart has zero counts", () => {
    assert.deepEqual(computeCartCounts([]), { lineCount: 0, totalQuantity: 0 });
    assert.deepEqual(EMPTY_CART_SUMMARY, {
      ok: true,
      status: "empty",
      lineCount: 0,
      totalQuantity: 0,
      badgeQuantity: 0,
    });
  });

  it("sums quantities 2 + 1 => totalQuantity 3", () => {
    const counts = computeCartCounts([
      { quantity: 2 },
      { quantity: 1 },
    ]);
    assert.equal(counts.lineCount, 2);
    assert.equal(counts.totalQuantity, 3);
  });

  it("normalizes invalid quantities to zero contribution", () => {
    assert.equal(normalizedCartItemQuantity(0), 0);
    assert.equal(normalizedCartItemQuantity(-1), 0);
    assert.equal(normalizedCartItemQuantity(1.5), 0);
    assert.equal(normalizedCartItemQuantity(100), 99);
    const counts = computeCartCounts([
      { quantity: 2 },
      { quantity: 0 },
      { quantity: "x" },
    ]);
    assert.equal(counts.lineCount, 3);
    assert.equal(counts.totalQuantity, 2);
  });

  it("returns active status summary", () => {
    const dto = buildCartSummaryDto({
      status: "active",
      items: [{ quantity: 1 }],
    });
    assert.deepEqual(dto, {
      ok: true,
      status: "active",
      lineCount: 1,
      totalQuantity: 1,
      badgeQuantity: 1,
    });
  });

  it("returns converted status summary", () => {
    const dto = buildCartSummaryDto({
      status: "converted",
      items: [{ quantity: 2 }, { quantity: 1 }],
    });
    assert.equal(dto.status, "converted");
    assert.equal(dto.totalQuantity, 3);
    assert.equal(dto.badgeQuantity, 0);
  });

  it("summary DTO exposes only safe fields", () => {
    const dto = buildCartSummaryDto({
      status: "active",
      items: [{ quantity: 1 }],
    });
    const keys = Object.keys(dto).sort();
    assert.deepEqual(keys, [
      "badgeQuantity",
      "lineCount",
      "ok",
      "status",
      "totalQuantity",
    ]);
    assert.equal(JSON.stringify(dto).includes("pathname"), false);
    assert.equal(JSON.stringify(dto).includes("secret"), false);
  });
});

describe("checkout_access unchanged", () => {
  it("still parses checkout cookie format independently", () => {
    const orderId = "507f1f77bcf86cd799439012";
    const token = generateCartAccessToken();
    const parsed = parseCheckoutAccessCookieValue(`${orderId}.${token}`);
    assert.deepEqual(parsed, { orderId, token });
    assert.equal(CHECKOUT_ACCESS_COOKIE, "checkout_access");
  });
});
