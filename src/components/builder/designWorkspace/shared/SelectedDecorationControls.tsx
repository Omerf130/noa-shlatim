"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import {
  getSignDecorationById,
  resolveDecorationColor,
  signDecorationColorPalette,
} from "@/data/signDecorations";
import { getSelectedDecorationId } from "@/lib/sign/designSelection";
import { DECORATION_SCALE_MAX, DECORATION_SCALE_MIN } from "@/lib/sign/compositionBounds";
import styles from "./decorationControls.module.scss";

export function SelectedDecorationControls() {
  const { state, dispatch } = useBuilder();
  const selectedId = getSelectedDecorationId(state.ui.designWorkspace.selectedElement);
  if (!selectedId) return null;

  const decoration = state.design.decorations.find((d) => d.id === selectedId);
  if (!decoration) return null;

  const meta = getSignDecorationById(decoration.type);
  const currentColor = resolveDecorationColor(decoration);

  return (
    <div className={styles.contextBlock}>
      <p className={styles.contextTitle}>קישוט נבחר — {meta.label}</p>
      <div className={styles.sliderField}>
        <span className={styles.sliderLabel} id="decoration-color-label">
          צבע
        </span>
        <div
          className={styles.swatches}
          role="group"
          aria-labelledby="decoration-color-label"
        >
          {signDecorationColorPalette.map((c) => {
            const selected =
              currentColor.toLowerCase() === c.hex.toLowerCase();
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
                  dispatch({
                    type: "UPDATE_DECORATION",
                    id: decoration.id,
                    patch: { color: c.hex },
                  })
                }
              />
            );
          })}
        </div>
      </div>
      <div className={styles.sliderField}>
        <label className={styles.sliderLabel} htmlFor="decoration-scale">
          גודל ({Math.round(decoration.scale * 100)}%)
        </label>
        <input
          id="decoration-scale"
          type="range"
          className={styles.range}
          min={DECORATION_SCALE_MIN}
          max={DECORATION_SCALE_MAX}
          step={0.05}
          value={decoration.scale}
          onChange={(e) =>
            dispatch({
              type: "UPDATE_DECORATION",
              id: decoration.id,
              patch: { scale: Number(e.target.value) },
            })
          }
        />
      </div>
      <div className={styles.contextActions}>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() =>
            dispatch({ type: "DUPLICATE_DECORATION", id: decoration.id })
          }
        >
          שכפול
        </button>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={() =>
            dispatch({ type: "DELETE_DECORATION", id: decoration.id })
          }
        >
          מחיקה
        </button>
        <button
          type="button"
          className={styles.btnSecondary}
          onClick={() =>
            dispatch({
              type: "SET_DESIGN_SELECTED_ELEMENT",
              element: state.design.text.value.trim()
                ? { kind: "text" }
                : null,
            })
          }
        >
          חזרה לטקסט
        </button>
      </div>
    </div>
  );
}
