import { config } from "dotenv";
import { resolve } from "node:path";
import { seedLegacyBackgrounds } from "../src/lib/backgrounds/seedLegacyBackgrounds";

config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const result = await seedLegacyBackgrounds();
  console.log(
    `Background seed complete: ${result.inserted} inserted, ${result.skipped} already present.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
