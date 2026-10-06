"use client";

import {
  setMaterialEnabled,
  type SetMaterialEnabledState,
} from "@/app/admin/(protected)/materials/actions";
import type { AdminMaterialsPageDto } from "@/lib/store/adminMaterialsDto";
import { useActionState, useCallback, useTransition } from "react";
import styles from "./AdminMaterialsCards.module.scss";

const initialState: SetMaterialEnabledState = {};

type AdminMaterialsCardsProps = {
  dto: AdminMaterialsPageDto;
};

export function AdminMaterialsCards({ dto }: AdminMaterialsCardsProps) {
  const [state, formAction] = useActionState(setMaterialEnabled, initialState);
  const [isPending, startTransition] = useTransition();

  const toggle = useCallback(
    (material: "wood" | "magnet", enabled: boolean) => {
      const formData = new FormData();
      formData.set("material", material);
      formData.set("enabled", enabled ? "true" : "false");
      startTransition(() => {
        formAction(formData);
      });
    },
    [formAction],
  );

  return (
    <div className={styles.wrap}>
      {state.message && !state.ok ? (
        <p className={styles.error} role="alert">
          {state.message}
        </p>
      ) : null}

      <ul className={styles.grid}>
        {dto.materials.map((item) => (
          <li key={item.key}>
            <article className={styles.card}>
              <div className={styles.cardTop}>
                <span
                  className={[
                    styles.sample,
                    item.key === "wood" ? styles.sampleWood : styles.sampleMagnet,
                  ].join(" ")}
                  aria-hidden
                />
                <div className={styles.cardCopy}>
                  <h2 className={styles.cardTitle}>{item.displayName}</h2>
                  <p className={styles.price} dir="ltr">
                    {item.priceLabel}
                  </p>
                  {!item.priceConfigured ? (
                    <p className={styles.priceHint}>מחיר לא הוגדר — הגדרות חנות</p>
                  ) : null}
                </div>
              </div>

              <div className={styles.cardFoot}>
                <span
                  className={[
                    styles.statusPill,
                    item.enabled ? styles.statusOn : styles.statusOff,
                  ].join(" ")}
                >
                  {item.enabled ? "פעיל" : "לא פעיל"}
                </span>
                <button
                  type="button"
                  className={styles.toggleBtn}
                  disabled={isPending}
                  onClick={() => toggle(item.key, !item.enabled)}
                  aria-pressed={item.enabled}
                >
                  {item.enabled ? "השבתה" : "הפעלה"}
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
