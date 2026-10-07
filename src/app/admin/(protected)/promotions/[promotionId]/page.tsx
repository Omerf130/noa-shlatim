import { AdminPromotionForm } from "@/components/admin/promotions/AdminPromotionForm";
import { getAdminPromotionEditorDto } from "@/lib/promotions/adminPromotionDtos";
import { notFound } from "next/navigation";
import styles from "../page.module.scss";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ promotionId: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { promotionId } = await params;
  return {
    title: `עריכת מבצע | פאנל ניהול`,
    description: promotionId,
  };
}

export default async function AdminEditPromotionPage({ params }: PageProps) {
  const { promotionId } = await params;
  const dto = await getAdminPromotionEditorDto({ promotionId });
  if (!dto || dto.mode !== "edit") {
    notFound();
  }

  return (
    <div className={styles.page}>
      <AdminPromotionForm dto={dto} />
    </div>
  );
}
