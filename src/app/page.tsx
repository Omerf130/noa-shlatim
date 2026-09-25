import { BenefitsStrip } from "@/components/home/BenefitsStrip/BenefitsStrip";
import { EmotionalCtaSection } from "@/components/home/EmotionalCtaSection/EmotionalCtaSection";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection/HowItWorksSection";
import { IllustrationStylesSection } from "@/components/home/IllustrationStylesSection/IllustrationStylesSection";
import { MaterialsSection } from "@/components/home/MaterialsSection/MaterialsSection";
import { CustomerExamplesSection } from "@/components/home/CustomerExamplesSection/CustomerExamplesSection";
import { SignExamplesSection } from "@/components/home/SignExamplesSection/SignExamplesSection";
import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";

export default function HomePage() {
  return (
    <>
      <a href="#main" className="skip-link">
        דלג לתוכן
      </a>
      <Header />
      <main id="main">
        <HeroSection />
        <HowItWorksSection />
        <IllustrationStylesSection />
        <SignExamplesSection />
        <CustomerExamplesSection />
        <MaterialsSection />
        <EmotionalCtaSection />
        <BenefitsStrip />
      </main>
      <Footer />
    </>
  );
}
