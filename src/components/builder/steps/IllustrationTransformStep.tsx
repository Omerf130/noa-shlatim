"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import styles from "./stepShared.module.scss";

export function IllustrationTransformStep() {
  const { state, dispatch } = useBuilder();
  const t = state.design.illustrationTransform;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>מיקום וגודל האיור</h2>
        <p className={styles.lead}>התאימו את האיור בתוך השלט — השינויים מתעדכנים מיד בתצוגה.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ill-scale">
          גודל ({Math.round(t.scale * 100)}%)
        </label>
        <input
          id="ill-scale"
          type="range"
          className={styles.range}
          min={0.5}
          max={1.5}
          step={0.05}
          value={t.scale}
          onChange={(e) =>
            dispatch({
              type: "SET_ILLUSTRATION_TRANSFORM",
              patch: { scale: Number(e.target.value) },
            })
          }
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ill-x">
          מיקום אופקי ({t.x})
        </label>
        <input
          id="ill-x"
          type="range"
          className={styles.range}
          min={-40}
          max={40}
          step={1}
          value={t.x}
          onChange={(e) =>
            dispatch({
              type: "SET_ILLUSTRATION_TRANSFORM",
              patch: { x: Number(e.target.value) },
            })
          }
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ill-y">
          מיקום אנכי ({t.y})
        </label>
        <input
          id="ill-y"
          type="range"
          className={styles.range}
          min={-40}
          max={40}
          step={1}
          value={t.y}
          onChange={(e) =>
            dispatch({
              type: "SET_ILLUSTRATION_TRANSFORM",
              patch: { y: Number(e.target.value) },
            })
          }
        />
      </div>
    </div>
  );
}
