"use client";

import { Button } from "@/components/ui/Button/Button";
import { CheckoutShippingSelector } from "@/components/checkout/CheckoutShippingSelector";
import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import type {
  CheckoutCustomerDto,
  CheckoutShippingAddressDto,
} from "@/lib/checkout/checkoutPageDto";
import {
  validateShippingAddressFields,
  type ShippingAddressFieldErrors,
  type ShippingAddressInput,
} from "@/lib/checkout/shippingAddressSchema";
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
  initialShippingAddress: CheckoutShippingAddressDto | null;
  onShippingSelectionChange?: (methodId: string) => void;
  onShippingAddressPreviewChange?: (address: ShippingAddressInput) => void;
};

function emptyShippingAddressInput(): ShippingAddressInput {
  return {
    city: "",
    street: "",
    houseNumber: "",
    floor: "",
    postalCode: "",
  };
}

function shippingInputFromInitial(
  initial: CheckoutShippingAddressDto | null,
): ShippingAddressInput {
  if (!initial) {
    return emptyShippingAddressInput();
  }
  return {
    city: initial.city,
    street: initial.street,
    houseNumber: initial.houseNumber,
    floor: initial.floor ?? "",
    postalCode: initial.postalCode,
  };
}

type SaveResponse =
  | {
      ok: true;
      customer: CheckoutCustomerDto;
      shippingAddress: CheckoutShippingAddressDto;
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
  initialShippingAddress,
  onShippingSelectionChange,
  onShippingAddressPreviewChange,
}: CheckoutCustomerFormProps) {
  const [fullName, setFullName] = useState(initialCustomer.fullName);
  const [phone, setPhone] = useState(initialCustomer.phone);
  const [email, setEmail] = useState(initialCustomer.email);
  const [notes, setNotes] = useState(initialNotes);
  const [city, setCity] = useState(
    () => shippingInputFromInitial(initialShippingAddress).city,
  );
  const [street, setStreet] = useState(
    () => shippingInputFromInitial(initialShippingAddress).street,
  );
  const [houseNumber, setHouseNumber] = useState(
    () => shippingInputFromInitial(initialShippingAddress).houseNumber,
  );
  const [floor, setFloor] = useState(
    () => shippingInputFromInitial(initialShippingAddress).floor ?? "",
  );
  const [postalCode, setPostalCode] = useState(
    () => shippingInputFromInitial(initialShippingAddress).postalCode,
  );
  const [shippingFieldErrors, setShippingFieldErrors] =
    useState<ShippingAddressFieldErrors>({});
  const [selectedShippingMethodId, setSelectedShippingMethodId] = useState<
    string | null
  >(initialSelectedShippingMethodId);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const router = useRouter();

  const shippingInput = useCallback(
    (): ShippingAddressInput => ({
      city,
      street,
      houseNumber,
      floor,
      postalCode,
    }),
    [city, floor, houseNumber, postalCode, street],
  );

  const notifyShippingPreview = useCallback(
    (next: ShippingAddressInput) => {
      onShippingAddressPreviewChange?.(next);
    },
    [onShippingAddressPreviewChange],
  );

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
        shippingAddress: shippingInput(),
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
    shippingInput,
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

    const addressErrors = validateShippingAddressFields(shippingInput());
    if (Object.keys(addressErrors).length > 0) {
      setShippingFieldErrors(addressErrors);
      setFieldError("יש לתקן את כתובת המשלוח לפני המשך.");
      return;
    }
    setShippingFieldErrors({});

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
      setCity(saveData.shippingAddress.city);
      setStreet(saveData.shippingAddress.street);
      setHouseNumber(saveData.shippingAddress.houseNumber);
      setFloor(saveData.shippingAddress.floor ?? "");
      setPostalCode(saveData.shippingAddress.postalCode);
      notifyShippingPreview({
        ...saveData.shippingAddress,
        floor: saveData.shippingAddress.floor ?? "",
      });
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
    shippingInput,
    termsAccepted,
    router,
    notifyShippingPreview,
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

      <h2 className={styles.formTitle}>כתובת למשלוח</h2>
      <p className={styles.formSectionLead}>לאן נשלח את השלט שלכם?</p>

      <label className={styles.field}>
        <span className={styles.label}>עיר</span>
        <input
          className={styles.input}
          type="text"
          name="shippingCity"
          autoComplete="address-level2"
          required
          disabled={formDisabled || paymentBusy}
          value={city}
          onChange={(e) => {
            const next = e.target.value;
            setCity(next);
            notifyShippingPreview({ ...shippingInput(), city: next });
            if (shippingFieldErrors.city) {
              setShippingFieldErrors((prev) => ({ ...prev, city: undefined }));
            }
          }}
        />
        {shippingFieldErrors.city ? (
          <p className={styles.fieldError} role="alert">
            {shippingFieldErrors.city}
          </p>
        ) : null}
      </label>

      <label className={styles.field}>
        <span className={styles.label}>רחוב</span>
        <input
          className={styles.input}
          type="text"
          name="shippingStreet"
          autoComplete="street-address"
          required
          disabled={formDisabled || paymentBusy}
          value={street}
          onChange={(e) => {
            const next = e.target.value;
            setStreet(next);
            notifyShippingPreview({ ...shippingInput(), street: next });
            if (shippingFieldErrors.street) {
              setShippingFieldErrors((prev) => ({ ...prev, street: undefined }));
            }
          }}
        />
        {shippingFieldErrors.street ? (
          <p className={styles.fieldError} role="alert">
            {shippingFieldErrors.street}
          </p>
        ) : null}
      </label>

      <div className={styles.addressRow}>
        <label className={styles.field}>
          <span className={styles.label}>מספר בית</span>
          <input
            className={styles.input}
            type="text"
            name="shippingHouseNumber"
            autoComplete="off"
            required
            disabled={formDisabled || paymentBusy}
            value={houseNumber}
            onChange={(e) => {
              const next = e.target.value;
              setHouseNumber(next);
              notifyShippingPreview({ ...shippingInput(), houseNumber: next });
              if (shippingFieldErrors.houseNumber) {
                setShippingFieldErrors((prev) => ({
                  ...prev,
                  houseNumber: undefined,
                }));
              }
            }}
          />
          {shippingFieldErrors.houseNumber ? (
            <p className={styles.fieldError} role="alert">
              {shippingFieldErrors.houseNumber}
            </p>
          ) : null}
        </label>

        <label className={styles.field}>
          <span className={styles.label}>קומה (אופציונלי)</span>
          <input
            className={styles.input}
            type="text"
            name="shippingFloor"
            autoComplete="off"
            disabled={formDisabled || paymentBusy}
            value={floor}
            onChange={(e) => {
              const next = e.target.value;
              setFloor(next);
              notifyShippingPreview({ ...shippingInput(), floor: next });
              if (shippingFieldErrors.floor) {
                setShippingFieldErrors((prev) => ({ ...prev, floor: undefined }));
              }
            }}
          />
          {shippingFieldErrors.floor ? (
            <p className={styles.fieldError} role="alert">
              {shippingFieldErrors.floor}
            </p>
          ) : null}
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>מיקוד</span>
        <input
          className={styles.input}
          type="text"
          name="shippingPostalCode"
          autoComplete="postal-code"
          inputMode="numeric"
          pattern="[0-9]*"
          required
          disabled={formDisabled || paymentBusy}
          dir="ltr"
          maxLength={7}
          value={postalCode}
          onChange={(e) => {
            const next = e.target.value.replace(/\D/g, "").slice(0, 7);
            setPostalCode(next);
            notifyShippingPreview({ ...shippingInput(), postalCode: next });
            if (shippingFieldErrors.postalCode) {
              setShippingFieldErrors((prev) => ({
                ...prev,
                postalCode: undefined,
              }));
            }
          }}
        />
        {shippingFieldErrors.postalCode ? (
          <p className={styles.fieldError} role="alert">
            {shippingFieldErrors.postalCode}
          </p>
        ) : null}
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
