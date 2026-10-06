"use client";

import { Button } from "@/components/ui/Button/Button";
import { CHECKOUT_TERMS_REQUIRED_MESSAGE } from "@/lib/legal/terms";
import Link from "next/link";
import { useState } from "react";
import styles from "./CheckoutPaymentReturnActions.module.scss";

type CheckoutPaymentReturnActionsProps = {
  orderId: string;
  canRetry: boolean;
  showCheckoutLink?: boolean;
};

type PaymentInitResponse =
  | { ok: true; paymentPageLink: string }
  | { ok: false; code: string; message: string };

export function CheckoutPaymentReturnActions({
  orderId,
  canRetry,
  showCheckoutLink = false,
}: CheckoutPaymentReturnActionsProps) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onRetry = async () => {
    setErrorMessage(null);
    if (!termsAccepted) {
      setErrorMessage(CHECKOUT_TERMS_REQUIRED_MESSAGE);
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/payment/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termsAccepted: true }),
      });
      const data = (await res.json()) as PaymentInitResponse;
      if (!data.ok) {
        setErrorMessage(data.message);
        return;
      }
      window.location.assign(data.paymentPageLink);
    } catch {
      setErrorMessage("לא הצלחנו לפתוח את דף התשלום. נסו שוב.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.root}>
      {canRetry && (
        <>
          <label className={styles.terms}>
            <input
              type="checkbox"
              checked={termsAccepted}
              disabled={busy}
              onChange={(e) => setTermsAccepted(e.target.checked)}
            />
            <span>
              אני מסכים/ה ל{" "}
              <Link href="/terms" target="_blank" rel="noopener noreferrer">
                תקנון
              </Link>
            </span>
          </label>
          <Button type="button" disabled={busy} onClick={() => void onRetry()}>
            {busy ? "פותחים תשלום…" : "נסו שוב לתשלום"}
          </Button>
        </>
      )}
      {showCheckoutLink && (
        <Link href={`/checkout/${orderId}`} className={styles.backLink}>
          חזרה לעמוד ההזמנה
        </Link>
      )}
      {errorMessage && (
        <p className={styles.error} role="alert">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
