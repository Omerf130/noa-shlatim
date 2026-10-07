"use client";

import {
  createPromotionAction,
  updatePromotionAction,
  type PromotionFormState,
} from "@/app/admin/(protected)/promotions/actions";
import { Button } from "@/components/ui/Button/Button";
import type { AdminPromotionEditorDto } from "@/lib/promotions/adminPromotionDtos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import styles from "./AdminPromotionForm.module.scss";

const initialState: PromotionFormState = {};

type RequirementRow = {
  magnetSizeId: string;
  quantity: number;
};

type AdminPromotionFormProps = {
  dto: AdminPromotionEditorDto;
};

function rowWarning(
  magnetSizeId: string,
  options: AdminPromotionEditorDto["magnetSizeOptions"],
): string | null {
  const opt = options.find((o) => o.id === magnetSizeId);
  if (!opt) {
    return "גודל המגנט הוסר מהגדרות החנות — יש לבחור גודל אחר.";
  }
  if (!opt.enabled) {
    return `גודל «${opt.label}» מושבת — המבצע לא יחול עד לתיקון.`;
  }
  return null;
}

export function AdminPromotionForm({ dto }: AdminPromotionFormProps) {
  const router = useRouter();
  const [state, setState] = useState<PromotionFormState>(initialState);
  const [isPending, startTransition] = useTransition();

  const [internalName, setInternalName] = useState(dto.internalName);
  const [bundlePriceIls, setBundlePriceIls] = useState(dto.bundlePriceIls);
  const [enabled, setEnabled] = useState(dto.enabled);
  const [showInBanner, setShowInBanner] = useState(dto.showInBanner);
  const [bannerText, setBannerText] = useState(dto.bannerText);
  const [bannerSortOrder, setBannerSortOrder] = useState(String(dto.bannerSortOrder));
  const [requirements, setRequirements] = useState<RequirementRow[]>(
    dto.requirements.length > 0
      ? dto.requirements
      : dto.magnetSizeOptions[0]
        ? [{ magnetSizeId: dto.magnetSizeOptions[0].id, quantity: 1 }]
        : [],
  );

  const selectableForNewRow = useMemo(
    () => dto.magnetSizeOptions.filter((o) => o.enabled),
    [dto.magnetSizeOptions],
  );

  const buildPayload = useCallback(() => {
    return JSON.stringify({
      internalName,
      bundlePriceIls,
      enabled,
      showInBanner,
      bannerText,
      bannerSortOrder: Number(bannerSortOrder),
      requirements,
    });
  }, [
    internalName,
    bundlePriceIls,
    enabled,
    showInBanner,
    bannerText,
    bannerSortOrder,
    requirements,
  ]);

  const onSubmit = useCallback(() => {
    const formData = new FormData();
    formData.set("payload", buildPayload());
    if (dto.mode === "edit" && dto.promotionId) {
      formData.set("promotionId", dto.promotionId);
    }

    startTransition(async () => {
      const next =
        dto.mode === "create"
          ? await createPromotionAction(initialState, formData)
          : await updatePromotionAction(initialState, formData);
      setState(next);
      if (next.ok) {
        if (dto.mode === "create") {
          router.push("/admin/promotions");
          router.refresh();
        } else {
          router.refresh();
        }
      }
    });
  }, [buildPayload, dto.mode, dto.promotionId, router]);

  const addRequirementRow = useCallback(() => {
    const first = selectableForNewRow[0];
    if (!first) {
      return;
    }
    setRequirements((prev) => [...prev, { magnetSizeId: first.id, quantity: 1 }]);
  }, [selectableForNewRow]);

  const updateRow = useCallback((index: number, patch: Partial<RequirementRow>) => {
    setRequirements((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }, []);

  const removeRow = useCallback((index: number) => {
    setRequirements((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const noSizes = dto.magnetSizeOptions.length === 0;

  return (
    <div className={styles.form}>
      <Link href="/admin/promotions" className={styles.backLink}>
        ← חזרה לרשימת מבצעים
      </Link>

      <header>
        <h1 className={styles.sectionTitle}>
          {dto.mode === "create" ? "מבצע חדש" : "עריכת מבצע"}
        </h1>
      </header>

      {noSizes ? (
        <p className={styles.feedbackWarn} role="status">
          יש להגדיר גדלי מגנט ב«חומרים» לפני שמירת מבצע.
        </p>
      ) : null}

      <section className={styles.section} aria-labelledby="promo-name-heading">
        <h2 id="promo-name-heading" className={styles.sectionTitle}>
          פרטים פנימיים
        </h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="internalName">
            שם המבצע (פנימי)
          </label>
          <input
            id="internalName"
            className={styles.input}
            value={internalName}
            onChange={(e) => setInternalName(e.target.value)}
            autoComplete="off"
          />
        </div>
      </section>

      <section className={styles.section} aria-labelledby="promo-rules-heading">
        <h2 id="promo-rules-heading" className={styles.sectionTitle}>
          תנאי המבצע
        </h2>
        {requirements.map((row, index) => {
          const warn = rowWarning(row.magnetSizeId, dto.magnetSizeOptions);
          return (
            <div key={`req-${index}`} className={styles.requirementRow}>
              <div className={`${styles.field} ${styles.select}`}>
                <label className={styles.label} htmlFor={`size-${index}`}>
                  גודל מגנט
                </label>
                <select
                  id={`size-${index}`}
                  className={styles.input}
                  value={row.magnetSizeId}
                  onChange={(e) => updateRow(index, { magnetSizeId: e.target.value })}
                >
                  {dto.magnetSizeOptions.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.label}
                      {!opt.enabled ? " (מושבת)" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor={`qty-${index}`}>
                  כמות
                </label>
                <input
                  id={`qty-${index}`}
                  type="number"
                  min={1}
                  max={20}
                  className={`${styles.input} ${styles.qtyInput}`}
                  value={row.quantity}
                  onChange={(e) =>
                    updateRow(index, { quantity: Number.parseInt(e.target.value, 10) || 1 })
                  }
                />
              </div>
              {requirements.length > 1 ? (
                <button
                  type="button"
                  className={styles.removeRowBtn}
                  onClick={() => removeRow(index)}
                >
                  הסרה
                </button>
              ) : null}
              {warn ? (
                <p className={styles.rowWarning} role="status">
                  {warn}
                </p>
              ) : null}
            </div>
          );
        })}
        <button
          type="button"
          className={styles.addRowBtn}
          onClick={addRequirementRow}
          disabled={selectableForNewRow.length === 0}
        >
          + הוספת גודל
        </button>
      </section>

      <section className={styles.section} aria-labelledby="promo-price-heading">
        <h2 id="promo-price-heading" className={styles.sectionTitle}>
          מחיר המבצע
        </h2>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bundlePriceIls">
            מחיר לחבילה (₪)
          </label>
          <input
            id="bundlePriceIls"
            className={styles.input}
            inputMode="decimal"
            dir="ltr"
            value={bundlePriceIls}
            onChange={(e) => setBundlePriceIls(e.target.value)}
            placeholder="149"
          />
          <p className={styles.hint}>מחיר אחד לכל יישום של חבילת המבצע (למשל 149 ₪).</p>
        </div>
        {dto.priceWarning && dto.mode === "edit" ? (
          <p className={styles.feedbackWarn} role="status">
            {dto.priceWarning}
          </p>
        ) : null}
      </section>

      <section className={styles.section} aria-labelledby="promo-banner-heading">
        <h2 id="promo-banner-heading" className={styles.sectionTitle}>
          באנר באתר
        </h2>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          מבצע פעיל
        </label>
        <label className={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={showInBanner}
            onChange={(e) => setShowInBanner(e.target.checked)}
          />
          הצג בבאנר
        </label>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bannerText">
            טקסט באנר (שיווקי)
          </label>
          <textarea
            id="bannerText"
            className={styles.textarea}
            value={bannerText}
            onChange={(e) => setBannerText(e.target.value)}
            disabled={!showInBanner}
          />
        </div>
        <div className={styles.field}>
          <label className={styles.label} htmlFor="bannerSortOrder">
            סדר תצוגה בבאנר
          </label>
          <input
            id="bannerSortOrder"
            type="number"
            className={styles.input}
            dir="ltr"
            value={bannerSortOrder}
            onChange={(e) => setBannerSortOrder(e.target.value)}
          />
          <p className={styles.hint}>מספר נמוך יוצג קודם. אינו משפיע על חישוב המחיר.</p>
        </div>
      </section>

      {state.message && state.ok ? (
        <p className={styles.feedbackOk} role="status">
          {state.message}
        </p>
      ) : null}
      {state.warning ? (
        <p className={styles.feedbackWarn} role="status">
          {state.warning}
        </p>
      ) : null}
      {state.message && !state.ok ? (
        <p className={styles.feedbackError} role="alert">
          {state.message}
        </p>
      ) : null}

      <div className={styles.actions}>
        <Button type="button" disabled={isPending || noSizes} onClick={onSubmit}>
          {isPending ? "שומר…" : "שמירה"}
        </Button>
      </div>
    </div>
  );
}
