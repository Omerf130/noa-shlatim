import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  COOKIE_NOTICE_DISMISSED_KEY,
  COOKIE_NOTICE_DISMISSED_VALUE,
  readCookieNoticeDismissed,
  writeCookieNoticeDismissed,
} from "./cookieNoticeStorage";

describe("cookieNoticeStorage", () => {
  it("read returns false when key missing", () => {
    const storage = new Map<string, string>();
    const original = globalThis.localStorage;
    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => {
          storage.set(k, v);
        },
      },
      configurable: true,
    });
    try {
      assert.equal(readCookieNoticeDismissed(), false);
      writeCookieNoticeDismissed();
      assert.equal(storage.get(COOKIE_NOTICE_DISMISSED_KEY), COOKIE_NOTICE_DISMISSED_VALUE);
      assert.equal(readCookieNoticeDismissed(), true);
    } finally {
      Object.defineProperty(globalThis, "localStorage", {
        value: original,
        configurable: true,
      });
    }
  });
});
