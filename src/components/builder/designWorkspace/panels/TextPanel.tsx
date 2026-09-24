"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import type { TextPosition } from "@/types/signDesign";
import styles from "./panels.module.scss";

const TEXT_COLORS = [
  { value: "#1f1b18", label: "פחם" },
  { value: "#ffffff", label: "לבן" },
  { value: "#c46953", label: "טרקוטה" },
  { value: "#5c5752", label: "אפור חם" },
  { value: "#2d4a3e", label: "ירוק כהה" },
];

const POSITIONS: { value: TextPosition; label: string }[] = [
  { value: "top", label: "למעלה" },
  { value: "center", label: "מרכז" },
  { value: "bottom", label: "למטה" },
];

export function TextPanel() {
  const { state, dispatch } = useBuilder();
  const { text } = state.design;

  return (
    <div className={styles.panel}>
      <p className={styles.panelIntro}>הוסיפו טקסט אישי — רואים את התוצאה על השלט.</p>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ws-sign-text">
          מה כתוב על השלט?
        </label>
        <input
          id="ws-sign-text"
          type="text"
          className={styles.textInput}
          value={text.value}
          onChange={(e) =>
            dispatch({ type: "SET_TEXT", patch: { value: e.target.value } })
          }
          placeholder="משפחת כהן"
          maxLength={40}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="ws-sign-text-size">
          גודל ({text.size}px)
        </label>
        <input
          id="ws-sign-text-size"
          type="range"
          className={styles.range}
          min={14}
          max={48}
          step={1}
          value={text.size}
          onChange={(e) =>
            dispatch({ type: "SET_TEXT", patch: { size: Number(e.target.value) } })
          }
        />
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="ws-text-color-label">
          צבע
        </span>
        <div className={styles.swatches} role="group" aria-labelledby="ws-text-color-label">
          {TEXT_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              className={[
                styles.swatch,
                text.color === c.value ? styles.swatchSelected : "",
              ].join(" ")}
              style={{ backgroundColor: c.value }}
              aria-label={c.label}
              aria-pressed={text.color === c.value}
              onClick={() => dispatch({ type: "SET_TEXT", patch: { color: c.value } })}
            />
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <span className={styles.label} id="ws-text-position-label">
          מיקום
        </span>
        <div className={styles.segmented} role="group" aria-labelledby="ws-text-position-label">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={[
                styles.segment,
                text.position === p.value ? styles.segmentActive : "",
              ].join(" ")}
              aria-pressed={text.position === p.value}
              onClick={() =>
                dispatch({ type: "SET_TEXT", patch: { position: p.value } })
              }
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
