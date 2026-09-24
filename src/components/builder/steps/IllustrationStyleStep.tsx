"use client";

import { ChoiceCard } from "@/components/builder/ChoiceCard/ChoiceCard";
import { useBuilder } from "@/components/builder/BuilderContext";
import { illustrationStyles } from "@/data/illustrationStyles";
import styles from "./stepShared.module.scss";

const artClass: Record<string, string> = {
  classic: styles.classicArt,
  soft: styles.softArt,
  playful: styles.playfulArt,
};

export function IllustrationStyleStep() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.illustration?.styleId;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת סגנון איור</h2>
        <p className={styles.lead}>
          בוחרים כיוון עיצובי — בגרסה העתידית ניצור מהתמונה שלכם איור אמיתי.
        </p>
      </div>

      <p className={styles.notice} role="note">
        <strong>אבטחת ציפיות:</strong> הכרטיסים והתצוגה המקדימה בשלב זה הם{" "}
        <strong>דוגמה זמנית בלבד</strong> לצורכי אב-טיפוס. הם אינם מייצגים את
        איכות, הדיוק או המראה של האיור שיווצר באמצעות AI בשלב מאוחר יותר.
      </p>

      <div className={styles.grid3} role="radiogroup" aria-label="סגנון איור לדוגמה">
        {illustrationStyles.map((style) => (
          <ChoiceCard
            key={style.id}
            name="illustration-style"
            value={style.id}
            checked={selected === style.id}
            onChange={(id) => dispatch({ type: "SET_ILLUSTRATION_STYLE", styleId: id })}
            title={style.name}
            description="תצוגת כרטיס — לא תוצאת AI"
          >
            <div
              className={[styles.styleCardArt, artClass[style.cardVariant]].join(" ")}
              aria-hidden="true"
            />
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
