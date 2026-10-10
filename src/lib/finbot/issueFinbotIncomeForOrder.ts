import { connectDb } from "@/lib/db/connect";
import {
  buildFinbotIncomeRequest,
  FinbotIncomeRequestBuildError,
} from "@/lib/finbot/buildIncomeRequest";
import { createFinbotIncomeDocument, type FinbotFetchFn } from "@/lib/finbot/createIncomeDocument";
import {
  claimAccountingIssuance,
  setAccountingDocumentFailed,
  setAccountingDocumentIssued,
  setAccountingDocumentUncertain,
} from "@/lib/finbot/claimAccountingIssuance";
import { getFinbotConfig } from "@/lib/finbot/env";
import { parseOrderCommercialSnapshot } from "@/lib/orders/commercialSnapshotAccess";
import { validatePersistedCheckoutCustomer } from "@/lib/orders/validatePersistedCheckoutCustomer";
import type { PaymentAttemptRecord } from "@/lib/orders/paymentAttemptStatus";
import { fetchPayPlusTransactionViewCardDetails } from "@/lib/payplus/fetchTransactionView";
import { getPayPlusConfig } from "@/lib/payplus/env";
import type { PayPlusFetchFn } from "@/lib/payplus/generatePaymentLink";
import {
  mergeValidatedPayPlusCardDetails,
  type ValidatedPayPlusCardDetails,
} from "@/lib/payplus/payPlusCardDetails";
import { Order } from "@/models/Order";

export type IssueFinbotIncomeResult =
  | { ok: true; outcome: "issued" | "skipped" }
  | { ok: true; outcome: "failed" | "uncertain" }
  | { ok: false; reason: string };

function findSucceededAttempt(
  attempts: PaymentAttemptRecord[] | undefined,
): PaymentAttemptRecord | null {
  return attempts?.find((a) => a.status === "succeeded") ?? null;
}

function cardFromAttempt(attempt: PaymentAttemptRecord): Partial<ValidatedPayPlusCardDetails> {
  const out: Partial<ValidatedPayPlusCardDetails> = {};
  if (attempt.payplusCardLastFourDigits?.trim()) {
    out.payplusCardLastFourDigits = attempt.payplusCardLastFourDigits.trim();
  }
  if (
    typeof attempt.payplusNumberOfPayments === "number" &&
    attempt.payplusNumberOfPayments >= 1
  ) {
    out.payplusNumberOfPayments = attempt.payplusNumberOfPayments;
  }
  return out;
}

async function resolvePayPlusCardDetails(params: {
  attempt: PaymentAttemptRecord;
  fetchFn?: PayPlusFetchFn;
}): Promise<ValidatedPayPlusCardDetails | null> {
  const fromAttempt = cardFromAttempt(params.attempt);
  const merged = mergeValidatedPayPlusCardDetails(fromAttempt, {});
  if (merged) {
    return merged;
  }

  const uid = params.attempt.payplusTransactionUid?.trim();
  if (!uid) {
    return null;
  }

  const payplusConfig = getPayPlusConfig();
  if (!payplusConfig) {
    return null;
  }

  const view = await fetchPayPlusTransactionViewCardDetails({
    config: payplusConfig,
    payplusTransactionUid: uid,
    fetchFn: params.fetchFn,
  });

  if (!view.ok) {
    return null;
  }

  if (fromAttempt.payplusCardLastFourDigits || fromAttempt.payplusNumberOfPayments) {
    return mergeValidatedPayPlusCardDetails(fromAttempt, view.card);
  }

  return view.card;
}

const CARD_DETAILS_ERROR =
  "לא ניתן להשלים פרטי אשראי (4 ספרות אחרונות / מספר תשלומים). נדרש לבדוק ב-PayPlus.";

const FINBOT_NOT_CONFIGURED_ERROR = "Finbot אינו מוגדר בשרת (FINBOT_API_SECRET חסר).";

export async function issueFinbotIncomeForOrder(params: {
  orderId: string;
  finbotFetchFn?: FinbotFetchFn;
  payplusFetchFn?: PayPlusFetchFn;
}): Promise<IssueFinbotIncomeResult> {
  await connectDb();

  const order = await Order.findById(params.orderId).lean();
  if (!order || order.status !== "paid") {
    return { ok: true, outcome: "skipped" };
  }

  const succeeded = findSucceededAttempt(
    (order.payment?.attempts ?? []) as PaymentAttemptRecord[],
  );
  const payplusTransactionUid = succeeded?.payplusTransactionUid?.trim();
  if (!succeeded || !payplusTransactionUid) {
    return { ok: true, outcome: "skipped" };
  }

  const claim = await claimAccountingIssuance({
    orderId: params.orderId,
    payplusTransactionUid,
  });

  if (!claim.ok) {
    return { ok: false, reason: claim.reason };
  }
  if (!claim.claimed) {
    return { ok: true, outcome: "skipped" };
  }

  const failAccounting = async (message: string, code: string | null = null) => {
    await setAccountingDocumentFailed({
      orderId: params.orderId,
      errorCode: code,
      errorMessage: message,
    });
    return { ok: true as const, outcome: "failed" as const };
  };

  const finbotConfig = getFinbotConfig();
  if (!finbotConfig) {
    return failAccounting(FINBOT_NOT_CONFIGURED_ERROR, "FINBOT_NOT_CONFIGURED");
  }

  const snapshotParsed = parseOrderCommercialSnapshot(order.commercialSnapshot);
  if (!snapshotParsed) {
    return failAccounting("חסר snapshot מסחרי קפוא להזמנה.", "MISSING_SNAPSHOT");
  }

  if (!validatePersistedCheckoutCustomer(order.customer)) {
    return failAccounting("פרטי לקוח חסרים או לא תקינים.", "INVALID_CUSTOMER");
  }

  const customer = {
    fullName: order.customer!.fullName!.trim(),
    email: order.customer!.email!.trim(),
    phone: order.customer!.phone!.trim(),
  };

  const card = await resolvePayPlusCardDetails({
    attempt: succeeded,
    fetchFn: params.payplusFetchFn,
  });
  if (!card) {
    return failAccounting(CARD_DETAILS_ERROR, "MISSING_CARD_DETAILS");
  }

  const completedAt = succeeded.completedAt?.trim() || new Date().toISOString();

  let body;
  try {
    body = buildFinbotIncomeRequest({
      orderId: params.orderId,
      snapshot: order.commercialSnapshot,
      customer,
      card,
      payplusTransactionUid,
      paymentCompletedAtIso: completedAt,
    });
  } catch (err) {
    if (err instanceof FinbotIncomeRequestBuildError) {
      return failAccounting(err.message, err.code);
    }
    return failAccounting("שגיאה בהכנת נתוני המסמך.", "BUILD_REQUEST");
  }

  const finbotResult = await createFinbotIncomeDocument({
    config: finbotConfig,
    body,
    fetchFn: params.finbotFetchFn,
  });

  if (!finbotResult.ok) {
    if (finbotResult.kind === "transport") {
      const isTimeout = finbotResult.errorMessage === "FINBOT_TIMEOUT";
      await setAccountingDocumentUncertain({
        orderId: params.orderId,
        errorMessage: isTimeout
          ? "הבקשה ל-Finbot נותקה בזמן. ייתכן שהמסמך כבר הופק — יש לאמת ב-Finbot לפני הפקה חוזרת."
          : "שגיאת תקשורת עם Finbot. ייתכן שהמסמך כבר הופק — יש לאמת ב-Finbot לפני הפקה חוזרת.",
      });
      return { ok: true, outcome: "uncertain" };
    }
    return failAccounting(finbotResult.errorMessage, finbotResult.errorCode);
  }

  const issuedAtIso = new Date().toISOString();
  await setAccountingDocumentIssued({
    orderId: params.orderId,
    documentUrl: finbotResult.documentUrl,
    documentNumber: finbotResult.documentNumber,
    payplusTransactionUid,
    issuedAtIso,
  });

  return { ok: true, outcome: "issued" };
}
