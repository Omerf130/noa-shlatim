import { getBackgroundById } from "@/data/signBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import { formatDecorationSummary } from "@/lib/admin/orders/decorationSummary";
import { adminOrderAssetApiPath } from "@/lib/admin/orders/adminOrderAssets";
import {
  customerDisplayName,
  formatAdminDateTime,
  formatOrderReference,
  materialLabelFromSnapshot,
} from "@/lib/admin/orders/formatOrderReference";
import {
  buildPersistedSignPreviewProps,
} from "@/lib/orders/persistedOrderSignPreview";
import {
  photoOrderDesignSchema,
  type PhotoOrderDesignSnapshot,
} from "@/lib/orders/orderDesignSchema";
import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { SignDesignState } from "@/types/signDesign";

export const DESIGN_PREVIEW_UNAVAILABLE_MESSAGE =
  "לא ניתן לשחזר את תצוגת העיצוב מהנתונים השמורים.";

export type AdminOrderListItemDto = {
  orderId: string;
  orderReference: string;
  statusLabel: "טיוטה";
  createdAtLabel: string;
  materialLabel: string;
  customerDisplayName: string;
  customerPhone: string | null;
  detailHref: string;
};

export type AdminOrderListPageDto = {
  items: AdminOrderListItemDto[];
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
};

export type AdminOrderDesignPreviewDto = {
  design: SignDesignState;
  integratedFinalPreview: IntegratedFinalPreviewConfig;
  materialLabel: string;
  backgroundName: string;
  styleName: string | null;
  signText: string;
  decorationSummary: string;
};

export type AdminOrderDetailDto = {
  orderId: string;
  orderReference: string;
  statusLabel: "טיוטה";
  createdAtLabel: string;
  updatedAtLabel: string;
  customer: {
    fullName: string | null;
    phone: string | null;
    email: string | null;
  };
  customerNotes: string;
  designPreview: AdminOrderDesignPreviewDto | null;
  designPreviewUnavailableMessage: string | null;
  productionAssets: {
    originalImageUrl: string | null;
    artworkUrl: string | null;
  };
};

type OrderLeanForAdmin = {
  _id: { toString(): string };
  status: string;
  creationMode: string;
  design: unknown;
  customer?: { fullName?: string; phone?: string; email?: string };
  notes?: string;
  assets?: {
    originalImage?: unknown;
    finalArtwork?: unknown;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

function parseDesignSnapshot(raw: unknown): PhotoOrderDesignSnapshot | null {
  const parsed = photoOrderDesignSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const design = parsed.data;
  const background = getBackgroundById(design.backgroundId);
  if (!background?.active) {
    return null;
  }
  return design;
}

export function buildAdminOrderListItemDto(
  order: OrderLeanForAdmin,
): AdminOrderListItemDto | null {
  if (order.status !== "draft" || order.creationMode !== "photo") {
    return null;
  }

  const orderId = order._id.toString();
  const design = parseDesignSnapshot(order.design);

  return {
    orderId,
    orderReference: formatOrderReference(orderId),
    statusLabel: "טיוטה",
    createdAtLabel: formatAdminDateTime(order.createdAt),
    materialLabel: materialLabelFromSnapshot(design?.material),
    customerDisplayName: customerDisplayName(order.customer),
    customerPhone: order.customer?.phone?.trim() || null,
    detailHref: `/admin/orders/${orderId}`,
  };
}

export function buildAdminOrderDetailDto(order: OrderLeanForAdmin): AdminOrderDetailDto {
  const orderId = order._id.toString();
  const design = parseDesignSnapshot(order.design);
  const artworkUrl = adminOrderAssetApiPath(orderId, "artwork");
  const originalUrl = order.assets?.originalImage
    ? adminOrderAssetApiPath(orderId, "original")
    : null;

  let designPreview: AdminOrderDesignPreviewDto | null = null;
  let designPreviewUnavailableMessage: string | null = null;

  if (design) {
    const previewProps = buildPersistedSignPreviewProps(design, artworkUrl);
    designPreview = {
      ...previewProps,
      materialLabel: materialLabelFromSnapshot(design.material),
      backgroundName: getBackgroundById(design.backgroundId)?.name ?? "—",
      styleName:
        getIllustrationStyleById(design.photoIllustrationStyleId)?.name ?? null,
      signText: design.text.value,
      decorationSummary: formatDecorationSummary(design.decorations),
    };
  } else {
    designPreviewUnavailableMessage = DESIGN_PREVIEW_UNAVAILABLE_MESSAGE;
  }

  return {
    orderId,
    orderReference: formatOrderReference(orderId),
    statusLabel: "טיוטה",
    createdAtLabel: formatAdminDateTime(order.createdAt),
    updatedAtLabel: formatAdminDateTime(order.updatedAt),
    customer: {
      fullName: order.customer?.fullName?.trim() || null,
      phone: order.customer?.phone?.trim() || null,
      email: order.customer?.email?.trim() || null,
    },
    customerNotes: order.notes?.trim() ?? "",
    designPreview,
    designPreviewUnavailableMessage,
    productionAssets: {
      originalImageUrl: originalUrl,
      artworkUrl: order.assets?.finalArtwork ? artworkUrl : null,
    },
  };
}

export function clampListPageParams(pageRaw: unknown, limitRaw: unknown): {
  page: number;
  limit: number;
} {
  const DEFAULT_LIMIT = 20;
  const MAX_LIMIT = 50;
  let page = Number(pageRaw);
  if (!Number.isFinite(page) || page < 1) {
    page = 1;
  }
  page = Math.floor(page);

  let limit = Number(limitRaw);
  if (!Number.isFinite(limit) || limit < 1) {
    limit = DEFAULT_LIMIT;
  }
  limit = Math.min(MAX_LIMIT, Math.floor(limit));

  return { page, limit };
}
