"use client";

import {
  ADMIN_NAV_ENTRIES,
  isAdminNavActive,
  type AdminNavLiveEntry,
} from "@/lib/admin/nav/adminNavConfig";
import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminNav.module.scss";

type AdminNavProps = {
  onNavigate?: () => void;
};

export function AdminNav({ onNavigate }: AdminNavProps) {
  const pathname = usePathname();

  return (
    <ul className={styles.list}>
      {ADMIN_NAV_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        if (entry.kind === "soon") {
          return (
            <li key={entry.id}>
              <span className={styles.itemSoon} aria-disabled="true">
                <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden />
                {entry.label}
                <span className={styles.soonBadge}>בקרוב</span>
              </span>
            </li>
          );
        }

        const live = entry as AdminNavLiveEntry;
        const active = isAdminNavActive(pathname, live);

        return (
          <li key={entry.id}>
            <Link
              href={live.href}
              className={active ? styles.itemActive : styles.itemLive}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              <Icon className={styles.icon} size={18} strokeWidth={2} aria-hidden />
              {live.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
