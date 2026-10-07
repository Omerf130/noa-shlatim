export type CartErrorCode =
  | "CART_NOT_FOUND"
  | "CART_NOT_ACTIVE"
  | "CART_LINE_NOT_FOUND"
  | "INVALID_QUANTITY"
  | "CART_UNAUTHORIZED";

export class CartError extends Error {
  readonly code: CartErrorCode;
  readonly httpStatus: number;

  constructor(code: CartErrorCode, message: string, httpStatus: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const USER_MESSAGES: Record<CartErrorCode, string> = {
  CART_NOT_FOUND: "לא נמצא סל פעיל.",
  CART_NOT_ACTIVE: "הסל אינו פעיל יותר.",
  CART_LINE_NOT_FOUND: "הפריט לא נמצא בסל.",
  INVALID_QUANTITY: "כמות לא תקינה.",
  CART_UNAUTHORIZED: "אין גישה לסל.",
};

export function userMessageForCartCode(code: CartErrorCode): string {
  return USER_MESSAGES[code];
}
