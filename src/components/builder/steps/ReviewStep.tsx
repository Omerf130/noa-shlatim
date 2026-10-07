"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { useCreateDraftOrder } from "@/hooks/useCreateDraftOrder";
import { findCustomerBackground } from "@/lib/builder/backgroundSelection";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import styles from "./ReviewStep.module.scss";

export function ReviewStep() {
  const { state, dispatch, customerBackgrounds, customerMagnetCatalog } = useBuilder();
  const { design, ui } = state;
  const {
    submitDraftOrder,
    isSubmitting,
    errorMessage,
    canSubmitDraftOrder,
  } = useCreateDraftOrder();

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
  const bgName = findCustomerBackground(customerBackgrounds, design.backgroundId)?.name;
  const materialLabel =
    design.material === "wood" ? "עץ" : design.material === "magnet" ? "מגנט" : "—";
  const selectedMagnetSize =
    design.material === "magnet" && design.magnetSizeId
      ? customerMagnetCatalog.sizes.find((s) => s.id === design.magnetSizeId)
      : null;

  const isPhoto = design.creationMode === "photo";
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
        {!isPhoto && integratedFinalKind && (
          <div className={styles.summaryItem}>
            <dt>סוג שלט</dt>
            <dd>{integratedFinalKind}</dd>
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
        {selectedMagnetSize ? (
          <div className={styles.summaryItem}>
            <dt>גודל מגנט</dt>
            <dd>
              {selectedMagnetSize.name}
              {selectedMagnetSize.dimensionsLabel
                ? ` · ${selectedMagnetSize.dimensionsLabel}`
                : ""}
              {" · "}
              <span dir="ltr">{selectedMagnetSize.displayPrice}</span>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className={styles.actions}>
        <Button
          variant="secondary"
          disabled={isSubmitting}
          onClick={() => dispatch({ type: "GO_TO_STEP", stepId: "design" })}
        >
          חזרה לעריכה
        </Button>
        <Button
          disabled={!canSubmitDraftOrder || isSubmitting}
          onClick={() => void submitDraftOrder()}
        >
          {isSubmitting ? "שומרים את ההזמנה…" : "להמשך להזמנה"}
        </Button>
      </div>

      {errorMessage ? (
        <p className={styles.checkoutMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
