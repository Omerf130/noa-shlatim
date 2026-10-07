import { BenefitsStrip } from "@/components/home/BenefitsStrip/BenefitsStrip";
import { EmotionalCtaSection } from "@/components/home/EmotionalCtaSection/EmotionalCtaSection";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection/HowItWorksSection";
import { CustomerExamplesSection } from "@/components/home/CustomerExamplesSection/CustomerExamplesSection";
import { SignExamplesSection } from "@/components/home/SignExamplesSection/SignExamplesSection";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { resolveSiteContent } from "@/lib/siteContent/resolveSiteContent";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const content = await resolveSiteContent();
  return {
    title: content.seo.homeTitle,
    description: content.seo.homeDescription,
  };
}

export default async function HomePage() {
  const content = await resolveSiteContent();
  const { global, home } = content;

  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header primaryCtaLabel={global.primaryCtaLabel} />
      <main id="main">
        <HeroSection hero={home.hero} primaryCtaLabel={global.primaryCtaLabel} />
        <HowItWorksSection content={home.howItWorks} />
        <SignExamplesSection content={home.signExamples} />
        <CustomerExamplesSection content={home.customerExamples} />
        <EmotionalCtaSection
          content={home.emotionalCta}
          primaryCtaLabel={global.primaryCtaLabel}
        />
        <BenefitsStrip />
      </main>
      <Footer tagline={global.footerTagline} primaryCtaLabel={global.primaryCtaLabel} />
    </>
  );
}
