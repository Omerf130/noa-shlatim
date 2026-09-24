"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { getStepMeta, getStepsForMode } from "@/lib/builder/steps";
import styles from "./BuilderProgress.module.scss";

export function BuilderProgress() {
  const { state } = useBuilder();
  const steps = getStepsForMode(state.design.creationMode);
  const current = state.ui.currentStepId;
  const currentIndex = steps.indexOf(current);

  return (
    <nav className={styles.nav} aria-label="התקדמות בעיצוב">
      <ol className={styles.list}>
        {steps.map((stepId, index) => {
          const meta = getStepMeta(stepId);
          const isComplete = index < currentIndex;
          const isCurrent = stepId === current;
          return (
            <li
              key={stepId}
              className={[
                styles.item,
                isComplete ? styles.complete : "",
                isCurrent ? styles.current : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <span className={styles.label}>
                {isComplete ? `${meta.progressLabel} ✓` : meta.progressLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
