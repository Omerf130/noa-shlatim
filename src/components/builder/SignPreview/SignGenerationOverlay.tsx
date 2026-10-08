"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CreationMode } from "@/types/signDesign";
import styles from "./SignGenerationOverlay.module.scss";

const PRIMARY_MESSAGE = "יוצרים את השלט שלכם...";

const PLAYFUL_ROTATING_MESSAGES = [
  "נועה בודקת אם כולם יצאו פוטוגניים...",
  "רגע, מי הזיז את העצם?",
  "מסדרים את הפרווה לפני התמונה...",
  "עוד רגע, נועה נותנת אישור סופי 🐾",
] as const;

const ROTATE_MS = 5500;

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
  creationMode?: CreationMode | null;
};

function PawMark({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 16 16"
      width={20}
      height={20}
      aria-hidden="true"
    >
      <ellipse cx="8" cy="11" rx="3.2" ry="2.6" fill="currentColor" />
      <circle cx="4.5" cy="6.5" r="1.6" fill="currentColor" />
      <circle cx="8" cy="5" r="1.7" fill="currentColor" />
      <circle cx="11.5" cy="6.5" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function SignGenerationOverlay({
  active,
}: SignGenerationOverlayProps) {
  const [rotateIndex, setRotateIndex] = useState(0);
  const [prevActive, setPrevActive] = useState(active);
  if (prevActive !== active) {
    setPrevActive(active);
    if (!active) {
      setRotateIndex(0);
    }
  }
  const reducedMotion = useSyncExternalStore(
    subscribeReducedMotion,
    getReducedMotionSnapshot,
    getReducedMotionServerSnapshot,
  );

  useEffect(() => {
    if (!active) {
      return;
    }
    if (reducedMotion) {
      return;
    }
    const id = window.setInterval(() => {
      setRotateIndex((i) => (i + 1) % PLAYFUL_ROTATING_MESSAGES.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [active, reducedMotion]);

  if (!active) {
    return null;
  }

  const supporting = reducedMotion
    ? PLAYFUL_ROTATING_MESSAGES[0]
    : PLAYFUL_ROTATING_MESSAGES[rotateIndex % PLAYFUL_ROTATING_MESSAGES.length];

  return (
    <div
      className={[
        styles.overlay,
        reducedMotion ? styles.reducedMotion : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className={styles.glowRing} aria-hidden="true" />
      <div className={styles.panel}>
        <div className={styles.playScene} aria-hidden="true">
          <div className={styles.doorSign}>
            <span className={styles.doorSignLabel}>נועה</span>
          </div>
          <PawMark className={styles.pawRunner} />
        </div>
        <p className={styles.primary}>{PRIMARY_MESSAGE}</p>
        <p className={styles.supporting}>{supporting}</p>
      </div>
    </div>
  );
}
