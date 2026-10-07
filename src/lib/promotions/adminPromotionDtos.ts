import { formatMinorToIlsDisplay, formatMinorToIlsInput } from "@/lib/money/ils";
import {
  computeRequirementsCatalogTotalMinor,
  promotionPriceWarning,
  requirementCatalogStatus,
  type PromotionRequirement,
} from "@/lib/promotions/promotionSchema";
import { connectDb } from "@/lib/db/connect";
import { loadStoreSettingsDocument } from "@/lib/store/loadStoreSettings";
import { Promotion, type PromotionDocument } from "@/models/Promotion";
import type { StoreMagnetSize } from "@/models/StoreSettings";

export type AdminMagnetSizeOptionDto = {
  id: string;
  label: string;
  enabled: boolean;
};

export type AdminPromotionRequirementRowDto = {
  magnetSizeId: string;
  sizeLabel: string;
  quantity: number;
  catalogStatus: "ok" | "disabled" | "missing";
  catalogStatusMessage: string | null;
};

export type AdminPromotionListItemDto = {
  promotionId: string;
  internalName: string;
  enabled: boolean;
  showInBanner: boolean;
  bannerSortOrder: number;
  bundlePriceLabel: string;
  ruleSummary: string;
  requirementsValid: boolean;
  editHref: string;
};

export type AdminPromotionEditorDto = {
  mode: "create" | "edit";
  promotionId: string | null;
  internalName: string;
  bundlePriceIls: string;
  enabled: boolean;
  showInBanner: boolean;
  bannerText: string;
  bannerSortOrder: number;
  requirements: Array<{ magnetSizeId: string; quantity: number }>;
  requirementRows: AdminPromotionRequirementRowDto[];
  priceWarning: string | null;
  magnetSizeOptions: AdminMagnetSizeOptionDto[];
};

export type AdminPromotionsListPageDto = {
  items: AdminPromotionListItemDto[];
  canCreate: boolean;
  createBlockedMessage: string | null;
};

function magnetSizeLabel(size: StoreMagnetSize): string {
  const name = size.name?.trim() || "מגנט";
  const dims = size.dimensionsLabel?.trim();
  return dims ? `${name} (${dims})` : name;
}

function buildRuleSummary(
  requirements: PromotionRequirement[],
  sizes: StoreMagnetSize[],
): string {
  const parts = requirements.map((req) => {
    const size = sizes.find((s) => s.id === req.magnetSizeId);
    const label = size ? magnetSizeLabel(size) : "גודל לא זמין";
    return `${label} × ${req.quantity}`;
  });
  return parts.join(" + ");
}

function requirementsFullyValid(
  requirements: PromotionRequirement[],
  sizes: StoreMagnetSize[],
): boolean {
  return requirements.every(
    (req) => requirementCatalogStatus(req.magnetSizeId, sizes).status === "ok",
  );
}

function buildRequirementRows(
  requirements: PromotionRequirement[],
  sizes: StoreMagnetSize[],
): AdminPromotionRequirementRowDto[] {
  return requirements.map((req) => {
    const size = sizes.find((s) => s.id === req.magnetSizeId);
    const status = requirementCatalogStatus(req.magnetSizeId, sizes);
    let catalogStatusMessage: string | null = null;
    if (status.status === "disabled") {
      catalogStatusMessage = `גודל «${status.sizeName}» מושבת או ללא מחיר — המבצע לא יחול עד לתיקון.`;
    } else if (status.status === "missing") {
      catalogStatusMessage = "גודל המגנט הוסר מהגדרות החנות — יש לעדכן את המבצע.";
    }
    return {
      magnetSizeId: req.magnetSizeId,
      sizeLabel: size ? magnetSizeLabel(size) : "גודל חסר",
      quantity: req.quantity,
      catalogStatus: status.status,
      catalogStatusMessage,
    };
  });
}

function magnetSizeOptionsFromStore(sizes: StoreMagnetSize[]): AdminMagnetSizeOptionDto[] {
  return [...sizes]
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    .map((size) => ({
      id: size.id,
      label: magnetSizeLabel(size),
      enabled: Boolean(size.enabled),
    }));
}

function docToListItem(
  doc: PromotionDocument,
  sizes: StoreMagnetSize[],
): AdminPromotionListItemDto {
  const requirements = doc.requirements as PromotionRequirement[];
  return {
    promotionId: doc.promotionId,
    internalName: doc.internalName,
    enabled: doc.enabled,
    showInBanner: doc.showInBanner,
    bannerSortOrder: doc.bannerSortOrder,
    bundlePriceLabel: formatMinorToIlsDisplay(doc.bundlePriceMinor),
    ruleSummary: buildRuleSummary(requirements, sizes),
    requirementsValid: requirementsFullyValid(requirements, sizes),
    editHref: `/admin/promotions/${doc.promotionId}`,
  };
}

export async function getAdminPromotionsListPageDto(): Promise<AdminPromotionsListPageDto> {
  await connectDb();
  const settings = await loadStoreSettingsDocument();
  const sizes = settings?.magnetSizes ?? [];
  const canCreate = sizes.length > 0;

  const docs = await Promotion.find()
    .sort({ bannerSortOrder: 1, internalName: 1 })
    .lean<PromotionDocument[]>();

  return {
    items: docs.map((doc) => docToListItem(doc, sizes)),
    canCreate,
    createBlockedMessage: canCreate
      ? null
      : "יש להגדיר גדלי מגנט ב«חומרים» לפני יצירת מבצעים.",
  };
}

export async function getAdminPromotionEditorDto(params: {
  promotionId: string | null;
}): Promise<AdminPromotionEditorDto | null> {
  await connectDb();
  const settings = await loadStoreSettingsDocument();
  const sizes = settings?.magnetSizes ?? [];
  const magnetSizeOptions = magnetSizeOptionsFromStore(sizes);

  if (!params.promotionId) {
    const firstSizeId = magnetSizeOptions[0]?.id ?? "";
    return {
      mode: "create",
      promotionId: null,
      internalName: "",
      bundlePriceIls: "",
      enabled: false,
      showInBanner: false,
      bannerText: "",
      bannerSortOrder: 0,
      requirements: firstSizeId
        ? [{ magnetSizeId: firstSizeId, quantity: 1 }]
        : [],
      requirementRows: [],
      priceWarning: null,
      magnetSizeOptions,
    };
  }

  const doc = await Promotion.findOne({ promotionId: params.promotionId }).lean<PromotionDocument>();
  if (!doc) {
    return null;
  }

  const requirements = doc.requirements as PromotionRequirement[];
  const catalog = computeRequirementsCatalogTotalMinor({
    requirements,
    persistedMagnetSizes: sizes,
  });
  const catalogTotal = catalog.ok ? catalog.totalMinor : null;

  return {
    mode: "edit",
    promotionId: doc.promotionId,
    internalName: doc.internalName,
    bundlePriceIls: formatMinorToIlsInput(doc.bundlePriceMinor),
    enabled: doc.enabled,
    showInBanner: doc.showInBanner,
    bannerText: doc.bannerText ?? "",
    bannerSortOrder: doc.bannerSortOrder,
    requirements: requirements.map((r) => ({
      magnetSizeId: r.magnetSizeId,
      quantity: r.quantity,
    })),
    requirementRows: buildRequirementRows(requirements, sizes),
    priceWarning: promotionPriceWarning(doc.bundlePriceMinor, catalogTotal),
    magnetSizeOptions,
  };
}

export function buildRequirementRowsForForm(
  requirements: PromotionRequirement[],
  sizes: StoreMagnetSize[],
): AdminPromotionRequirementRowDto[] {
  return buildRequirementRows(requirements, sizes);
}
