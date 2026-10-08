import type { DiagnosticOperation } from "@/lib/diagnostics/types";

export const NETWORK_ERROR_MESSAGE =
  "לא הצלחנו להתחבר לשרת. בדקו חיבור ונסו שוב.";

export const PAYLOAD_TOO_LARGE_MESSAGE =
  "גודל הקבצים חורג מהמגבלה. אם הבעיה נמשכת, צרו את השלט מחדש או פנו אלינו.";

export const SERVER_UNAVAILABLE_MESSAGE =
  "השרת אינו זמין כרגע. נסו שוב בעוד רגע.";

export const INVALID_RESPONSE_MESSAGE =
  "תגובה לא תקינה מהשרת. נסו שוב בעוד רגע.";

export const CLIENT_COMPOSITION_MESSAGE =
  "לא הצלחנו להכין את תמונת העיצוב במכשיר. נסו שוב או רעננו את העמוד.";

export const CLIENT_DECODE_MESSAGE =
  "לא הצלחנו להציג את התמונה שהתקבלה. נסו שוב.";

const OPERATION_CONTEXT: Record<
  DiagnosticOperation,
  { genericFailure: string; prepareOrder?: string }
> = {
  generate_final: {
    genericFailure: "לא הצלחנו ליצור את השלט. נסו שוב.",
  },
  illustration_generate: {
    genericFailure: "לא הצלחנו ליצור את האיור. נסו שוב.",
  },
  cart_add_item: {
    genericFailure: "לא הצלחנו להוסיף את השלט לסל. נסו שוב.",
  },
  cart_convert: {
    genericFailure: "לא הצלחנו להכין את ההזמנה. נסו שוב.",
    prepareOrder: "לא הצלחנו להכין את ההזמנה. בדקו חיבור ונסו שוב.",
  },
  payment_init: {
    genericFailure: "לא הצלחנו לפתוח את דף התשלום. נסו שוב.",
  },
};

export type ClassifyClientFailureInput = {
  operation: DiagnosticOperation;
  status: number;
  parseFailed: boolean;
  apiMessage?: string | null;
  clientPhase?: "composition" | "decode" | null;
};

/**
 * Maps HTTP/client outcomes to Hebrew copy. Never uses "connection" wording when status > 0.
 */
export function messageForClientOperationFailure(
  input: ClassifyClientFailureInput,
): string {
  if (input.clientPhase === "composition") {
    return CLIENT_COMPOSITION_MESSAGE;
  }
  if (input.clientPhase === "decode") {
    return CLIENT_DECODE_MESSAGE;
  }

  if (input.apiMessage?.trim()) {
    return input.apiMessage.trim();
  }

  if (input.status === 0) {
    if (input.operation === "cart_convert") {
      return (
        OPERATION_CONTEXT.cart_convert.prepareOrder ?? NETWORK_ERROR_MESSAGE
      );
    }
    return NETWORK_ERROR_MESSAGE;
  }

  if (input.status === 413) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  if (input.status === 502 || input.status === 503 || input.status === 504) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  if (input.parseFailed) {
    if (input.status >= 500) {
      return SERVER_UNAVAILABLE_MESSAGE;
    }
    if (input.status === 413) {
      return PAYLOAD_TOO_LARGE_MESSAGE;
    }
    return INVALID_RESPONSE_MESSAGE;
  }

  if (input.status >= 500) {
    return SERVER_UNAVAILABLE_MESSAGE;
  }

  return OPERATION_CONTEXT[input.operation].genericFailure;
}

/** @deprecated use messageForClientOperationFailure — kept for cart conversion import alias */
export function messageForCartConversionHttpFailure(
  status: number,
  parseFailed: boolean,
  apiMessage?: string | null,
): string {
  return messageForClientOperationFailure({
    operation: "cart_convert",
    status,
    parseFailed,
    apiMessage,
  });
}
