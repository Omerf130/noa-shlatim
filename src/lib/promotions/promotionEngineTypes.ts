export type PromotionRequirementForEngine = {
  magnetSizeId: string;
  quantity: number;
};

export type PromotionForEngine = {
  promotionId: string;
  internalName: string;
  bannerText: string;
  bundlePriceMinor: number;
  requirements: PromotionRequirementForEngine[];
};

export type PromotionApplicationInternal = {
  promotionId: string;
  internalName: string;
  bannerText: string;
  applicationCount: number;
};
