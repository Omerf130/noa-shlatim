import { buildAdminDashboardGreeting } from "@/lib/admin/dashboard/adminDashboardGreeting";
import type { AdminDashboardDto } from "@/lib/admin/dashboard/adminDashboardDtos";
import { computeMonthOverMonthTrend } from "@/lib/admin/dashboard/computeMonthOverMonthTrend";
import { computePaidRevenueMinorFromAggregation } from "@/lib/admin/dashboard/computePaidRevenueMinor";
import { fetchDashboardKpiMonthMetrics } from "@/lib/admin/dashboard/fetchDashboardKpiMonthMetrics";
import { getDashboardAttentionItems } from "@/lib/admin/dashboard/getDashboardAttentionItems";
import { buildAdminDashboardRecentOrderDto } from "@/lib/admin/dashboard/buildAdminDashboardRecentOrderDto";
import { ADMIN_VISIBLE_ORDER_FILTER } from "@/lib/admin/orders/adminOrderQueryFilter";
import { formatMinorToIlsDisplay } from "@/lib/money/ils";
import { connectDb } from "@/lib/db/connect";
import { computeStoreSettingsReadiness } from "@/lib/store/storeSettingsCompleteness";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { Order } from "@/models/Order";

const RECENT_ORDERS_LIMIT = 5;

type StatusCountRow = { _id: string; count: number };

function countForStatus(rows: StatusCountRow[], status: string): number {
  return rows.find((r) => r._id === status)?.count ?? 0;
}

export async function getAdminDashboardData(): Promise<AdminDashboardDto> {
  await connectDb();

  const [facetResult, recentRaw, attentionItems, storeDoc, monthMetrics] = await Promise.all([
    Order.aggregate<{
      total: Array<{ n: number }>;
      byStatus: StatusCountRow[];
      revenue: Array<{ _id: null; sum: number }>;
    }>([
      { $match: ADMIN_VISIBLE_ORDER_FILTER },
      {
        $facet: {
          total: [{ $count: "n" }],
          byStatus: [{ $group: { _id: "$status", count: { $sum: 1 } } }],
          revenue: [
            {
              $match: {
                status: "paid",
                commercialSnapshot: { $exists: true, $ne: null },
                "commercialSnapshot.totalAmountMinor": { $type: "number" },
              },
            },
            {
              $group: {
                _id: null,
                sum: { $sum: "$commercialSnapshot.totalAmountMinor" },
              },
            },
          ],
        },
      },
    ]),
    Order.find(ADMIN_VISIBLE_ORDER_FILTER)
      .sort({ createdAt: -1 })
      .limit(RECENT_ORDERS_LIMIT)
      .lean(),
    getDashboardAttentionItems(),
    loadStoreSettingsDocument(),
    fetchDashboardKpiMonthMetrics(),
  ]);

  const facet = facetResult[0];
  const totalOrders = facet?.total[0]?.n ?? 0;
  const byStatus = facet?.byStatus ?? [];
  const paidRevenueMinor = computePaidRevenueMinorFromAggregation(facet?.revenue);

  const { greeting, dateLabel } = buildAdminDashboardGreeting();

  const storeReadiness = storeDoc
    ? computeStoreSettingsReadiness({
        documentExists: true,
        pricing: storeDoc.pricing,
        shippingMethods: storeDoc.shippingMethods,
      })
    : null;

  const recentOrders = recentRaw
    .map((order) => buildAdminDashboardRecentOrderDto(order))
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const paymentPendingOrders = countForStatus(byStatus, "payment_pending");

  const totalOrdersTrend = computeMonthOverMonthTrend(
    monthMetrics.ordersCreatedCurrentMonth,
    monthMetrics.ordersCreatedPreviousMonth,
  );
  const revenueTrend = computeMonthOverMonthTrend(
    monthMetrics.paidRevenueMinorCurrentMonth,
    monthMetrics.paidRevenueMinorPreviousMonth,
  );

  return {
    greeting,
    dateLabel,
    subtitle: "סקירה מעודכנת של החנות וההזמנות במערכת.",
    kpis: {
      totalOrders,
      paidOrders: countForStatus(byStatus, "paid"),
      paymentPendingOrders,
      paidRevenueMinor,
      paidRevenueLabel: formatMinorToIlsDisplay(paidRevenueMinor),
      totalOrdersTrend,
      revenueTrend,
    },
    recentOrders,
    attentionItems,
    attentionCount: paymentPendingOrders,
    storeCheckoutReady: storeReadiness?.checkoutReady ?? null,
  };
}
