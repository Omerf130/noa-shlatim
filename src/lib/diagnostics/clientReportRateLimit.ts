const hits = new Map<string, { minuteCount: number; minuteReset: number; hourCount: number; hourReset: number }>();

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const MAX_PER_MINUTE = 3;
const MAX_PER_HOUR = 20;

export function checkClientDiagnosticReportRateLimit(clientKey: string): boolean {
  const now = Date.now();
  let entry = hits.get(clientKey);

  if (!entry || now > entry.hourReset) {
    entry = {
      minuteCount: 0,
      minuteReset: now + MINUTE_MS,
      hourCount: 0,
      hourReset: now + HOUR_MS,
    };
    hits.set(clientKey, entry);
  }

  if (now > entry.minuteReset) {
    entry.minuteCount = 0;
    entry.minuteReset = now + MINUTE_MS;
  }

  if (entry.minuteCount >= MAX_PER_MINUTE || entry.hourCount >= MAX_PER_HOUR) {
    return false;
  }

  entry.minuteCount += 1;
  entry.hourCount += 1;
  return true;
}

/** @internal tests */
export function resetClientDiagnosticReportRateLimitForTests(): void {
  hits.clear();
}
