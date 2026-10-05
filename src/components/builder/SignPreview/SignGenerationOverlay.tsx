"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import type { CreationMode } from "@/types/signDesign";
import styles from "./SignGenerationOverlay.module.scss";

const PRIMARY_MESSAGE = "יוצרים את השלט שלכם...";

const PHOTO_ROTATING_MESSAGES = [
  "מכינים את האיור שלכם...",
  "מחברים את המשפחה לרקע...",
  "מתאימים את הסגנון שבחרתם...",
  "עוד רגע השלט שלכם מוכן ✨",
] as const;

const ILLUSTRATION_ROTATING_MESSAGES = [
  "מכינים את האיור שלכם...",
  "משלבים את האיור ברקע...",
  "מחברים את הדמויות לסביבה...",
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

function rotatingMessagesForMode(mode: CreationMode | null): readonly string[] {
  if (mode === "illustration") {
    return ILLUSTRATION_ROTATING_MESSAGES;
  }
  return PHOTO_ROTATING_MESSAGES;
}

type SignGenerationOverlayProps = {
  active: boolean;
  creationMode?: CreationMode | null;
};

export function SignGenerationOverlay({
  active,
  creationMode = "photo",
}: SignGenerationOverlayProps) {
  const messages = rotatingMessagesForMode(creationMode);
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
      setRotateIndex((i) => (i + 1) % messages.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [active, reducedMotion, messages.length]);

  if (!active) {
    return null;
  }

  const supporting = reducedMotion
    ? messages[0]
    : messages[rotateIndex % messages.length];

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
