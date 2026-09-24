"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import type { Material } from "@/types/signDesign";
import styles from "./panels.module.scss";

export function MaterialPanel() {
  const { state, dispatch } = useBuilder();
  const selected = state.design.material;

  const options: { value: Material; title: string; desc: string; sampleClass: string }[] =
    [
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

  return (
    <div className={styles.panel} role="radiogroup" aria-label="חומר השלט">
      <p className={styles.panelIntro}>בחרו איך השלט ייראה על הדלת.</p>
      <div className={styles.materialRow}>
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
              <span className={[styles.materialSample, opt.sampleClass].join(" ")} aria-hidden />
              <span className={styles.materialTitle}>{opt.title}</span>
              <span className={styles.materialDesc}>{opt.desc}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
