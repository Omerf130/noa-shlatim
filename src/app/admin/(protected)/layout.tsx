import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdminSession } from "@/lib/auth/session";

export default async function AdminProtectedLayout({
  children,
}: LayoutProps<"/admin">) {
  const admin = await requireAdminSession();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
