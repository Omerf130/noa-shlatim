"use client";

import type { AdminOrderAccountingDocumentDto } from "@/lib/admin/orders/adminOrderDtos";
import { retryFinbotAccountingDocument } from "@/app/admin/(protected)/orders/[orderId]/actions";
import { useState, useTransition } from "react";
import styles from "./AdminOrderDetailContent.module.scss";

type AdminOrderAccountingSectionProps = {
  orderId: string;
  accounting: AdminOrderAccountingDocumentDto;
};

export function AdminOrderAccountingSection({
  orderId,
  accounting,
}: AdminOrderAccountingSectionProps) {
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const onRetry = () => {
    setMessage(null);
    startTransition(async () => {
      const result = await retryFinbotAccountingDocument(orderId);
      setMessage(result.message ?? (result.ok ? "בוצע." : "שגיאה."));
    });
  };

  return (
    <section className={styles.section} aria-labelledby="accounting-heading">
      <h2 id="accounting-heading" className={styles.sectionTitle}>
        מסמך חשבונאי
      </h2>
      <dl className={styles.fieldList}>
        <div>
          <dt>סטטוס</dt>
          <dd>{accounting.statusLabel}</dd>
        </div>
        {accounting.documentNumber && (
          <div>
            <dt>מספר מסמך</dt>
            <dd dir="ltr" className={styles.mono}>
              {accounting.documentNumber}
            </dd>
          </div>
        )}
        {accounting.issuedAtLabel && (
          <div>
            <dt>תאריך הפקה</dt>
            <dd>{accounting.issuedAtLabel}</dd>
          </div>
        )}
        {accounting.errorMessage && (
          <div>
            <dt>פרטים</dt>
            <dd>{accounting.errorMessage}</dd>
          </div>
        )}
      </dl>
      {accounting.statusKey === "issued" && accounting.documentUrl && (
        <p className={styles.accountingActions}>
          <a
            href={accounting.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.accountingLink}
          >
            צפייה במסמך
          </a>
        </p>
      )}
      {accounting.canRetry && (
        <p className={styles.accountingActions}>
          <button
            type="button"
            className={styles.retryButton}
            disabled={isPending}
            onClick={onRetry}
          >
            {isPending ? "מפיק…" : "נסה שוב"}
          </button>
        </p>
      )}
      {message && (
        <p className={styles.accountingFeedback} role="status">
          {message}
        </p>
      )}
    </section>
  );
}
