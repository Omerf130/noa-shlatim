import { AdminPromotionsList } from "@/components/admin/promotions/AdminPromotionsList";
import { getAdminPromotionsListPageDto } from "@/lib/promotions/adminPromotionDtos";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "מבצעים | פאנל ניהול",
};

export default async function AdminPromotionsPage() {
  const dto = await getAdminPromotionsListPageDto();

  return (
    <div className={styles.page}>
      <AdminPromotionsList dto={dto} />
    </div>
  );
}
