import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";
import {
  computePayPlusRequestHash,
  computePayPlusRequestHashFromParsedBody,
  payPlusHashMessageFromRawBody,
  verifyPayPlusRequestHash,
} from "@/lib/payplus/verifyPayPlusRequestHash";

describe("verifyPayPlusRequestHash", () => {
  const secret = "test-secret-key";

  const callbackBody = {
    transaction_type: "Charge",
    transaction: {
      uid: "dcb11c1e7-a1231-37cf-6311-f5111eeb69c7",
      payment_request_uid: "ef76432c-769a-43a6-ba7a-6f70272539d8",
      status_code: "000",
      amount: 90,
      currency: "ILS",
      more_info: "507f1f77bcf86cd799439011",
      more_info_2: "11111111-1111-4111-8111-111111111111",
    },
  };

  it("accepts valid hash and User-Agent PayPlus (compact JSON)", () => {
    const rawBody = JSON.stringify(callbackBody);
    const hash = computePayPlusRequestHash(rawBody, secret);
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody,
        hashHeader: hash,
        userAgent: "PayPlus",
        secretKey: secret,
      }),
      true,
    );
  });

  it("accepts hash when wire JSON is pretty-printed (PayPlus stringify contract)", () => {
    const prettyRaw = JSON.stringify(callbackBody, null, 2);
    const hash = computePayPlusRequestHashFromParsedBody(callbackBody, secret);
    assert.notEqual(prettyRaw, JSON.stringify(callbackBody));
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody: prettyRaw,
        hashHeader: hash,
        userAgent: "PayPlus",
        secretKey: secret,
      }),
      true,
    );
  });

  it("rejects hash computed from raw bytes when they differ from JSON.stringify(parsed)", () => {
    const prettyRaw = JSON.stringify(callbackBody, null, 2);
    const rawBytesHash = createHmac("sha256", secret)
      .update(prettyRaw, "utf8")
      .digest("base64");
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody: prettyRaw,
        hashHeader: rawBytesHash,
        userAgent: "PayPlus",
        secretKey: secret,
      }),
      false,
    );
  });

  it("uses JSON.stringify(parsed) as the signed message", () => {
    const prettyRaw = JSON.stringify(callbackBody, null, 2);
    const message = payPlusHashMessageFromRawBody(prettyRaw);
    assert.equal(message, JSON.stringify(callbackBody));
  });

  it("rejects invalid hash", () => {
    const rawBody = JSON.stringify(callbackBody);
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody,
        hashHeader: "invalid",
        userAgent: "PayPlus",
        secretKey: secret,
      }),
      false,
    );
  });

  it("rejects wrong User-Agent", () => {
    const rawBody = JSON.stringify(callbackBody);
    const hash = computePayPlusRequestHash(rawBody, secret);
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody,
        hashHeader: hash,
        userAgent: "curl/8.0",
        secretKey: secret,
      }),
      false,
    );
  });

  it("rejects non-JSON body", () => {
    assert.equal(
      verifyPayPlusRequestHash({
        rawBody: "not-json",
        hashHeader: "abc",
        userAgent: "PayPlus",
        secretKey: secret,
      }),
      false,
    );
  });
});
