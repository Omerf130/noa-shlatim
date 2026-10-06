import type { KpiTrendLine } from "@/lib/admin/dashboard/computeMonthOverMonthTrend";
import type { AdminDashboardKpis } from "@/lib/admin/dashboard/adminDashboardDtos";
import {
  ChartColumnIncreasing,
  CircleCheckBig,
  Clock3,
  ShoppingCart,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import styles from "./AdminDashboardKpiStrip.module.scss";

type AdminDashboardKpiStripProps = {
  kpis: AdminDashboardKpis;
};

export function AdminDashboardKpiStrip({ kpis }: AdminDashboardKpiStripProps) {
  return (
    <section className={styles.strip} aria-label="מדדי סקורה">
      <article className={`${styles.kpi} ${styles.kpiSage}`}>
        <div className={styles.iconZone}>
          <div className={styles.iconRing}>
            <ShoppingCart size={28} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <div className={styles.body}>
          <p className={styles.value}>{kpis.totalOrders}</p>
          <p className={styles.label}>סה&quot;כ הזמנות</p>
          <KpiTrendLineView trend={kpis.totalOrdersTrend} />
        </div>
      </article>

      <article className={`${styles.kpi} ${styles.kpiSagePaid}`}>
        <div className={styles.iconZone}>
          <div className={styles.iconRing}>
            <CircleCheckBig size={28} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <div className={styles.body}>
          <p className={styles.value}>{kpis.paidOrders}</p>
          <p className={styles.label}>שולמו</p>
          <p className={styles.supportMuted}>לפי סטטוס שולם במערכת</p>
        </div>
      </article>

      <article className={`${styles.kpi} ${styles.kpiWarm}`}>
        <div className={styles.iconZone}>
          <div className={styles.iconRing}>
            <Clock3 size={28} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <div className={styles.body}>
          <p className={styles.value}>{kpis.paymentPendingOrders}</p>
          <p className={styles.label}>ממתינות לתשלום</p>
          {kpis.paymentPendingOrders > 0 ? (
            <p className={styles.support}>
              <Link href="/admin/orders" className={styles.pendingLink}>
                צפייה בהזמנות ←
              </Link>
            </p>
          ) : (
            <p className={styles.supportMuted}>אין המתנה פעילה לתשלום</p>
          )}
        </div>
      </article>

      <article className={`${styles.kpi} ${styles.kpiForest}`}>
        <div className={styles.iconZone}>
          <div className={styles.iconRing}>
            <ChartColumnIncreasing size={28} strokeWidth={2} aria-hidden />
          </div>
        </div>
        <div className={styles.body}>
          <p className={`${styles.value} ${styles.valueMoney}`}>{kpis.paidRevenueLabel}</p>
          <p className={styles.label}>הכנסות</p>
          <KpiTrendLineView trend={kpis.revenueTrend} />
        </div>
      </article>
    </section>
  );
}

function KpiTrendLineView({ trend }: { trend: KpiTrendLine }) {
  if (trend.percentLabel) {
    return (
      <p className={`${styles.trend} ${styles[`trend_${trend.variant}`]}`}>
        <span className={styles.trendStrong}>{trend.percentLabel}</span>
        {trend.showUpArrow ? (
          <TrendingUp size={12} strokeWidth={2.25} className={styles.trendIcon} aria-hidden />
        ) : null}
        {trend.showDownArrow ? (
          <TrendingDown size={12} strokeWidth={2.25} className={styles.trendIcon} aria-hidden />
        ) : null}
        {trend.suffix ? <span className={styles.trendSuffix}>{trend.suffix}</span> : null}
      </p>
    );
  }

  return (
    <p className={`${styles.trend} ${styles[`trend_${trend.variant}`]}`}>{trend.text}</p>
  );
}
