"use client";

import type { CartSummaryDto } from "@/lib/cart/cartSummary";
import { navbarBadgeQuantityFromSummary } from "@/lib/cart/cartSummary";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type CartCountContextValue = {
  badgeQuantity: number;
  setBadgeQuantity: (quantity: number) => void;
  syncBadgeFromServer: () => Promise<void>;
};

const CartCountContext = createContext<CartCountContextValue | null>(null);

type CartCountProviderProps = {
  initialBadgeQuantity: number;
  children: ReactNode;
};

export function CartCountProvider({
  initialBadgeQuantity,
  children,
}: CartCountProviderProps) {
  const [badgeQuantity, setBadgeQuantity] = useState(initialBadgeQuantity);

  const syncBadgeFromServer = useCallback(async () => {
    try {
      const res = await fetch("/api/cart/summary", { credentials: "same-origin" });
      if (!res.ok) return;
      const data = (await res.json()) as CartSummaryDto;
      setBadgeQuantity(navbarBadgeQuantityFromSummary(data));
    } catch {
      /* keep last known count */
    }
  }, []);

  const value = useMemo(
    () => ({
      badgeQuantity,
      setBadgeQuantity,
      syncBadgeFromServer,
    }),
    [badgeQuantity, syncBadgeFromServer],
  );

  return (
    <CartCountContext.Provider value={value}>{children}</CartCountContext.Provider>
  );
}

export function useCartBadgeCount(): CartCountContextValue {
  const ctx = useContext(CartCountContext);
  if (!ctx) {
    throw new Error("useCartBadgeCount must be used within CartCountProvider");
  }
  return ctx;
}

/** Optional hook for surfaces outside provider (should not happen in production). */
export function useCartBadgeCountOptional(): CartCountContextValue | null {
  return useContext(CartCountContext);
}
