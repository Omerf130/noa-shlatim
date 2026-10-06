import type { AdminOrderStatusKey } from "@/lib/admin/orders/adminOrderDtos";
import styles from "./AdminStatusBadge.module.scss";

type AdminStatusBadgeProps = {
  statusKey: AdminOrderStatusKey | string;
  label: string;
};

export function AdminStatusBadge({ statusKey, label }: AdminStatusBadgeProps) {
  const variant =
    statusKey === "draft" ||
    statusKey === "payment_pending" ||
    statusKey === "paid" ||
    statusKey === "creating"
      ? statusKey
      : "draft";

  return (
    <span className={`${styles.badge} ${styles[variant]}`}>{label}</span>
  );
}
