import { connectDb } from "@/lib/db/connect";
import { evaluateAccountingClaimSkip } from "@/lib/finbot/accountingIssuanceRules";
import {
  ACCOUNTING_PENDING_STALE_MS,
  accountingExternalRefForOrder,
} from "@/lib/orders/accountingDocument";
import { Order } from "@/models/Order";

export type ClaimAccountingIssuanceResult =
  | { ok: true; claimed: true; attemptCount: number }
  | { ok: true; claimed: false; reason: "issued" | "pending_fresh" | "uncertain" | "not_paid" | "not_found" }
  | { ok: false; reason: "db_error" };

export async function claimAccountingIssuance(params: {
  orderId: string;
  payplusTransactionUid: string;
  nowMs?: number;
}): Promise<ClaimAccountingIssuanceResult> {
  const nowMs = params.nowMs ?? Date.now();
  const nowIso = new Date(nowMs).toISOString();
  const staleBeforeIso = new Date(nowMs - ACCOUNTING_PENDING_STALE_MS).toISOString();
  const externalRef = accountingExternalRefForOrder(params.orderId);

  await connectDb();

  const existing = await Order.findById(params.orderId)
    .select({ status: 1, accountingDocument: 1 })
    .lean();

  if (!existing) {
    return { ok: true, claimed: false, reason: "not_found" };
  }

  const doc = existing.accountingDocument as { status?: string; lastAttemptAt?: string } | undefined;
  const skip = evaluateAccountingClaimSkip(existing.status, doc, nowMs);
  if (skip === "not_paid") {
    return { ok: true, claimed: false, reason: "not_paid" };
  }
  if (skip === "issued") {
    return { ok: true, claimed: false, reason: "issued" };
  }
  if (skip === "uncertain") {
    return { ok: true, claimed: false, reason: "uncertain" };
  }
  if (skip === "pending_fresh") {
    return { ok: true, claimed: false, reason: "pending_fresh" };
  }

  const updated = await Order.findOneAndUpdate(
    {
      _id: params.orderId,
      status: "paid",
      $or: [
        { accountingDocument: { $exists: false } },
        { "accountingDocument.status": { $exists: false } },
        { "accountingDocument.status": "failed" },
        {
          "accountingDocument.status": "pending",
          "accountingDocument.lastAttemptAt": { $lte: staleBeforeIso },
        },
      ],
    },
    {
      $set: {
        "accountingDocument.provider": "finbot",
        "accountingDocument.type": "tax_invoice_receipt",
        "accountingDocument.status": "pending",
        "accountingDocument.lastAttemptAt": nowIso,
        "accountingDocument.externalRef": externalRef,
        "accountingDocument.payplusTransactionUid": params.payplusTransactionUid,
      },
      $inc: { "accountingDocument.attemptCount": 1 },
    },
    { new: true, upsert: false },
  ).lean();

  if (!updated) {
    const refreshed = await Order.findById(params.orderId)
      .select({ status: 1, accountingDocument: 1 })
      .lean();
    const refreshedDoc = refreshed?.accountingDocument as { status?: string; lastAttemptAt?: string } | undefined;
    if (refreshedDoc?.status === "issued") {
      return { ok: true, claimed: false, reason: "issued" };
    }
    if (refreshedDoc?.status === "uncertain") {
      return { ok: true, claimed: false, reason: "uncertain" };
    }
    if (
      refreshedDoc?.status === "pending" &&
      refreshedDoc.lastAttemptAt &&
      refreshedDoc.lastAttemptAt > staleBeforeIso
    ) {
      return { ok: true, claimed: false, reason: "pending_fresh" };
    }
    return { ok: true, claimed: false, reason: "pending_fresh" };
  }

  const attemptCount =
    (updated.accountingDocument as { attemptCount?: number } | undefined)?.attemptCount ?? 1;

  return { ok: true, claimed: true, attemptCount };
}

export async function setAccountingDocumentIssued(params: {
  orderId: string;
  documentUrl: string;
  documentNumber: string | null;
  payplusTransactionUid: string;
  issuedAtIso: string;
}): Promise<void> {
  await connectDb();
  const $set: Record<string, unknown> = {
    "accountingDocument.status": "issued",
    "accountingDocument.documentUrl": params.documentUrl,
    "accountingDocument.issuedAt": params.issuedAtIso,
    "accountingDocument.payplusTransactionUid": params.payplusTransactionUid,
  };
  if (params.documentNumber) {
    $set["accountingDocument.documentNumber"] = params.documentNumber;
  }
  await Order.updateOne(
    { _id: params.orderId, status: "paid", "accountingDocument.status": "pending" },
    {
      $set,
      $unset: {
        "accountingDocument.errorCode": "",
        "accountingDocument.errorMessage": "",
      },
    },
  );
}

export async function setAccountingDocumentFailed(params: {
  orderId: string;
  errorCode: string | null;
  errorMessage: string;
}): Promise<void> {
  await connectDb();
  await Order.updateOne(
    {
      _id: params.orderId,
      status: "paid",
      "accountingDocument.status": "pending",
    },
    {
      $set: {
        "accountingDocument.status": "failed",
        "accountingDocument.errorCode": params.errorCode ?? undefined,
        "accountingDocument.errorMessage": params.errorMessage,
      },
    },
  );
}

export async function setAccountingDocumentUncertain(params: {
  orderId: string;
  errorMessage: string;
}): Promise<void> {
  await connectDb();
  await Order.updateOne(
    {
      _id: params.orderId,
      status: "paid",
      "accountingDocument.status": "pending",
    },
    {
      $set: {
        "accountingDocument.status": "uncertain",
        "accountingDocument.errorCode": "UNCERTAIN",
        "accountingDocument.errorMessage": params.errorMessage,
      },
    },
  );
}
