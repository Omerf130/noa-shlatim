import { connectDb } from "@/lib/db/connect";
import {
  parseCheckoutAccessCookieValue,
  CHECKOUT_ACCESS_COOKIE,
} from "@/lib/checkout/constants";
import { verifyCheckoutAccessToken } from "@/lib/checkout/checkoutAccessToken";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import type { OrderCommercialSnapshot } from "@/lib/orders/commercialSnapshot";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import type { OrderTermsAcceptance } from "@/lib/orders/termsAcceptance";
import { OrderError } from "@/lib/orders/errors";
import type { OrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import {
  orderHasPersistedCheckoutItems,
  resolveOrderItems,
  type OrderLikeForResolveItems,
  type ResolvedOrderItem,
} from "@/lib/orders/resolveOrderItems";
import { ORDER_STATUSES, type OrderStatus } from "@/models/Order";
import { Order } from "@/models/Order";
import { cookies } from "next/headers";

export type CheckoutAccessMode = "edit" | "view" | "payment_init";

const CHECKOUT_ACCESS_BY_MODE: Record<CheckoutAccessMode, readonly OrderStatus[]> = {
  edit: ["draft"],
  view: ["draft", "payment_pending", "paid"],
  payment_init: ["draft", "payment_pending"],
};

export type CheckoutOrderKind = "legacy" | "cart_items";

export type CheckoutSourceOrder = OrderLikeForResolveItems & {
  customer?: { fullName?: string; phone?: string; email?: string };
  notes?: string;
  checkoutSelection?: { shippingMethodId?: string };
  commercialSnapshot?: unknown;
};

export type AuthorizedCheckoutOrder = {
  orderId: string;
  accessMode: CheckoutAccessMode;
  checkoutSource: CheckoutSourceOrder;
  order: {
    status: OrderStatus;
    checkoutKind: CheckoutOrderKind;
    resolvedItems: ResolvedOrderItem[];
    checkoutAccessTokenHash?: string | null;
    /** Legacy payment path — first resolved line design when legacy. */
    creationMode?: string;
    design?: OrderDesignSnapshot;
    assets?: {
      finalArtwork?: { pathname: string; contentType: string; sizeBytes: number };
    };
    customer?: { fullName?: string; phone?: string; email?: string };
    notes?: string;
    checkoutSelection?: { shippingMethodId?: string };
    commercialSnapshot?: OrderCommercialSnapshot | null;
    termsAcceptance?: OrderTermsAcceptance | null;
    payment?: {
      activeAttemptId?: string | null;
      attempts?: PaymentAttemptRecord[];
    } | null;
  };
};

function tokenFromRequestQuery(orderId: string, request: Request): string | null {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("access");
  if (queryToken?.trim()) {
    return queryToken.trim();
  }
  return null;
}

export async function extractCheckoutToken(
  orderId: string,
  request?: Request,
): Promise<string | null> {
  if (request) {
    const fromQuery = tokenFromRequestQuery(orderId, request);
    if (fromQuery) {
      return fromQuery;
    }
  }

  const cookieStore = await cookies();
  const raw = cookieStore.get(CHECKOUT_ACCESS_COOKIE)?.value;
  if (!raw) {
    return null;
  }
  const parsed = parseCheckoutAccessCookieValue(raw);
  if (!parsed || parsed.orderId !== orderId) {
    return null;
  }
  return parsed.token;
}

function isOrderStatus(value: string): value is OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value);
}

function assertCheckoutLinesReady(resolved: ResolvedOrderItem[]): void {
  if (resolved.length === 0) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }
  for (const item of resolved) {
    if (!item.assets.finalArtwork?.pathname) {
      throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
    }
  }
}

async function loadCheckoutOrder(orderId: string, mode: CheckoutAccessMode) {
  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  const resolvedItems = resolveOrderItems(order);
  assertCheckoutLinesReady(resolvedItems);

  const statusRaw = order.status;
  if (!isOrderStatus(statusRaw)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  const allowedStatuses = CHECKOUT_ACCESS_BY_MODE[mode];
  if (!allowedStatuses.includes(statusRaw)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  if (!order.checkoutAccessTokenHash) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  return { order, resolvedItems };
}

export type AuthorizeCheckoutAccessOptions = {
  mode?: CheckoutAccessMode;
};

export async function authorizeCheckoutAccess(
  orderId: string,
  request?: Request,
  options?: AuthorizeCheckoutAccessOptions,
): Promise<AuthorizedCheckoutOrder> {
  const mode = options?.mode ?? "edit";

  try {
    assertValidOrderId(orderId);
  } catch {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  const { order, resolvedItems } = await loadCheckoutOrder(orderId, mode);
  const token = await extractCheckoutToken(orderId, request);
  if (!token || !verifyCheckoutAccessToken(token, order.checkoutAccessTokenHash)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Unauthorized", 401);
  }

  const checkoutKind: CheckoutOrderKind = orderHasPersistedCheckoutItems(order)
    ? "cart_items"
    : "legacy";

  const first = resolvedItems[0]!;

  const checkoutSource: CheckoutSourceOrder = {
    creationMode: order.creationMode,
    design: order.design,
    assets: order.assets,
    items: order.items,
    customer: order.customer,
    notes: order.notes,
    checkoutSelection: order.checkoutSelection,
    commercialSnapshot: order.commercialSnapshot,
  };

  return {
    orderId,
    accessMode: mode,
    checkoutSource,
    order: {
      status: order.status as OrderStatus,
      checkoutKind,
      resolvedItems,
      checkoutAccessTokenHash: order.checkoutAccessTokenHash,
      creationMode: checkoutKind === "legacy" ? first.creationMode : order.creationMode,
      design: first.design,
      assets: first.assets,
      customer: order.customer,
      notes: order.notes,
      checkoutSelection: order.checkoutSelection,
      commercialSnapshot: order.commercialSnapshot ?? null,
      termsAcceptance: order.termsAcceptance ?? null,
      payment: order.payment ?? null,
    },
  };
}

/** Verify query access token for bootstrap (cookie is set in Route Handler only). */
export async function verifyCheckoutAccessBootstrap(
  orderId: string,
  accessToken: string,
): Promise<boolean> {
  try {
    assertValidOrderId(orderId);
  } catch {
    return false;
  }

  const loaded = await loadCheckoutOrder(orderId, "edit").catch(() => null);
  if (!loaded) {
    return false;
  }

  return verifyCheckoutAccessToken(accessToken, loaded.order.checkoutAccessTokenHash);
}
