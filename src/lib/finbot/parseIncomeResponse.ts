export type FinbotIncomeSuccess = {
  documentUrl: string;
  documentNumber: string | null;
  message: string | null;
};

export type FinbotIncomeFailure = {
  errorCode: string | null;
  errorMessage: string;
};

export type FinbotIncomeParseResult =
  | { ok: true; success: FinbotIncomeSuccess }
  | { ok: false; failure: FinbotIncomeFailure };

function statusToNumber(status: unknown): number | null {
  if (typeof status === "number" && Number.isFinite(status)) {
    return status;
  }
  if (typeof status === "string" && /^\d+$/.test(status.trim())) {
    return Number.parseInt(status.trim(), 10);
  }
  return null;
}

function extractDocumentNumber(body: Record<string, unknown>): string | null {
  const candidates = [
    body.documentNumber,
    body.document_number,
    body.docNumber,
    body.number,
    body.dataNumber,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) {
      return c.trim();
    }
    if (typeof c === "number" && Number.isFinite(c)) {
      return String(c);
    }
  }

  const data = body.data;
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const nested = data as Record<string, unknown>;
    for (const key of ["documentNumber", "document_number", "number", "docNumber"]) {
      const v = nested[key];
      if (typeof v === "string" && v.trim()) {
        return v.trim();
      }
    }
  }

  return null;
}

function extractDocumentUrl(body: Record<string, unknown>): string | null {
  const data = body.data;
  if (typeof data === "string" && data.trim()) {
    return data.trim();
  }
  if (typeof data === "object" && data !== null && !Array.isArray(data)) {
    const url = (data as Record<string, unknown>).url ?? (data as Record<string, unknown>).link;
    if (typeof url === "string" && url.trim()) {
      return url.trim();
    }
  }
  return null;
}

function extractErrorMessage(body: Record<string, unknown>): string {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const errors = body.errors ?? body.error;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "object" && first !== null) {
      const text = (first as Record<string, unknown>).text ?? (first as Record<string, unknown>).message;
      const code = (first as Record<string, unknown>).code ?? (first as Record<string, unknown>).number;
      const parts: string[] = [];
      if (code !== undefined && code !== null) {
        parts.push(String(code));
      }
      if (typeof text === "string" && text.trim()) {
        parts.push(text.trim());
      }
      if (parts.length) {
        return parts.join(": ");
      }
    }
  }
  return message || "שגיאה בהפקת המסמך";
}

function extractErrorCode(body: Record<string, unknown>): string | null {
  const errors = body.errors ?? body.error;
  if (Array.isArray(errors) && errors.length > 0) {
    const first = errors[0];
    if (typeof first === "object" && first !== null) {
      const code = (first as Record<string, unknown>).code ?? (first as Record<string, unknown>).number;
      if (code !== undefined && code !== null) {
        return String(code);
      }
    }
  }
  return null;
}

export function parseFinbotIncomeResponse(json: unknown): FinbotIncomeParseResult {
  if (json === null || typeof json !== "object") {
    return {
      ok: false,
      failure: { errorCode: null, errorMessage: "תשובה לא תקינה מ-Finbot" },
    };
  }

  const body = json as Record<string, unknown>;
  const status = statusToNumber(body.status);

  if (status === 1) {
    const documentUrl = extractDocumentUrl(body);
    if (!documentUrl) {
      return {
        ok: false,
        failure: {
          errorCode: null,
          errorMessage: "Finbot דיווח הצלחה ללא קישור למסמך",
        },
      };
    }
    return {
      ok: true,
      success: {
        documentUrl,
        documentNumber: extractDocumentNumber(body),
        message: typeof body.message === "string" ? body.message : null,
      },
    };
  }

  return {
    ok: false,
    failure: {
      errorCode: extractErrorCode(body),
      errorMessage: extractErrorMessage(body),
    },
  };
}
