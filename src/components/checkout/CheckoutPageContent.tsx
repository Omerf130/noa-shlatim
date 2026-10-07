"use client";

import { CheckoutBusinessInfo } from "@/components/checkout/CheckoutBusinessInfo";
import { CheckoutCustomerForm } from "@/components/checkout/CheckoutCustomerForm";
import { CheckoutOrderSummary } from "@/components/checkout/CheckoutOrderSummary";
import { CheckoutProductItems } from "@/components/checkout/CheckoutProductItems";
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

  const productSectionLabel =
    dto.items.length > 1 ? "סיכום השלטים" : "סיכום השלט";

  return (
    <main className={styles.main} dir="rtl">
      <div className={styles.inner}>
        <header className={styles.header}>
          <h1 className={styles.title}>השלמת הזמנה</h1>
          <p className={styles.lead}>
            {dto.items.length > 1
              ? "בדקו שכל השלטים נראים כמו שאישרתם, ובחרו משלוח ופרטי התקשרות."
              : "בדקו שהשלט נראה בדיוק כמו שאישרתם, ובחרו משלוח ופרטי התקשרות."}
          </p>
        </header>

        <div className={styles.grid}>
          <section className={styles.previewSection} aria-label={productSectionLabel}>
            <CheckoutProductItems items={dto.items} />

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
              canInitiatePayment={dto.canInitiatePayment}
              initialSelectedShippingMethodId={initialShippingId}
              onShippingSelectionChange={setSelectedShippingMethodId}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
