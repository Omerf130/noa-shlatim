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
import { reportClientOperationFailure } from "@/lib/diagnostics/reportClientFailure";
import { appendSupportReference } from "@/lib/diagnostics/supportReference";
import { messageForClientOperationFailure } from "@/lib/http/clientOperationErrors";
import { readJsonResponse } from "@/lib/http/readJsonResponse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import styles from "./CheckoutCustomerForm.module.scss";

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
  | { ok: true; paymentPageLink: string; traceId?: string }
  | { ok: false; code: string; message: string; traceId?: string };

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
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const router = useRouter();

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

  const onSecurePayment = useCallback(async () => {
    setFieldError(null);

    if (!canSaveCommercialCheckout || !commercial.available) {
      setFieldError("לא ניתן להמשיך לתשלום כרגע.");
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

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !email.trim()
    ) {
      setFieldError("יש למלא את כל שדות החובה.");
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

      const acknowledgedTotalAmountMinor =
        saveData.commercial.summary.totalAmountMinor ?? undefined;

      const initRes = await fetch(`/api/orders/${orderId}/payment/init`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          termsAccepted: true,
          ...(acknowledgedTotalAmountMinor != null
            ? { acknowledgedTotalAmountMinor }
            : {}),
        }),
      });
      const parsed = await readJsonResponse<PaymentInitResponse>(initRes);

      if (parsed.parseFailed || !parsed.data) {
        let traceId = parsed.traceId;
        if (!traceId) {
          traceId = await reportClientOperationFailure({
            operation: "payment_init",
            clientStage: "json_parse",
            httpStatus: parsed.status,
          });
        }
        setFieldError(
          appendSupportReference(
            messageForClientOperationFailure({
              operation: "payment_init",
              status: parsed.status,
              parseFailed: true,
            }),
            traceId,
          ),
        );
        return;
      }

      const initData = parsed.data;

      if (!initData.ok) {
        setFieldError(
          appendSupportReference(
            messageForClientOperationFailure({
              operation: "payment_init",
              status: parsed.status,
              parseFailed: false,
              apiMessage: initData.message,
            }),
            parsed.traceId ?? initData.traceId,
          ),
        );
        if (initData.code === "COMMERCIAL_TOTAL_CHANGED") {
          router.refresh();
        }
        return;
      }

      window.location.assign(initData.paymentPageLink);
    } catch {
      const traceId = await reportClientOperationFailure({
        operation: "payment_init",
        clientStage: "fetch",
      });
      setFieldError(
        appendSupportReference(
          messageForClientOperationFailure({
            operation: "payment_init",
            status: 0,
            parseFailed: false,
          }),
          traceId,
        ),
      );
    } finally {
      setPaymentState("idle");
    }
  }, [
    canSaveCommercialCheckout,
    commercial.available,
    email,
    fullName,
    onShippingSelectionChange,
    orderId,
    persistCheckoutDetails,
    phone,
    selectedShippingMethodId,
    termsAccepted,
    router,
  ]);

  const formDisabled = !canSaveCommercialCheckout;
  const paymentBusy = paymentState === "processing";

  return (
    <form
      className={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void onSecurePayment();
      }}
      noValidate
    >
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
          onChange={(e) => setFullName(e.target.value)}
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
          onChange={(e) => setPhone(e.target.value)}
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
          onChange={(e) => setEmail(e.target.value)}
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
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      {commercial.available && (
        <CheckoutShippingSelector
          commercial={commercial}
          selectedShippingMethodId={selectedShippingMethodId}
          onSelect={(id) => {
            setSelectedShippingMethodId(id);
            onShippingSelectionChange?.(id);
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

      <Button
        type="submit"
        disabled={paymentBusy || formDisabled}
        className={styles.submit}
      >
        {paymentBusy ? "שומרים וממשיכים לתשלום…" : "שמירה והמשך לתשלום"}
      </Button>
    </form>
  );
}
