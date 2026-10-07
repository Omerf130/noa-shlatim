export const COOKIE_NOTICE_DISMISSED_KEY = "noa_cookie_notice_dismissed" as const;

export const COOKIE_NOTICE_DISMISSED_VALUE = "1" as const;

function getStorage(): Storage | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }
  return globalThis.localStorage;
}

export function readCookieNoticeDismissed(): boolean {
  const storage = getStorage();
  if (!storage) {
    return false;
  }
  try {
    return (
      storage.getItem(COOKIE_NOTICE_DISMISSED_KEY) ===
      COOKIE_NOTICE_DISMISSED_VALUE
    );
  } catch {
    return false;
  }
}

export function writeCookieNoticeDismissed(): void {
  const storage = getStorage();
  if (!storage) {
    return;
  }
  try {
    storage.setItem(COOKIE_NOTICE_DISMISSED_KEY, COOKIE_NOTICE_DISMISSED_VALUE);
  } catch {
    // ignore quota / private mode
  }
}
