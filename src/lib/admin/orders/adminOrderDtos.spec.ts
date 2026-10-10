import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  adminOrderStatusLabel,
  buildAdminOrderAccountingDocumentDto,
  buildAdminOrderListItemDto,
  buildAdminOrderPaymentSummaryDto,
} from "@/lib/admin/orders/adminOrderDtos";

describe("admin order DTOs — payment visibility", () => {
  it("maps Hebrew status labels", () => {
    assert.equal(adminOrderStatusLabel("draft"), "טיוטה");
    assert.equal(adminOrderStatusLabel("payment_pending"), "ממתין לתשלום");
    assert.equal(adminOrderStatusLabel("paid"), "שולם");
    assert.equal(adminOrderStatusLabel("creating"), "בהכנה");
  });

  it("list item uses frozen snapshot total, not StoreSettings", () => {
    const dto = buildAdminOrderListItemDto({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      status: "paid",
      creationMode: "photo",
      design: {
        creationMode: "photo",
        material: "wood",
        backgroundId: "classic-white",
        photoIllustrationStyleId: "watercolor-soft",
        text: { value: "שלום", fontId: "assistant", color: "#000", align: "center" },
        decorations: [],
      },
      commercialSnapshot: {
        currency: "ILS",
        capturedAt: "2026-10-01T00:00:00.000Z",
        material: "wood",
        productAmountMinor: 12345,
        shippingMethodId: "pickup",
        shippingLabel: "איסוף",
        shippingAmountMinor: 0,
        totalAmountMinor: 12345,
      },
      customer: { fullName: "Test" },
      createdAt: new Date("2026-10-01T12:00:00Z"),
    });
    assert.ok(dto);
    assert.equal(dto!.totalLabel, "₪123.45");
    assert.equal(dto!.statusLabel, "שולם");
  });

  it("draft without snapshot has no total", () => {
    const dto = buildAdminOrderListItemDto({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      status: "draft",
      creationMode: "illustration",
      design: {
        creationMode: "illustration",
        material: "magnet",
        backgroundId: "classic-white",
        illustrationAssetId: "asset-1",
        text: { value: "שלום", fontId: "assistant", color: "#000", align: "center" },
        decorations: [],
      },
      createdAt: new Date(),
    });
    assert.ok(dto);
    assert.equal(dto!.totalLabel, null);
  });

  it("payment summary includes transaction uid for succeeded attempt only", () => {
    const summary = buildAdminOrderPaymentSummaryDto({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      status: "paid",
      creationMode: "photo",
      design: {},
      commercialSnapshot: {
        currency: "ILS",
        capturedAt: "2026-10-01T00:00:00.000Z",
        material: "wood",
        productAmountMinor: 10000,
        shippingMethodId: "pickup",
        shippingLabel: "איסוף",
        shippingAmountMinor: 0,
        totalAmountMinor: 10000,
      },
      termsAcceptance: {
        termsVersion: "2026-10-v2",
        termsAcceptedAt: "2026-10-01T00:00:01.000Z",
      },
      payment: {
        attempts: [
          {
            status: "succeeded",
            payplusTransactionUid: "tx-uid-123",
            completedAt: "2026-10-01T00:05:00.000Z",
          },
        ],
      },
    });
    assert.ok(summary);
    assert.equal(summary!.payplusTransactionUid, "tx-uid-123");
    assert.equal(summary!.termsVersion, "2026-10-v2");
    assert.equal(JSON.stringify(summary).includes("paymentPageLink"), false);
  });
});

describe("admin order DTOs — accounting document retry", () => {
  const paidOrderBase = {
    _id: { toString: () => "507f1f77bcf86cd799439011" },
    status: "paid" as const,
    creationMode: "photo" as const,
    design: {},
  };

  it("failed accounting status allows Admin retry", () => {
    const dto = buildAdminOrderAccountingDocumentDto({
      ...paidOrderBase,
      accountingDocument: {
        status: "failed",
        errorMessage: "cardNumber: 412: invalid",
      },
    });
    assert.ok(dto);
    assert.equal(dto!.statusKey, "failed");
    assert.equal(dto!.canRetry, true);
    assert.match(dto!.errorMessage ?? "", /412/);
  });

  it("uncertain accounting status does not allow blind retry", () => {
    const dto = buildAdminOrderAccountingDocumentDto({
      ...paidOrderBase,
      accountingDocument: {
        status: "uncertain",
      },
    });
    assert.ok(dto);
    assert.equal(dto!.canRetry, false);
  });

  it("issued accounting status does not allow retry", () => {
    const dto = buildAdminOrderAccountingDocumentDto({
      ...paidOrderBase,
      accountingDocument: {
        status: "issued",
        documentUrl: "https://finbot.example/doc",
      },
    });
    assert.ok(dto);
    assert.equal(dto!.canRetry, false);
  });
});
