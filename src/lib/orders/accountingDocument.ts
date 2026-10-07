export const ACCOUNTING_DOCUMENT_STATUSES = [
  "pending",
  "issued",
  "failed",
  "uncertain",
] as const;

export type AccountingDocumentStatus = (typeof ACCOUNTING_DOCUMENT_STATUSES)[number];

export type OrderAccountingDocument = {
  provider: "finbot";
  type: "tax_invoice_receipt";
  status: AccountingDocumentStatus;
  documentUrl?: string;
  documentNumber?: string;
  issuedAt?: string;
  lastAttemptAt?: string;
  attemptCount: number;
  externalRef?: string;
  payplusTransactionUid?: string;
  errorCode?: string;
  errorMessage?: string;
};

/** Fresh pending claims younger than this are not re-claimed. */
export const ACCOUNTING_PENDING_STALE_MS = 5 * 60 * 1000;

export function accountingExternalRefForOrder(orderId: string): string {
  return `order:${orderId}`;
}
