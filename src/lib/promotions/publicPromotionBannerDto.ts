export type PublicPromotionBannerItemDto = {
  bannerText: string;
};

export type PublicPromotionBannerDto = {
  items: PublicPromotionBannerItemDto[];
};

export type PromotionBannerSourceRow = {
  enabled: boolean;
  showInBanner: boolean;
  bannerText: string;
  bannerSortOrder: number;
  promotionId: string;
};

export function buildPublicPromotionBannerDtoFromRows(
  rows: PromotionBannerSourceRow[],
): PublicPromotionBannerDto {
  const items = rows
    .filter(
      (row) =>
        row.enabled &&
        row.showInBanner &&
        typeof row.bannerText === "string" &&
        row.bannerText.trim().length > 0,
    )
    .sort((a, b) => {
      const orderDiff = (a.bannerSortOrder ?? 0) - (b.bannerSortOrder ?? 0);
      if (orderDiff !== 0) {
        return orderDiff;
      }
      return a.promotionId.localeCompare(b.promotionId);
    })
    .map((row) => ({ bannerText: row.bannerText.trim() }));

  return { items };
}
