"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import styles from "./SignGenerationOverlay.module.scss";

const PRIMARY_MESSAGE = "יוצרים את השלט שלכם...";

const ROTATING_MESSAGES = [
  "מכינים את האיור שלכם...",
  "מחברים את המשפחה לרקע...",
  "מתאימים את הסגנון שבחרתם...",
  "עוד רגע השלט שלכם מוכן ✨",
] as const;

const ROTATE_MS = 6000;

function subscribeReducedMotion(onStoreChange: () => void) {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getReducedMotionSnapshot() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getReducedMotionServerSnapshot() {
  return false;
}

type SignGenerationOverlayProps = {
  active: boolean;
};

export function SignGenerationOverlay({ active }: SignGenerationOverlayProps) {
  const [rotateIndex, setRotateIndex] = useState(0);
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (!active || reducedMotion) {
      return;
    }
    const id = window.setInterval(() => {
      setRotateIndex((i) => (i + 1) % ROTATING_MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [active, reducedMotion]);

  if (!active) {
    return null;
  }

  const supporting = reducedMotion
    ? ROTATING_MESSAGES[0]
    : ROTATING_MESSAGES[rotateIndex];

  return (
    <div
      className={[
        styles.overlay,
        reducedMotion ? styles.reducedMotion : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-busy="true"
    >
      <div className={styles.glowRing} aria-hidden="true" />
      <div className={styles.panel}>
        <p className={styles.primary}>{PRIMARY_MESSAGE}</p>
        <p className={styles.supporting} aria-live="polite">
          {supporting}
        </p>
      </div>
    </div>
  );
}
