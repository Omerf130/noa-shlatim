"use client";

import { AdminNav } from "@/components/admin/AdminNav";
import { useEffect, useId, useRef } from "react";
import styles from "./AdminMobileNavDrawer.module.scss";

type AdminMobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

export function AdminMobileNavDrawer({ open, onClose }: AdminMobileNavDrawerProps) {
  const panelId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    closeButtonRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className={styles.root}>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="סגירת תפריט"
        onClick={onClose}
      />
      <aside
        id={panelId}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-label="תפריט ניהול"
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>תפריט</span>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
          >
            סגירה
          </button>
        </div>
        <AdminNav onNavigate={onClose} />
      </aside>
    </div>
  );
}
