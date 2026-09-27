import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { logoutAdmin } from "@/app/admin/(protected)/actions";
import type { SafeAdmin } from "@/lib/auth/session";
import styles from "./AdminShell.module.scss";

type AdminShellProps = {
  admin: SafeAdmin;
  children: React.ReactNode;
};

type NavItem =
  | { label: string; kind: "link"; href: string; active?: boolean }
  | { label: string; kind: "disabled" };

const navItems: NavItem[] = [
  { label: "דשבורד", kind: "link", href: "/admin", active: true },
  { label: "עיצובים", kind: "disabled" },
  { label: "הזמנות", kind: "disabled" },
];

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
          <ul className={styles.navList}>
            {navItems.map((item) => (
              <li key={item.label}>
                {item.kind === "disabled" ? (
                  <span className={styles.navItemDisabled}>{item.label}</span>
                ) : (
                  <a
                    href={item.href}
                    className={item.active ? styles.navItemActive : styles.navItem}
                    aria-current={item.active ? "page" : undefined}
                  >
                    {item.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </nav>

        <main className={styles.main}>{children}</main>
      </div>
    </div>
  );
}
