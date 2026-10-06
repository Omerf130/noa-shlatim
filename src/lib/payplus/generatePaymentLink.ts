import type { PayPlusConfig } from "@/lib/payplus/env";
import type { PayPlusGenerateLinkRequestBody } from "@/lib/payplus/buildGenerateLinkRequest";
import { parsePayPlusGenerateLinkResponse } from "@/lib/payplus/parseGenerateLinkResponse";

export type PayPlusFetchFn = typeof fetch;

export type GeneratePaymentLinkResult =
  | { ok: true; pageRequestUid: string; paymentPageLink: string }
  | { ok: false; reason: "HTTP" | "PARSE" | "TIMEOUT" };

const GENERATE_LINK_PATH = "/PaymentPages/generateLink";
const REQUEST_TIMEOUT_MS = 30_000;

export async function generatePayPlusPaymentLink(params: {
  config: PayPlusConfig;
  body: PayPlusGenerateLinkRequestBody;
  fetchFn?: PayPlusFetchFn;
}): Promise<GeneratePaymentLinkResult> {
  const fetchImpl = params.fetchFn ?? fetch;
  const url = `${params.config.apiBaseUrl}${GENERATE_LINK_PATH}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": params.config.apiKey,
        "secret-key": params.config.secretKey,
      },
      body: JSON.stringify(params.body),
      signal: controller.signal,
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return { ok: false, reason: "PARSE" };
    }

    const parsed = parsePayPlusGenerateLinkResponse(res.ok, json);
    if (!parsed.ok) {
      return { ok: false, reason: parsed.reason === "API_ERROR" ? "HTTP" : "PARSE" };
    }

    return { ok: true, ...parsed.data };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { ok: false, reason: "TIMEOUT" };
    }
    return { ok: false, reason: "HTTP" };
  } finally {
    clearTimeout(timeout);
  }
}
