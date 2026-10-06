import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";
import {
  parseSiteContentDocument,
  resolveSiteContentSyncFallback,
} from "@/lib/siteContent/resolveSiteContent";
import { siteContentSchema } from "@/lib/siteContent/siteContentSchema";

describe("DEFAULT_SITE_CONTENT", () => {
  it("validates against siteContentSchema", () => {
    const parsed = siteContentSchema.safeParse(DEFAULT_SITE_CONTENT);
    assert.equal(parsed.success, true);
  });
});

describe("parseSiteContentDocument", () => {
  it("returns null for invalid stored shape", () => {
    assert.equal(parseSiteContentDocument({ seo: {}, global: null }), null);
  });

  it("returns parsed data for valid document", () => {
    const parsed = parseSiteContentDocument(DEFAULT_SITE_CONTENT);
    assert.ok(parsed);
    assert.equal(parsed!.seo.homeTitle, DEFAULT_SITE_CONTENT.seo.homeTitle);
  });
});

describe("resolveSiteContentSyncFallback", () => {
  it("returns canonical defaults", () => {
    const content = resolveSiteContentSyncFallback();
    assert.equal(content.home.hero.titleLine1, "שלט לדלת");
  });
});
