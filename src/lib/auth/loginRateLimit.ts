/** In-process login failure guard — not distributed across serverless instances. */

const hits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES_PER_WINDOW = 10;

export function clientKeyFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() ?? "unknown";
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }
  return "local";
}

export function isLoginRateLimited(clientKey: string): boolean {
  const now = Date.now();
  const entry = hits.get(clientKey);
  if (!entry || now > entry.resetAt) {
    return false;
  }
  return entry.count >= MAX_FAILURES_PER_WINDOW;
}

export function recordLoginFailure(clientKey: string): void {
  const now = Date.now();
  const entry = hits.get(clientKey);
  if (!entry || now > entry.resetAt) {
    hits.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(clientKey: string): void {
  hits.delete(clientKey);
}
