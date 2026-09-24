"use client";

import { ChoiceCard } from "@/components/builder/ChoiceCard/ChoiceCard";
import { useBuilder } from "@/components/builder/BuilderContext";
import type { Material } from "@/types/signDesign";
import styles from "./stepShared.module.scss";
import matStyles from "./materialStep.module.scss";

export function MaterialStep() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.material;

  const setMaterial = (value: string) => {
    dispatch({ type: "SET_MATERIAL", material: value as Material });
  };

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>בחירת חומר</h2>
        <p className={styles.lead}>איך תרצו שהשלט ייראה ויתלה על הדלת?</p>
      </div>

      <div className={styles.grid2} role="radiogroup" aria-label="חומר השלט">
        <ChoiceCard
          name="material"
          value="wood"
          checked={selected === "wood"}
          onChange={setMaterial}
          title="עץ"
          description="מראה חם וטבעי לכניסה ביתית."
        >
          <div className={[matStyles.sample, matStyles.wood].join(" ")} aria-hidden="true" />
        </ChoiceCard>
        <ChoiceCard
          name="material"
          value="magnet"
          checked={selected === "magnet"}
          onChange={setMaterial}
          title="מגנט"
          description="קל להחלפה — מתאים לדלתות מתכת."
        >
          <div className={[matStyles.sample, matStyles.magnet].join(" ")} aria-hidden="true" />
        </ChoiceCard>
      </div>
    </div>
  );
}
