export const DIAGNOSTIC_OPERATIONS = [
  "generate_final",
  "illustration_generate",
  "cart_add_item",
  "cart_convert",
  "payment_init",
] as const;

export type DiagnosticOperation = (typeof DIAGNOSTIC_OPERATIONS)[number];

export const DIAGNOSTIC_STAGES = [
  "auth",
  "parse_body",
  "validate",
  "provider",
  "storage",
  "persist",
  "response",
  "client",
  "unknown",
] as const;

export type DiagnosticStage = (typeof DIAGNOSTIC_STAGES)[number];

export const CLIENT_DIAGNOSTIC_STAGES = [
  "composition",
  "fetch",
  "json_parse",
  "decode",
  "malformed_response",
] as const;

export type ClientDiagnosticStage = (typeof CLIENT_DIAGNOSTIC_STAGES)[number];

export type OperationFailureSource = "server" | "client";

export type OperationFailureRecord = {
  traceId: string;
  operation: DiagnosticOperation;
  stage: DiagnosticStage;
  errorCode: string;
  httpStatus: number;
  durationMs: number;
  source: OperationFailureSource;
  createdAt?: Date;
};
