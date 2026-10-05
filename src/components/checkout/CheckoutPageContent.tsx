"use client";

import { SignPreview } from "@/components/builder/SignPreview/SignPreview";
import { CheckoutBusinessInfo } from "@/components/checkout/CheckoutBusinessInfo";
import { CheckoutCustomerForm } from "@/components/checkout/CheckoutCustomerForm";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import type { CheckoutPageDto } from "@/lib/checkout/checkoutPageDto";
import { useState } from "react";
import styles from "./CheckoutPageContent.module.scss";

type CheckoutPageContentProps = {
  dto: CheckoutPageDto;
};

export function CheckoutPageContent({ dto }: CheckoutPageContentProps) {
  const initialShippingId =
    dto.commercial.available && dto.commercial.selectionValid
      ? dto.commercial.selectedShippingMethodId
      : dto.commercial.available
        ? null
        : null;

  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<
    string | null
  >(initialShippingId);

  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>השלמת הזמנה</h1>
          <p className={styles.lead}>
            בדקו שהשלט נראה בדיוק כמו שאישרתם, ובחרו משלוח ופרטי התקשרות.
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.previewSection} aria-label="סיכום השלט">
            {dto.hasValidDesign && dto.design && dto.integratedFinalPreview ? (
              <>
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
              </>
            ) : (
              <p className={styles.previewUnavailable} role="status">
                לא ניתן להציג את תצוגת השלט מהנתונים השמורים.
              </p>
            )}

            <CheckoutOrderSummary
              commercial={dto.commercial}
              selectedShippingMethodId={selectedShippingMethodId}
            />
          </section>

          <section className={styles.formSection} aria-label="פרטי הזמנה">
            <CheckoutBusinessInfo />
            <CheckoutCustomerForm
              orderId={dto.orderId}
              initialCustomer={dto.customer}
              initialNotes={dto.notes}
              commercial={dto.commercial}
              canSaveCommercialCheckout={dto.canSaveCommercialCheckout}
              initialSelectedShippingMethodId={initialShippingId}
              onShippingSelectionChange={setSelectedShippingMethodId}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
