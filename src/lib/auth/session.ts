import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connectDb } from "@/lib/db/connect";
import { ADMIN_SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from "@/lib/auth/constants";
import { AdminSession } from "@/models/AdminSession";
import { AdminUser, type SafeAdmin } from "@/models/AdminUser";

export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

function sessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export async function createAdminSession(adminUserId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await connectDb();
  await AdminSession.create({
    tokenHash,
    adminUserId,
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_SESSION_COOKIE,
    token,
    sessionCookieOptions(SESSION_MAX_AGE_SECONDS),
  );
}

export async function destroyAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;

  if (token) {
    await connectDb();
    await AdminSession.deleteOne({ tokenHash: hashSessionToken(token) });
  }

  cookieStore.set(ADMIN_SESSION_COOKIE, "", sessionCookieOptions(0));
}

export async function getAdminSession(): Promise<SafeAdmin | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) {
    return null;
  }

  await connectDb();
  const session = await AdminSession.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) {
    return null;
  }

  const user = await AdminUser.findById(session.adminUserId);
  if (!user || !user.isActive) {
    return null;
  }

  return user.toSafeObject();
}

export async function requireAdminSession(): Promise<SafeAdmin> {
  const admin = await getAdminSession();
  if (!admin) {
    redirect("/admin/login");
  }
  return admin;
}

export type { SafeAdmin };
