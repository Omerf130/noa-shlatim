import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildFinbotIncomeRequest,
  finbotCardNumberFromPayPlusLastFour,
  FinbotIncomeRequestBuildError,
} from "@/lib/finbot/buildIncomeRequest";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";

const snapshot: OrderCommercialSnapshot = {
  currency: "ILS",
  capturedAt: "2026-10-01T00:00:00.000Z",
  material: "magnet",
  productAmountMinor: 8500,
  shippingMethodId: "ship",
  shippingLabel: "שליח",
  shippingAmountMinor: 500,
  totalAmountMinor: 9000,
};

const baseParams = {
  orderId: "507f1f77bcf86cd799439011",
  snapshot,
  customer: {
    fullName: "Test User",
    email: "buyer@example.com",
    phone: "0501234567",
  },
  payplusTransactionUid: "payplus-tx-uid",
  paymentCompletedAtIso: "2026-10-07T10:00:00.000Z",
};

describe("finbotCardNumberFromPayPlusLastFour", () => {
  it("maps valid last-four to JSON number", () => {
    assert.equal(finbotCardNumberFromPayPlusLastFour("6134"), 6134);
  });

  it("rejects leading-zero last-four without sending ambiguous numeric value", () => {
    assert.throws(
      () => finbotCardNumberFromPayPlusLastFour("0123"),
      (err: unknown) => {
        assert.ok(err instanceof FinbotIncomeRequestBuildError);
        assert.equal(err.code, "FINBOT_CARD_LEADING_ZERO");
        return true;
      },
    );
  });

  it("rejects invalid length", () => {
    assert.throws(
      () => finbotCardNumberFromPayPlusLastFour("123"),
      (err: unknown) => {
        assert.ok(err instanceof FinbotIncomeRequestBuildError);
        assert.equal(err.code, "INVALID_CARD_LAST_FOUR");
        return true;
      },
    );
  });
});

describe("buildFinbotIncomeRequest", () => {
  it("builds type 2 with email.to and exact payment total", () => {
    const body = buildFinbotIncomeRequest({
      ...baseParams,
      card: {
        payplusCardLastFourDigits: "6134",
        payplusNumberOfPayments: 2,
      },
    });

    assert.equal(body.type, "2");
    assert.equal(body.language, "he");
    assert.equal(body.currency, "ILS");
    assert.equal(body.vatType, true);
    assert.equal(body.email.to, "buyer@example.com");
    assert.equal(body.customer.email, "buyer@example.com");
    assert.equal(body.payments[0]!.type, "2");
    assert.equal(body.payments[0]!.sum, 90);
    assert.equal(body.payments[0]!.cardNumber, 6134);
    assert.equal(body.payments[0]!.numberPayments, 2);
    assert.equal(body.payments[0]!.transactionNumber, "payplus-tx-uid");
    assert.equal(body.items.length, 2);
    assert.match(body.items[0]!.name, /מגנט/);
    assert.equal(body.title, "order:507f1f77bcf86cd799439011");
  });

  it("serializes cardNumber as JSON number (not string)", () => {
    const body = buildFinbotIncomeRequest({
      ...baseParams,
      card: {
        payplusCardLastFourDigits: "4242",
        payplusNumberOfPayments: 1,
      },
    });
    const serialized = JSON.parse(JSON.stringify(body)) as typeof body;
    assert.equal(typeof serialized.payments[0]!.cardNumber, "number");
    assert.equal(serialized.payments[0]!.cardNumber, 4242);
    assert.equal(typeof serialized.payments[0]!.numberPayments, "number");
  });

  it("throws when last-four has leading zero", () => {
    assert.throws(() =>
      buildFinbotIncomeRequest({
        ...baseParams,
        card: {
          payplusCardLastFourDigits: "0123",
          payplusNumberOfPayments: 1,
        },
      }),
    );
  });
});
