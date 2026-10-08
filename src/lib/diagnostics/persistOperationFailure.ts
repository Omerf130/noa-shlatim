import { connectDb } from "@/lib/db/connect";
import { OperationFailureTrace } from "@/models/OperationFailureTrace";
import { sanitizeErrorCode } from "@/lib/diagnostics/sanitizeErrorCode";
import type { OperationFailureRecord } from "@/lib/diagnostics/types";

export type PersistOperationFailureDeps = {
  connect: () => Promise<unknown>;
  create: (doc: OperationFailureRecord) => Promise<unknown>;
};

const defaultDeps: PersistOperationFailureDeps = {
  connect: connectDb,
  create: async (doc) => OperationFailureTrace.create(doc),
};

/**
 * Fire-and-forget safe persistence. Never throws to callers.
 */
export async function persistOperationFailure(
  record: OperationFailureRecord,
  deps: PersistOperationFailureDeps = defaultDeps,
): Promise<void> {
  try {
    await deps.connect();
    await deps.create({
      ...record,
      errorCode: sanitizeErrorCode(record.errorCode),
      createdAt: record.createdAt ?? new Date(),
    });
  } catch {
    /* diagnostic writes must not affect customer flows */
  }
}

export function scheduleOperationFailure(record: OperationFailureRecord): void {
  void persistOperationFailure(record);
}
