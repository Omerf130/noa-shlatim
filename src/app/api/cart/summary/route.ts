import { getCartSummaryForRequest } from "@/lib/cart/getCartSummaryForRequest";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const summary = await getCartSummaryForRequest(request);
  return NextResponse.json(summary);
}
