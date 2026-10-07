"use client";

import {
  saveMagnetSizes,
  type SaveMagnetSizesState,
} from "@/app/admin/(protected)/materials/actions";
import type { AdminMagnetSizeRowDto } from "@/lib/store/adminMaterialsDto";
import { useRouter } from "next/navigation";
import { useActionState, useCallback, useEffect, useMemo, useState, useTransition } from "react";
import styles from "./MagnetSizesEditor.module.scss";

const initialState: SaveMagnetSizesState = {};

type SizeRow = AdminMagnetSizeRowDto;

function isUnsavedNewRow(row: SizeRow): boolean {
  return row.id.startsWith("new:");
}

function serializeRowsForCompare(rows: SizeRow[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      id: row.id,
      name: row.name,
      dimensionsLabel: row.dimensionsLabel,
      price: row.price,
      enabled: row.enabled,
    })),
  );
}

type MagnetSizesEditorProps = {
  initialRows: AdminMagnetSizeRowDto[];
  legacyMagnetPricingOnly: boolean;
};

export function MagnetSizesEditor({
  initialRows,
  legacyMagnetPricingOnly,
}: MagnetSizesEditorProps) {
  const router = useRouter();
  const [rows, setRows] = useState<SizeRow[]>(initialRows);
  const [state, formAction, isPending] = useActionState(saveMagnetSizes, initialState);
  const [isSubmitting, startTransition] = useTransition();
  const baseline = useMemo(() => serializeRowsForCompare(initialRows), [initialRows]);
  const isDirty = useMemo(
    () => serializeRowsForCompare(rows) !== baseline,
    [baseline, rows],
  );

  const isSaving = isPending || isSubmitting;

  useEffect(() => {
    if (state.ok) {
      router.refresh();
    }
  }, [state.ok, router]);

  const buildPayload = useCallback(() => {
    return JSON.stringify({
      sizes: rows.map((row) => ({
        id: row.id,
        name: row.name,
        dimensionsLabel: row.dimensionsLabel,
        price: row.price,
        enabled: row.enabled,
      })),
    });
  }, [rows]);

  const handleSave = useCallback(() => {
    const formData = new FormData();
    formData.set("payload", buildPayload());
    startTransition(() => {
      formAction(formData);
    });
  }, [buildPayload, formAction]);

  const addRow = useCallback(() => {
    setRows((prev) => [
      ...prev,
      {
        id: `new:${crypto.randomUUID()}`,
        name: "",
        dimensionsLabel: "",
        price: "",
        enabled: true,
      },
    ]);
  }, []);

  const cancelNewRow = useCallback((index: number) => {
    setRows((prev) => {
      const row = prev[index];
      if (!row || !isUnsavedNewRow(row)) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const moveRow = useCallback((index: number, direction: -1 | 1) => {
    setRows((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index]!;
      next[index] = next[target]!;
      next[target] = tmp;
      return next;
    });
  }, []);

  const updateRow = useCallback((index: number, patch: Partial<SizeRow>) => {
    setRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }, []);

  const showSuccess = Boolean(state.ok && state.message && !isDirty);

  return (
    <div className={styles.editor}>
      <div className={styles.editorHead}>
        <h3 className={styles.heading}>גדלים ומחירים</h3>
        {isDirty ? (
          <span className={styles.unsavedHint} aria-live="polite">
            יש שינויים שלא נשמרו
          </span>
        ) : null}
      </div>

      {legacyMagnetPricingOnly ? (
        <p className={styles.legacyBanner} role="status">
          הוגדר מחיר מגנט ישן. יש להוסיף גדלים ומחירים.
        </p>
      ) : null}

      {showSuccess && state.message ? (
        <p className={styles.success} role="status">
          {state.message}
        </p>
      ) : null}

      {state.message && !state.ok ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p className={styles.emptyHint}>עדיין לא הוגדרו גדלים. הוסיפו גודל ראשון.</p>
      ) : null}

      <ul className={styles.list}>
        {rows.map((row, index) => {
          const isNew = isUnsavedNewRow(row);
          return (
            <li
              key={row.id}
              className={[styles.row, isNew ? styles.rowNew : ""].filter(Boolean).join(" ")}
            >
              <div className={styles.rowToolbar}>
                <div className={styles.orderGroup} aria-label="סדר תצוגה">
                  <span className={styles.orderLabel}>סדר</span>
                  <div className={styles.orderButtons}>
                    <button
                      type="button"
                      className={styles.orderBtn}
                      disabled={index === 0}
                      onClick={() => moveRow(index, -1)}
                      aria-label="הזזה למעלה בתור"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.orderBtn}
                      disabled={index === rows.length - 1}
                      onClick={() => moveRow(index, 1)}
                      aria-label="הזזה למטה בתור"
                    >
                      ↓
                    </button>
                  </div>
                </div>

                <label className={styles.activeToggle}>
                  <input
                    type="checkbox"
                    className={styles.activeToggleInput}
                    checked={row.enabled}
                    onChange={(e) => updateRow(index, { enabled: e.target.checked })}
                  />
                  <span className={styles.activeToggleTrack} aria-hidden />
                  <span className={styles.activeToggleText}>
                    {row.enabled ? "פעיל" : "לא פעיל"}
                  </span>
                </label>

                {isNew ? (
                  <button
                    type="button"
                    className={styles.cancelNewBtn}
                    onClick={() => cancelNewRow(index)}
                  >
                    ביטול
                  </button>
                ) : null}
              </div>

              {isNew ? (
                <p className={styles.newRowBadge} aria-live="polite">
                  גודל חדש — יישמר בלחיצה על «שמירת גדלים»
                </p>
              ) : null}

              <div className={styles.rowFields}>
                <label className={styles.field}>
                  <span className={styles.label}>שם</span>
                  <input
                    className={styles.input}
                    value={row.name}
                    onChange={(e) => updateRow(index, { name: e.target.value })}
                    maxLength={80}
                    placeholder="לדוגמה: מגנט קטן"
                  />
                </label>
                <label className={styles.field}>
                  <span className={styles.label}>מידות / תווית</span>
                  <input
                    className={styles.input}
                    value={row.dimensionsLabel}
                    onChange={(e) =>
                      updateRow(index, { dimensionsLabel: e.target.value })
                    }
                    maxLength={80}
                    placeholder={'18×36 ס"מ'}
                  />
                </label>
                <label className={[styles.field, styles.fieldPrice].join(" ")}>
                  <span className={styles.label}>מחיר (₪)</span>
                  <input
                    className={styles.input}
                    value={row.price}
                    onChange={(e) => updateRow(index, { price: e.target.value })}
                    dir="ltr"
                    inputMode="decimal"
                    placeholder="0"
                  />
                </label>
              </div>
            </li>
          );
        })}
      </ul>

      <div className={styles.foot}>
        <button type="button" className={styles.addBtn} onClick={addRow}>
          + הוספת גודל
        </button>
        <button
          type="button"
          className={styles.saveBtn}
          disabled={!isDirty || isSaving}
          aria-busy={isSaving}
          onClick={handleSave}
        >
          {isSaving ? "שומר…" : "שמירת גדלים"}
        </button>
      </div>
    </div>
  );
}
