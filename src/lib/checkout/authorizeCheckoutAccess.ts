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
import { ORDER_STATUSES, type OrderStatus } from "@/models/Order";
import { Order } from "@/models/Order";
import { cookies } from "next/headers";

export type CheckoutAccessMode = "edit" | "view";

const CHECKOUT_ACCESS_BY_MODE: Record<CheckoutAccessMode, readonly OrderStatus[]> = {
  edit: ["draft"],
  view: ["draft", "payment_pending", "paid"],
};

export type AuthorizedCheckoutOrder = {
  orderId: string;
  accessMode: CheckoutAccessMode;
  order: {
    status: OrderStatus;
    creationMode: string;
    checkoutAccessTokenHash?: string | null;
    design: OrderDesignSnapshot;
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

async function loadCheckoutOrder(orderId: string, mode: CheckoutAccessMode) {
  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  const creationMode = order.creationMode;
  if (
    creationMode !== "photo" &&
    creationMode !== "illustration"
  ) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

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

  if (!order.assets?.finalArtwork?.pathname) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  return order;
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

  const order = await loadCheckoutOrder(orderId, mode);
  const token = await extractCheckoutToken(orderId, request);
  if (!token || !verifyCheckoutAccessToken(token, order.checkoutAccessTokenHash)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Unauthorized", 401);
  }

  return {
    orderId,
    accessMode: mode,
    order: {
      status: order.status as OrderStatus,
      creationMode: order.creationMode,
      checkoutAccessTokenHash: order.checkoutAccessTokenHash,
      design: order.design as OrderDesignSnapshot,
      assets: order.assets,
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

  const order = await loadCheckoutOrder(orderId, "edit").catch(() => null);
  if (!order) {
    return false;
  }

  return verifyCheckoutAccessToken(accessToken, order.checkoutAccessTokenHash);
}
