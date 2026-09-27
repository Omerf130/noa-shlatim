/** Cookie name for opaque admin session token (raw token never stored in MongoDB). */
export const ADMIN_SESSION_COOKIE = "admin_session";

/** Default session lifetime: 7 days. */
export const SESSION_MAX_AGE_SECONDS = Number(
  process.env.ADMIN_SESSION_MAX_AGE_SECONDS ?? String(7 * 24 * 60 * 60),
);

/** Precomputed bcrypt hash for timing-safe login when email is unknown. */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxnGmJ.f.gkS4/j/KRMxOpFkEyHa";

export const GENERIC_AUTH_ERROR = "אימייל או סיסמה שגויים";
