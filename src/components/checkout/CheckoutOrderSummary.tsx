"use client";

import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import { computeCheckoutTotals } from "@/lib/checkout/computeCheckoutTotals";
import {
  CHECKOUT_SHIPPING_LINE_PENDING,
} from "@/lib/checkout/formatCheckoutUnavailableMessage";
import { formatMinorForCheckoutDisplay } from "@/lib/money/ils";
import styles from "./CheckoutOrderSummary.module.scss";

type CheckoutOrderSummaryProps = {
  commercial: CheckoutCommercialDto;
  selectedShippingMethodId: string | null;
};

export function CheckoutOrderSummary({
  commercial,
  selectedShippingMethodId,
}: CheckoutOrderSummaryProps) {
  if (!commercial.available) {
    return null;
  }

  if (commercial.pricingMode === "multi_v2") {
    const selected = selectedShippingMethodId
      ? commercial.shippingMethods.find((m) => m.methodId === selectedShippingMethodId)
      : null;

    const summary = commercial.summary;
    const hasPromotionBreakdown =
      (summary.discountMinor ?? 0) > 0 &&
      summary.catalogProductDisplay != null &&
      summary.netProductDisplay != null;

    const shippingLine =
      commercial.priceSource === "frozen"
        ? summary.shippingDisplay
        : selected
          ? selected.displayAmount
          : CHECKOUT_SHIPPING_LINE_PENDING;

    let totalLine = summary.totalDisplay;
    if (commercial.priceSource === "live" && selected) {
      const productMinor =
        summary.netProductAmountMinor ?? summary.productAmountMinor;
      const totals = computeCheckoutTotals(productMinor, selected.amountMinor);
      if (totals.ok) {
        totalLine = formatMinorForCheckoutDisplay(totals.totalAmountMinor);
      }
    }

    return (
      <section className={styles.summary} aria-label="סיכום מחיר">
        <h2 className={styles.title}>סיכום הזמנה</h2>
        <dl className={styles.lines}>
          {hasPromotionBreakdown ? (
            <>
              <div className={styles.line}>
                <dt>מוצרים</dt>
                <dd dir="ltr">{summary.catalogProductDisplay}</dd>
              </div>
              {(summary.appliedPromotions ?? []).map((promo) => (
                <div className={styles.line} key={promo.customerLabel}>
                  <dt>
                    {promo.applicationCount > 1
                      ? `${promo.customerLabel} ×${promo.applicationCount}`
                      : promo.customerLabel}
                  </dt>
                  <dd dir="ltr">{promo.savingsDisplay}</dd>
                </div>
              ))}
              <div className={styles.line}>
                <dt>סה״כ מוצרים</dt>
                <dd dir="ltr">{summary.netProductDisplay}</dd>
              </div>
            </>
          ) : (
            <div className={styles.line}>
              <dt>מוצרים</dt>
              <dd dir="ltr">{summary.productDisplay}</dd>
            </div>
          )}
          <div className={styles.line}>
            <dt>משלוח</dt>
            <dd>{shippingLine}</dd>
          </div>
          {totalLine && (
            <div className={[styles.line, styles.totalLine].join(" ")}>
              <dt>סה״כ</dt>
              <dd dir="ltr">{totalLine}</dd>
            </div>
          )}
        </dl>
        {summary.promotionMessage ? (
          <p className={styles.promotionNote} role="status">
            {summary.promotionMessage}
          </p>
        ) : null}
      </section>
    );
  }

  const productLine = commercial.product.displayAmount;
  const selected = selectedShippingMethodId
    ? commercial.shippingMethods.find((m) => m.methodId === selectedShippingMethodId)
    : null;

  let shippingLine = CHECKOUT_SHIPPING_LINE_PENDING;
  let totalLine: string | null = null;

  if (selected) {
    shippingLine = selected.displayAmount;
    const totals = computeCheckoutTotals(
      commercial.product.amountMinor,
      selected.amountMinor,
    );
    if (totals.ok) {
      totalLine = formatMinorForCheckoutDisplay(totals.totalAmountMinor);
    }
  }

  return (
    <section className={styles.summary} aria-label="סיכום מחיר">
      <h2 className={styles.title}>סיכום הזמנה</h2>
      <dl className={styles.lines}>
        <div className={styles.line}>
          <dt>{commercial.product.productDescription}</dt>
          <dd dir="ltr">{productLine}</dd>
        </div>
        <div className={styles.line}>
          <dt>משלוח</dt>
          <dd>{shippingLine}</dd>
        </div>
        {totalLine && (
          <div className={[styles.line, styles.totalLine].join(" ")}>
            <dt>סה״כ</dt>
            <dd dir="ltr">{totalLine}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
