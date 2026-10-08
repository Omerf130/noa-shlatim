"use client";

import type { ClientDiagnosticStage, DiagnosticOperation } from "@/lib/diagnostics/types";

type ReportResponse =
  | { ok: true; traceId: string }
  | { ok: false; code: string };

/**
 * Best-effort client-side failure report when the server never returned a traceId.
 */
export async function reportClientOperationFailure(params: {
  operation: DiagnosticOperation;
  clientStage: ClientDiagnosticStage;
  traceId?: string | null;
  httpStatus?: number;
}): Promise<string | null> {
  try {
    const res = await fetch("/api/diagnostics/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        operation: params.operation,
        clientStage: params.clientStage,
        traceId: params.traceId ?? undefined,
        httpStatus: params.httpStatus ?? 0,
      }),
    });
    const json = (await res.json()) as ReportResponse;
    if (json.ok && json.traceId) {
      return json.traceId;
    }
  } catch {
    /* ignore */
  }
  return params.traceId?.trim() || null;
}
