import { PrivacyDocument } from "@/components/legal/PrivacyDocument/PrivacyDocument";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { PRIVACY_PAGE_TITLE } from "@/lib/legal/privacy";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${PRIVACY_PAGE_TITLE} | נועה`,
  description:
    "מדיניות פרטיות באתר נועה שלטים לדלת: איזה מידע נאסף, שימוש בתמונות ובינה מלאכותית, תשלומים ויצירת קשר.",
};

export default async function PrivacyPage() {
  const content = await resolveSiteContent();
  const { global } = content;

  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header primaryCtaLabel={global.primaryCtaLabel} />
      <main id="main">
        <PrivacyDocument />
      </main>
      <Footer tagline={global.footerTagline} primaryCtaLabel={global.primaryCtaLabel} />
    </>
  );
}
