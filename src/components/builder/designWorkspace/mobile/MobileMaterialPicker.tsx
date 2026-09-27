"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
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
  const { state, dispatch } = useBuilder();
  const selected = state.design.material;

  return (
    <div className={styles.materialRow} role="radiogroup" aria-label="חומר השלט">
      {options.map((opt) => {
        const isSelected = selected === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={[styles.materialCard, isSelected ? styles.materialSelected : ""]
              .filter(Boolean)
              .join(" ")}
            onClick={() => dispatch({ type: "SET_MATERIAL", material: opt.value })}
          >
            <span
              className={[styles.materialSample, opt.sampleClass].join(" ")}
              aria-hidden
            />
            <span className={styles.materialTitle}>{opt.title}</span>
          </button>
        );
      })}
    </div>
  );
}
