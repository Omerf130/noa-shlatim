export type OrderErrorCode =
  | "INVALID_DESIGN"
  | "INVALID_ASSET"
  | "UNSUPPORTED_CREATION_MODE"
  | "ORDER_IN_PROGRESS"
  | "STORAGE_FAILED"
  | "ORDER_PERSIST_FAILED"
  | "DATABASE_UNAVAILABLE"
  | "PAYMENT_IN_PROGRESS"
  | "PAYMENT_INVALID_STATE"
  | "PAYMENT_NOT_READY"
  | "PAYPLUS_LINK_FAILED"
  | "MATERIAL_UNAVAILABLE"
  | "MAGNET_SIZE_UNAVAILABLE"
  | "BACKGROUND_UNAVAILABLE";

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
  PAYMENT_IN_PROGRESS: "תשלום כבר בתהליך. נסו שוב בעוד רגע.",
  PAYMENT_INVALID_STATE: "לא ניתן להמשיך לתשלום עבור הזמנה זו.",
  PAYMENT_NOT_READY: "יש להשלים את פרטי ההזמנה לפני תשלום.",
  PAYPLUS_LINK_FAILED:
    "לא הצלחנו לפתוח את דף התשלום. נסו שוב בעוד רגע.",
  MATERIAL_UNAVAILABLE:
    "החומר שבחרתם אינו זמין כרגע. בחרו חומר אחר והמשיכו.",
  MAGNET_SIZE_UNAVAILABLE:
    "גודל המגנט שבחרתם אינו זמין. בחרו גודל אחר או חזרו לעריכת השלט.",
  BACKGROUND_UNAVAILABLE:
    "הרקע שבחרתם אינו זמין כרגע. בחרו רקע אחר והמשיכו.",
};

export function userMessageForOrderCode(code: OrderErrorCode): string {
  return USER_MESSAGES[code];
}
