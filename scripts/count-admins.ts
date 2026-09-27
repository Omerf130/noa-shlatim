import { config } from "dotenv";
import { resolve } from "node:path";
import { connectDb } from "../src/lib/db/connect";
import { AdminUser } from "../src/models/AdminUser";
import { AdminSession } from "../src/models/AdminSession";

config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  await connectDb();
  const adminCount = await AdminUser.countDocuments();
  const sessionCount = await AdminSession.countDocuments();
  console.log("AdminUser count:", adminCount);
  console.log("AdminSession count:", sessionCount);
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : "Unknown error");
  process.exit(1);
});
