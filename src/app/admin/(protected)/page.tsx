import { AdminDashboardView } from "@/components/admin/dashboard/AdminDashboardView";
import { getAdminDashboardData } from "@/lib/admin/dashboard/getAdminDashboardData";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "דשבורד | פאנל ניהול",
};

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  return <AdminDashboardView data={data} />;
}
