"use client";

import {
  readCookieNoticeDismissed,
  writeCookieNoticeDismissed,
} from "@/lib/cookies/cookieNoticeStorage";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import styles from "./CookieNotice.module.scss";

export function CookieNotice() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    queueMicrotask(() => {
      setDismissed(readCookieNoticeDismissed());
    });
  }, []);

  if (isAdmin || dismissed) {
    return null;
  }

  function dismiss() {
    writeCookieNoticeDismissed();
    setDismissed(true);
  }

  return (
    <div
      className={styles.banner}
      role="dialog"
      aria-labelledby="cookie-notice-title"
      aria-describedby="cookie-notice-desc"
    >
      <div className={styles.inner}>
        <p id="cookie-notice-desc" className={styles.text}>
          <span id="cookie-notice-title" className={styles.srOnly}>
            הודעה על Cookies
          </span>
          האתר משתמש ב-Cookies הנדרשים לתפעול תקין, למשל כדי לאפשר לחזור
          להזמנה. אין שימוש ב-Cookies לפרסום או לניתוח התנהגות.{" "}
          <Link href="/privacy" className={styles.link}>
            מדיניות הפרטיות
          </Link>
        </p>
        <div className={styles.actions}>
          <button type="button" className={styles.acceptButton} onClick={dismiss}>
            הבנתי
          </button>
        </div>
      </div>
    </div>
  );
}
