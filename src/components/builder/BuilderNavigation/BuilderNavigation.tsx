"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { canProceed, stepValidationHint } from "@/lib/builder/validation";
import { getPrevStep } from "@/lib/builder/steps";
import type { BuilderStepId } from "@/types/builder";
import { useState } from "react";
import styles from "./BuilderNavigation.module.scss";

type BuilderNavigationProps = {
  className?: string;
};

export function BuilderNavigation({ className }: BuilderNavigationProps) {
  const { state, dispatch } = useBuilder();
  const { design, ui } = state;
  const step = ui.currentStepId;
  const canContinue = canProceed(step, design);
  const hint = stepValidationHint(step, design);
  const hasBack = getPrevStep(design.creationMode, step) !== null;
  const [continueAttemptStep, setContinueAttemptStep] = useState<BuilderStepId | null>(
    null,
  );

  const showHint = continueAttemptStep === step && hint && !canContinue;

  const onContinue = () => {
    setContinueAttemptStep(step);
    if (canContinue) {
      dispatch({ type: "GO_NEXT" });
    }
  };

  return (
    <div className={[styles.bar, className].filter(Boolean).join(" ")}>
      {showHint && (
        <p className={styles.hint} role="status">
          {hint}
        </p>
      )}
      <div className={styles.actions}>
        {hasBack ? (
          <Button variant="secondary" onClick={() => dispatch({ type: "GO_BACK" })}>
            חזרה
          </Button>
        ) : (
          <span />
        )}
        <Button
          onClick={onContinue}
          aria-disabled={!canContinue && continueAttemptStep === step}
        >
          המשך
        </Button>
      </div>
    </div>
  );
}
