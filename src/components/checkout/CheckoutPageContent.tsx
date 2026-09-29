"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { CheckoutCustomerForm } from "@/components/checkout/CheckoutCustomerForm";
import type { CheckoutPageDto } from "@/lib/checkout/checkoutPageDto";
import styles from "./CheckoutPageContent.module.scss";

type CheckoutPageContentProps = {
  dto: CheckoutPageDto;
};

export function CheckoutPageContent({ dto }: CheckoutPageContentProps) {
  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>השלמת הזמנה</h1>
          <p className={styles.lead}>
            בדקו שהשלט נראה בדיוק כמו שאישרתם, ומלאו פרטי התקשרות.
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.previewSection} aria-label="סיכום השלט">
            <div className={styles.previewWrap}>
              <SignPreview
                design={dto.design}
                size="hero"
                integratedFinalPreview={dto.integratedFinalPreview}
                ariaLabel="תצוגת השלט להזמנה"
              />
            </div>

            <dl className={styles.summary}>
              <div className={styles.summaryItem}>
                <dt>חומר</dt>
                <dd>{dto.materialLabel}</dd>
              </div>
              <div className={styles.summaryItem}>
                <dt>רקע</dt>
                <dd>{dto.backgroundName}</dd>
              </div>
              {dto.styleName && (
                <div className={styles.summaryItem}>
                  <dt>סגנון איור</dt>
                  <dd>{dto.styleName}</dd>
                </div>
              )}
              <div className={styles.summaryItem}>
                <dt>טקסט</dt>
                <dd>{dto.design.text.value || "—"}</dd>
              </div>
            </dl>
          </section>

          <section className={styles.formSection} aria-label="פרטי לקוח">
            <CheckoutCustomerForm
              orderId={dto.orderId}
              initialCustomer={dto.customer}
              initialNotes={dto.notes}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
