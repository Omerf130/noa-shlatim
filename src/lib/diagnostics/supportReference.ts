const UUIDish =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Short suffix searchable in Admin (full traceId is stored server-side). */
export function supportReferenceSuffix(traceId: string | null | undefined): string | null {
  if (!traceId?.trim()) {
    return null;
  }
  const normalized = traceId.trim();
  if (!UUIDish.test(normalized)) {
    return null;
  }
  return normalized.replace(/-/g, "").slice(-8).toUpperCase();
}

export function formatSupportReferenceLine(traceId: string | null | undefined): string | null {
  const suffix = supportReferenceSuffix(traceId);
  if (!suffix) {
    return null;
  }
  return `קוד תמיכה: ${suffix}`;
}

export function appendSupportReference(
  message: string,
  traceId: string | null | undefined,
): string {
  const line = formatSupportReferenceLine(traceId);
  if (!line) {
    return message;
  }
  return `${message}\n${line}`;
}
