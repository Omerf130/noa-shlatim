import { config } from "dotenv";
import { resolve } from "node:path";
import { seedSiteContent } from "../src/lib/siteContent/seedSiteContent";

config({ path: resolve(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  const result = await seedSiteContent();
  if (result.inserted) {
    console.log("Site content seed complete: document inserted.");
  } else {
    console.log("Site content seed complete: document already present (not overwritten).");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
