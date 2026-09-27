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
import { DecorationPicker } from "@/components/builder/designWorkspace/shared/DecorationPicker";
import { SelectedDecorationControls } from "@/components/builder/designWorkspace/shared/SelectedDecorationControls";
import { getSelectedDecorationId } from "@/lib/sign/designSelection";
import decorStyles from "@/components/builder/designWorkspace/shared/decorationControls.module.scss";
import { useState } from "react";
import styles from "./mobileEditor.module.scss";

type TextSubtool = "text" | "font" | "color" | "size" | "position";

const subtools: { id: TextSubtool; label: string }[] = [
  { id: "text", label: "טקסט" },
  { id: "font", label: "כתב" },
  { id: "color", label: "צבע" },
  { id: "size", label: "גודל" },
  { id: "position", label: "מיקום" },
];

const POSITIONS: { value: TextPosition; label: string }[] = [
  { value: "top", label: "למעלה" },
  { value: "center", label: "מרכז" },
  { value: "bottom", label: "למטה" },
];

export function MobileTextControls() {
  const { state, dispatch } = useBuilder();
  const { text } = state.design;
  const [active, setActive] = useState<TextSubtool>("text");
  const selectedDecorationId = getSelectedDecorationId(
    state.ui.designWorkspace.selectedElement,
  );

  if (selectedDecorationId) {
    return <SelectedDecorationControls />;
  }

  return (
    <div>
      <div className={styles.subToolRow} role="tablist" aria-label="פרמטרי טקסט">
        {subtools.map((st) => (
          <button
            key={st.id}
            type="button"
            role="tab"
            aria-selected={active === st.id}
            className={[
              styles.subToolBtn,
              active === st.id ? styles.subToolBtnActive : "",
            ].join(" ")}
            onClick={() => setActive(st.id)}
          >
            {st.label}
          </button>
        ))}
      </div>

      {active === "text" && (
        <div className={decorStyles.inputRow}>
          <input
            id="mobile-sign-text"
            type="text"
            className={styles.textInput}
            value={text.value}
            onChange={(e) =>
              dispatch({ type: "SET_TEXT", patch: { value: e.target.value } })
            }
            placeholder="משפחת כהן"
            maxLength={40}
            aria-label="מה כתוב על השלט?"
          />
          <DecorationPicker
            onPick={(decorationType) =>
              dispatch({ type: "ADD_DECORATION", decorationType })
            }
          />
        </div>
      )}

      {active === "font" && (
        <div className={styles.fontRow} role="radiogroup" aria-label="סגנון כתב">
          {signTextFontOptions.map((option) => {
            const selected = text.fontStyle === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="radio"
                aria-checked={selected}
                className={[
                  styles.fontOption,
                  selected ? styles.fontOptionActive : "",
                ].join(" ")}
                onClick={() =>
                  dispatch({ type: "SET_TEXT", patch: { fontStyle: option.id } })
                }
              >
                <span
                  className={styles.fontPreview}
                  style={{
                    fontFamily: signTextFontFamily(option.id),
                    fontWeight: option.fontWeight,
                  }}
                  aria-hidden
                >
                  {option.previewSample}
                </span>
                <span className={styles.fontLabel}>{option.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {active === "color" && (
        <>
          <div className={styles.swatches} role="group" aria-label="צבע">
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
                  onClick={() =>
                    dispatch({ type: "SET_TEXT", patch: { color: colorValue } })
                  }
                />
              );
            })}
          </div>
          <div className={styles.multicolorRow} role="radiogroup" aria-label="צבעי מעבר">
            {signTextMulticolorOptions.map((option) => {
              const colorValue = multicolorTextColor(option.preset);
              const selected =
                isMulticolorTextColor(text.color) &&
                text.color.preset === option.preset;
              return (
                <button
                  key={option.preset}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={[
                    styles.multicolorBtn,
                    selected ? styles.multicolorBtnSelected : "",
                  ].join(" ")}
                  onClick={() =>
                    dispatch({ type: "SET_TEXT", patch: { color: colorValue } })
                  }
                >
                  <span
                    className={[
                      styles.multicolorSwatch,
                      styles[
                        `multicolorSwatch_${option.preset}` as `multicolorSwatch_${SignTextMulticolorId}`
                      ],
                    ].join(" ")}
                    aria-hidden
                  />
                  <span className={styles.multicolorLabel}>{option.label}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {active === "size" && (
        <div className={styles.sliderField}>
          <label className={styles.sliderLabel} htmlFor="mobile-text-size">
            גודל ({text.size}px)
          </label>
          <input
            id="mobile-text-size"
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
      )}

      {active === "position" && (
        <div className={styles.segmented} role="group" aria-label="מיקום טקסט">
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
      )}
    </div>
  );
}
