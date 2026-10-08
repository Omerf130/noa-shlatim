import { NextResponse } from "next/server";
import { TRACE_ID_HEADER } from "@/lib/diagnostics/config";
import { scheduleOperationFailure } from "@/lib/diagnostics/persistOperationFailure";
import { sanitizeErrorCode } from "@/lib/diagnostics/sanitizeErrorCode";
import type { DiagnosticOperation, DiagnosticStage } from "@/lib/diagnostics/types";

export type OperationTrace = {
  traceId: string;
  operation: DiagnosticOperation;
  durationMs: () => number;
  okJson: (body: Record<string, unknown>, init?: ResponseInit) => NextResponse;
  failJson: (params: {
    stage: DiagnosticStage;
    code: string;
    status: number;
    message: string;
  }) => NextResponse;
  recordFailure: (params: {
    stage: DiagnosticStage;
    code: string;
    status: number;
  }) => void;
};

export function beginOperationTrace(operation: DiagnosticOperation): OperationTrace {
  const traceId = crypto.randomUUID();
  const startedAt = Date.now();

  const durationMs = () => Math.max(0, Date.now() - startedAt);

  function attachTrace(response: NextResponse): NextResponse {
    response.headers.set(TRACE_ID_HEADER, traceId);
    return response;
  }

  function recordFailure(params: {
    stage: DiagnosticStage;
    code: string;
    status: number;
  }): void {
    scheduleOperationFailure({
      traceId,
      operation,
      stage: params.stage,
      errorCode: sanitizeErrorCode(params.code),
      httpStatus: params.status,
      durationMs: durationMs(),
      source: "server",
    });
  }

  return {
    traceId,
    operation,
    durationMs,
    recordFailure,
    okJson(body, init) {
      const payload = { ...body, traceId };
      return attachTrace(NextResponse.json(payload, init));
    },
    failJson({ stage, code, status, message }) {
      recordFailure({ stage, code, status });
      return attachTrace(
        NextResponse.json(
          {
            ok: false,
            code: sanitizeErrorCode(code),
            message,
            traceId,
          },
          { status },
        ),
      );
    },
  };
}
