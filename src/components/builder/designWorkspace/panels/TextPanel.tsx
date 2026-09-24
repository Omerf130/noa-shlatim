"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  isMulticolorTextColor,
  multicolorTextColor,
  signTextMulticolorOptions,
  signTextSolidColors,
  solidTextColor,
  textColorsEqual,
} from "@/data/signTextColors";
import type { SignTextMulticolorId } from "@/types/signDesign";
import { signTextFontOptions } from "@/data/signTextFonts";
import { signTextFontFamily } from "@/lib/fonts/signTextFonts";
import type { TextPosition } from "@/types/signDesign";
import styles from "./panels.module.scss";

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
        <span className={styles.label} id="ws-text-font-label">
          סגנון כתב
        </span>
        <div
          className={styles.fontStyleRow}
          role="radiogroup"
          aria-labelledby="ws-text-font-label"
        >
          {signTextFontOptions.map((option) => {
            const selected = text.fontStyle === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[
                  styles.fontStyleOption,
                  selected ? styles.fontStyleOptionActive : "",
                ].join(" ")}
                onClick={() =>
                  dispatch({ type: "SET_TEXT", patch: { fontStyle: option.id } })
                }
              >
                <span
                  className={styles.fontStylePreview}
                  style={{
                    fontFamily: signTextFontFamily(option.id),
                    fontWeight: option.fontWeight,
                    fontSize: option.previewSizeRem
                      ? `${option.previewSizeRem}rem`
                      : undefined,
                  }}
                  aria-hidden="true"
                >
                  {option.previewSample}
                </span>
                <span className={styles.fontStyleLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
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
          {signTextSolidColors.map((c) => {
            const colorValue = solidTextColor(c.hex);
            const selected = textColorsEqual(text.color, colorValue);
            return (
              <button
                key={c.hex}
                type="button"
                className={[
                  styles.swatch,
                  selected ? styles.swatchSelected : "",
                  c.hex === "#ffffff" ? styles.swatchLight : "",
                ].join(" ")}
                style={{ backgroundColor: c.hex }}
                aria-label={c.label}
                aria-pressed={selected}
                onClick={() => dispatch({ type: "SET_TEXT", patch: { color: colorValue } })}
              />
            );
          })}
        </div>
        <div
          className={styles.multicolorGroup}
          role="radiogroup"
          aria-label="צבעי מעבר"
        >
          {signTextMulticolorOptions.map((option) => {
            const colorValue = multicolorTextColor(option.preset);
            const selected =
              isMulticolorTextColor(text.color) && text.color.preset === option.preset;
            return (
              <button
                key={option.preset}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[
                  styles.multicolorOption,
                  selected ? styles.multicolorOptionSelected : "",
                ].join(" ")}
                onClick={() =>
                  dispatch({ type: "SET_TEXT", patch: { color: colorValue } })
                }
              >
                <span
                  className={[
                    styles.multicolorSwatch,
                    styles[`multicolorSwatch_${option.preset}` as `multicolorSwatch_${SignTextMulticolorId}`],
                  ].join(" ")}
                  aria-hidden="true"
                />
                <span className={styles.multicolorLabel}>{option.label}</span>
              </button>
            );
          })}
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
