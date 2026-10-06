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
import { isAllowedStyleId } from "@/lib/ai/illustrationPrompts";
import {
  orderDesignSchema,
  type OrderDesignSnapshot,
} from "@/lib/orders/orderDesignSchema";
import { orderCommercialSnapshotSchema } from "@/lib/orders/commercialSnapshot";
import { formatMinorToIlsDisplay } from "@/lib/money/ils";
import type { IntegratedFinalPreviewConfig } from "@/components/builder/SignPreview/SignPreview";
import type { SignDesignState } from "@/types/signDesign";
import type { OrderStatus } from "@/models/Order";

export const DESIGN_PREVIEW_UNAVAILABLE_MESSAGE =
  "לא ניתן לשחזר את תצוגת העיצוב מהנתונים השמורים.";

export type AdminOrderStatusKey = OrderStatus;

export type AdminOrderStatusLabel =
  | "טיוטה"
  | "ממתין לתשלום"
  | "שולם"
  | "בהכנה";

export function adminOrderStatusLabel(status: string): AdminOrderStatusLabel | "—" {
  switch (status) {
    case "draft":
      return "טיוטה";
    case "payment_pending":
      return "ממתין לתשלום";
    case "paid":
      return "שולם";
    case "creating":
      return "בהכנה";
    default:
      return "—";
  }
}

export type AdminOrderListItemDto = {
  orderId: string;
  orderReference: string;
  statusKey: AdminOrderStatusKey;
  statusLabel: AdminOrderStatusLabel | "—";
  createdAtLabel: string;
  materialLabel: string;
  totalLabel: string | null;
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

export type AdminCreationMode = "photo" | "illustration";

export function adminCreationModeLabel(mode: AdminCreationMode): string {
  return mode === "photo" ? "תמונה" : "איור קיים";
}

export type AdminOrderPaymentSummaryDto = {
  statusLabel: AdminOrderStatusLabel | "—";
  productAmountLabel: string;
  shippingMethodLabel: string;
  shippingAmountLabel: string;
  totalLabel: string;
  currency: string;
  capturedAtLabel: string;
  termsVersion: string;
  termsAcceptedAtLabel: string;
  payplusTransactionUid: string | null;
  paymentCompletedAtLabel: string | null;
};

export type AdminOrderDetailDto = {
  orderId: string;
  orderReference: string;
  creationMode: AdminCreationMode;
  creationModeLabel: string;
  statusKey: AdminOrderStatusKey;
  statusLabel: AdminOrderStatusLabel | "—";
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
  paymentSummary: AdminOrderPaymentSummaryDto | null;
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
  commercialSnapshot?: unknown;
  termsAcceptance?: {
    termsVersion?: string;
    termsAcceptedAt?: string;
  };
  payment?: {
    attempts?: Array<{
      status?: string;
      payplusTransactionUid?: string;
      completedAt?: string;
    }>;
  };
  createdAt?: Date;
  updatedAt?: Date;
};

const ADMIN_LIST_STATUSES = ["draft", "payment_pending", "paid", "creating"] as const;

export function isAdminVisibleOrderStatus(status: string): status is (typeof ADMIN_LIST_STATUSES)[number] {
  return (ADMIN_LIST_STATUSES as readonly string[]).includes(status);
}

function parseDesignSnapshot(raw: unknown): OrderDesignSnapshot | null {
  const parsed = orderDesignSchema.safeParse(raw);
  if (!parsed.success) {
    return null;
  }
  const design = parsed.data;
  const background = getBackgroundById(design.backgroundId);
  if (!background?.active) {
    return null;
  }
  if (
    design.creationMode === "photo" &&
    !isAllowedStyleId(design.photoIllustrationStyleId)
  ) {
    return null;
  }
  return design;
}

function styleNameFromOrderDesign(design: OrderDesignSnapshot): string | null {
  if (design.creationMode !== "photo") {
    return null;
  }
  return getIllustrationStyleById(design.photoIllustrationStyleId)?.name ?? null;
}

function totalLabelFromSnapshot(commercialSnapshot: unknown): string | null {
  const parsed = orderCommercialSnapshotSchema.safeParse(commercialSnapshot);
  if (!parsed.success) {
    return null;
  }
  return formatMinorToIlsDisplay(parsed.data.totalAmountMinor);
}

function materialLabelForOrder(order: OrderLeanForAdmin, design: OrderDesignSnapshot | null): string {
  const snapshotMat = orderCommercialSnapshotSchema.safeParse(order.commercialSnapshot);
  if (snapshotMat.success) {
    return materialLabelFromSnapshot(snapshotMat.data.material);
  }
  return materialLabelFromSnapshot(design?.material);
}

function findSucceededPaymentAttempt(order: OrderLeanForAdmin) {
  return order.payment?.attempts?.find((a) => a.status === "succeeded") ?? null;
}

export function buildAdminOrderPaymentSummaryDto(
  order: OrderLeanForAdmin,
): AdminOrderPaymentSummaryDto | null {
  if (order.status !== "payment_pending" && order.status !== "paid") {
    return null;
  }

  const snapshotParsed = orderCommercialSnapshotSchema.safeParse(order.commercialSnapshot);
  if (!snapshotParsed.success) {
    return null;
  }
  const snapshot = snapshotParsed.data;
  const terms = order.termsAcceptance;
  const succeeded = findSucceededPaymentAttempt(order);

  return {
    statusLabel: adminOrderStatusLabel(order.status),
    productAmountLabel: formatMinorToIlsDisplay(snapshot.productAmountMinor),
    shippingMethodLabel: snapshot.shippingLabel,
    shippingAmountLabel: formatMinorToIlsDisplay(snapshot.shippingAmountMinor),
    totalLabel: formatMinorToIlsDisplay(snapshot.totalAmountMinor),
    currency: snapshot.currency,
    capturedAtLabel: formatAdminDateTime(snapshot.capturedAt),
    termsVersion: terms?.termsVersion?.trim() || "—",
    termsAcceptedAtLabel: terms?.termsAcceptedAt
      ? formatAdminDateTime(terms.termsAcceptedAt)
      : "—",
    payplusTransactionUid: succeeded?.payplusTransactionUid?.trim() || null,
    paymentCompletedAtLabel: succeeded?.completedAt
      ? formatAdminDateTime(succeeded.completedAt)
      : null,
  };
}

export function buildAdminOrderListItemDto(
  order: OrderLeanForAdmin,
): AdminOrderListItemDto | null {
  const mode = order.creationMode;
  if (
    !isAdminVisibleOrderStatus(order.status) ||
    (mode !== "photo" && mode !== "illustration")
  ) {
    return null;
  }

  const orderId = order._id.toString();
  const design = parseDesignSnapshot(order.design);

  return {
    orderId,
    orderReference: formatOrderReference(orderId),
    statusKey: order.status as AdminOrderStatusKey,
    statusLabel: adminOrderStatusLabel(order.status),
    createdAtLabel: formatAdminDateTime(order.createdAt),
    materialLabel: materialLabelForOrder(order, design),
    totalLabel: totalLabelFromSnapshot(order.commercialSnapshot),
    customerDisplayName: customerDisplayName(order.customer),
    customerPhone: order.customer?.phone?.trim() || null,
    detailHref: `/admin/orders/${orderId}`,
  };
}

export function buildAdminOrderDetailDto(order: OrderLeanForAdmin): AdminOrderDetailDto {
  const orderId = order._id.toString();
  const creationMode = order.creationMode as AdminCreationMode;
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
      styleName: styleNameFromOrderDesign(design),
      signText: design.text.value,
      decorationSummary: formatDecorationSummary(design.decorations),
    };
  } else {
    designPreviewUnavailableMessage = DESIGN_PREVIEW_UNAVAILABLE_MESSAGE;
  }

  return {
    orderId,
    orderReference: formatOrderReference(orderId),
    creationMode,
    creationModeLabel: adminCreationModeLabel(creationMode),
    statusKey: order.status as AdminOrderStatusKey,
    statusLabel: adminOrderStatusLabel(order.status),
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
    paymentSummary: buildAdminOrderPaymentSummaryDto(order),
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
