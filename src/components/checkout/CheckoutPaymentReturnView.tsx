"use client";

import { CheckoutPaymentReturnActions } from "@/components/checkout/CheckoutPaymentReturnActions";
import type { OrderStatus } from "@/models/Order";
import { useCallback, useEffect, useRef, useState } from "react";
import styles from "./CheckoutPaymentReturnView.module.scss";

const POLL_INTERVAL_MS = 3_000;
const POLL_MAX_DURATION_MS = 90_000;

type PaymentStatusResponse =
  | {
      ok: true;
      status: OrderStatus;
      canRetryPayment: boolean;
      orderReference: string;
    }
  | { ok: false };

type CheckoutPaymentReturnViewProps = {
  orderId: string;
  initialStatus: OrderStatus;
  initialCanRetry: boolean;
  orderReference: string;
  outcomeHint?: string;
  showCheckoutLink: boolean;
};

function outcomeContextCopy(outcome: string | undefined): string | null {
  switch (outcome) {
    case "success":
      return "חזרתם מדף התשלום לאחר ניסיון תשלום. האישור הסופי מתקבל מהמערכת שלנו — לא מהדפדפן.";
    case "failure":
      return "דף התשלום דיווח על כישלון. הסטטוס למטה מבוסס על הנתונים השמורים אצלנו.";
    case "cancel":
      return "ביטלתם את התשלום בדף PayPlus. אם תרצו, אפשר לנסות שוב כשהמערכת תאפשר.";
    default:
      return null;
  }
}

export function CheckoutPaymentReturnView({
  orderId,
  initialStatus,
  initialCanRetry,
  orderReference,
  outcomeHint,
  showCheckoutLink,
}: CheckoutPaymentReturnViewProps) {
  const [status, setStatus] = useState<OrderStatus>(initialStatus);
  const [canRetry, setCanRetry] = useState(initialCanRetry);
  const [pollTimedOut, setPollTimedOut] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  const pollStartedAt = useRef<number | null>(null);
  const inFlight = useRef(false);

  const refreshStatus = useCallback(async (): Promise<boolean> => {
    if (inFlight.current) {
      return false;
    }
    inFlight.current = true;
    try {
      const res = await fetch(`/api/orders/${orderId}/payment/status`, {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) {
        setFetchError(true);
        return false;
      }
      const data = (await res.json()) as PaymentStatusResponse;
      if (!data.ok) {
        setFetchError(true);
        return false;
      }
      setFetchError(false);
      setStatus(data.status);
      setCanRetry(data.canRetryPayment);
      return data.status === "paid";
    } catch {
      setFetchError(true);
      return false;
    } finally {
      inFlight.current = false;
    }
  }, [orderId]);

  useEffect(() => {
    if (status !== "payment_pending") {
      return;
    }

    pollStartedAt.current = Date.now();

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) {
        return;
      }
      const becamePaid = await refreshStatus();
      if (cancelled) {
        return;
      }
      if (becamePaid) {
        return;
      }
      const started = pollStartedAt.current ?? Date.now();
      if (Date.now() - started >= POLL_MAX_DURATION_MS) {
        setPollTimedOut(true);
        return;
      }
      timer = setTimeout(() => {
        void tick();
      }, POLL_INTERVAL_MS);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [status, refreshStatus]);

  const polling =
    status === "payment_pending" && !pollTimedOut;

  const contextLine = outcomeContextCopy(outcomeHint);

  if (status === "paid") {
    return (
      <div className={styles.root}>
        <h1 className={styles.titleSuccess}>התשלום התקבל בהצלחה</h1>
        <p className={styles.lead}>
          תודה! ההזמנה התקבלה והתשלום אושר.
        </p>
        <p className={styles.reference} dir="ltr">
          מספר הזמנה: <strong>{orderReference}</strong>
        </p>
      </div>
    );
  }

  if (status === "payment_pending") {
    return (
      <div className={styles.root}>
        <h1 className={styles.title}>אנחנו עדיין מאמתים את התשלום</h1>
        <p className={styles.lead}>
          ייתכן שייקח כמה רגעים עד שהאישור מהמערכת יופיע כאן. אין צורך לשלם שוב בינתיים.
        </p>
        {contextLine && <p className={styles.hint}>{contextLine}</p>}
        {polling && (
          <p className={styles.polling} role="status" aria-live="polite">
            בודקים עדכון סטטוס…
          </p>
        )}
        {!polling && pollTimedOut && (
          <p className={styles.timedOut} role="status">
            עדיין לא התקבל אישור סופי לתשלום. אפשר לרענן את העמוד בעוד מספר רגעים.
          </p>
        )}
        {fetchError && (
          <p className={styles.timedOut} role="status">
            לא הצלחנו לרענן את הסטטוס כרגע. נסו לרענן את העמוד.
          </p>
        )}
        <p className={styles.reference} dir="ltr">
          מספר הזמנה: <strong>{orderReference}</strong>
        </p>
        <CheckoutPaymentReturnActions
          orderId={orderId}
          canRetry={canRetry}
          showCheckoutLink={showCheckoutLink}
        />
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h1 className={styles.title}>תשלום</h1>
      <p className={styles.lead}>
        {contextLine ?? "חזרתם מדף התשלום. הסטטוס המעודכן מוצג למטה."}
      </p>
      <p className={styles.status} role="status">
        סטטוס הזמנה במערכת:{" "}
        <strong>
          {status === "draft"
            ? "טיוטה"
            : status === "creating"
              ? "בהכנה"
              : status}
        </strong>
      </p>
      <p className={styles.reference} dir="ltr">
        מספר הזמנה: <strong>{orderReference}</strong>
      </p>
      <CheckoutPaymentReturnActions
        orderId={orderId}
        canRetry={canRetry}
        showCheckoutLink={showCheckoutLink}
      />
    </div>
  );
}
