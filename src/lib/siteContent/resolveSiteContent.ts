import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";
import { siteContentSchema, type SiteContentData } from "@/lib/siteContent/siteContentSchema";
import { connectDb } from "@/lib/db/connect";
import { SITE_CONTENT_KEY, SiteContent } from "@/models/SiteContent";

function docToPlain(doc: Record<string, unknown>): unknown {
  return {
    seo: doc.seo,
    global: doc.global,
    home: doc.home,
  };
}

export function parseSiteContentDocument(raw: unknown): SiteContentData | null {
  const parsed = siteContentSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function loadSiteContentFromDb(): Promise<SiteContentData | null> {
  try {
    await connectDb();
    const doc = await SiteContent.findOne({ singletonKey: SITE_CONTENT_KEY }).lean();
    if (!doc) {
      return null;
    }
    return parseSiteContentDocument(docToPlain(doc as Record<string, unknown>));
  } catch (err) {
    console.error("[siteContent] load failed", err);
    return null;
  }
}

/** Resolved marketing content — always returns valid defaults-backed data. */
export async function resolveSiteContent(): Promise<SiteContentData> {
  const stored = await loadSiteContentFromDb();
  return stored ?? DEFAULT_SITE_CONTENT;
}

export function resolveSiteContentSyncFallback(): SiteContentData {
  return DEFAULT_SITE_CONTENT;
}
