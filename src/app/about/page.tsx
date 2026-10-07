import { AboutStoryPage } from "@/components/about/AboutStoryPage";
import { CustomerPublicTopChrome } from "@/components/layout/CustomerPublicTopChrome";
import { Footer } from "@/components/layout/Footer/Footer";
import {
  ABOUT_PAGE_METADATA_DESCRIPTION,
  ABOUT_PAGE_METADATA_TITLE,
} from "@/lib/about/aboutPageContent";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: ABOUT_PAGE_METADATA_TITLE,
  description: ABOUT_PAGE_METADATA_DESCRIPTION,
};

export default async function AboutPage() {
  const content = await resolveSiteContent();
  const { global } = content;

  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <CustomerPublicTopChrome primaryCtaLabel={global.primaryCtaLabel} />
      <main id="main">
        <AboutStoryPage />
      </main>
      <Footer tagline={global.footerTagline} primaryCtaLabel={global.primaryCtaLabel} />
    </>
  );
}
