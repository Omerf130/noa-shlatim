"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { useState } from "react";
import styles from "./mobileEditor.module.scss";

type IllSubtool = "scale" | "x" | "y";

const subtools: { id: IllSubtool; label: string }[] = [
  { id: "scale", label: "גודל" },
  { id: "x", label: "↔" },
  { id: "y", label: "↕" },
];

export function MobileIllustrationControls() {
  const { state, dispatch } = useBuilder();
  const t = state.design.illustrationTransform;
  const [active, setActive] = useState<IllSubtool>("scale");

  const sliderProps = {
    scale: {
      id: "mobile-ill-scale",
      label: `גודל (${Math.round(t.scale * 100)}%)`,
      min: 0.5,
      max: 1.5,
      step: 0.05,
      value: t.scale,
      onChange: (v: number) =>
        dispatch({ type: "SET_ILLUSTRATION_TRANSFORM", patch: { scale: v } }),
    },
    x: {
      id: "mobile-ill-x",
      label: `ימינה / שמאלה (${t.x})`,
      min: -40,
      max: 40,
      step: 1,
      value: t.x,
      onChange: (v: number) =>
        dispatch({ type: "SET_ILLUSTRATION_TRANSFORM", patch: { x: v } }),
    },
    y: {
      id: "mobile-ill-y",
      label: `למעלה / למטה (${t.y})`,
      min: -40,
      max: 40,
      step: 1,
      value: t.y,
      onChange: (v: number) =>
        dispatch({ type: "SET_ILLUSTRATION_TRANSFORM", patch: { y: v } }),
    },
  } as const;

  const current = sliderProps[active];

  return (
    <div>
      <div className={styles.subToolRow} role="tablist" aria-label="פרמטרי תמונה">
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
      <div className={styles.sliderField}>
        <label className={styles.sliderLabel} htmlFor={current.id}>
          {current.label}
        </label>
        <input
          id={current.id}
          type="range"
          className={styles.range}
          min={current.min}
          max={current.max}
          step={current.step}
          value={current.value}
          onChange={(e) => current.onChange(Number(e.target.value))}
        />
      </div>

    </div>
  );
}
