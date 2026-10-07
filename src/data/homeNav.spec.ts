import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { homeNavLinks } from "@/data/homeNav";

describe("homeNavLinks", () => {
  it("does not include removed materials anchor", () => {
    const hrefs = homeNavLinks.map((l) => l.href);
    assert.equal(hrefs.includes("#materials"), false);
    assert.equal(hrefs.includes("/about"), true);
    assert.equal(hrefs.length, 4);
  });
});
