"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authenticateAdmin } from "@/lib/auth/authenticateAdmin";
import { GENERIC_AUTH_ERROR } from "@/lib/auth/constants";
import {
  clearLoginFailures,
  clientKeyFromHeaders,
  isLoginRateLimited,
  recordLoginFailure,
} from "@/lib/auth/loginRateLimit";
import { loginSchema } from "@/lib/auth/schemas";
import { createAdminSession } from "@/lib/auth/session";
import { connectDb } from "@/lib/db/connect";
import { AdminUser } from "@/models/AdminUser";

export type LoginFormState = {
  error?: string;
};

export async function loginAdmin(
  _prevState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: GENERIC_AUTH_ERROR };
  }

  const headersList = await headers();
  const clientKey = clientKeyFromHeaders(headersList);

  if (isLoginRateLimited(clientKey)) {
    return { error: GENERIC_AUTH_ERROR };
  }

  const user = await authenticateAdmin(parsed.data.email, parsed.data.password);

  if (!user) {
    recordLoginFailure(clientKey);
    return { error: GENERIC_AUTH_ERROR };
  }

  clearLoginFailures(clientKey);
  await createAdminSession(user._id.toString());

  await connectDb();
  await AdminUser.updateOne({ _id: user._id }, { lastLoginAt: new Date() });

  redirect("/admin");
}
