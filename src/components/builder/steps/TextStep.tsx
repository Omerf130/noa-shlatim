"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  signTextSolidColors,
  solidTextColor,
  textColorsEqual,
} from "@/data/signTextColors";
import type { TextPosition } from "@/types/signDesign";
import styles from "./stepShared.module.scss";

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
          {signTextSolidColors.map((c) => {
            const colorValue = solidTextColor(c.hex);
            const selected = textColorsEqual(text.color, colorValue);
            return (
              <button
                key={c.hex}
                type="button"
                className={[styles.swatch, selected ? styles.swatchSelected : ""].join(
                  " ",
                )}
                style={{ backgroundColor: c.hex }}
                aria-label={c.label}
                aria-pressed={selected}
                onClick={() =>
                  dispatch({ type: "SET_TEXT", patch: { color: colorValue } })
                }
              />
            );
          })}
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
