export type AiErrorCode =
  | "AI_NOT_CONFIGURED"
  | "AI_DISABLED"
  | "INVALID_STYLE"
  | "INVALID_IMAGE"
  | "IMAGE_TOO_LARGE"
  | "RATE_LIMITED"
  | "GENERATION_TIMEOUT"
  | "PROVIDER_ERROR"
  | "GENERATION_FAILED";

export class AiIllustrationError extends Error {
  readonly code: AiErrorCode;
  readonly httpStatus: number;

  constructor(code: AiErrorCode, message: string, httpStatus: number) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const USER_MESSAGES: Record<AiErrorCode, string> = {
  AI_NOT_CONFIGURED: "יצירת איור ב-AI אינה מוגדרת בשרת.",
  AI_DISABLED: "יצירת איור ב-AI אינה פעילה כרגע.",
  INVALID_STYLE: "סגנון האיור שנבחר אינו תקין.",
  INVALID_IMAGE: "קובץ התמונה אינו תקין. נא להעלות JPG, PNG או WEBP.",
  IMAGE_TOO_LARGE: "קובץ התמונה גדול מדי.",
  RATE_LIMITED: "בוצעו יותר מדי בקשות. נסו שוב מאוחר יותר.",
  GENERATION_TIMEOUT: "יצירת האיור ארכה יותר מדי. נסו שוב.",
  PROVIDER_ERROR: "לא הצלחנו ליצור את האיור. נסו שוב.",
  GENERATION_FAILED: "יצירת האיור נכשלה. נסו שוב.",
};

export function userMessageForCode(code: AiErrorCode): string {
  return USER_MESSAGES[code];
}
