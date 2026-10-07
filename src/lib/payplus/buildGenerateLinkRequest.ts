import { commercialSnapshotTotalMinor, parseOrderCommercialSnapshot } from "@/lib/orders/commercialSnapshotAccess";
import { orderMinorToPayPlusAmount } from "@/lib/payplus/amount";

export type PayPlusGenerateLinkCustomer = {
  customer_name: string;
  email: string;
  phone?: string;
};

export type PayPlusGenerateLinkRequestBody = {
  payment_page_uid: string;
  amount: number;
  currency_code: "ILS";
  charge_method: 1;
  sendEmailApproval: false;
  sendEmailFailure: false;
  initial_invoice: false;
  send_failure_callback: true;
  language_code: "he";
  refURL_callback: string;
  refURL_success: string;
  refURL_failure: string;
  refURL_cancel: string;
  more_info: string;
  more_info_2: string;
  customer: PayPlusGenerateLinkCustomer;
};

export function buildPayPlusReturnUrls(siteUrl: string, orderId: string) {
  const base = `${siteUrl}/checkout/${orderId}/payment/return`;
  return {
    refURL_callback: `${siteUrl}/api/payplus/callback`,
    refURL_success: `${base}?outcome=success`,
    refURL_failure: `${base}?outcome=failure`,
    refURL_cancel: `${base}?outcome=cancel`,
  };
}

export function buildPayPlusGenerateLinkRequest(params: {
  paymentPageUid: string;
  siteUrl: string;
  orderId: string;
  attemptId: string;
  snapshot: unknown;
  customer: PayPlusGenerateLinkCustomer;
}): PayPlusGenerateLinkRequestBody {
  const parsed = parseOrderCommercialSnapshot(params.snapshot);
  if (!parsed) {
    throw new Error("INVALID_COMMERCIAL_SNAPSHOT");
  }
  const urls = buildPayPlusReturnUrls(params.siteUrl, params.orderId);
  return {
    payment_page_uid: params.paymentPageUid,
    amount: orderMinorToPayPlusAmount(commercialSnapshotTotalMinor(parsed)),
    currency_code: "ILS",
    charge_method: 1,
    sendEmailApproval: false,
    sendEmailFailure: false,
    initial_invoice: false,
    send_failure_callback: true,
    language_code: "he",
    ...urls,
    more_info: params.orderId,
    more_info_2: params.attemptId,
    customer: params.customer,
  };
}
