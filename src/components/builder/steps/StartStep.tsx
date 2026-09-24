"use client";

import { ChoiceCard } from "@/components/builder/ChoiceCard/ChoiceCard";
import { useBuilder } from "@/components/builder/BuilderContext";
import type { CreationMode } from "@/types/signDesign";
import styles from "./StartStep.module.scss";

export function StartStep() {
  const { state, dispatch } = useBuilder();
  const mode = state.design.creationMode;

  const setMode = (value: string) => {
    dispatch({ type: "SET_CREATION_MODE", mode: value as CreationMode });
  };

  return (
    <div className={styles.start}>
      <header className={styles.intro}>
        <p className={styles.eyebrow}>בואו ניצור משהו משלכם</p>
        <h1 className={styles.heading}>איך תרצו להתחיל?</h1>
        <p className={styles.lead}>
          בחרו נקודת פתיחה — מכאן מתחילים לעצב שלט דלת אישי.
        </p>
      </header>

      <div className={styles.choices} role="radiogroup" aria-label="דרך יצירה">
        <ChoiceCard
          name="creation-mode"
          value="photo"
          checked={mode === "photo"}
          onChange={setMode}
          title="יש לי תמונה רגילה"
          description="תמונת משפחה שתהפוך לאיור — בשלב הבא תעלו את התמונה."
        />
        <ChoiceCard
          name="creation-mode"
          value="illustration"
          checked={mode === "illustration"}
          onChange={setMode}
          title="כבר יש לי איור"
          description="קובץ מאויר מוכן — ממשיכים ישר לעיצוב השלט."
        />
      </div>
    </div>
  );
}
