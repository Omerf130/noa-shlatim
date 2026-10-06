export type PayPlusGenerateLinkSuccess = {
  pageRequestUid: string;
  paymentPageLink: string;
};

export type PayPlusGenerateLinkParseResult =
  | { ok: true; data: PayPlusGenerateLinkSuccess }
  | { ok: false; reason: "INVALID_JSON" | "UNEXPECTED_SHAPE" | "API_ERROR" };

export function parsePayPlusGenerateLinkResponse(
  httpOk: boolean,
  body: unknown,
): PayPlusGenerateLinkParseResult {
  if (!httpOk || typeof body !== "object" || body === null) {
    return { ok: false, reason: "API_ERROR" };
  }

  const record = body as Record<string, unknown>;
  const results = record.results;
  if (typeof results === "object" && results !== null) {
    const status = (results as Record<string, unknown>).status;
    if (status !== "success") {
      return { ok: false, reason: "API_ERROR" };
    }
  }

  const data = record.data;
  if (typeof data !== "object" || data === null) {
    return { ok: false, reason: "UNEXPECTED_SHAPE" };
  }

  const pageRequestUid = (data as Record<string, unknown>).page_request_uid;
  const paymentPageLink = (data as Record<string, unknown>).payment_page_link;

  if (typeof pageRequestUid !== "string" || !pageRequestUid.trim()) {
    return { ok: false, reason: "UNEXPECTED_SHAPE" };
  }
  if (typeof paymentPageLink !== "string" || !paymentPageLink.trim()) {
    return { ok: false, reason: "UNEXPECTED_SHAPE" };
  }

  try {
    const url = new URL(paymentPageLink.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return { ok: false, reason: "UNEXPECTED_SHAPE" };
    }
  } catch {
    return { ok: false, reason: "UNEXPECTED_SHAPE" };
  }

  return {
    ok: true,
    data: {
      pageRequestUid: pageRequestUid.trim(),
      paymentPageLink: paymentPageLink.trim(),
    },
  };
}
