import styles from "./page.module.scss";

export const metadata = {
  title: "דשבורד | פאנל ניהול",
};

export default function AdminDashboardPage() {
  return (
    <div className={styles.dashboard}>
      <h1 className={styles.heading}>דשבורד</h1>
      <p className={styles.lead}>
        ברוכים הבאים לפאנל הניהול. בקרוב: עיצובים והזמנות.
      </p>
    </div>
  );
}
