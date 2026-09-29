import { StoreSettingsForm } from "@/components/admin/store-settings/StoreSettingsForm";
import { getStoreSettingsForAdmin } from "@/lib/store/getStoreSettingsForAdmin";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "הגדרות חנות | פאנל ניהול",
};

export default async function AdminStoreSettingsPage() {
  const dto = await getStoreSettingsForAdmin();

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.heading}>הגדרות חנות</h1>
        <p className={styles.lead}>
          הגדרת תמחור ושיטות משלוח לשימוש עתידי בתשלום ובקופה. אין ברירות מחדל
          עסקיות.
        </p>
      </header>
      <StoreSettingsForm
        key={dto.updatedAtLabel ?? "initial"}
        dto={dto}
      />
    </div>
  );
}
