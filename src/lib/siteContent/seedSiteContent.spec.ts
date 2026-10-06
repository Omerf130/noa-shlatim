import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { siteContentSetOnInsert } from "@/lib/siteContent/seedSiteContent";
import { siteContentSchema } from "@/lib/siteContent/siteContentSchema";
import { SITE_CONTENT_KEY } from "@/models/SiteContent";

describe("siteContentSetOnInsert", () => {
  it("uses global singleton key and validates", () => {
    const doc = siteContentSetOnInsert();
    assert.equal(doc.singletonKey, SITE_CONTENT_KEY);
    const content = {
      seo: doc.seo,
      global: doc.global,
      home: doc.home,
    };
    assert.equal(siteContentSchema.safeParse(content).success, true);
  });
});
