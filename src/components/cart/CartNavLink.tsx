"use client";

import { useCartBadgeCountOptional } from "@/components/cart/CartCountProvider";
import { cartNavAriaLabel } from "@/lib/cart/cartNavA11y";
import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import styles from "./CartNavLink.module.scss";

type CartNavLinkProps = {
  className?: string;
  onNavigate?: () => void;
};

export function CartNavLink({ className, onNavigate }: CartNavLinkProps) {
  const cartCount = useCartBadgeCountOptional();
  const badgeQuantity = cartCount?.badgeQuantity ?? 0;
  const ariaLabel = cartNavAriaLabel(badgeQuantity);

  return (
    <Link
      href="/cart"
      className={[styles.cartLink, className].filter(Boolean).join(" ")}
      aria-label={ariaLabel}
      onClick={onNavigate}
    >
      <ShoppingBag size={22} strokeWidth={1.75} aria-hidden />
      {badgeQuantity > 0 ? (
        <span className={styles.badge} aria-hidden="true">
          {badgeQuantity > 99 ? "99+" : badgeQuantity}
        </span>
      ) : null}
    </Link>
  );
}
