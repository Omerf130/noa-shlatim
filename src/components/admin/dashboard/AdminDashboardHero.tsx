import Link from "next/link";
import styles from "./AdminDashboardHero.module.scss";

type AdminDashboardHeroProps = {
  greeting: string;
  dateLabel: string;
  subtitle: string;
  storeCheckoutReady: boolean | null;
};

export function AdminDashboardHero({
  greeting,
  dateLabel,
  subtitle,
  storeCheckoutReady,
}: AdminDashboardHeroProps) {
  return (
    <header className={styles.hero}>
      <div className={styles.row}>
        <h1 className={styles.greeting}>
          {greeting} <span aria-hidden>👋</span>
        </h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <p className={styles.date}>{dateLabel}</p>
      </div>
      {storeCheckoutReady === false && (
        <p className={styles.banner} role="status">
          הגדרות החנות אינן מוכנות לקופה —{" "}
          <Link href="/admin/store-settings">עדכון הגדרות חנות</Link>
        </p>
      )}
    </header>
  );
}
