export const ADD_TO_CART_NETWORK_ERROR_MESSAGE =
  "לא הצלחנו להוסיף את השלט לסל. בדקו חיבור ונסו שוב.";

export const ADD_TO_CART_PAYLOAD_TOO_LARGE_MESSAGE =
  "גודל הקבצים חורג מהמגבלה. אם הבעיה נמשכת, צרו את השלט מחדש או פנו אלינו.";

export const ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE =
  "השרת אינו זמין כרגע. נסו שוב בעוד רגע.";

export const ADD_TO_CART_INVALID_RESPONSE_MESSAGE =
  "תגובה לא תקינה מהשרת. נסו שוב בעוד רגע.";

/**
 * Maps HTTP status (and optional parsed API code) to user-facing Hebrew copy.
 */
export function messageForAddToCartHttpFailure(
  status: number,
  apiMessage?: string | null,
): string {
  if (apiMessage?.trim()) {
    return apiMessage.trim();
  }
  if (status === 413) {
    return ADD_TO_CART_PAYLOAD_TOO_LARGE_MESSAGE;
  }
  if (status === 502 || status === 503 || status === 504) {
    return ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE;
  }
  if (status === 0) {
    return ADD_TO_CART_NETWORK_ERROR_MESSAGE;
  }
  if (status >= 500) {
    return ADD_TO_CART_SERVER_UNAVAILABLE_MESSAGE;
  }
  return ADD_TO_CART_INVALID_RESPONSE_MESSAGE;
}
