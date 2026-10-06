"use client";

import { FinalSignCreatePanel } from "@/components/builder/designWorkspace/FinalSignCreatePanel";
import { BuilderMaterialSelector } from "@/components/builder/material/BuilderMaterialSelector";
import type { Material } from "@/types/signDesign";
import styles from "./panels.module.scss";

const options: {
  value: Material;
  title: string;
  desc: string;
  sampleClass: string;
}[] = [
  {
    value: "wood",
    title: "עץ",
    desc: "מראה חם לכניסה ביתית",
    sampleClass: styles.sampleWood,
  },
  {
    value: "magnet",
    title: "מגנט",
    desc: "מתאים לדלתות מתכת",
    sampleClass: styles.sampleMagnet,
  },
];

export function MaterialPanel() {
  return (
    <div className={styles.panel}>
      <BuilderMaterialSelector
        options={options}
        layout="panel"
        panelIntroClass={styles.panelIntro}
        panelIntroText="בחרו איך השלט ייראה על הדלת."
        sampleBaseClass={styles.materialSample}
        cardClass={styles.materialCard}
        selectedCardClass={styles.materialSelected}
        titleClass={styles.materialTitle}
        descClass={styles.materialDesc}
        rowClass={styles.materialRow}
        unavailableClass={styles.materialUnavailable}
      >
        <FinalSignCreatePanel />
      </BuilderMaterialSelector>
    </div>
  );
}
