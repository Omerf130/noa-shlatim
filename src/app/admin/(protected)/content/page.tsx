import { AdminSiteContentView } from "@/components/admin/content/AdminSiteContentView";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import styles from "./page.module.scss";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "תוכן האתר | פאנל ניהול",
};

export default async function AdminContentPage() {
  const content = await resolveSiteContent();

  return (
    <div className={styles.page}>
      <AdminSiteContentView initialContent={content} />
    </div>
  );
}
