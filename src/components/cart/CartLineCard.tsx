"use client";

import { Button } from "@/components/ui/Button/Button";
import type { CartLineDetailDto } from "@/lib/cart/cartDetailDto";
import {
  MAX_CART_LINE_QUANTITY,
  MIN_CART_LINE_QUANTITY,
} from "@/lib/cart/cartConstants";
import styles from "./CartLineCard.module.scss";

type CartLineCardProps = {
  line: CartLineDetailDto;
  readOnly: boolean;
  pending: boolean;
  confirmRemoveLineId: string | null;
  onQuantityChange: (lineId: string, quantity: number) => void;
  onRequestRemove: (lineId: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (lineId: string) => void;
};

function materialLabel(material: CartLineDetailDto["material"]): string {
  return material === "wood" ? "עץ" : "מגנט";
}

export function CartLineCard({
  line,
  readOnly,
  pending,
  confirmRemoveLineId,
  onQuantityChange,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
}: CartLineCardProps) {
  const unavailable = line.availability === "unavailable";
  const confirming = confirmRemoveLineId === line.lineId;
  const qtyDisabled = readOnly || pending || unavailable || confirming;

  return (
    <article
      className={`${styles.card} ${unavailable ? styles.unavailable : ""}`}
      aria-labelledby={`cart-line-${line.lineId}-title`}
    >
      <div className={styles.preview}>
        {/* Cookie-auth private artwork — same-origin API route, not optimizable via next/image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={line.artworkUrl}
          alt=""
          className={styles.artwork}
          loading="lazy"
          decoding="async"
        />
      </div>

      <div className={styles.body}>
        <h3 id={`cart-line-${line.lineId}-title`} className={styles.lineTitle}>
          שלט {materialLabel(line.material)}
        </h3>

        <dl className={styles.meta}>
          <div>
            <dt>חומר</dt>
            <dd>{materialLabel(line.material)}</dd>
          </div>
          {line.material === "magnet" && line.magnetSizeName ? (
            <div>
              <dt>גודל</dt>
              <dd>
                {line.magnetSizeName}
                {line.magnetSizeDimensionsLabel
                  ? ` · ${line.magnetSizeDimensionsLabel}`
                  : ""}
              </dd>
            </div>
          ) : null}
          {line.unitPriceLabel && !unavailable ? (
            <div>
              <dt>מחיר ליחידה</dt>
              <dd dir="ltr">{line.unitPriceLabel}</dd>
            </div>
          ) : null}
        </dl>

        {unavailable && line.unavailableReason ? (
          <p className={styles.unavailableMsg} role="alert">
            {line.unavailableReason}
          </p>
        ) : null}

        {!unavailable && line.lineTotalLabel ? (
          <p className={styles.lineTotal}>
            סה״כ שורה: <span dir="ltr">{line.lineTotalLabel}</span>
          </p>
        ) : null}

        {!readOnly && (
          <div className={styles.controls}>
            <div className={styles.quantity}>
              <span className={styles.quantityLabel} id={`qty-label-${line.lineId}`}>
                כמות
              </span>
              <div
                className={styles.quantityStepper}
                role="group"
                aria-labelledby={`qty-label-${line.lineId}`}
              >
                <button
                  type="button"
                  className={styles.stepBtn}
                  disabled={qtyDisabled || line.quantity <= MIN_CART_LINE_QUANTITY}
                  aria-label="הפחתת כמות"
                  onClick={() => onQuantityChange(line.lineId, line.quantity - 1)}
                >
                  −
                </button>
                <span className={styles.qtyValue} aria-live="polite">
                  {line.quantity}
                </span>
                <button
                  type="button"
                  className={styles.stepBtn}
                  disabled={qtyDisabled || line.quantity >= MAX_CART_LINE_QUANTITY}
                  aria-label="הוספת כמות"
                  onClick={() => onQuantityChange(line.lineId, line.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {confirming ? (
              <div className={styles.removeConfirm} role="alert">
                <p className={styles.removeQuestion}>להסיר את השלט מהסל?</p>
                <div className={styles.removeActions}>
                  <Button
                    variant="secondary"
                    disabled={pending}
                    onClick={onCancelRemove}
                  >
                    ביטול
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={pending}
                    onClick={() => onConfirmRemove(line.lineId)}
                  >
                    הסרה
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className={styles.removeLink}
                disabled={pending}
                onClick={() => onRequestRemove(line.lineId)}
              >
                הסרה מהסל
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
