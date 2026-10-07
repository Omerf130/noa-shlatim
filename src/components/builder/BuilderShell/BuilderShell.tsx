import { CartNavLink } from "@/components/cart/CartNavLink";
import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./BuilderShell.module.scss";

type BuilderShellProps = {
  children: ReactNode;
};

export function BuilderShell({ children }: BuilderShellProps) {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <BrandLogo variant="compact" />
        <div className={styles.headerActions}>
          <CartNavLink />
          <Link href="/" className={styles.homeLink}>
            חזרה לדף הבית
          </Link>
        </div>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  );
}
