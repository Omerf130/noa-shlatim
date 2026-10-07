"use client";

import {
  saveStoreSettings,
  type StoreSettingsFormState,
} from "@/app/admin/(protected)/store-settings/actions";
import type { AdminStoreSettingsDto } from "@/lib/store/adminStoreSettingsDto";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useState, useTransition } from "react";
import styles from "./StoreSettingsForm.module.scss";

type ShippingRow = {
  id: string;
  displayName: string;
  price: string;
  enabled: boolean;
  instructions: string;
};

const initialActionState: StoreSettingsFormState = {};

function rowsFromDto(dto: AdminStoreSettingsDto): ShippingRow[] {
  return dto.shippingMethods.map((m) => ({
    id: m.id,
    displayName: m.displayName,
    price: m.price,
    enabled: m.enabled,
    instructions: m.instructions,
  }));
}

type StoreSettingsFormProps = {
  dto: AdminStoreSettingsDto;
};

export function StoreSettingsForm({ dto }: StoreSettingsFormProps) {
  const router = useRouter();
  const [woodPrice, setWoodPrice] = useState(dto.woodPrice);
  const [shippingRows, setShippingRows] = useState<ShippingRow[]>(() =>
    rowsFromDto(dto),
  );

  const [state, formAction, isPending] = useActionState(
    saveStoreSettings,
    initialActionState,
  );
  const [isSubmitting, startTransition] = useTransition();

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const buildPayloadJson = useCallback(() => {
    return JSON.stringify({
      woodPrice,
      shippingMethods: shippingRows.map((row) => ({
        id: row.id,
        displayName: row.displayName,
        price: row.price,
        enabled: row.enabled,
        instructions: row.instructions,
      })),
    });
  }, [shippingRows, woodPrice]);

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const formData = new FormData();
      formData.set("payload", buildPayloadJson());
      startTransition(() => {
        formAction(formData);
      });
    },
    [buildPayloadJson, formAction],
  );

  const addShippingMethod = useCallback(() => {
    setShippingRows((rows) => [
      ...rows,
      {
        id: `new:${crypto.randomUUID()}`,
        displayName: "",
        price: "",
        enabled: true,
        instructions: "",
      },
    ]);
  }, []);

  const removeShippingMethod = useCallback((index: number) => {
    setShippingRows((rows) => rows.filter((_, i) => i !== index));
  }, []);

  const moveShippingMethod = useCallback((index: number, direction: -1 | 1) => {
    setShippingRows((rows) => {
      const next = [...rows];
      const target = index + direction;
      if (target < 0 || target >= next.length) {
        return rows;
      }
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }, []);

  const updateRow = useCallback(
    (index: number, patch: Partial<ShippingRow>) => {
      setShippingRows((rows) =>
        rows.map((row, i) => (i === index ? { ...row, ...patch } : row)),
      );
    },
    [],
  );

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {dto.showNotConfiguredBanner && (
        <p className={styles.banner} role="status">
          הגדרות החנות טרם הוגדרו.
        </p>
      )}

      {!dto.showNotConfiguredBanner && (
        <ul className={styles.readiness} aria-label="מצב הגדרות">
          <li className={dto.pricingReady ? styles.ready : styles.notReady}>
            תמחור: {dto.pricingReady ? "מוכן" : "לא הושלם"}
          </li>
          <li className={dto.shippingReady ? styles.ready : styles.notReady}>
            משלוח: {dto.shippingReady ? "מוכן" : "לא הושלם"}
          </li>
        </ul>
      )}

      {dto.updatedAtLabel && (
        <p className={styles.updated}>עודכן לאחרונה: {dto.updatedAtLabel}</p>
      )}

      <section className={styles.section} aria-labelledby="pricing-heading">
        <h2 id="pricing-heading" className={styles.sectionTitle}>
          תמחור
        </h2>
        <p className={styles.sectionLead}>
          מחיר שלט עץ. מחירי מגנט מנוהלים בדף חומרים. השאר ריק אם טרם הוגדר.
        </p>
        <div className={styles.pricingGrid}>
          <label className={styles.field}>
            <span className={styles.label}>מחיר שלט עץ (₪)</span>
            <input
              className={styles.input}
              type="text"
              inputMode="decimal"
              name="woodPriceDisplay"
              value={woodPrice}
              onChange={(e) => setWoodPrice(e.target.value)}
              dir="ltr"
              autoComplete="off"
            />
          </label>
        </div>
      </section>

      <section className={styles.section} aria-labelledby="shipping-heading">
        <div className={styles.sectionHeaderRow}>
          <h2 id="shipping-heading" className={styles.sectionTitle}>
            שיטות משלוח
          </h2>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={addShippingMethod}
          >
            הוספת שיטה
          </button>
        </div>
        <p className={styles.sectionLead}>
          הוסיפו שיטות משלוח/איסוף לפי הצורך. אין ברירת מחדל.
        </p>

        {shippingRows.length === 0 ? (
          <p className={styles.emptyShipping} role="status">
            אין שיטות משלוח. לחצו «הוספת שיטה».
          </p>
        ) : (
          <ul className={styles.shippingList}>
            {shippingRows.map((row, index) => (
              <li key={row.id} className={styles.shippingCard}>
                <div className={styles.cardTop}>
                  <span className={styles.cardIndex}>שיטה {index + 1}</span>
                  <div className={styles.cardActions}>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveShippingMethod(index, -1)}
                      disabled={index === 0}
                      aria-label="הזזה למעלה"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.iconBtn}
                      onClick={() => moveShippingMethod(index, 1)}
                      disabled={index === shippingRows.length - 1}
                      aria-label="הזזה למטה"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => removeShippingMethod(index)}
                    >
                      הסרה
                    </button>
                  </div>
                </div>

                <label className={styles.field}>
                  <span className={styles.label}>שם השיטה</span>
                  <input
                    className={styles.input}
                    type="text"
                    value={row.displayName}
                    onChange={(e) =>
                      updateRow(index, { displayName: e.target.value })
                    }
                    maxLength={80}
                  />
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>מחיר (₪)</span>
                  <input
                    className={styles.input}
                    type="text"
                    inputMode="decimal"
                    value={row.price}
                    onChange={(e) => updateRow(index, { price: e.target.value })}
                    dir="ltr"
                  />
                </label>

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={row.enabled}
                    onChange={(e) =>
                      updateRow(index, { enabled: e.target.checked })
                    }
                  />
                  <span>פעיל (יוצג ללקוחות כשהחנות מוכנה)</span>
                </label>

                <label className={styles.field}>
                  <span className={styles.label}>הוראות / מידע נוסף (אופציונלי)</span>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    maxLength={300}
                    value={row.instructions}
                    onChange={(e) =>
                      updateRow(index, { instructions: e.target.value })
                    }
                  />
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>

      {state.message && (
        <p
          className={state.ok ? styles.success : styles.error}
          role={state.ok ? "status" : "alert"}
        >
          {state.message}
        </p>
      )}

      <button
        type="submit"
        className={styles.submit}
        disabled={isPending || isSubmitting}
      >
        {isPending || isSubmitting ? "שומרים…" : "שמירת הגדרות"}
      </button>
    </form>
  );
}
