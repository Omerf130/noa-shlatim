import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  extractPayPlusCardDetailsForPersistence,
  parsePayPlusCallbackPayload,
} from "@/lib/payplus/parseCallbackPayload";

describe("parsePayPlusCallbackPayload", () => {
  it("parses documented callback envelope", () => {
    const raw = JSON.stringify({
      transaction_type: "Charge",
      transaction: {
        uid: "dcb11c1e7-a1231-37cf-6311-f5111eeb69c7",
        payment_request_uid: "ef76432c-769a-43a6-ba7a-6f70272539d8",
        status_code: "000",
        amount: 1,
        currency: "ILS",
        more_info: "507f1f77bcf86cd799439011",
        more_info_2: "attempt-a",
      },
    });
    const result = parsePayPlusCallbackPayload(raw);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payload.transaction.uid, "dcb11c1e7-a1231-37cf-6311-f5111eeb69c7");
      assert.equal(result.payload.transaction.status_code, "000");
      assert.deepEqual(result.payload.cardDetailsForPersistence, {});
    }
  });

  it("parses last four and number of payments when present", () => {
    const raw = JSON.stringify({
      transaction_type: "Charge",
      transaction: {
        uid: "tx-1",
        status_code: "000",
        amount: 90,
        currency: "ILS",
        more_info: "507f1f77bcf86cd799439011",
        more_info_2: "attempt-a",
        payments: { number_of_payments: 3 },
      },
      data: {
        card_information: { four_digits: "6134" },
      },
    });
    const result = parsePayPlusCallbackPayload(raw);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.payload.cardDetailsForPersistence.payplusCardLastFourDigits, "6134");
      assert.equal(result.payload.cardDetailsForPersistence.payplusNumberOfPayments, 3);
    }
  });

  it("does not fail parse when card fields are absent", () => {
    const raw = JSON.stringify({
      transaction_type: "Charge",
      transaction: {
        uid: "tx-1",
        status_code: "000",
        amount: 90,
        currency: "ILS",
        payments: { number_of_payments: 0 },
      },
      data: { card_information: { four_digits: "12ab" } },
    });
    const result = parsePayPlusCallbackPayload(raw);
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.deepEqual(result.payload.cardDetailsForPersistence, {});
    }
  });

  it("extractPayPlusCardDetailsForPersistence validates fields", () => {
    const details = extractPayPlusCardDetailsForPersistence(
      {
        uid: "u",
        status_code: "000",
        amount: 1,
        currency: "ILS",
        payments: { number_of_payments: 2 },
      },
      { card_information: { four_digits: "9999" } },
    );
    assert.equal(details.payplusCardLastFourDigits, "9999");
    assert.equal(details.payplusNumberOfPayments, 2);
  });

  it("rejects malformed JSON", () => {
    const result = parsePayPlusCallbackPayload("{not-json");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "INVALID_JSON");
    }
  });

  it("rejects missing transaction", () => {
    const result = parsePayPlusCallbackPayload(JSON.stringify({ transaction_type: "Charge" }));
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, "INVALID_SHAPE");
    }
  });
});
