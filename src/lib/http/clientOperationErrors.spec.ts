import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  INVALID_RESPONSE_MESSAGE,
  NETWORK_ERROR_MESSAGE,
  PAYLOAD_TOO_LARGE_MESSAGE,
  SERVER_UNAVAILABLE_MESSAGE,
  messageForClientOperationFailure,
} from "@/lib/http/clientOperationErrors";

describe("messageForClientOperationFailure", () => {
  it("uses network copy only for status 0", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "generate_final",
        status: 0,
        parseFailed: false,
      }),
      NETWORK_ERROR_MESSAGE,
    );
    assert.doesNotMatch(
      messageForClientOperationFailure({
        operation: "generate_final",
        status: 502,
        parseFailed: true,
      }),
      /חיבור/,
    );
  });

  it("maps 413 without connection wording", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "generate_final",
        status: 413,
        parseFailed: true,
      }),
      PAYLOAD_TOO_LARGE_MESSAGE,
    );
  });

  it("maps 502/504 to server unavailable", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "cart_convert",
        status: 504,
        parseFailed: true,
      }),
      SERVER_UNAVAILABLE_MESSAGE,
    );
  });

  it("maps 500 JSON failures to server unavailable", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "payment_init",
        status: 500,
        parseFailed: false,
      }),
      SERVER_UNAVAILABLE_MESSAGE,
    );
  });

  it("prefers API Hebrew messages", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "cart_convert",
        status: 409,
        parseFailed: false,
        apiMessage: "ההזמנה כבר נשמרת. נסו שוב בעוד רגע.",
      }),
      "ההזמנה כבר נשמרת. נסו שוב בעוד רגע.",
    );
  });

  it("maps non-JSON 404 to invalid response", () => {
    assert.equal(
      messageForClientOperationFailure({
        operation: "illustration_generate",
        status: 404,
        parseFailed: true,
      }),
      INVALID_RESPONSE_MESSAGE,
    );
  });
});
