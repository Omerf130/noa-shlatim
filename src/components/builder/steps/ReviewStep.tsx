"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { useCreateDraftOrder } from "@/hooks/useCreateDraftOrder";
import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import styles from "./ReviewStep.module.scss";

export function ReviewStep() {
  const { state, dispatch } = useBuilder();
  const { design, ui } = state;
  const { submitDraftOrder, isSubmitting, errorMessage, canSubmitPhotoOrder } =
    useCreateDraftOrder();

  const pathLabel =
    design.creationMode === "photo" ? "מתמונה רגילה" : "מאיור קיים";
  const styleName = getIllustrationStyleById(
    design.photoIllustrationStyleId ?? design.illustration?.styleId ?? null,
  )?.name;
  const integratedFinalKind =
    (design.creationMode === "photo" || design.creationMode === "illustration") &&
    ui.finalSignArtwork.isValid
      ? design.creationMode === "photo"
        ? "שלט מאויר משולב"
        : "שלט משולב"
      : null;
  const bgName = getBackgroundById(design.backgroundId)?.name;
  const materialLabel =
    design.material === "wood" ? "עץ" : design.material === "magnet" ? "מגנט" : "—";

  const isPhoto = design.creationMode === "photo";
  const isIllustration = design.creationMode === "illustration";

  return (
    <div className={styles.review}>
      <header className={styles.header}>
        <h2 className={styles.title}>השלט שלכם מוכן</h2>
        <p className={styles.subtitle}>נראה מעולה — אפשר לערוך או להמשיך כשתרצו.</p>
      </header>

      <dl className={styles.summary} aria-label="סיכום קצר">
        <div className={styles.summaryItem}>
          <dt>דרך</dt>
          <dd>{pathLabel}</dd>
        </div>
        {isPhoto && styleName && (
          <div className={styles.summaryItem}>
            <dt>סגנון איור</dt>
            <dd>
              {styleName}
              {integratedFinalKind ? ` · ${integratedFinalKind}` : ""}
            </dd>
          </div>
        )}
        <div className={styles.summaryItem}>
          <dt>רקע</dt>
          <dd>{bgName ?? "—"}</dd>
        </div>
        <div className={styles.summaryItem}>
          <dt>טקסט</dt>
          <dd>{design.text.value || "—"}</dd>
        </div>
        <div className={styles.summaryItem}>
          <dt>חומר</dt>
          <dd>{materialLabel}</dd>
        </div>
      </dl>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => dispatch({ type: "GO_TO_STEP", stepId: "design" })}
        >
          חזרה לעריכה
        </Button>
        {isPhoto ? (
          <Button
            disabled={!canSubmitPhotoOrder || isSubmitting}
            onClick={() => void submitDraftOrder()}
          >
            {isSubmitting ? "שומרים את ההזמנה…" : "להמשך להזמנה"}
          </Button>
        ) : (
          <Button disabled title="שמירת הזמנה למסלול איור קיים — בקרוב">
            להמשך להזמנה (בקרוב)
          </Button>
        )}
      </div>

      {isIllustration && (
        <p className={styles.checkoutMessage} role="note">
          שמירת הזמנה למסלול איור קיים תתווסף לאחר בדיקה. ניתן לערוך את השלט בינתיים.
        </p>
      )}

      {errorMessage ? (
        <p className={styles.checkoutMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
