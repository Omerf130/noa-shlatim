import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";
import { siteContentSchema } from "@/lib/siteContent/siteContentSchema";

describe("siteContentSchema validation", () => {
  it("rejects empty required hero field", () => {
    const invalid = structuredClone(DEFAULT_SITE_CONTENT);
    invalid.home.hero.eyebrow = "   ";
    assert.equal(siteContentSchema.safeParse(invalid).success, false);
  });

  it("requires exactly four how-it-works steps", () => {
    const invalid = structuredClone(DEFAULT_SITE_CONTENT);
    invalid.home.howItWorks.steps = invalid.home.howItWorks.steps.slice(0, 3);
    assert.equal(siteContentSchema.safeParse(invalid).success, false);
  });
});
