export type OrderErrorCode =
  | "INVALID_DESIGN"
  | "INVALID_ASSET"
  | "UNSUPPORTED_CREATION_MODE"
  | "ORDER_IN_PROGRESS"
  | "STORAGE_FAILED"
  | "ORDER_PERSIST_FAILED"
  | "DATABASE_UNAVAILABLE";

export class OrderError extends Error {
  readonly code: OrderErrorCode;
  readonly httpStatus: number;

  constructor(code: OrderErrorCode, message: string, httpStatus: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const USER_MESSAGES: Record<OrderErrorCode, string> = {
  INVALID_DESIGN: "פרטי העיצוב אינם תקינים.",
  INVALID_ASSET: "קובץ התמונה אינו תקין.",
  UNSUPPORTED_CREATION_MODE: "סוג יצירה זה אינו נתמך בשלב זה.",
  ORDER_IN_PROGRESS: "ההזמנה כבר נשמרת. נסו שוב בעוד רגע.",
  STORAGE_FAILED: "לא הצלחנו לשמור את הקבצים. נסו שוב.",
  ORDER_PERSIST_FAILED: "לא הצלחנו לשמור את ההזמנה. נסו שוב.",
  DATABASE_UNAVAILABLE: "שירות ההזמנות אינו זמין כרגע.",
};

export function userMessageForOrderCode(code: OrderErrorCode): string {
  return USER_MESSAGES[code];
}
