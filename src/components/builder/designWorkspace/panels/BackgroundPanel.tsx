"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import { signBackgrounds } from "@/data/signBackgrounds";
import styles from "./panels.module.scss";

export function BackgroundPanel() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;

  return (
    <div className={styles.panel} role="radiogroup" aria-label="בחירת רקע">
      <p className={styles.panelIntro}>בחרו רקע — השינוי יופיע מיד על השלט.</p>
      <ul className={styles.thumbGrid}>
        {signBackgrounds.map((bg) => {
          const isSelected = selected === bg.id;
          return (
            <li key={bg.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isSelected}
                className={[styles.thumb, isSelected ? styles.thumbSelected : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={() =>
                  dispatch({ type: "SET_BACKGROUND", backgroundId: bg.id })
                }
              >
                <span className={styles.thumbVisual}>
                  <SignBackgroundLayer variant={bg.variant} />
                </span>
                <span className={styles.thumbLabel}>{bg.name}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
