"use client";

import { BackgroundPicker } from "@/components/builder/shared/BackgroundPicker";
import { useBuilder } from "@/components/builder/BuilderContext";
import styles from "./panels.module.scss";

export function BackgroundPanel() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;

  return (
    <div className={styles.panel} role="radiogroup" aria-label="בחירת רקע">
      <p className={styles.panelIntro}>בחרו רקע — השינוי יופיע מיד על השלט.</p>
      <BackgroundPicker
        selectedId={selected}
        onSelect={(backgroundId) =>
          dispatch({ type: "SET_BACKGROUND", backgroundId })
        }
      />
    </div>
  );
}
