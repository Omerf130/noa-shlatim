import { connectDb } from "@/lib/db/connect";
import { DUMMY_PASSWORD_HASH } from "@/lib/auth/constants";
import { normalizeAdminEmail } from "@/lib/auth/normalizeEmail";
import { verifyPassword } from "@/lib/auth/password";
import { AdminUser, type AdminUserDocument } from "@/models/AdminUser";

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<AdminUserDocument | null> {
  await connectDb();
  const normalized = normalizeAdminEmail(email);
  const user = await AdminUser.findOne({ email: normalized }).select("+passwordHash");

  const hashToCompare = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const passwordOk = await verifyPassword(password, hashToCompare);

  if (!user || !user.isActive || !passwordOk) {
    return null;
  }

  return user;
}
