import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADD_TO_CART_NETWORK_ERROR_MESSAGE,
  AddIdempotencyKeySession,
  parseAddToCartResponse,
} from "@/lib/cart/addToCartClient";

describe("parseAddToCartResponse", () => {
  it("parses success", () => {
    const parsed = parseAddToCartResponse({
      ok: true,
      cartId: "507f1f77bcf86cd799439011",
      lineId: "22222222-2222-4222-8222-222222222222",
      lineCount: 1,
      totalQuantity: 1,
    });
    assert.equal(parsed?.ok, true);
  });

  it("parses domain error message", () => {
    const parsed = parseAddToCartResponse({
      ok: false,
      code: "MATERIAL_UNAVAILABLE",
      message: "החומר שבחרתם אינו זמין כרגע. בחרו חומר אחר והמשיכו.",
    });
    assert.equal(parsed?.ok, false);
    if (parsed?.ok === false) {
      assert.match(parsed.message, /חומר/);
    }
  });

  it("returns null for malformed JSON body", () => {
    assert.equal(parseAddToCartResponse(null), null);
    assert.equal(parseAddToCartResponse({ ok: true }), null);
  });
});

describe("AddIdempotencyKeySession", () => {
  it("reuses the same key until success consumes it", () => {
    const session = new AddIdempotencyKeySession();
    const first = session.getOrCreate();
    const second = session.getOrCreate();
    assert.equal(first, second);
    session.consumeAfterSuccess();
    assert.equal(session.peek(), null);
    const next = session.getOrCreate();
    assert.notEqual(next, first);
  });

  it("resetForNewSign clears consumed key for a fresh sign", () => {
    const session = new AddIdempotencyKeySession();
    const key = session.getOrCreate();
    session.resetForNewSign();
    assert.equal(session.peek(), null);
    const fresh = session.getOrCreate();
    assert.notEqual(fresh, key);
  });
});

describe("network error copy", () => {
  it("uses Cart-specific generic Hebrew message", () => {
    assert.match(ADD_TO_CART_NETWORK_ERROR_MESSAGE, /לסל/);
  });
});
