"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import type { TextPosition } from "@/types/signDesign";
import styles from "./stepShared.module.scss";

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

export function TextStep() {
  const { state, dispatch } = useBuilder();
  const { text } = state.design;

  return (
    <div className={styles.step}>
      <div>
        <h2 className={styles.heading}>טקסט על השלט</h2>
        <p className={styles.lead}>לדוגמה: שם המשפחה או ברכת שלום.</p>
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sign-text">
          הטקסט שיופיע על השלט
        </label>
        <input
          id="sign-text"
          type="text"
          className={styles.textInput}
          value={text.value}
          onChange={(e) => dispatch({ type: "SET_TEXT", patch: { value: e.target.value } })}
          placeholder="משפחת כהן"
          maxLength={40}
        />
      </div>

      <div className={styles.field}>
        <label className={styles.label} htmlFor="sign-text-size">
          גודל ({text.size}px)
        </label>
        <input
          id="sign-text-size"
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
        <span className={styles.label} id="text-color-label">
          צבע
        </span>
        <div className={styles.swatches} role="group" aria-labelledby="text-color-label">
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
        <span className={styles.label} id="text-position-label">
          מיקום אנכי
        </span>
        <div className={styles.segmented} role="group" aria-labelledby="text-position-label">
          {POSITIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={[
                styles.segment,
                text.position === p.value ? styles.segmentActive : "",
              ].join(" ")}
              aria-pressed={text.position === p.value}
              onClick={() => dispatch({ type: "SET_TEXT", patch: { position: p.value } })}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
