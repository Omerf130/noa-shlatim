import { redirect } from "next/navigation";
import { BrandLogo } from "@/components/brand/BrandLogo/BrandLogo";
import { getAdminSession } from "@/lib/auth/session";
import { AdminLoginForm } from "@/app/admin/login/AdminLoginForm";
import styles from "./page.module.scss";

export const metadata = {
  title: "התחברות | פאנל ניהול",
};

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) {
    redirect("/admin");
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <BrandLogo variant="compact" asLink={false} className={styles.logo} />
        <h1 className={styles.title}>פאנל ניהול</h1>
        <p className={styles.subtitle}>התחברות למערכת הניהול</p>
        <AdminLoginForm />
      </div>
    </div>
  );
}
