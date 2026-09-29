import { getAdminSession, type SafeAdmin } from "@/lib/auth/session";
import { NextResponse } from "next/server";

export async function requireAdminApiSession(): Promise<
  SafeAdmin | NextResponse
> {
  const admin = await getAdminSession();
  if (!admin) {
    return NextResponse.json(
      { ok: false, message: "Unauthorized" },
      { status: 401 },
    );
  }
  return admin;
}

export function isAdminApiAuthFailure(
  result: SafeAdmin | NextResponse,
): result is NextResponse {
  return result instanceof NextResponse;
}
