import type { FinbotConfig } from "@/lib/finbot/env";
import type { FinbotIncomeRequestBody } from "@/lib/finbot/buildIncomeRequest";
import { parseFinbotIncomeResponse } from "@/lib/finbot/parseIncomeResponse";

export type FinbotFetchFn = typeof fetch;

export type CreateFinbotIncomeResult =
  | { ok: true; documentUrl: string; documentNumber: string | null; message: string | null }
  | { ok: false; kind: "api_error"; errorCode: string | null; errorMessage: string }
  | { ok: false; kind: "transport"; errorMessage: string };

const INCOME_PATH = "/income";
const REQUEST_TIMEOUT_MS = 45_000;

export async function createFinbotIncomeDocument(params: {
  config: FinbotConfig;
  body: FinbotIncomeRequestBody;
  fetchFn?: FinbotFetchFn;
}): Promise<CreateFinbotIncomeResult> {
  const fetchImpl = params.fetchFn ?? fetch;
  const url = `${params.config.apiBaseUrl}${INCOME_PATH}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const res = await fetchImpl(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        secret: params.config.apiSecret,
      },
      body: JSON.stringify(params.body),
      signal: controller.signal,
    });

    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return {
        ok: false,
        kind: "transport",
        errorMessage: "לא ניתן לפענח תשובת Finbot",
      };
    }

    const parsed = parseFinbotIncomeResponse(json);
    if (parsed.ok) {
      return {
        ok: true,
        documentUrl: parsed.success.documentUrl,
        documentNumber: parsed.success.documentNumber,
        message: parsed.success.message,
      };
    }

    return {
      ok: false,
      kind: "api_error",
      errorCode: parsed.failure.errorCode,
      errorMessage: parsed.failure.errorMessage,
    };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return {
        ok: false,
        kind: "transport",
        errorMessage: "FINBOT_TIMEOUT",
      };
    }
    return {
      ok: false,
      kind: "transport",
      errorMessage: err instanceof Error ? err.message : "FINBOT_NETWORK_ERROR",
    };
  } finally {
    clearTimeout(timeout);
  }
}
