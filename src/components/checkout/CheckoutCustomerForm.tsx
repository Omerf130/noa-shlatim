"use client";

import { Button } from "@/components/ui/Button/Button";
import type { CheckoutCustomerDto } from "@/lib/checkout/checkoutPageDto";
import { useCallback, useState } from "react";
import styles from "./CheckoutCustomerForm.module.scss";

type SaveState = "idle" | "submitting" | "success" | "error";

type CheckoutCustomerFormProps = {
  orderId: string;
  initialCustomer: CheckoutCustomerDto;
  initialNotes: string;
};

type SaveResponse =
  | { ok: true; customer: CheckoutCustomerDto; notes: string }
  | { ok: false; code: string; message: string };

export function CheckoutCustomerForm({
  orderId,
  initialCustomer,
  initialNotes,
}: CheckoutCustomerFormProps) {
  const [fullName, setFullName] = useState(initialCustomer.fullName);
  const [phone, setPhone] = useState(initialCustomer.phone);
  const [email, setEmail] = useState(initialCustomer.email);
  const [notes, setNotes] = useState(initialNotes);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setFieldError(null);
      setSaveState("submitting");

      try {
        const res = await fetch(`/api/orders/${orderId}/checkout`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: { fullName, phone, email },
            notes,
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
        setSaveState("success");
      } catch {
        setFieldError("לא הצלחנו לשמור את הפרטים. נסו שוב.");
        setSaveState("error");
      }
    },
    [email, fullName, notes, orderId, phone],
  );

  return (
    <form className={styles.form} onSubmit={(e) => void onSubmit(e)} noValidate>
      <h2 className={styles.formTitle}>פרטי התקשרות</h2>

      <label className={styles.field}>
        <span className={styles.label}>שם מלא</span>
        <input
          className={styles.input}
          type="text"
          name="fullName"
          autoComplete="name"
          required
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
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            if (saveState === "success") setSaveState("idle");
          }}
        />
      </label>

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
        disabled={saveState === "submitting"}
        className={styles.submit}
      >
        {saveState === "submitting" ? "שומרים…" : "שמירת פרטים"}
      </Button>
    </form>
  );
}
