import { israelMonthRangeUtc } from "@/lib/admin/dashboard/israelMonthBounds";
import { ADMIN_VISIBLE_ORDER_FILTER } from "@/lib/admin/orders/adminOrderQueryFilter";
import { Order } from "@/models/Order";

export type DashboardKpiMonthMetrics = {
  ordersCreatedCurrentMonth: number;
  ordersCreatedPreviousMonth: number;
  paidRevenueMinorCurrentMonth: number;
  paidRevenueMinorPreviousMonth: number;
};

const paidRevenueMatch = {
  status: "paid" as const,
  commercialSnapshot: { $exists: true, $ne: null },
  "commercialSnapshot.totalAmountMinor": { $type: "number" as const },
};

async function sumPaidRevenueMinorInRange(start: Date, end: Date): Promise<number> {
  const rows = await Order.aggregate<{ sum: number }>([
    {
      $match: {
        ...ADMIN_VISIBLE_ORDER_FILTER,
        ...paidRevenueMatch,
        updatedAt: { $gte: start, $lt: end },
      },
    },
    { $group: { _id: null, sum: { $sum: "$commercialSnapshot.totalAmountMinor" } } },
  ]);
  const sum = rows[0]?.sum;
  return Number.isFinite(sum) ? Math.trunc(sum) : 0;
}

export async function fetchDashboardKpiMonthMetrics(
  reference: Date = new Date(),
): Promise<DashboardKpiMonthMetrics> {
  const current = israelMonthRangeUtc(reference, 0);
  const previous = israelMonthRangeUtc(reference, 1);

  const orderFilter = ADMIN_VISIBLE_ORDER_FILTER;

  const [
    ordersCreatedCurrentMonth,
    ordersCreatedPreviousMonth,
    paidRevenueMinorCurrentMonth,
    paidRevenueMinorPreviousMonth,
  ] = await Promise.all([
    Order.countDocuments({
      ...orderFilter,
      createdAt: { $gte: current.startInclusive, $lt: current.endExclusive },
    }),
    Order.countDocuments({
      ...orderFilter,
      createdAt: { $gte: previous.startInclusive, $lt: previous.endExclusive },
    }),
    sumPaidRevenueMinorInRange(current.startInclusive, current.endExclusive),
    sumPaidRevenueMinorInRange(previous.startInclusive, previous.endExclusive),
  ]);

  return {
    ordersCreatedCurrentMonth,
    ordersCreatedPreviousMonth,
    paidRevenueMinorCurrentMonth,
    paidRevenueMinorPreviousMonth,
  };
}
