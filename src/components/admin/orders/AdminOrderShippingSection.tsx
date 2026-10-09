"use client";

import type { ShippingAddress } from "@/lib/checkout/shippingAddressSchema";
import { formatShippingAddressBlock } from "@/lib/orders/formatShippingAddress";
import { useCallback, useState } from "react";
import styles from "./AdminOrderShippingSection.module.scss";

type AdminOrderShippingSectionProps = {
  shippingAddress: ShippingAddress | null;
};

export function AdminOrderShippingSection({
  shippingAddress,
}: AdminOrderShippingSectionProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  const onCopy = useCallback(async () => {
    if (!shippingAddress) {
      return;
    }
    const text = formatShippingAddressBlock(shippingAddress);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
      window.setTimeout(() => setCopyState("idle"), 2000);
    }
  }, [shippingAddress]);

  return (
    <section className={styles.section} aria-labelledby="shipping-address-heading">
      <div className={styles.headerRow}>
        <h2 id="shipping-address-heading" className={styles.sectionTitle}>
          כתובת למשלוח
        </h2>
        {shippingAddress ? (
          <button type="button" className={styles.copyBtn} onClick={() => void onCopy()}>
            {copyState === "copied"
              ? "הועתק"
              : copyState === "failed"
                ? "לא הצלחנו להעתיק"
                : "העתקת כתובת"}
          </button>
        ) : null}
      </div>
      {!shippingAddress ? (
        <p className={styles.missing} role="status">
          לא הוזנה כתובת למשלוח
        </p>
      ) : (
        <dl className={styles.fieldList}>
          <div>
            <dt>עיר</dt>
            <dd>{shippingAddress.city}</dd>
          </div>
          <div>
            <dt>רחוב</dt>
            <dd>{shippingAddress.street}</dd>
          </div>
          <div>
            <dt>מספר בית</dt>
            <dd>{shippingAddress.houseNumber}</dd>
          </div>
          {shippingAddress.floor ? (
            <div>
              <dt>קומה</dt>
              <dd>{shippingAddress.floor}</dd>
            </div>
          ) : null}
          <div>
            <dt>מיקוד</dt>
            <dd dir="ltr" className={styles.mono}>
              {shippingAddress.postalCode}
            </dd>
          </div>
        </dl>
      )}
    </section>
  );
}
