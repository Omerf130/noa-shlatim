import { config } from "dotenv";
import { resolve } from "node:path";
import { normalizeAdminEmail } from "../src/lib/auth/normalizeEmail";
import { hashPassword } from "../src/lib/auth/password";
import { adminSeedEnvSchema } from "../src/lib/auth/schemas";
import { connectDb } from "../src/lib/db/connect";
import { AdminUser } from "../src/models/AdminUser";

config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const parsed = adminSeedEnvSchema.safeParse({
    email: process.env.ADMIN_SEED_EMAIL,
    password: process.env.ADMIN_SEED_PASSWORD,
  });

  if (!parsed.success) {
    console.error(
      "Missing or invalid ADMIN_SEED_EMAIL / ADMIN_SEED_PASSWORD in .env.local (password min 8 characters, valid email).",
    );
    process.exit(1);
  }

  const email = normalizeAdminEmail(parsed.data.email);

  await connectDb();

  const existing = await AdminUser.findOne({ email });
  if (existing) {
    console.log(`Admin already exists for ${email}; no changes made.`);
    process.exit(0);
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await AdminUser.create({
    email,
    passwordHash,
    isActive: true,
  });

  console.log(`Admin created for ${email}.`);
  console.log("You may remove ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD from .env.local.");
  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("Seed failed:", message);
  process.exit(1);
});
