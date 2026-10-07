"use client";

import { Button } from "@/components/ui/Button/Button";
import { CheckoutShippingSelector } from "@/components/checkout/CheckoutShippingSelector";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import type { CheckoutCustomerDto } from "@/lib/checkout/checkoutPageDto";
import { CHECKOUT_SHIPPING_REQUIRED_MESSAGE } from "@/lib/checkout/formatCheckoutUnavailableMessage";
import {
  CHECKOUT_TERMS_REQUIRED_MESSAGE,
  TERMS_VERSION,
} from "@/lib/legal/terms";
import Link from "next/link";
import { useCallback, useState } from "react";
import styles from "./CheckoutCustomerForm.module.scss";

type SaveState = "idle" | "submitting" | "success" | "error";
type PaymentState = "idle" | "processing";

type CheckoutCustomerFormProps = {
  orderId: string;
  initialCustomer: CheckoutCustomerDto;
  initialNotes: string;
  commercial: CheckoutCommercialDto;
  canSaveCommercialCheckout: boolean;
  canInitiatePayment: boolean;
  initialSelectedShippingMethodId: string | null;
  onShippingSelectionChange?: (methodId: string) => void;
};

type SaveResponse =
  | {
      ok: true;
      customer: CheckoutCustomerDto;
      notes: string;
      selectedShippingMethodId: string;
      commercial: Extract<CheckoutCommercialDto, { available: true }>;
    }
  | { ok: false; code: string; message: string };

type PaymentInitResponse =
  | { ok: true; paymentPageLink: string }
  | { ok: false; code: string; message: string };

export function CheckoutCustomerForm({
  orderId,
  initialCustomer,
  initialNotes,
  commercial,
  canSaveCommercialCheckout,
  canInitiatePayment,
  initialSelectedShippingMethodId,
  onShippingSelectionChange,
}: CheckoutCustomerFormProps) {
  const [fullName, setFullName] = useState(initialCustomer.fullName);
  const [phone, setPhone] = useState(initialCustomer.phone);
  const [email, setEmail] = useState(initialCustomer.email);
  const [notes, setNotes] = useState(initialNotes);
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<
    string | null
  >(initialSelectedShippingMethodId);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");

  const persistCheckoutDetails = useCallback(async (): Promise<
    SaveResponse | { ok: false; message: string }
  > => {
    if (!canSaveCommercialCheckout || !commercial.available) {
      return { ok: false, message: "לא ניתן לשמור את ההזמנה כרגע." };
    }

    if (!selectedShippingMethodId) {
      return { ok: false, message: CHECKOUT_SHIPPING_REQUIRED_MESSAGE };
    }

    const res = await fetch(`/api/orders/${orderId}/checkout`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: { fullName, phone, email },
        notes,
        selectedShippingMethodId,
      }),
    });
    return (await res.json()) as SaveResponse;
  }, [
    canSaveCommercialCheckout,
    commercial.available,
    email,
    fullName,
    notes,
    orderId,
    phone,
    selectedShippingMethodId,
  ]);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldError(null);

      if (!termsAccepted) {
        setFieldError(CHECKOUT_TERMS_REQUIRED_MESSAGE);
        setSaveState("error");
        return;
      }

      setSaveState("submitting");

      try {
        const data = await persistCheckoutDetails();
        if (!data.ok) {
          setFieldError(data.message);
          setSaveState("error");
          return;
        }

        setFullName(data.customer.fullName);
        setPhone(data.customer.phone);
        setEmail(data.customer.email);
        setNotes(data.notes);
        setSelectedShippingMethodId(data.selectedShippingMethodId);
        onShippingSelectionChange?.(data.selectedShippingMethodId);
        setSaveState("success");
      } catch {
        setFieldError("לא הצלחנו לשמור את הפרטים. נסו שוב.");
        setSaveState("error");
      }
    },
    [onShippingSelectionChange, persistCheckoutDetails, termsAccepted],
  );

  const onSecurePayment = useCallback(async () => {
    setFieldError(null);

    if (!canInitiatePayment || !canSaveCommercialCheckout || !commercial.available) {
      return;
    }

    if (!selectedShippingMethodId) {
      setFieldError(CHECKOUT_SHIPPING_REQUIRED_MESSAGE);
      return;
    }

    if (!termsAccepted) {
      setFieldError(CHECKOUT_TERMS_REQUIRED_MESSAGE);
      return;
    }

    setPaymentState("processing");

    try {
      const saveData = await persistCheckoutDetails();
      if (!saveData.ok) {
        setFieldError(saveData.message);
        return;
      }

      setFullName(saveData.customer.fullName);
      setPhone(saveData.customer.phone);
      setEmail(saveData.customer.email);
      setNotes(saveData.notes);
      setSelectedShippingMethodId(saveData.selectedShippingMethodId);
      onShippingSelectionChange?.(saveData.selectedShippingMethodId);
      setSaveState("success");

      const initRes = await fetch(`/api/orders/${orderId}/payment/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ termsAccepted: true }),
      });
      const initData = (await initRes.json()) as PaymentInitResponse;

      if (!initData.ok) {
        setFieldError(initData.message);
        return;
      }

      window.location.assign(initData.paymentPageLink);
    } catch {
      setFieldError("לא הצלחנו לפתוח את דף התשלום. נסו שוב.");
    } finally {
      setPaymentState("idle");
    }
  }, [
    canInitiatePayment,
    canSaveCommercialCheckout,
    commercial.available,
    onShippingSelectionChange,
    orderId,
    persistCheckoutDetails,
    selectedShippingMethodId,
    termsAccepted,
  ]);

  const formDisabled = !canSaveCommercialCheckout;
  const paymentBusy = paymentState === "processing" || saveState === "submitting";

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)} noValidate>
      {!commercial.available && (
        <p className={styles.unavailable} role="status">
          {commercial.message}
        </p>
      )}

      <h2 className={styles.formTitle}>פרטי התקשרות</h2>

      <label className={styles.field}>
        <span className={styles.label}>שם מלא</span>
        <input
          className={styles.input}
          type="text"
          name="fullName"
          autoComplete="name"
          required
          disabled={formDisabled || paymentBusy}
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (saveState === "success") setSaveState("idle");
          }}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>טלפון</span>
        <input
          className={styles.input}
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          required
          disabled={formDisabled || paymentBusy}
          dir="ltr"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (saveState === "success") setSaveState("idle");
          }}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>אימייל</span>
        <input
          className={styles.input}
          type="email"
          name="email"
          autoComplete="email"
          required
          disabled={formDisabled || paymentBusy}
          dir="ltr"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (saveState === "success") setSaveState("idle");
          }}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>הערות (אופציונלי)</span>
        <textarea
          className={styles.textarea}
          name="notes"
          rows={3}
          maxLength={500}
          disabled={formDisabled || paymentBusy}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (saveState === "success") setSaveState("idle");
          }}
        />
      </label>

      {commercial.available && (
        <CheckoutShippingSelector
          commercial={commercial}
          selectedShippingMethodId={selectedShippingMethodId}
          onSelect={(id) => {
            setSelectedShippingMethodId(id);
            onShippingSelectionChange?.(id);
            if (saveState === "success") setSaveState("idle");
          }}
          disabled={formDisabled || paymentBusy}
        />
      )}

      <div className={styles.termsField}>
        <input
          id="checkout-terms-accepted"
          className={styles.termsCheckbox}
          type="checkbox"
          name="termsAccepted"
          checked={termsAccepted}
          disabled={formDisabled || paymentBusy}
          data-terms-version={TERMS_VERSION}
          onChange={(e) => {
            setTermsAccepted(e.target.checked);
            if (saveState === "success") setSaveState("idle");
            if (fieldError === CHECKOUT_TERMS_REQUIRED_MESSAGE) {
              setFieldError(null);
            }
          }}
        />
        <label htmlFor="checkout-terms-accepted" className={styles.termsLabel}>
          <span>קראתי ואני מסכים ל</span>{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.termsLink}
            onClick={(e) => e.stopPropagation()}
          >
            תקנון
          </Link>{" "}
          <span>ול</span>{" "}
          <Link
            href="/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.termsLink}
            onClick={(e) => e.stopPropagation()}
          >
            מדיניות הפרטיות
          </Link>
        </label>
      </div>

      {fieldError && (
        <p className={styles.error} role="alert">
          {fieldError}
        </p>
      )}

      {saveState === "success" && (
        <p className={styles.success} role="status">
          הפרטים נשמרו
        </p>
      )}

      <Button
        type="submit"
        disabled={paymentBusy || formDisabled}
        className={styles.submit}
      >
        {saveState === "submitting" ? "שומרים…" : "שמירת פרטים ומשלוח"}
      </Button>

      {canInitiatePayment && (
        <Button
          type="button"
          disabled={paymentBusy || formDisabled}
          className={styles.payButton}
          onClick={() => void onSecurePayment()}
        >
          {paymentState === "processing" ? "פותחים תשלום מאובטח…" : "מעבר לתשלום מאובטח"}
        </Button>
      )}
    </form>
  );
}
