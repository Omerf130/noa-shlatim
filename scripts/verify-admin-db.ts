/**
 * Local verification helper — reads .env.local, never prints passwords or URI.
 */
import { config } from "dotenv";
import { resolve } from "node:path";
import { authenticateAdmin } from "../src/lib/auth/authenticateAdmin";
import { normalizeAdminEmail } from "../src/lib/auth/normalizeEmail";
import { connectDb } from "../src/lib/db/connect";
import { AdminUser } from "../src/models/AdminUser";

config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const seedEmail = process.env.ADMIN_SEED_EMAIL;
  const seedPassword = process.env.ADMIN_SEED_PASSWORD;

  if (!seedEmail || !seedPassword) {
    console.error("ADMIN_SEED_EMAIL and ADMIN_SEED_PASSWORD required in .env.local for credential checks.");
    process.exit(1);
  }

  await connectDb();
  const email = normalizeAdminEmail(seedEmail);
  const doc = await AdminUser.findOne({ email }).select("+passwordHash").lean();

  if (!doc) {
    console.error("No AdminUser found for seed email.");
    process.exit(1);
  }

  const raw = doc as Record<string, unknown>;
  const hasPlainPassword = "password" in raw && raw.password !== undefined;
  const hasHash =
    typeof raw.passwordHash === "string" && raw.passwordHash.startsWith("$2");

  console.log("AdminUser exists:", email);
  console.log("Has passwordHash field:", hasHash);
  console.log("Has plaintext password field:", hasPlainPassword);

  const wrongUser = await authenticateAdmin(email, "wrong-password-xyz-12345");
  console.log("Wrong password rejected:", wrongUser === null);

  const wrongEmail = await authenticateAdmin("nonexistent@example.invalid", seedPassword);
  console.log("Wrong email rejected:", wrongEmail === null);

  const ok = await authenticateAdmin(seedEmail, seedPassword);
  console.log("Correct credentials accepted:", ok !== null);

  process.exit(0);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : "Unknown error";
  console.error("Verify failed:", message);
  process.exit(1);
});
