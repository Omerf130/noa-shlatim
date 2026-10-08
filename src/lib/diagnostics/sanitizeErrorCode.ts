const MAX_CODE_LENGTH = 64;

/** Safe application error codes only — never raw provider or stack text. */
export function sanitizeErrorCode(code: unknown): string {
  if (typeof code !== "string") {
    return "UNKNOWN";
  }
  const trimmed = code.trim();
  if (!trimmed) {
    return "UNKNOWN";
  }
  if (!/^[A-Z0-9_]+$/.test(trimmed)) {
    return "UNKNOWN";
  }
  return trimmed.slice(0, MAX_CODE_LENGTH);
}

export function clientStageToErrorCode(stage: string): string {
  const map: Record<string, string> = {
    composition: "CLIENT_COMPOSITION",
    fetch: "CLIENT_FETCH",
    json_parse: "CLIENT_JSON_PARSE",
    decode: "CLIENT_DECODE",
    malformed_response: "CLIENT_MALFORMED_RESPONSE",
  };
  return sanitizeErrorCode(map[stage] ?? "CLIENT_UNKNOWN");
}
