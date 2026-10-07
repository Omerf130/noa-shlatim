"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { useAddToCart } from "@/hooks/useAddToCart";
import { findCustomerBackground } from "@/lib/builder/backgroundSelection";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import styles from "./ReviewStep.module.scss";

export function ReviewStep() {
  const { state, dispatch, customerBackgrounds, customerMagnetCatalog } = useBuilder();
  const { design, ui } = state;
  const {
    submitAddToCart,
    startNewSign,
    isSubmitting,
    errorMessage,
    addSuccess,
    canAddToCart,
  } = useAddToCart();

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
  const addedToCart = addSuccess !== null;

  return (
    <div className={styles.review}>
      <header className={styles.header}>
        <h2 className={styles.title}>
          {addedToCart ? "השלט נוסף לסל" : "השלט שלכם מוכן"}
        </h2>
        <p className={styles.subtitle}>
          {addedToCart
            ? "אפשר להמשיך וליצור שלט נוסף."
            : "נראה מעולה — אפשר לערוך או להמשיך כשתרצו."}
        </p>
      </header>

      {!addedToCart ? (
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
      ) : (
        <div
          className={styles.successPanel}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <p className={styles.successTitle}>השלט נוסף לסל</p>
          <p className={styles.successDetail}>
            {addSuccess.totalQuantity === 1
              ? "פריט אחד בסל."
              : `${addSuccess.totalQuantity} פריטים בסל.`}
          </p>
        </div>
      )}

      <div className={styles.actions}>
        {addedToCart ? (
          <Button onClick={startNewSign}>יצירת שלט נוסף</Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={isSubmitting}
              onClick={() => dispatch({ type: "GO_TO_STEP", stepId: "design" })}
            >
              חזרה לעריכה
            </Button>
            <Button
              disabled={!canAddToCart || isSubmitting}
              aria-busy={isSubmitting}
              onClick={() => void submitAddToCart()}
            >
              {isSubmitting ? "מוסיף לסל…" : "הוספה לסל"}
            </Button>
          </>
        )}
      </div>

      {errorMessage ? (
        <p className={styles.errorMessage} role="alert">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
