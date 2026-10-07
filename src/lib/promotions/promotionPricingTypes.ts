export type AppliedPromotionDisplay = {
  customerLabel: string;
  applicationCount: number;
  savingsMinor: number;
  savingsLabel: string;
};

export type FrozenPromotionApplication = {
  promotionId: string;
  internalName: string;
  customerLabel: string;
  applicationCount: number;
  savingsMinor: number;
};

export type PromotionOptimizationResult = {
  catalogSubtotalMinor: number;
  discountMinor: number;
  productTotalMinor: number;
  applications: AppliedPromotionDisplay[];
  frozenApplications: FrozenPromotionApplication[];
  promotionMessage: string | null;
  /** True when search space exceeded — catalog-only pricing used. */
  optimizationFallback: boolean;
};
