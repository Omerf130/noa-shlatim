"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { shouldShowDraftEditReassurance } from "@/lib/builder/shouldShowDraftEditReassurance";
import styles from "./DraftEditReassurance.module.scss";

export function DraftEditReassurance() {
  const { state } = useBuilder();
  if (!shouldShowDraftEditReassurance(state)) {
    return null;
  }

  return (
    <div className={styles.notice} role="note">
      <p className={styles.title}>אל דאגה, זו עדיין רק תצוגת העריכה ✨</p>
      <p className={styles.body}>
        בסיום נחבר את התמונה, הרקע והסגנון שבחרתם לאיור אחד מותאם אישית.
      </p>
    </div>
  );
}
