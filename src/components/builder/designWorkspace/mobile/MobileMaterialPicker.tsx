"use client";

import { FinalSignCreatePanel } from "@/components/builder/designWorkspace/FinalSignCreatePanel";
import { BuilderMaterialSelector } from "@/components/builder/material/BuilderMaterialSelector";
import panelStyles from "@/components/builder/designWorkspace/panels/panels.module.scss";
import type { Material } from "@/types/signDesign";
import styles from "./mobileEditor.module.scss";

const options: {
  value: Material;
  title: string;
  sampleClass: string;
}[] = [
  { value: "wood", title: "עץ", sampleClass: styles.sampleWood },
  { value: "magnet", title: "מגנט", sampleClass: styles.sampleMagnet },
];

export function MobileMaterialPicker() {
  return (
    <div className={panelStyles.panel}>
      <BuilderMaterialSelector
        options={options}
        layout="mobile"
        sampleBaseClass={styles.materialSample}
        cardClass={styles.materialCard}
        selectedCardClass={styles.materialSelected}
        titleClass={styles.materialTitle}
        rowClass={styles.materialRow}
        unavailableClass={styles.materialUnavailable}
      >
        <FinalSignCreatePanel />
      </BuilderMaterialSelector>
    </div>
  );
}
