import { getCartDetailForRequest } from "@/lib/cart/getCartDetailForRequest";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const detail = await getCartDetailForRequest(request);
  return NextResponse.json(detail);
}
