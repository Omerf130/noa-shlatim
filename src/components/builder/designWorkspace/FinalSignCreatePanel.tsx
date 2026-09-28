"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { isDesignWorkspaceComplete } from "@/lib/builder/validation";
import { useFinalSignGeneration } from "@/hooks/useFinalSignGeneration";
import styles from "./panels/panels.module.scss";

export function FinalSignCreatePanel() {
  const { state } = useBuilder();
  const {
    finalArt,
    generateFinalSign,
    showDraftPreview,
    showFinalPreview,
    isGenerating,
    hasValidFinal,
  } = useFinalSignGeneration();

  if (state.design.creationMode !== "photo") {
    return null;
  }
  if (state.ui.currentStepId !== "design") {
    return null;
  }

  const prerequisitesMet = isDesignWorkspaceComplete(state.design);
  const showingFinal = hasValidFinal && finalArt.previewMode === "final";

  return (
    <div className={styles.finalSignBlock}>
      <p className={styles.finalSignIntro}>
        לאחר שסיימתם לעצב — יוצרים את השלט המאויר המשולב (רקע + דמויות) בקריאה
        אחת.
      </p>

      {showingFinal ? (
        <div className={styles.finalSignActions}>
          <button
            type="button"
            className={styles.finalSignSecondaryBtn}
            onClick={showDraftPreview}
          >
            חזרה לעריכה
          </button>
          <p className={styles.finalSignSuccess} role="status">
            השלט נוצר. אפשר להמשיך לסיכום או לערוך שוב.
          </p>
        </div>
      ) : (
        <div className={styles.finalSignActions}>
          <button
            type="button"
            className={styles.finalSignPrimaryBtn}
            disabled={isGenerating || !prerequisitesMet}
            onClick={() => void generateFinalSign()}
          >
            {isGenerating ? "יוצר שלט…" : "צור את השלט שלי"}
          </button>
          {hasValidFinal && (
            <button
              type="button"
              className={styles.finalSignSecondaryBtn}
              onClick={showFinalPreview}
            >
              הצג את השלט שנוצר
            </button>
          )}
          {!prerequisitesMet && (
            <p className={styles.finalSignHint}>
              השלימו רקע, טקסט וחומר כדי ליצור את השלט.
            </p>
          )}
        </div>
      )}

      {finalArt.status === "error" && finalArt.userMessage ? (
        <p className={styles.finalSignError} role="alert">
          {finalArt.userMessage}
        </p>
      ) : null}
    </div>
  );
}
