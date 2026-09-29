import { connectDb } from "@/lib/db/connect";
import {
  parseCheckoutAccessCookieValue,
  CHECKOUT_ACCESS_COOKIE,
} from "@/lib/checkout/constants";
import { verifyCheckoutAccessToken } from "@/lib/checkout/checkoutAccessToken";
import { assertValidOrderId } from "@/lib/orders/orderBlobPaths";
import { OrderError } from "@/lib/orders/errors";
import type { PhotoOrderDesignSnapshot } from "@/lib/orders/orderDesignSchema";
import { Order } from "@/models/Order";
import { cookies } from "next/headers";

export type AuthorizedCheckoutOrder = {
  orderId: string;
  order: {
    status: string;
    creationMode: string;
    checkoutAccessTokenHash?: string | null;
    design: PhotoOrderDesignSnapshot;
    assets?: {
      finalArtwork?: { pathname: string; contentType: string; sizeBytes: number };
    };
    customer?: { fullName?: string; phone?: string; email?: string };
    notes?: string;
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

async function loadCheckoutOrder(orderId: string) {
  await connectDb();
  const order = await Order.findById(orderId).lean();
  if (!order) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  if (order.creationMode !== "photo" || order.status !== "draft") {
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

export async function authorizeCheckoutAccess(
  orderId: string,
  request?: Request,
): Promise<AuthorizedCheckoutOrder> {
  try {
    assertValidOrderId(orderId);
  } catch {
    throw new OrderError("ORDER_PERSIST_FAILED", "Not found", 404);
  }

  const order = await loadCheckoutOrder(orderId);
  const token = await extractCheckoutToken(orderId, request);
  if (!token || !verifyCheckoutAccessToken(token, order.checkoutAccessTokenHash)) {
    throw new OrderError("ORDER_PERSIST_FAILED", "Unauthorized", 401);
  }

  return {
    orderId,
    order: {
      status: order.status,
      creationMode: order.creationMode,
      checkoutAccessTokenHash: order.checkoutAccessTokenHash,
      design: order.design as PhotoOrderDesignSnapshot,
      assets: order.assets,
      customer: order.customer,
      notes: order.notes,
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

  const order = await loadCheckoutOrder(orderId).catch(() => null);
  if (!order) {
    return false;
  }

  return verifyCheckoutAccessToken(accessToken, order.checkoutAccessTokenHash);
}
