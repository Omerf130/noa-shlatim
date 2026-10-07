import { CartError, userMessageForCartCode } from "@/lib/cart/cartErrors";
import { NextResponse } from "next/server";

export function cartErrorResponse(err: CartError) {
  return NextResponse.json(
    {
      ok: false,
      code: err.code,
      message: userMessageForCartCode(err.code),
    },
    { status: err.httpStatus },
  );
}

export function handleCartRouteError(err: unknown) {
  if (err instanceof CartError) {
    return cartErrorResponse(err);
  }
  console.error("[api/cart]", err);
  return NextResponse.json(
    { ok: false, code: "UNKNOWN", message: "אירעה שגיאה. נסו שוב." },
    { status: 500 },
  );
}
