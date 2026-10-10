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

function finbotErrorEntries(body: Record<string, unknown>): unknown[] {
  const errors = body.errors ?? body.error;
  if (Array.isArray(errors)) {
    return errors;
  }
  return [];
}

function formatFinbotErrorEntry(entry: unknown): string | null {
  if (typeof entry === "string" && entry.trim()) {
    return entry.trim();
  }
  if (typeof entry !== "object" || entry === null) {
    return null;
  }
  const row = entry as Record<string, unknown>;
  const fieldRaw =
    row.field ?? row.fieldName ?? row.name ?? row.key ?? row.param ?? row.parameter;
  const textRaw = row.text ?? row.message ?? row.error;
  const codeRaw = row.code ?? row.number ?? row.errorCode;

  const parts: string[] = [];
  if (typeof fieldRaw === "string" && fieldRaw.trim()) {
    parts.push(fieldRaw.trim());
  }
  if (codeRaw !== undefined && codeRaw !== null && String(codeRaw).trim()) {
    parts.push(String(codeRaw).trim());
  }
  if (typeof textRaw === "string" && textRaw.trim()) {
    parts.push(textRaw.trim());
  }
  return parts.length > 0 ? parts.join(": ") : null;
}

function extractErrorMessage(body: Record<string, unknown>): string {
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const formatted = finbotErrorEntries(body)
    .map(formatFinbotErrorEntry)
    .filter((line): line is string => Boolean(line));
  if (formatted.length > 0) {
    return formatted.join(" | ");
  }
  return message || "שגיאה בהפקת המסמך";
}

function extractErrorCode(body: Record<string, unknown>): string | null {
  const codes: string[] = [];
  for (const entry of finbotErrorEntries(body)) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const code = (entry as Record<string, unknown>).code ?? (entry as Record<string, unknown>).number;
    if (code !== undefined && code !== null && String(code).trim()) {
      codes.push(String(code).trim());
    }
  }
  if (codes.length > 0) {
    return codes.join(",");
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
