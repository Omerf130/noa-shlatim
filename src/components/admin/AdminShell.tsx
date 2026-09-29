import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAdmin } from "@/app/admin/(protected)/actions";
import type { SafeAdmin } from "@/lib/auth/session";
import styles from "./AdminShell.module.scss";

type AdminShellProps = {
  admin: SafeAdmin;
  children: React.ReactNode;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.headerStart}>
          <BrandLogo variant="compact" className={styles.logo} />
          <span className={styles.panelTitle}>פאנל ניהול</span>
        </div>
        <div className={styles.headerEnd}>
          <span className={styles.email}>{admin.email}</span>
          <form action={logoutAdmin}>
            <button type="submit" className={styles.logout}>
              התנתקות
            </button>
          </form>
        </div>
      </header>

      <div className={styles.body}>
        <nav className={styles.nav} aria-label="ניווט ניהול">
          <AdminNav />
        </nav>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
