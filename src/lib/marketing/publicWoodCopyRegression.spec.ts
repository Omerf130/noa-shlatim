import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { homeBenefits } from "@/data/homeBenefits";
import { homeHeroValueItems } from "@/data/homeHero";
import { homeSignExamples } from "@/data/homeSignExamples";
import { DEFAULT_SITE_CONTENT } from "@/lib/siteContent/defaultSiteContent";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("public wood marketing cleanup", () => {
  it("homepage defaults avoid wooden sign marketing", () => {
    const blob = JSON.stringify({
      homeBenefits,
      homeHeroValueItems,
      homeSignExamples,
      seo: DEFAULT_SITE_CONTENT.seo,
      home: DEFAULT_SITE_CONTENT.home,
    });
    assert.doesNotMatch(blob, /עץ או מגנט/);
    assert.doesNotMatch(blob, /שלט עץ/);
    assert.doesNotMatch(blob, /שלטים מעץ/);
  });

  it("home benefits highlight magnet door signs", () => {
    assert.ok(homeBenefits.some((b) => b.label.includes("מגנט")));
  });

  it("checkout customer-facing label file unchanged for historical wood orders", () => {
    const checkoutLabel = readFileSync(
      join(repoRoot, "src/lib/checkout/formatProductLabelForCheckout.ts"),
      "utf8",
    );
    assert.match(checkoutLabel, /material === "wood"/);
  });
});
