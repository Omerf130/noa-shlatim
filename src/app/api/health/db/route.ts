import { connectDb } from "@/lib/db/connect";
import mongoose from "mongoose";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    await connectDb();
    const db = mongoose.connection.db;
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Database unavailable" },
        { status: 503 },
      );
    }
    await db.admin().ping();
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[api/health/db]", message);
    return NextResponse.json(
      { ok: false, error: "Database connection failed" },
      { status: 503 },
    );
  }
}
