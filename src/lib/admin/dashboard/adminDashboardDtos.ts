import type {
  DashboardPaymentStatusPresentation,
  DashboardWorkflowStatusPresentation,
} from "@/lib/admin/dashboard/adminDashboardOrderPresentation";
import type { KpiTrendLine } from "@/lib/admin/dashboard/computeMonthOverMonthTrend";
import type { AdminOrderListItemDto } from "@/lib/admin/orders/adminOrderDtos";
import type { DashboardAttentionItemDto } from "@/lib/admin/dashboard/getDashboardAttentionItems";

export type AdminDashboardKpis = {
  totalOrders: number;
  paidOrders: number;
  paymentPendingOrders: number;
  paidRevenueMinor: number;
  paidRevenueLabel: string;
  totalOrdersTrend: KpiTrendLine;
  revenueTrend: KpiTrendLine;
};

export type AdminDashboardRecentOrderDto = AdminOrderListItemDto & {
  artworkThumbnailUrl: string | null;
  customerEmail: string | null;
  createdAtDateLine: string;
  createdAtTimeLine: string;
  paymentStatus: DashboardPaymentStatusPresentation;
  workflowStatus: DashboardWorkflowStatusPresentation;
};

export type AdminDashboardDto = {
  greeting: string;
  dateLabel: string;
  subtitle: string;
  kpis: AdminDashboardKpis;
  recentOrders: AdminDashboardRecentOrderDto[];
  attentionItems: DashboardAttentionItemDto[];
  attentionCount: number;
  storeCheckoutReady: boolean | null;
};
