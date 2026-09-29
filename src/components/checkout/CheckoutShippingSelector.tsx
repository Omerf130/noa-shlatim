"use client";

import type { CheckoutCommercialDto } from "@/lib/checkout/buildCheckoutCommercialView";
import styles from "./CheckoutShippingSelector.module.scss";

type CheckoutShippingSelectorProps = {
  commercial: Extract<CheckoutCommercialDto, { available: true }>;
  selectedShippingMethodId: string | null;
  onSelect: (methodId: string) => void;
  disabled?: boolean;
};

export function CheckoutShippingSelector({
  commercial,
  selectedShippingMethodId,
  onSelect,
  disabled = false,
}: CheckoutShippingSelectorProps) {
  return (
    <fieldset className={styles.fieldset} disabled={disabled}>
      <legend className={styles.legend}>שיטת משלוח</legend>

      {commercial.staleSelectionMessage && (
        <p className={styles.stale} role="status">
          {commercial.staleSelectionMessage}
        </p>
      )}

      <div className={styles.list} role="radiogroup" aria-label="בחירת שיטת משלוח">
        {commercial.shippingMethods.map((method) => {
          const checked = selectedShippingMethodId === method.methodId;
          return (
            <label
              key={method.methodId}
              className={[styles.option, checked ? styles.optionSelected : ""]
                .filter(Boolean)
                .join(" ")}
            >
              <input
                type="radio"
                name="shippingMethod"
                value={method.methodId}
                checked={checked}
                disabled={disabled}
                onChange={() => onSelect(method.methodId)}
                className={styles.radio}
              />
              <span className={styles.optionBody}>
                <span className={styles.optionHeader}>
                  <span className={styles.optionName}>{method.displayName}</span>
                  <span className={styles.optionPrice} dir="ltr">
                    {method.displayAmount}
                  </span>
                </span>
                {method.instructions.trim() && (
                  <span className={styles.instructions}>{method.instructions}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
