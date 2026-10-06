import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import type { SafeAdmin } from "@/lib/auth/session";
import styles from "./AdminShell.module.scss";

type AdminShellProps = {
  admin: SafeAdmin;
  children: React.ReactNode;
};

export function AdminShell({ admin, children }: AdminShellProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.mainColumn}>
        <AdminTopBar email={admin.email} />
        <div className={styles.mainInner}>{children}</div>
      </div>
      <AdminSidebar />
    </div>
  );
}
