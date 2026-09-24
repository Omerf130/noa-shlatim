"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import styles from "./panels.module.scss";

export function ImagePanel() {
  const { state, dispatch } = useBuilder();
  const t = state.design.illustrationTransform;

  return (
    <div className={styles.panel}>
      <p className={styles.panelIntro}>
        התאימו את האיור על גבי השלט — גודל ומיקום.
      </p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ws-ill-scale">
          גודל ({Math.round(t.scale * 100)}%)
        </label>
        <input
          id="ws-ill-scale"
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
        <label className={styles.label} htmlFor="ws-ill-x">
          ימינה / שמאלה ({t.x})
        </label>
        <input
          id="ws-ill-x"
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
        <label className={styles.label} htmlFor="ws-ill-y">
          למעלה / למטה ({t.y})
        </label>
        <input
          id="ws-ill-y"
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
