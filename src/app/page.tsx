import { Footer } from "@/components/layout/Footer/Footer";
import { Header } from "@/components/layout/Header/Header";
import { DesignsPreviewSection } from "@/components/home/DesignsPreviewSection/DesignsPreviewSection";
import { FinalCtaSection } from "@/components/home/FinalCtaSection/FinalCtaSection";
import { HeroSection } from "@/components/home/HeroSection/HeroSection";
import { HowItWorksSection } from "@/components/home/HowItWorksSection/HowItWorksSection";
import { MaterialsSection } from "@/components/home/MaterialsSection/MaterialsSection";
import { TwoWaysSection } from "@/components/home/TwoWaysSection/TwoWaysSection";

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
        <TwoWaysSection />
        <DesignsPreviewSection />
        <MaterialsSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  );
}
