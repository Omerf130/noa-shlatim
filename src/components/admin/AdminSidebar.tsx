import { AdminNav } from "@/components/admin/AdminNav";
import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { BUSINESS_DETAILS } from "@/data/businessDetails";
import { Lightbulb } from "lucide-react";
import Link from "next/link";
import styles from "./AdminSidebar.module.scss";

export function AdminSidebar() {
  return (
    <aside className={styles.sidebar} aria-label="ניווט ניהול">
      <div className={styles.brand}>
        <BrandLogo variant="compact" className={styles.logo} />
        <p className={styles.brandTagline}>נועה · שלטים לדלת</p>
      </div>
      <AdminNav />
      <div className={styles.helpCard}>
        <div className={styles.helpIcon} aria-hidden>
          <Lightbulb size={16} strokeWidth={1.75} />
        </div>
        <p className={styles.helpTitle}>צריך עזרה?</p>
        <p className={styles.helpText}>
          שאלות על ניהול החנות — נשמח לעזור במייל.
        </p>
        <Link href={BUSINESS_DETAILS.mailtoHref} className={styles.helpBtn}>
          צור קשר
        </Link>
      </div>
    </aside>
  );
}
