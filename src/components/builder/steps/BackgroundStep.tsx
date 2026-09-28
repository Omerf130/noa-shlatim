"use client";

import { BackgroundPicker } from "@/components/builder/shared/BackgroundPicker";
import { useBuilder } from "@/components/builder/BuilderContext";
import panelStyles from "@/components/builder/designWorkspace/panels/panels.module.scss";
import styles from "./stepShared.module.scss";

export function BackgroundStep() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת רקע</h2>
        <p className={styles.lead}>
          בוחרים את הרקע של השלט לפני יצירת האיור — כך האיור יותאם לסצנה שבחרתם.
        </p>
      </div>

      <div className={panelStyles.panel} role="radiogroup" aria-label="בחירת רקע">
        <p className={panelStyles.panelIntro}>
          אפשר לשנות רקע גם בשלב העיצוב; האיור נוצר לפי הבחירה כאן.
        </p>
        <BackgroundPicker
          selectedId={selected}
          onSelect={(backgroundId) =>
            dispatch({ type: "SET_BACKGROUND", backgroundId })
          }
        />
      </div>
    </div>
  );
}
