"use client";

import { ChoiceCard } from "@/components/builder/ChoiceCard/ChoiceCard";
import { useBuilder } from "@/components/builder/BuilderContext";
import { SignBackgroundLayer } from "@/components/sign/SignBackgroundLayer/SignBackgroundLayer";
import { signBackgrounds } from "@/data/signBackgrounds";
import styles from "./stepShared.module.scss";
import bgStyles from "./backgroundStep.module.scss";

export function BackgroundStep() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.backgroundId;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת רקע</h2>
        <p className={styles.lead}>בחרו את הרקע שמתאים לכניסה ולסגנון הבית.</p>
      </div>

      <div className={styles.grid2} role="radiogroup" aria-label="רקע לשלט">
        {signBackgrounds.map((bg) => (
          <ChoiceCard
            key={bg.id}
            name="sign-background"
            value={bg.id}
            checked={selected === bg.id}
            onChange={(id) => dispatch({ type: "SET_BACKGROUND", backgroundId: id })}
            title={bg.name}
          >
            <div className={[styles.bgThumb, bgStyles.thumbInner].join(" ")}>
              <SignBackgroundLayer background={bg} />
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  );
}
