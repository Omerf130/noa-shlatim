import { AdminMaterialsCards } from "@/components/admin/materials/AdminMaterialsCards";
import { getAdminMaterialsPageDto } from "@/lib/store/adminMaterialsDto";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "חומרים | פאנל ניהול",
};

export default async function AdminMaterialsPage() {
  const dto = await getAdminMaterialsPageDto();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>חומרים</h1>
        <p className={styles.lead}>בחירת החומרים הזמינים ללקוחות</p>
      </header>
      <AdminMaterialsCards dto={dto} />
    </div>
  );
}
