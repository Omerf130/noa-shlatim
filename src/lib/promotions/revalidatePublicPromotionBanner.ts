import { PUBLIC_PROMOTION_BANNER_CACHE_TAG } from "@/lib/promotions/loadPublicPromotionBanner";
import { revalidatePath, revalidateTag } from "next/cache";

/** Call after Admin Promotion banner-related changes. */
export function revalidatePublicPromotionBannerSurfaces(): void {
  revalidateTag(PUBLIC_PROMOTION_BANNER_CACHE_TAG, "max");
  revalidatePath("/");
  revalidatePath("/create");
  revalidatePath("/cart");
  revalidatePath("/terms");
  revalidatePath("/privacy");
}
