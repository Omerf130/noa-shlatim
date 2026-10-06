import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";
import { loadSiteContentFromDb } from "@/lib/siteContent/resolveSiteContent";
import {
  siteContentSchema,
  type SiteContentData,
  type SiteContentSectionKey,
} from "@/lib/siteContent/siteContentSchema";
import { connectDb } from "@/lib/db/connect";
import { SITE_CONTENT_KEY, SiteContent } from "@/models/SiteContent";

export type SaveSiteContentResult =
  | { ok: true }
  | { ok: false; message: string };

async function currentOrDefault(): Promise<SiteContentData> {
  const stored = await loadSiteContentFromDb();
  return stored ?? DEFAULT_SITE_CONTENT;
}

function mergeSection(
  base: SiteContentData,
  section: SiteContentSectionKey,
  payload: unknown,
): SiteContentData {
  switch (section) {
    case "hero": {
      const p = payload as SiteContentData["home"]["hero"] & {
        primaryCtaLabel: string;
      };
      const { primaryCtaLabel, ...hero } = p;
      return {
        ...base,
        global: {
          ...base.global,
          primaryCtaLabel,
        },
        home: {
          ...base.home,
          hero: { ...base.home.hero, ...hero },
        },
      };
    }
    case "howItWorks":
      return {
        ...base,
        home: {
          ...base.home,
          howItWorks: payload as SiteContentData["home"]["howItWorks"],
        },
      };
    case "signExamples":
      return {
        ...base,
        home: {
          ...base.home,
          signExamples: payload as SiteContentData["home"]["signExamples"],
        },
      };
    case "customerExamples":
      return {
        ...base,
        home: {
          ...base.home,
          customerExamples: payload as SiteContentData["home"]["customerExamples"],
        },
      };
    case "emotionalCta":
      return {
        ...base,
        home: {
          ...base.home,
          emotionalCta: payload as SiteContentData["home"]["emotionalCta"],
        },
      };
    case "footer": {
      const { footerTagline } = payload as { footerTagline: string };
      return {
        ...base,
        global: {
          ...base.global,
          footerTagline,
        },
      };
    }
    case "seo":
      return {
        ...base,
        seo: payload as SiteContentData["seo"],
      };
    default:
      return base;
  }
}

export async function saveSiteContentSection(
  section: SiteContentSectionKey,
  payload: unknown,
): Promise<SaveSiteContentResult> {
  let merged: SiteContentData;
  try {
    const base = await currentOrDefault();
    merged = mergeSection(base, section, payload);
    merged = siteContentSchema.parse(merged);
  } catch {
    return { ok: false, message: "התוכן שהוזן אינו תקין." };
  }

  await connectDb();
  await SiteContent.findOneAndUpdate(
    { singletonKey: SITE_CONTENT_KEY },
    {
      $set: {
        singletonKey: SITE_CONTENT_KEY,
        seo: merged.seo,
        global: merged.global,
        home: merged.home,
      },
    },
    { upsert: true, new: true, runValidators: true },
  );

  return { ok: true };
}
