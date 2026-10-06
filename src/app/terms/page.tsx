import { TermsDocument } from "@/components/legal/TermsDocument/TermsDocument";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { TERMS_PAGE_TITLE } from "@/lib/legal/terms";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: `${TERMS_PAGE_TITLE} | נועה`,
  description:
    "תקנון שימוש ורכישה באתר נועה שלטים לדלת — תנאי שימוש, הזמנה, משלוחים, עיצוב אישי ושירות לקוחות.",
};

export default async function TermsPage() {
  const content = await resolveSiteContent();
  const { global } = content;

  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header primaryCtaLabel={global.primaryCtaLabel} />
      <main id="main">
        <TermsDocument />
      </main>
      <Footer tagline={global.footerTagline} primaryCtaLabel={global.primaryCtaLabel} />
    </>
  );
}
