import { PromotionBanner } from "@/components/promotions/PromotionBanner";
import { loadPublicPromotionBannerDto } from "@/lib/promotions/loadPublicPromotionBanner";

export async function PromotionBannerServer() {
  const dto = await loadPublicPromotionBannerDto();
  return <PromotionBanner dto={dto} />;
}
