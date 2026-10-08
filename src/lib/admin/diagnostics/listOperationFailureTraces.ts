import { connectDb } from "@/lib/db/connect";
import {
  DIAGNOSTIC_OPERATIONS,
  type DiagnosticOperation,
} from "@/lib/diagnostics/types";
import { OperationFailureTrace } from "@/models/OperationFailureTrace";

export type AdminOperationFailureRow = {
  traceId: string;
  operation: DiagnosticOperation;
  stage: string;
  errorCode: string;
  httpStatus: number;
  durationMs: number;
  source: string;
  createdAt: string;
};

export type AdminOperationFailureList = {
  items: AdminOperationFailureRow[];
  operationFilter: DiagnosticOperation | "all";
  traceSearch: string | null;
};

function parseOperationFilter(value: unknown): DiagnosticOperation | "all" {
  if (typeof value !== "string" || !value.trim()) {
    return "all";
  }
  const trimmed = value.trim();
  if ((DIAGNOSTIC_OPERATIONS as readonly string[]).includes(trimmed)) {
    return trimmed as DiagnosticOperation;
  }
  return "all";
}

function normalizeTraceSearch(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const q = value.trim().replace(/-/g, "").toUpperCase();
  if (!/^[0-9A-F]{4,32}$/.test(q)) {
    return null;
  }
  return q;
}

export async function listOperationFailureTraces(params: {
  operation?: unknown;
  trace?: unknown;
  limit?: unknown;
}): Promise<AdminOperationFailureList> {
  const operationFilter = parseOperationFilter(params.operation);
  const traceSearch = normalizeTraceSearch(params.trace);
  const limitRaw = params.limit;
  const limit =
    typeof limitRaw === "string" && /^\d+$/.test(limitRaw)
      ? Math.min(200, Math.max(1, Number.parseInt(limitRaw, 10)))
      : 50;

  await connectDb();

  const filter: Record<string, unknown> = {};
  if (operationFilter !== "all") {
    filter.operation = operationFilter;
  }
  if (traceSearch) {
    filter.traceId = { $regex: `${traceSearch}$`, $options: "i" };
  }

  const rows = await OperationFailureTrace.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  const items: AdminOperationFailureRow[] = rows.map((row) => ({
    traceId: row.traceId,
    operation: row.operation as DiagnosticOperation,
    stage: row.stage,
    errorCode: row.errorCode,
    httpStatus: row.httpStatus,
    durationMs: row.durationMs,
    source: row.source,
    createdAt:
      row.createdAt instanceof Date
        ? row.createdAt.toISOString()
        : new Date(String(row.createdAt)).toISOString(),
  }));

  return { items, operationFilter, traceSearch };
}
