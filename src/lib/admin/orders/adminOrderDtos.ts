import { loadBackgroundForRenderAsSignBackground } from "@/lib/backgrounds/loadBackgrounds";
import { getIllustrationStyleById } from "@/data/illustrationStyles";
import { formatDecorationSummary } from "@/lib/admin/orders/decorationSummary";
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
import {
  commercialSnapshotDiscountMinor,
  commercialSnapshotDisplayLines,
  commercialSnapshotPromotionsApplied,
  parseOrderCommercialSnapshot,
} from "@/lib/orders/commercialSnapshotAccess";
import { orderCommercialSnapshotSchema } from "@/lib/orders/commercialSnapshot";
import { LEGACY_ORDER_LINE_ID } from "@/lib/orders/orderItemConstants";
import { resolveOrderItems } from "@/lib/orders/resolveOrderItems";
import {
  adminOrderAssetApiPath,
  adminOrderItemAssetApiPath,
  resolveAdminOrderArtworkThumbnailApiPath,
} from "@/lib/admin/orders/adminOrderAssets";
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
  productSummaryLabel: string | null;
  artworkThumbnailUrl: string | null;
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
  magnetSizeName: string | null;
  magnetSizeDimensionsLabel: string | null;
  backgroundName: string;
  styleName: string | null;
  signText: string;
  decorationSummary: string;
};

export type AdminCreationMode = "photo" | "illustration";

export function adminCreationModeLabel(mode: AdminCreationMode): string {
  return mode === "photo" ? "תמונה" : "איור קיים";
}

export type AdminOrderAccountingDocumentDto = {
  statusKey: "pending" | "issued" | "failed" | "uncertain" | "none";
  statusLabel: string;
  documentNumber: string | null;
  issuedAtLabel: string | null;
  documentUrl: string | null;
  errorMessage: string | null;
  canRetry: boolean;
};

export type AdminOrderPaymentPromotionLineDto = {
  customerLabel: string;
  applicationCount: number;
  savingsLabel: string;
};

export type AdminOrderPaymentSummaryDto = {
  statusLabel: AdminOrderStatusLabel | "—";
  productAmountLabel: string;
  catalogProductAmountLabel: string | null;
  discountAmountLabel: string | null;
  appliedPromotions: AdminOrderPaymentPromotionLineDto[];
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

export type AdminOrderLineDetailDto = {
  lineId: string;
  quantity: number;
  creationMode: AdminCreationMode;
  creationModeLabel: string;
  designPreview: AdminOrderDesignPreviewDto | null;
  designPreviewUnavailableMessage: string | null;
  productionAssets: {
    originalImageUrl: string | null;
    artworkUrl: string | null;
  };
  commercialLineLabel: string | null;
  commercialLineTotalLabel: string | null;
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
  productSummaryLabel: string | null;
  orderLines: AdminOrderLineDetailDto[];
  designPreview: AdminOrderDesignPreviewDto | null;
  designPreviewUnavailableMessage: string | null;
  productionAssets: {
    originalImageUrl: string | null;
    artworkUrl: string | null;
  };
  paymentSummary: AdminOrderPaymentSummaryDto | null;
  accountingDocument: AdminOrderAccountingDocumentDto | null;
};

type OrderLeanForAdmin = {
  _id: { toString(): string };
  status: string;
  creationMode?: string;
  design?: unknown;
  items?: unknown;
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
  accountingDocument?: {
    status?: string;
    documentNumber?: string;
    documentUrl?: string;
    issuedAt?: string;
    errorMessage?: string;
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
  const parsed = parseOrderCommercialSnapshot(commercialSnapshot);
  if (!parsed) {
    return null;
  }
  return formatMinorToIlsDisplay(parsed.snapshot.totalAmountMinor);
}

function adminProductSummaryLabel(order: OrderLeanForAdmin): string | null {
  const resolved = resolveOrderItems({
    creationMode: order.creationMode as "photo" | "illustration" | undefined,
    design: order.design,
    assets: order.assets as Parameters<typeof resolveOrderItems>[0]["assets"],
    items: order.items as Parameters<typeof resolveOrderItems>[0]["items"],
  });
  if (resolved.length === 0) {
    return null;
  }
  const totalQty = resolved.reduce((sum, line) => sum + line.quantity, 0);
  if (resolved.length === 1 && totalQty === 1) {
    return null;
  }
  return `${resolved.length} סוגי שלטים · ${totalQty} יחידות`;
}

function materialLabelForOrder(order: OrderLeanForAdmin, design: OrderDesignSnapshot | null): string {
  const snapshotMat = orderCommercialSnapshotSchema.safeParse(order.commercialSnapshot);
  if (snapshotMat.success) {
    return materialLabelFromSnapshot(snapshotMat.data.material);
  }
  return materialLabelFromSnapshot(design?.material);
}

function magnetSizeLabelsForOrder(
  order: OrderLeanForAdmin,
  design: OrderDesignSnapshot | null,
): { name: string | null; dimensions: string | null } {
  const snapshotParsed = orderCommercialSnapshotSchema.safeParse(order.commercialSnapshot);
  if (snapshotParsed.success && snapshotParsed.data.material === "magnet") {
    const name = snapshotParsed.data.magnetSizeName?.trim();
    const dimensions = snapshotParsed.data.magnetSizeDimensionsLabel?.trim();
    if (name) {
      return { name, dimensions: dimensions || null };
    }
  }
  if (design?.material === "magnet" && design.magnetSizeId) {
    return { name: design.magnetSizeId, dimensions: null };
  }
  return { name: null, dimensions: null };
}

function findSucceededPaymentAttempt(order: OrderLeanForAdmin) {
  return order.payment?.attempts?.find((a) => a.status === "succeeded") ?? null;
}

export function buildAdminOrderAccountingDocumentDto(
  order: OrderLeanForAdmin,
): AdminOrderAccountingDocumentDto | null {
  if (order.status !== "paid") {
    return null;
  }

  const doc = order.accountingDocument;
  if (!doc?.status) {
    return {
      statusKey: "none",
      statusLabel: "ממתין להפקה",
      documentNumber: null,
      issuedAtLabel: null,
      documentUrl: null,
      errorMessage: null,
      canRetry: false,
    };
  }

  switch (doc.status) {
    case "pending":
      return {
        statusKey: "pending",
        statusLabel: "ממתין להפקה",
        documentNumber: null,
        issuedAtLabel: null,
        documentUrl: null,
        errorMessage: null,
        canRetry: false,
      };
    case "issued":
      return {
        statusKey: "issued",
        statusLabel: "הופק בהצלחה",
        documentNumber: doc.documentNumber?.trim() || null,
        issuedAtLabel: doc.issuedAt ? formatAdminDateTime(doc.issuedAt) : null,
        documentUrl: doc.documentUrl?.trim() || null,
        errorMessage: null,
        canRetry: false,
      };
    case "failed":
      return {
        statusKey: "failed",
        statusLabel: "שגיאה בהפקת המסמך",
        documentNumber: null,
        issuedAtLabel: null,
        documentUrl: null,
        errorMessage: doc.errorMessage?.trim() || "שגיאה בהפקת המסמך",
        canRetry: true,
      };
    case "uncertain":
      return {
        statusKey: "uncertain",
        statusLabel: "נדרש אימות",
        documentNumber: null,
        issuedAtLabel: null,
        documentUrl: null,
        errorMessage:
          doc.errorMessage?.trim() ||
          "ייתכן שהמסמך כבר הופק ב-Finbot. יש לאמת במערכת Finbot לפני הפקה נוספת.",
        canRetry: false,
      };
    default:
      return null;
  }
}

export function buildAdminOrderPaymentSummaryDto(
  order: OrderLeanForAdmin,
): AdminOrderPaymentSummaryDto | null {
  if (order.status !== "payment_pending" && order.status !== "paid") {
    return null;
  }

  const snapshotParsed = parseOrderCommercialSnapshot(order.commercialSnapshot);
  if (!snapshotParsed) {
    return null;
  }
  const snapshot = snapshotParsed.snapshot;
  const terms = order.termsAcceptance;
  const succeeded = findSucceededPaymentAttempt(order);
  const discountMinor = commercialSnapshotDiscountMinor(snapshotParsed);
  const promotions = commercialSnapshotPromotionsApplied(snapshotParsed);

  return {
    statusLabel: adminOrderStatusLabel(order.status),
    productAmountLabel: formatMinorToIlsDisplay(snapshot.productAmountMinor),
    catalogProductAmountLabel:
      discountMinor > 0
        ? formatMinorToIlsDisplay(snapshot.productAmountMinor)
        : null,
    discountAmountLabel:
      discountMinor > 0
        ? `-${formatMinorToIlsDisplay(discountMinor)}`
        : null,
    appliedPromotions: promotions.map((p) => ({
      customerLabel: p.customerLabel,
      applicationCount: p.applicationCount,
      savingsLabel: `-${formatMinorToIlsDisplay(p.savingsMinor)}`,
    })),
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
  if (!isAdminVisibleOrderStatus(order.status)) {
    return null;
  }

  const resolved = resolveOrderItems({
    creationMode: order.creationMode as "photo" | "illustration" | undefined,
    design: order.design,
    assets: order.assets as Parameters<typeof resolveOrderItems>[0]["assets"],
    items: order.items as Parameters<typeof resolveOrderItems>[0]["items"],
  });
  if (resolved.length === 0) {
    return null;
  }

  const orderId = order._id.toString();
  const design = parseDesignSnapshot(order.design);
  const summary = adminProductSummaryLabel(order);

  return {
    orderId,
    orderReference: formatOrderReference(orderId),
    statusKey: order.status as AdminOrderStatusKey,
    statusLabel: adminOrderStatusLabel(order.status),
    createdAtLabel: formatAdminDateTime(order.createdAt),
    materialLabel: summary ?? materialLabelForOrder(order, design),
    totalLabel: totalLabelFromSnapshot(order.commercialSnapshot),
    customerDisplayName: customerDisplayName(order.customer),
    customerPhone: order.customer?.phone?.trim() || null,
    productSummaryLabel: summary,
    artworkThumbnailUrl: resolveAdminOrderArtworkThumbnailApiPath(orderId, {
      creationMode: order.creationMode as "photo" | "illustration" | undefined,
      design: order.design,
      assets: order.assets as Parameters<typeof resolveOrderItems>[0]["assets"],
      items: order.items as Parameters<typeof resolveOrderItems>[0]["items"],
    }),
    detailHref: `/admin/orders/${orderId}`,
  };
}

async function buildAdminOrderLineDetail(params: {
  orderId: string;
  lineId: string;
  quantity: number;
  creationMode: AdminCreationMode;
  designRaw: unknown;
  order: OrderLeanForAdmin;
  commercialLine?: { description: string; lineTotalMinor: number } | null;
}): Promise<AdminOrderLineDetailDto> {
  const design = parseDesignSnapshot(params.designRaw);
  const useLegacyAssets = params.lineId === LEGACY_ORDER_LINE_ID;
  const artworkUrl = useLegacyAssets
    ? adminOrderAssetApiPath(params.orderId, "artwork")
    : adminOrderItemAssetApiPath(params.orderId, params.lineId, "artwork");
  const hasOriginal = useLegacyAssets
    ? Boolean(params.order.assets?.originalImage)
    : true;
  const originalUrl = hasOriginal
    ? useLegacyAssets
      ? adminOrderAssetApiPath(params.orderId, "original")
      : adminOrderItemAssetApiPath(params.orderId, params.lineId, "original")
    : null;
  const hasArtwork = useLegacyAssets
    ? Boolean(params.order.assets?.finalArtwork)
    : true;
  const artworkDisplayUrl = hasArtwork ? artworkUrl : null;

  let designPreview: AdminOrderDesignPreviewDto | null = null;
  let designPreviewUnavailableMessage: string | null = null;

  if (design) {
    const previewProps = buildPersistedSignPreviewProps(design, artworkUrl);
    const background = await loadBackgroundForRenderAsSignBackground(design.backgroundId);
    const magnetLabels = magnetSizeLabelsForOrder(params.order, design);
    designPreview = {
      ...previewProps,
      materialLabel: materialLabelFromSnapshot(design.material),
      magnetSizeName: magnetLabels.name,
      magnetSizeDimensionsLabel: magnetLabels.dimensions,
      backgroundName: background?.name ?? "—",
      styleName: styleNameFromOrderDesign(design),
      signText: design.text.value,
      decorationSummary: formatDecorationSummary(design.decorations),
    };
  } else {
    designPreviewUnavailableMessage = DESIGN_PREVIEW_UNAVAILABLE_MESSAGE;
  }

  return {
    lineId: params.lineId,
    quantity: params.quantity,
    creationMode: params.creationMode,
    creationModeLabel: adminCreationModeLabel(params.creationMode),
    designPreview,
    designPreviewUnavailableMessage,
    productionAssets: {
      originalImageUrl: originalUrl,
      artworkUrl: artworkDisplayUrl,
    },
    commercialLineLabel: params.commercialLine?.description ?? null,
    commercialLineTotalLabel: params.commercialLine
      ? formatMinorToIlsDisplay(params.commercialLine.lineTotalMinor)
      : null,
  };
}

export async function buildAdminOrderDetailDto(
  order: OrderLeanForAdmin,
): Promise<AdminOrderDetailDto> {
  const orderId = order._id.toString();
  const resolved = resolveOrderItems({
    creationMode: order.creationMode as "photo" | "illustration" | undefined,
    design: order.design,
    assets: order.assets as Parameters<typeof resolveOrderItems>[0]["assets"],
    items: order.items as Parameters<typeof resolveOrderItems>[0]["items"],
  });
  const first = resolved[0];
  const creationMode = (first?.creationMode ?? order.creationMode ?? "illustration") as AdminCreationMode;

  const parsedCommercial = parseOrderCommercialSnapshot(order.commercialSnapshot);
  const commercialByLineId = new Map(
    parsedCommercial
      ? commercialSnapshotDisplayLines(parsedCommercial).map((line) => [
          line.lineId,
          { description: line.description, lineTotalMinor: line.lineTotalMinor },
        ] as const)
      : [],
  );

  const orderLines: AdminOrderLineDetailDto[] = [];
  for (const line of resolved) {
    orderLines.push(
      await buildAdminOrderLineDetail({
        orderId,
        lineId: line.lineId,
        quantity: line.quantity,
        creationMode: line.creationMode,
        designRaw: line.design,
        order,
        commercialLine: commercialByLineId.get(line.lineId) ?? null,
      }),
    );
  }

  const primary = orderLines[0];
  const designPreview = primary?.designPreview ?? null;
  const designPreviewUnavailableMessage =
    primary?.designPreviewUnavailableMessage ?? DESIGN_PREVIEW_UNAVAILABLE_MESSAGE;
  const productionAssets = primary?.productionAssets ?? {
    originalImageUrl: null,
    artworkUrl: null,
  };

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
    productSummaryLabel: adminProductSummaryLabel(order),
    orderLines,
    designPreview,
    designPreviewUnavailableMessage,
    productionAssets,
    paymentSummary: buildAdminOrderPaymentSummaryDto(order),
    accountingDocument: buildAdminOrderAccountingDocumentDto(order),
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
