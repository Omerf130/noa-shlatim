"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./AdminShell.module.scss";

type NavItem =
  | { label: string; kind: "link"; href: string; match: "exact" | "prefix" }
  | { label: string; kind: "disabled" };

const navItems: NavItem[] = [
  { label: "דשבורד", kind: "link", href: "/admin", match: "exact" },
  { label: "עיצובים", kind: "disabled" },
  { label: "הזמנות", kind: "link", href: "/admin/orders", match: "prefix" },
  {
    label: "הגדרות חנות",
    kind: "link",
    href: "/admin/store-settings",
    match: "prefix",
  },
];

function isNavActive(pathname: string, item: Extract<NavItem, { kind: "link" }>): boolean {
  if (item.match === "exact") {
    return pathname === item.href;
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function AdminNav() {
  const pathname = usePathname();

  return (
    <ul className={styles.navList}>
      {navItems.map((item) => (
        <li key={item.label}>
          {item.kind === "disabled" ? (
            <span className={styles.navItemDisabled}>{item.label}</span>
          ) : (
            <Link
              href={item.href}
              className={
                isNavActive(pathname, item) ? styles.navItemActive : styles.navItem
              }
              aria-current={isNavActive(pathname, item) ? "page" : undefined}
            >
              {item.label}
            </Link>
          )}
        </li>
      ))}
    </ul>
  );
}
