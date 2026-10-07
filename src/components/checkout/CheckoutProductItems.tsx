"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import type { CheckoutLineItemDto } from "@/lib/checkout/checkoutPageDto";
import styles from "./CheckoutProductItems.module.scss";

type CheckoutProductItemsProps = {
  items: CheckoutLineItemDto[];
};

export function CheckoutProductItems({ items }: CheckoutProductItemsProps) {
  if (items.length === 0) {
    return (
      <p className={styles.unavailable} role="status">
        לא ניתן להציג את תצוגת השלטים מהנתונים השמורים.
      </p>
    );
  }

  return (
    <ul className={styles.list}>
      {items.map((item, index) => (
        <li
          key={`${item.artworkUrl}-${index}`}
          className={styles.card}
          aria-label={`פריט ${index + 1}`}
        >
          {item.hasValidDesign && item.design && item.integratedFinalPreview ? (
            <>
              <div className={styles.previewWrap}>
                <SignPreview
                  design={item.design}
                  size="hero"
                  integratedFinalPreview={item.integratedFinalPreview}
                  previewBackground={item.previewBackground}
                  ariaLabel={`תצוגת שלט ${index + 1}`}
                />
              </div>

              <dl className={styles.meta}>
                <div className={styles.metaRow}>
                  <dt>מוצר</dt>
                  <dd>{item.productLabel}</dd>
                </div>
                <div className={styles.metaRow}>
                  <dt>חומר</dt>
                  <dd>{item.materialLabel}</dd>
                </div>
                {item.magnetSizeName && (
                  <div className={styles.metaRow}>
                    <dt>גודל מגנט</dt>
                    <dd>
                      {item.magnetSizeName}
                      {item.magnetSizeDimensionsLabel
                        ? ` · ${item.magnetSizeDimensionsLabel}`
                        : ""}
                    </dd>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <dt>רקע</dt>
                  <dd>{item.backgroundName}</dd>
                </div>
                {item.styleName && (
                  <div className={styles.metaRow}>
                    <dt>סגנון איור</dt>
                    <dd>{item.styleName}</dd>
                  </div>
                )}
                <div className={styles.metaRow}>
                  <dt>טקסט</dt>
                  <dd>{item.design.text.value || "—"}</dd>
                </div>
                {item.quantity > 1 && (
                  <div className={[styles.metaRow, styles.quantityRow].join(" ")}>
                    <dt>כמות</dt>
                    <dd>{item.quantity}</dd>
                  </div>
                )}
                {item.unitPriceDisplay && (
                  <div className={styles.metaRow}>
                    <dt>מחיר ליחידה</dt>
                    <dd dir="ltr">{item.unitPriceDisplay}</dd>
                  </div>
                )}
                {item.lineTotalDisplay && (
                  <div className={styles.metaRow}>
                    <dt>סה״כ שורה</dt>
                    <dd dir="ltr">{item.lineTotalDisplay}</dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <p className={styles.unavailable} role="status">
              לא ניתן להציג את תצוגת השלט מהנתונים השמורים.
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}
