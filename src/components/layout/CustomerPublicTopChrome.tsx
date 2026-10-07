import { Header } from "@/components/layout/Header/Header";
import { PromotionBannerServer } from "@/components/promotions/PromotionBannerServer";

type CustomerPublicTopChromeProps = {
  primaryCtaLabel: string;
};

export async function CustomerPublicTopChrome({
  primaryCtaLabel,
}: CustomerPublicTopChromeProps) {
  return (
    <>
      <PromotionBannerServer />
      <Header primaryCtaLabel={primaryCtaLabel} />
    </>
  );
}
