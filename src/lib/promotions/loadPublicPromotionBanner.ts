import { connectDb } from "@/lib/db/connect";
import {
  buildPublicPromotionBannerDtoFromRows,
  type PublicPromotionBannerDto,
  type PromotionBannerSourceRow,
} from "@/lib/promotions/publicPromotionBannerDto";
import { Promotion } from "@/models/Promotion";
import { unstable_cache } from "next/cache";

export const PUBLIC_PROMOTION_BANNER_CACHE_TAG = "promotion-public-banner";

async function loadPublicPromotionBannerDtoUncached(): Promise<PublicPromotionBannerDto> {
  await connectDb();
  const docs = await Promotion.find({
    enabled: true,
    showInBanner: true,
  })
    .select("enabled showInBanner bannerText bannerSortOrder promotionId")
    .lean();

  const rows: PromotionBannerSourceRow[] = docs.map((doc) => ({
    enabled: Boolean(doc.enabled),
    showInBanner: Boolean(doc.showInBanner),
    bannerText: String(doc.bannerText ?? ""),
    bannerSortOrder: Number(doc.bannerSortOrder ?? 0),
    promotionId: String(doc.promotionId ?? "").trim(),
  }));

  return buildPublicPromotionBannerDtoFromRows(rows);
}

export const loadPublicPromotionBannerDto = unstable_cache(
  loadPublicPromotionBannerDtoUncached,
  ["load-public-promotion-banner-dto"],
  {
    tags: [PUBLIC_PROMOTION_BANNER_CACHE_TAG],
    revalidate: 60,
  },
);
