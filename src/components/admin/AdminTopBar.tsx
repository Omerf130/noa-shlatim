"use client";

import { AdminMobileNavDrawer } from "@/components/admin/AdminMobileNavDrawer";
import { logoutAdmin } from "@/app/admin/(protected)/actions";
import { Menu } from "lucide-react";
import { useState } from "react";
import styles from "./AdminTopBar.module.scss";

type AdminTopBarProps = {
  email: string;
};

export function AdminTopBar({ email }: AdminTopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className={styles.bar}>
        <button
          type="button"
          className={styles.menuBtn}
          aria-label="פתיחת תפריט"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Menu size={22} strokeWidth={2} aria-hidden />
        </button>
        <div className={styles.spacer} />
        <span className={styles.avatar} aria-hidden>
          {email.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <span className={styles.email} title={email}>
          {email}
        </span>
        <form action={logoutAdmin}>
          <button type="submit" className={styles.logout}>
            התנתקות
          </button>
        </form>
      </header>
      <AdminMobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
