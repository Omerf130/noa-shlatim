import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { ABOUT_PAGE_COPY_MARKERS, ABOUT_PAGE_IMAGE_SRC } from "@/lib/about/aboutPageContent";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("about page", () => {
  it("includes supplied story markers in content module", () => {
    const serialized = ABOUT_PAGE_COPY_MARKERS.join("\n");
    assert.match(serialized, /אז למה בכלל נועה\?/);
    assert.match(serialized, /בטח שלא בגלל כלב/);
    assert.match(serialized, /ככה נולד הרעיון של נועה \| שלטים לדלת/);
    assert.match(serialized, /כנראה שמגיע לו להיות גם על הדלת/);
  });

  it("uses the supplied about image path", () => {
    assert.match(ABOUT_PAGE_IMAGE_SRC, /WhatsApp Image 2026-10-07 at 17\.12\.31\.jpeg$/);
  });

  it("route and chrome match public customer pages", () => {
    const page = readFileSync(join(repoRoot, "src/app/about/page.tsx"), "utf8");
    assert.match(page, /CustomerPublicTopChrome/);
    assert.match(page, /AboutStoryPage/);
    assert.match(page, /ABOUT_PAGE_METADATA_TITLE/);
  });

  it("story component uses Next Image without animation", () => {
    const component = readFileSync(
      join(repoRoot, "src/components/about/AboutStoryPage.tsx"),
      "utf8",
    );
    assert.match(component, /from "next\/image"/);
    assert.match(component, /ABOUT_PAGE_IMAGE_SRC/);
    assert.doesNotMatch(component, /marquee|animation|ResizeObserver/i);
  });
});
