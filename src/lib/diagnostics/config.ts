/** Mongo TTL for operation failure traces (days). */
export function operationFailureRetentionDays(): number {
  const raw = process.env.OPERATION_FAILURE_RETENTION_DAYS;
  if (raw) {
    const n = Number.parseInt(raw, 10);
    if (Number.isFinite(n) && n >= 1 && n <= 90) {
      return n;
    }
  }
  return 14;
}

export function operationFailureTtlSeconds(): number {
  return operationFailureRetentionDays() * 24 * 60 * 60;
}

export const TRACE_ID_HEADER = "X-Trace-Id";
