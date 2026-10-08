import { clientKeyFromRequest } from "@/lib/ai/devGuard";
import { checkClientDiagnosticReportRateLimit } from "@/lib/diagnostics/clientReportRateLimit";
import { scheduleOperationFailure } from "@/lib/diagnostics/persistOperationFailure";
import {
  clientStageToErrorCode,
  sanitizeErrorCode,
} from "@/lib/diagnostics/sanitizeErrorCode";
import {
  CLIENT_DIAGNOSTIC_STAGES,
  DIAGNOSTIC_OPERATIONS,
  type ClientDiagnosticStage,
  type DiagnosticOperation,
} from "@/lib/diagnostics/types";
import { TRACE_ID_HEADER } from "@/lib/diagnostics/config";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const UUIDish =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function parseOperation(value: unknown): DiagnosticOperation | null {
  if (typeof value !== "string") {
    return null;
  }
  return (DIAGNOSTIC_OPERATIONS as readonly string[]).includes(value)
    ? (value as DiagnosticOperation)
    : null;
}

function parseClientStage(value: unknown): ClientDiagnosticStage | null {
  if (typeof value !== "string") {
    return null;
  }
  return (CLIENT_DIAGNOSTIC_STAGES as readonly string[]).includes(value)
    ? (value as ClientDiagnosticStage)
    : null;
}

function parseTraceId(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }
  const trimmed = value.trim();
  return UUIDish.test(trimmed) ? trimmed : null;
}

export async function POST(request: Request) {
  const clientKey = clientKeyFromRequest(request);
  if (!checkClientDiagnosticReportRateLimit(clientKey)) {
    return NextResponse.json({ ok: false, code: "RATE_LIMITED" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const record = body && typeof body === "object" ? (body as Record<string, unknown>) : null;
  const operation = parseOperation(record?.operation);
  const clientStage = parseClientStage(record?.clientStage);
  if (!operation || !clientStage) {
    return NextResponse.json({ ok: false, code: "INVALID_BODY" }, { status: 400 });
  }

  const traceId = parseTraceId(record?.traceId) ?? crypto.randomUUID();
  const httpStatusRaw = record?.httpStatus;
  const httpStatus =
    typeof httpStatusRaw === "number" && Number.isFinite(httpStatusRaw)
      ? Math.max(0, Math.min(599, Math.floor(httpStatusRaw)))
      : 0;

  scheduleOperationFailure({
    traceId,
    operation,
    stage: "client",
    errorCode: clientStageToErrorCode(clientStage),
    httpStatus,
    durationMs: 0,
    source: "client",
  });

  const response = NextResponse.json({ ok: true, traceId });
  response.headers.set(TRACE_ID_HEADER, traceId);
  return response;
}

/** Reject unexpected fields in error codes for tests */
export function sanitizeReportErrorCode(code: unknown): string {
  return sanitizeErrorCode(code);
}
