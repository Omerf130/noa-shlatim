/** In-process dev guard only — not production rate limiting. */

const hits = new Map<string, { count: number; resetAt: number }>();

const WINDOW_MS = 60 * 60 * 1000;
const MAX_PER_WINDOW = 20;

export function checkDevGenerationGuard(clientKey: string): boolean {
  if (process.env.NODE_ENV === "production") {
    return true;
  }

  const now = Date.now();
  const entry = hits.get(clientKey);
  if (!entry || now > entry.resetAt) {
    hits.set(clientKey, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_PER_WINDOW) {
    return false;
  }
  entry.count += 1;
  return true;
}

export function clientKeyFromRequest(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  return "local";
}
