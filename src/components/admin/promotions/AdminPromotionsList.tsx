"use client";

import {
  setPromotionEnabled,
  type SetPromotionEnabledState,
} from "@/app/admin/(protected)/promotions/actions";
import { Button } from "@/components/ui/Button/Button";
import type { AdminPromotionsListPageDto } from "@/lib/promotions/adminPromotionDtos";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import styles from "./AdminPromotionsList.module.scss";

const toggleInitial: SetPromotionEnabledState = {};

type AdminPromotionsListProps = {
  dto: AdminPromotionsListPageDto;
};

export function AdminPromotionsList({ dto }: AdminPromotionsListProps) {
  const router = useRouter();
  const [toggleState, setToggleState] = useState(toggleInitial);
  const [isPending, startTransition] = useTransition();

  const onToggleEnabled = useCallback(
    (promotionId: string, enabled: boolean) => {
      const formData = new FormData();
      formData.set("promotionId", promotionId);
      formData.set("enabled", enabled ? "true" : "false");
      startTransition(async () => {
        const next = await setPromotionEnabled(toggleInitial, formData);
        setToggleState(next);
        if (next.ok) {
          router.refresh();
        }
      });
    },
    [router],
  );

  return (
    <>
      <header className={styles.pageHeader}>
        <h1 className={styles.heading}>מבצעים</h1>
        <p className={styles.lead}>
          הגדרת חבילות מגנטים במחיר מבצע. המבצעים יחולו אוטומטית בסל (בשלב הבא).
        </p>
      </header>

      <div className={styles.toolbar}>
        {dto.canCreate ? (
          <Button href="/admin/promotions/new">מבצע חדש</Button>
        ) : (
          <Button disabled>מבצע חדש</Button>
        )}
      </div>

      {!dto.canCreate && dto.createBlockedMessage ? (
        <p className={styles.blockedNote} role="status">
          {dto.createBlockedMessage}
        </p>
      ) : null}

      {toggleState.message && !toggleState.ok ? (
        <p role="alert">{toggleState.message}</p>
      ) : null}

      {dto.items.length === 0 ? (
        <p className={styles.empty}>עדיין לא הוגדרו מבצעים.</p>
      ) : (
        <ul className={styles.list}>
          {dto.items.map((item) => (
            <li key={item.promotionId} className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{item.internalName}</h2>
                <div className={styles.badges}>
                  <span className={item.enabled ? styles.badge : styles.badgeMuted}>
                    {item.enabled ? "פעיל" : "מושבת"}
                  </span>
                  {item.showInBanner ? (
                    <span className={styles.badge}>באנר</span>
                  ) : null}
                  {!item.requirementsValid ? (
                    <span className={styles.badgeWarn}>דורש תיקון</span>
                  ) : null}
                </div>
              </div>
              <p className={styles.meta}>
                {item.ruleSummary} · {item.bundlePriceLabel}
                <br />
                סדר באנר: {item.bannerSortOrder}
              </p>
              <div className={styles.actions}>
                <Link href={item.editHref} className={styles.linkBtn}>
                  עריכה
                </Link>
                <button
                  type="button"
                  className={styles.toggleBtn}
                  disabled={isPending}
                  onClick={() => onToggleEnabled(item.promotionId, !item.enabled)}
                >
                  {item.enabled ? "השבתה" : "הפעלה"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
