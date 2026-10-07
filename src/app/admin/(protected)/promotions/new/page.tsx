import { AdminPromotionForm } from "@/components/admin/promotions/AdminPromotionForm";
import { getAdminPromotionEditorDto } from "@/lib/promotions/adminPromotionDtos";
import { redirect } from "next/navigation";
import styles from "../page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "מבצע חדש | פאנל ניהול",
};

export default async function AdminNewPromotionPage() {
  const dto = await getAdminPromotionEditorDto({ promotionId: null });
  if (!dto) {
    redirect("/admin/promotions");
  }

  return (
    <div className={styles.page}>
      <AdminPromotionForm dto={dto} />
    </div>
  );
}
