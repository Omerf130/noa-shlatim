import { ACCOUNTING_PENDING_STALE_MS } from "@/lib/orders/accountingDocument";

export type AccountingClaimSkipReason =
  | "issued"
  | "pending_fresh"
  | "uncertain"
  | "not_paid";

export function evaluateAccountingClaimSkip(
  orderStatus: string,
  accountingDocument: { status?: string; lastAttemptAt?: string } | null | undefined,
  nowMs: number,
): AccountingClaimSkipReason | null {
  if (orderStatus !== "paid") {
    return "not_paid";
  }

  const status = accountingDocument?.status;
  if (status === "issued") {
    return "issued";
  }
  if (status === "uncertain") {
    return "uncertain";
  }
  if (status === "pending") {
    const last = accountingDocument?.lastAttemptAt?.trim();
    const staleBeforeIso = new Date(nowMs - ACCOUNTING_PENDING_STALE_MS).toISOString();
    if (last && last > staleBeforeIso) {
      return "pending_fresh";
    }
  }

  return null;
}
