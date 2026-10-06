import type { AdminDashboardDto } from "@/lib/admin/dashboard/adminDashboardDtos";
import { AdminDashboardAttentionFeed } from "@/components/admin/dashboard/AdminDashboardAttentionFeed";
import { AdminDashboardHero } from "@/components/admin/dashboard/AdminDashboardHero";
import { AdminDashboardKpiStrip } from "@/components/admin/dashboard/AdminDashboardKpiStrip";
import { AdminDashboardMgmtTiles } from "@/components/admin/dashboard/AdminDashboardMgmtTiles";
import { AdminDashboardRecentOrders } from "@/components/admin/dashboard/AdminDashboardRecentOrders";
import styles from "./AdminDashboardView.module.scss";

type AdminDashboardViewProps = {
  data: AdminDashboardDto;
};

export function AdminDashboardView({ data }: AdminDashboardViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.topCluster}>
        <AdminDashboardHero
          greeting={data.greeting}
          dateLabel={data.dateLabel}
          subtitle={data.subtitle}
          storeCheckoutReady={data.storeCheckoutReady}
        />
        <AdminDashboardKpiStrip kpis={data.kpis} />
      </div>

      <div className={styles.midRow}>
        <AdminDashboardRecentOrders orders={data.recentOrders} />
        <AdminDashboardAttentionFeed
          attentionCount={data.attentionCount}
          items={data.attentionItems}
        />
      </div>

      <AdminDashboardMgmtTiles />
    </div>
  );
}
