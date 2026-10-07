import { CartPageClient } from "@/components/cart/CartPageClient";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { getCartDetailForRequest } from "@/lib/cart/getCartDetailForRequest";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "הסל | נועה",
  description: "סל הקניות — שלטים מותאמים אישית לפני המשך להזמנה.",
};

export const dynamic = "force-dynamic";

export default async function CartPage() {
  const [content, initialDetail] = await Promise.all([
    resolveSiteContent(),
    getCartDetailForRequest(),
  ]);
  const { global } = content;

  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header primaryCtaLabel={global.primaryCtaLabel} />
      <main id="main" className={styles.main}>
        <div className={styles.inner}>
          <header className={styles.pageHeader}>
            <h1 className={styles.title}>הסל</h1>
          </header>
          <CartPageClient initialDetail={initialDetail} />
        </div>
      </main>
      <Footer tagline={global.footerTagline} primaryCtaLabel={global.primaryCtaLabel} />
    </>
  );
}
