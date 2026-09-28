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
  const selected = state.design.photoIllustrationStyleId;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת סגנון איור</h2>
        <p className={styles.lead}>
          בוחרים את כיוון האיור לשלט הסופי. האיור המשולב (רקע + דמויות) ייווצר
          בשלב העיצוב, אחרי שתסיימו לעצב את השלט.
        </p>
      </div>

      <div className={styles.grid3} role="radiogroup" aria-label="סגנון איור">
        {illustrationStyles.map((style) => (
          <ChoiceCard
            key={style.id}
            name="illustration-style"
            value={style.id}
            checked={selected === style.id}
            onChange={(id) => dispatch({ type: "SET_ILLUSTRATION_STYLE", styleId: id })}
            title={style.name}
            description="כיוון עיצובי לשלט המאויר"
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
