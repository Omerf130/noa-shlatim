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

type CheckoutCustomerFormProps = {
  orderId: string;
  initialCustomer: CheckoutCustomerDto;
  initialNotes: string;
  commercial: CheckoutCommercialDto;
  canSaveCommercialCheckout: boolean;
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

export function CheckoutCustomerForm({
  orderId,
  initialCustomer,
  initialNotes,
  commercial,
  canSaveCommercialCheckout,
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

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldError(null);

      if (!canSaveCommercialCheckout || !commercial.available) {
        return;
      }

      if (!selectedShippingMethodId) {
        setFieldError(CHECKOUT_SHIPPING_REQUIRED_MESSAGE);
        setSaveState("error");
        return;
      }

      if (!termsAccepted) {
        setFieldError(CHECKOUT_TERMS_REQUIRED_MESSAGE);
        setSaveState("error");
        return;
      }

      setSaveState("submitting");

      try {
        const res = await fetch(`/api/orders/${orderId}/checkout`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { fullName, phone, email },
            notes,
            selectedShippingMethodId,
          }),
        });
        const data = (await res.json()) as SaveResponse;

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
    [
      canSaveCommercialCheckout,
      commercial.available,
      email,
      fullName,
      notes,
      orderId,
      phone,
      selectedShippingMethodId,
      termsAccepted,
      onShippingSelectionChange,
    ],
  );

  const formDisabled = !canSaveCommercialCheckout;

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
          disabled={formDisabled}
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
          disabled={formDisabled}
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
          disabled={formDisabled}
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
          disabled={formDisabled}
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
          disabled={formDisabled}
        />
      )}

      <div className={styles.termsField}>
        <input
          id="checkout-terms-accepted"
          className={styles.termsCheckbox}
          type="checkbox"
          name="termsAccepted"
          checked={termsAccepted}
          disabled={formDisabled}
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
          <span>אני מסכים/ה ל</span>{" "}
          <Link
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.termsLink}
            onClick={(e) => e.stopPropagation()}
          >
            תקנון
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
        disabled={saveState === "submitting" || formDisabled}
        className={styles.submit}
      >
        {saveState === "submitting" ? "שומרים…" : "שמירת פרטים ומשלוח"}
      </Button>
    </form>
  );
}
