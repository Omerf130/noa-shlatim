import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { isAdminOrderAssetAccessAllowed } from "@/lib/admin/orders/adminOrderAssets";
import { ADMIN_VISIBLE_ORDER_FILTER } from "@/lib/admin/orders/adminOrderQueryFilter";
import { buildFinbotIncomeLineItems } from "@/lib/finbot/vatLinePrices";
import { buildOwnerPaidOrderEmail } from "@/lib/notifications/buildOwnerPaidOrderEmail";
import {
  commercialSnapshotTotalMinor,
  parseOrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import { decidePayPlusCallback } from "@/lib/orders/decidePayPlusCallback";
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import { buildPayPlusGenerateLinkRequest } from "@/lib/payplus/buildGenerateLinkRequest";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function pathMissing(relativePath: string): boolean {
  try {
    readFileSync(join(repoRoot, relativePath), "utf8");
    return false;
  } catch {
    return true;
  }
}

function readRepo(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

const sampleDesign = {
  creationMode: "illustration" as const,
  backgroundId: "bg-1",
  material: "wood" as const,
  text: {
    value: "שלום",
    color: { kind: "solid" as const, hex: "#112233" },
    size: 24,
    position: "center" as const,
    fontStyle: "clean" as const,
    offsetX: 0,
    offsetY: 0,
  },
  illustrationTransform: { x: 0.5, y: 0.5, scale: 1 },
  decorations: [],
};

const v1Snapshot = {
  currency: "ILS" as const,
  capturedAt: "2026-01-01T00:00:00.000Z",
  material: "wood" as const,
  productAmountMinor: 9000,
  shippingMethodId: "ship",
  shippingLabel: "שליח",
  shippingAmountMinor: 0,
  totalAmountMinor: 9000,
};

describe("C12 — obsolete new-order creation removed", () => {
  it("1-2: Builder Review is Add to Cart only", () => {
    const review = readRepo("src/components/builder/steps/ReviewStep.tsx");
    assert.match(review, /useAddToCart/);
    assert.match(review, /הוספה לסל/);
    assert.doesNotMatch(review, /useCreateDraftOrder/);
    assert.doesNotMatch(review, /\/api\/orders\/draft/);
    assert.doesNotMatch(review, /router\.push/);
  });

  it("3: POST /api/orders/draft route removed", () => {
    assert.equal(pathMissing("src/app/api/orders/draft/route.ts"), true);
  });

  it("4: createDraftOrder module removed", () => {
    assert.equal(pathMissing("src/lib/orders/createDraftOrder.ts"), true);
  });

  it("27: customer cannot bypass Cart via removed draft API", () => {
    assert.equal(pathMissing("src/hooks/useCreateDraftOrder.ts"), true);
    assert.equal(pathMissing("src/app/api/orders/draft/route.ts"), true);
    const convert = readRepo("src/app/api/cart/convert/route.ts");
    assert.match(convert, /convertCartToOrder/);
    assert.doesNotMatch(convert, /createDraftOrder/);
  });
});

describe("C12 — canonical Cart purchase path (wiring)", () => {
  it("4-6: cart add / convert endpoints remain", () => {
    assert.match(readRepo("src/app/api/cart/items/route.ts"), /addCartItem/);
    assert.match(readRepo("src/app/api/cart/items/[lineId]/route.ts"), /updateCartLineQuantity|removeCartLine/);
    assert.match(readRepo("src/app/api/cart/convert/route.ts"), /convertCartToOrder/);
  });

  it("7: conversion writes items[] Order", () => {
    const src = readRepo("src/lib/cart/convertCartToOrder.ts");
    assert.match(src, /items:/);
    assert.match(src, /buildCartConversionDraftIdempotencyKey/);
  });

  it("28-29: cart_access and checkout_access enforced", () => {
    assert.match(readRepo("src/app/api/cart/convert/route.ts"), /authorizeCartConversion/);
    assert.match(readRepo("src/lib/checkout/authorizeCheckoutAccess.ts"), /CHECKOUT_ACCESS_COOKIE/);
    assert.match(readRepo("src/app/checkout/[orderId]/page.tsx"), /authorizeCheckoutAccess/);
    assert.match(readRepo("src/lib/cart/authorizeCartAccess.ts"), /CART_ACCESS_COOKIE/);
  });
});

describe("C12 — checkout and commercial (multi-item + legacy read)", () => {
  it("8-9: checkout uses resolveOrderItems and live commercial builder", () => {
    assert.match(readRepo("src/lib/checkout/buildCheckoutPageFromOrder.ts"), /resolveOrderItems/);
    assert.match(readRepo("src/lib/checkout/buildCheckoutCommercialForOrder.ts"), /multi_v2/);
    assert.match(
      readRepo("src/lib/orders/computeLiveCommercialForOrder.ts"),
      /computeLiveCommercialSnapshotV2ForOrder/,
    );
  });

  it("17-18: legacy Order synthesizes for Checkout", () => {
    const items = resolveOrderItems({
      creationMode: "illustration",
      design: sampleDesign,
      assets: {},
    });
    assert.equal(items.length, 1);
    assert.equal(items[0]!.lineId, LEGACY_ORDER_LINE_ID);
    assert.match(readRepo("src/app/checkout/[orderId]/page.tsx"), /buildCheckoutPageFromOrder/);
  });

  it("19-20: legacy artwork route and v1 snapshot parser", () => {
    assert.match(readRepo("src/app/api/orders/[orderId]/artwork/route.ts"), /authorizeCheckoutAccess/);
    const parsed = parseOrderCommercialSnapshot(v1Snapshot);
    assert.equal(parsed?.version, 1);
    assert.equal(parsed && commercialSnapshotTotalMinor(parsed), 9000);
  });
});

describe("C12 — payment freeze and PayPlus (unchanged wiring)", () => {
  it("10-11: payment init freezes v2 from draft", () => {
    const init = readRepo("src/lib/orders/initiateOrderPayment.ts");
    assert.match(init, /computeLiveCommercialSnapshotV2ForOrder/);
    assert.match(init, /reserveFirstPaymentAttempt/);
    assert.doesNotMatch(readRepo("src/app/api/orders/[orderId]/payment/init/route.ts"), /cart_items/);
  });

  it("11: PayPlus amount from frozen snapshot total", () => {
    const body = buildPayPlusGenerateLinkRequest({
      paymentPageUid: "page-uid",
      siteUrl: "https://example.com",
      orderId: "507f1f77bcf86cd799439011",
      attemptId: "attempt-1",
      snapshot: v1Snapshot,
      customer: { customer_name: "Test", email: "a@b.com" },
    });
    assert.equal(body.amount, 90);
  });

  it("12: callback verifies amount via union parser", () => {
    const orderId = "507f1f77bcf86cd799439011";
    const attemptId = "11111111-1111-4111-8111-111111111111";
    const decision = decidePayPlusCallback(
      {
        orderId,
        status: "payment_pending",
        commercialSnapshot: v1Snapshot,
        payment: {
          activeAttemptId: attemptId,
          attempts: [
            {
              attemptId,
              status: "ready",
              createdAt: "2026-10-01T00:00:00.000Z",
              pageRequestUid: "ef76432c-769a-43a6-ba7a-6f70272539d8",
            },
          ],
        },
      },
      {
        transactionType: "Charge",
        cardDetailsForPersistence: {},
        transaction: {
          uid: "dcb11c1e7-a1231-37cf-6311-f5111eeb69c7",
          payment_request_uid: "ef76432c-769a-43a6-ba7a-6f70272539d8",
          status_code: "000",
          amount: 90,
          currency: "ILS",
          more_info: orderId,
          more_info_2: attemptId,
        },
      },
    );
    assert.equal(decision.kind, "mark_paid");
  });

  it("21: legacy payment_pending retry path preserved", () => {
    const init = readRepo("src/lib/orders/initiateOrderPayment.ts");
    assert.match(init, /reserveRetryPaymentAttempt/);
    assert.match(init, /hasValidCommercialSnapshot/);
  });
});

describe("C12 — Finbot, Resend, Admin (legacy + v2 read)", () => {
  it("13-14: Finbot and owner email accept v1 snapshot", () => {
    const lines = buildFinbotIncomeLineItems(v1Snapshot);
    assert.ok(lines.length >= 1);
    const email = buildOwnerPaidOrderEmail({
      orderId: "507f1f77bcf86cd799439011",
      customer: { fullName: "Test", phone: "050", email: "a@b.com" },
      snapshot: v1Snapshot,
      paymentCompletedAtIso: "2026-10-07T12:00:00.000Z",
      adminOrderUrl: "https://example.com/admin/orders/x",
    });
    assert.match(email.html, /₪90/);
  });

  it("15-16: Admin multi-item filter and per-line assets", () => {
    assert.ok(ADMIN_VISIBLE_ORDER_FILTER.$or);
    assert.match(readRepo("src/lib/admin/orders/adminOrderDtos.ts"), /orderLines/);
    assert.match(
      readRepo("src/app/api/admin/orders/[orderId]/items/[lineId]/assets/[assetType]/route.ts"),
      /resolveOrderItemAssetPathname/,
    );
  });

  it("22-26: legacy Admin assets and legacy detail DTO paths", () => {
    assert.match(
      readRepo("src/app/api/admin/orders/[orderId]/assets/[assetType]/route.ts"),
      /LEGACY_ORDER_LINE_ID|resolveOrderItems/,
    );
    assert.equal(
      isAdminOrderAssetAccessAllowed({
        status: "paid",
        creationMode: "illustration",
        design: sampleDesign,
      }),
      true,
    );
    assert.match(readRepo("src/lib/admin/orders/adminOrderDtos.ts"), /buildAdminOrderLineDetail/);
  });

  it("30: Admin asset routes require admin session", () => {
    assert.match(
      readRepo("src/app/api/admin/orders/[orderId]/items/[lineId]/assets/[assetType]/route.ts"),
      /requireAdminApiSession/,
    );
  });
});
