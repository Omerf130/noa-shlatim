import { AdminBackgroundsView } from "@/components/admin/backgrounds/AdminBackgroundsView";
import { getAdminBackgroundsPageDto } from "@/lib/backgrounds/adminBackgroundsDto";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "רקעים | פאנל ניהול",
};

export default async function AdminBackgroundsPage() {
  const backgrounds = await getAdminBackgroundsPageDto();

  return (
    <div className={styles.page}>
      <AdminBackgroundsView initialBackgrounds={backgrounds} />
    </div>
  );
}
