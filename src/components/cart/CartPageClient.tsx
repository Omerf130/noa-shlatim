"use client";

import { CartLineCard } from "@/components/cart/CartLineCard";
import { Button } from "@/components/ui/Button/Button";
import { CART_CHECKOUT_CONVERSION_ENABLED } from "@/lib/cart/cartConstants";
import type { CartDetailDto } from "@/lib/cart/cartDetailDto";
import {
  CART_MUTATION_ERROR_MESSAGE,
  deleteCartLine,
  fetchCartDetail,
  patchCartLineQuantity,
} from "@/lib/cart/fetchCartDetail";
import { useCartBadgeCount } from "@/components/cart/CartCountProvider";
import {
  ConversionIdempotencyKeySession,
  parseCartConversionResponse,
} from "@/lib/cart/cartConversionClient";
import { reportClientOperationFailure } from "@/lib/diagnostics/reportClientFailure";
import { appendSupportReference } from "@/lib/diagnostics/supportReference";
import { messageForCartConversionHttpFailure } from "@/lib/http/clientOperationErrors";
import { readJsonResponse } from "@/lib/http/readJsonResponse";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import styles from "./CartPageClient.module.scss";

type CartPageClientProps = {
  initialDetail: CartDetailDto;
};

export function CartPageClient({ initialDetail }: CartPageClientProps) {
  const [detail, setDetail] = useState<CartDetailDto>(initialDetail);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [confirmRemoveLineId, setConfirmRemoveLineId] = useState<string | null>(
    null,
  );
  const router = useRouter();
  const { setBadgeQuantity } = useCartBadgeCount();
  const [converting, setConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const conversionSessionRef = useRef(new ConversionIdempotencyKeySession());

  const applyDetail = useCallback(
    (next: CartDetailDto) => {
      setDetail(next);
      setBadgeQuantity(next.status === "active" ? next.totalQuantity : 0);
    },
    [setBadgeQuantity],
  );

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const data = await fetchCartDetail();
      applyDetail(data);
    } catch {
      setLoadError("לא הצלחנו לטעון את הסל. נסו לרענן את העמוד.");
    }
  }, [applyDetail]);

  const runMutation = useCallback(
    async (action: () => Promise<CartDetailDto>) => {
      setMutationError(null);
      setPending(true);
      try {
        const next = await action();
        applyDetail(next);
        setConfirmRemoveLineId(null);
      } catch (err) {
        setMutationError(
          err instanceof Error ? err.message : CART_MUTATION_ERROR_MESSAGE,
        );
      } finally {
        setPending(false);
      }
    },
    [applyDetail],
  );

  const onQuantityChange = useCallback(
    (lineId: string, quantity: number) => {
      void runMutation(() => patchCartLineQuantity(lineId, quantity));
    },
    [runMutation],
  );

  const onConfirmRemove = useCallback(
    (lineId: string) => {
      void runMutation(() => deleteCartLine(lineId));
    },
    [runMutation],
  );

  const handleContinueToCheckout = useCallback(async () => {
    if (converting || pending) {
      return;
    }
    setConvertError(null);
    setConverting(true);
    const conversionIdempotencyKey = conversionSessionRef.current.getOrCreate();
    try {
      const res = await fetch("/api/cart/convert", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversionIdempotencyKey }),
      });

      const parsed = await readJsonResponse<Record<string, unknown>>(res);

      if (parsed.parseFailed || !parsed.data) {
        let traceId = parsed.traceId;
        if (!traceId) {
          traceId = await reportClientOperationFailure({
            operation: "cart_convert",
            clientStage: "json_parse",
            httpStatus: parsed.status,
          });
        }
        setConvertError(
          appendSupportReference(
            messageForCartConversionHttpFailure(parsed.status, true),
            traceId,
          ),
        );
        return;
      }

      const data = parseCartConversionResponse(parsed.data);
      if (!data || !data.ok) {
        conversionSessionRef.current.resetForNewAttempt();
        const apiMessage = data && !data.ok ? data.message : null;
        const traceFromBody =
          parsed.data && typeof parsed.data.traceId === "string"
            ? parsed.data.traceId
            : null;
        setConvertError(
          appendSupportReference(
            messageForCartConversionHttpFailure(
              parsed.status,
              false,
              apiMessage,
            ),
            parsed.traceId ?? traceFromBody,
          ),
        );
        return;
      }

      conversionSessionRef.current.consumeAfterSuccess();
      setBadgeQuantity(0);
      router.push(data.checkoutPath);
    } catch {
      const traceId = await reportClientOperationFailure({
        operation: "cart_convert",
        clientStage: "fetch",
      });
      setConvertError(
        appendSupportReference(
          messageForCartConversionHttpFailure(0, false),
          traceId,
        ),
      );
    } finally {
      setConverting(false);
    }
  }, [converting, pending, router, setBadgeQuantity]);

  if (loadError) {
    return (
      <div className={styles.stateBox} role="alert">
        <p>{loadError}</p>
        <Button variant="secondary" onClick={() => void load()}>
          ניסיון חוזר
        </Button>
      </div>
    );
  }

  const isEmpty =
    detail.status === "empty" ||
    (detail.lines.length === 0 && detail.status !== "converted");

  if (detail.status === "converted") {
    return (
      <div className={styles.stateBox}>
        <h2 className={styles.emptyTitle}>הסל הזה כבר הושלם</h2>
        <p className={styles.emptyText}>
          ההזמנה מהסל הזה כבר נסגרה. אפשר להתחיל שלט חדש.
        </p>
        <Button href="/create">יצירת שלט</Button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className={styles.stateBox}>
        <h2 className={styles.emptyTitle}>הסל שלך עדיין ריק</h2>
        <p className={styles.emptyText}>עיצבו שלט ראשון — ונשמור אותו כאן עד שתמשיכו.</p>
        <Button href="/create">יצירת שלט</Button>
      </div>
    );
  }

  const readOnly = detail.status !== "active";
  const checkoutReady =
    detail.canCheckout && CART_CHECKOUT_CONVERSION_ENABLED;

  return (
    <div className={styles.cart}>
      <ul className={styles.lineList}>
        {detail.lines.map((line) => (
          <li key={line.lineId}>
            <CartLineCard
              line={line}
              readOnly={readOnly}
              pending={pending}
              confirmRemoveLineId={confirmRemoveLineId}
              onQuantityChange={onQuantityChange}
              onRequestRemove={setConfirmRemoveLineId}
              onCancelRemove={() => setConfirmRemoveLineId(null)}
              onConfirmRemove={onConfirmRemove}
            />
          </li>
        ))}
      </ul>

      <aside className={styles.summary} aria-label="סיכום סל">
        {detail.discountMinor > 0 ? (
          <>
            <div className={styles.summaryRow}>
              <span>מוצרים</span>
              <strong dir="ltr">{detail.catalogSubtotalLabel}</strong>
            </div>
            {detail.appliedPromotions.map((promo) => (
              <div className={styles.summaryRow} key={promo.customerLabel}>
                <span>
                  {promo.applicationCount > 1
                    ? `${promo.customerLabel} ×${promo.applicationCount}`
                    : promo.customerLabel}
                </span>
                <strong dir="ltr">{promo.savingsLabel}</strong>
              </div>
            ))}
            <div className={styles.summaryRow}>
              <span>סה״כ מוצרים</span>
              <strong dir="ltr">{detail.productTotalLabel}</strong>
            </div>
            {detail.promotionMessage ? (
              <p className={styles.promotionMessage} role="status">
                {detail.promotionMessage}
              </p>
            ) : null}
          </>
        ) : (
          <div className={styles.summaryRow}>
            <span>סכום ביניים</span>
            <strong dir="ltr">{detail.subtotalLabel}</strong>
          </div>
        )}
        <p className={styles.shippingNote}>משלוח יחושב בשלב ההזמנה</p>

        <Button
          className={styles.checkoutBtn}
          disabled={!checkoutReady || converting || pending}
          aria-busy={converting}
          onClick={() => void handleContinueToCheckout()}
        >
          {converting ? "מכינים את ההזמנה…" : "המשך להזמנה"}
        </Button>

        {!detail.canCheckout && detail.lines.length > 0 ? (
          <p className={styles.checkoutBlocked} role="status">
            יש לטפל בפריטים שאינם זמינים לפני המשך להזמנה.
          </p>
        ) : null}
      </aside>

      {mutationError ? (
        <p className={styles.mutationError} role="alert">
          {mutationError}
        </p>
      ) : null}

      {convertError ? (
        <p className={styles.mutationError} role="alert">
          {convertError}
        </p>
      ) : null}
    </div>
  );
}
