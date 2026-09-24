"use client";

import { useBuilder } from "@/components/builder/BuilderContext";
import { Button } from "@/components/ui/Button/Button";
import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import styles from "./ReviewStep.module.scss";

export function ReviewStep() {
  const { state, dispatch } = useBuilder();
  const { design, ui } = state;

  const pathLabel =
    design.creationMode === "photo" ? "מתמונה רגילה" : "מאיור קיים";
  const styleName = getIllustrationStyleById(
    design.photoIllustrationStyleId ?? design.illustration?.styleId ?? null,
  )?.name;
  const illustrationKind =
    design.creationMode === "photo"
      ? design.illustration?.source === "ai"
        ? "איור AI"
        : design.illustration?.source === "mockAi"
          ? "דוגמה (QA)"
          : null
      : null;
  const bgName = getBackgroundById(design.backgroundId)?.name;
  const materialLabel =
    design.material === "wood" ? "עץ" : design.material === "magnet" ? "מגנט" : "—";

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
        {design.creationMode === "photo" && styleName && (
          <div className={styles.summaryItem}>
            <dt>סגנון איור</dt>
            <dd>
              {styleName}
              {illustrationKind ? ` · ${illustrationKind}` : ""}
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
          onClick={() => dispatch({ type: "GO_TO_STEP", stepId: "design" })}
        >
          חזרה לעריכה
        </Button>
        <Button onClick={() => dispatch({ type: "SHOW_CHECKOUT_MESSAGE" })}>
          להמשך להזמנה
        </Button>
      </div>

      {ui.checkoutMessageVisible && (
        <p className={styles.checkoutMessage} role="status">
          ההזמנה והתשלום יתווספו בשלב הבא.
        </p>
      )}
    </div>
  );
}
