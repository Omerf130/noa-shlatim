import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";
import { connectDb } from "@/lib/db/connect";
import { SITE_CONTENT_KEY, SiteContent } from "@/models/SiteContent";

export type SeedSiteContentResult = {
  inserted: boolean;
  skipped: boolean;
};

export function siteContentSetOnInsert() {
  return {
    singletonKey: SITE_CONTENT_KEY,
    ...DEFAULT_SITE_CONTENT,
  };
}

export async function seedSiteContent(): Promise<SeedSiteContentResult> {
  await connectDb();
  const result = await SiteContent.updateOne(
    { singletonKey: SITE_CONTENT_KEY },
    { $setOnInsert: siteContentSetOnInsert() },
    { upsert: true },
  );

  return {
    inserted: result.upsertedCount > 0,
    skipped: result.upsertedCount === 0,
  };
}
