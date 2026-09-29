import { AdminOrderDetailContent } from "@/components/admin/orders/AdminOrderDetailContent";
import { getAdminOrderDetail } from "@/lib/admin/orders/getAdminOrderDetail";
import Link from "next/link";
import { notFound } from "next/navigation";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

type OrderDetailPageProps = {
  params: Promise<{ orderId: string }>;
};

export default async function AdminOrderDetailPage({ params }: OrderDetailPageProps) {
  const { orderId } = await params;
  const dto = await getAdminOrderDetail(orderId);

  if (!dto) {
    notFound();
  }

  return (
    <div className={styles.page}>
      <Link href="/admin/orders" className={styles.back}>
        ← חזרה להזמנות
      </Link>
      <AdminOrderDetailContent dto={dto} />
    </div>
  );
}
