import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADD_TO_CART_NETWORK_ERROR_MESSAGE,
  ADD_TO_CART_PAYLOAD_TOO_LARGE_MESSAGE,
  ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE,
  messageForAddToCartHttpFailure,
} from "@/lib/cart/addToCartHttpErrors";

describe("messageForAddToCartHttpFailure", () => {
  it("prefers API message when present", () => {
    assert.equal(
      messageForAddToCartHttpFailure(400, "פג תוקף קבצי השלט."),
      "פג תוקף קבצי השלט.",
    );
  });

  it("maps 413 to payload too large", () => {
    assert.equal(
      messageForAddToCartHttpFailure(413),
      ADD_TO_CART_PAYLOAD_TOO_LARGE_MESSAGE,
    );
    assert.doesNotMatch(ADD_TO_CART_PAYLOAD_TOO_LARGE_MESSAGE, /חיבור/);
  });

  it("maps 502/504 to server unavailable", () => {
    assert.equal(
      messageForAddToCartHttpFailure(502),
      ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE,
    );
    assert.equal(
      messageForAddToCartHttpFailure(504),
      ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE,
    );
  });

  it("maps status 0 to network copy", () => {
    assert.equal(
      messageForAddToCartHttpFailure(0),
      ADD_TO_CART_NETWORK_ERROR_MESSAGE,
    );
  });
});
