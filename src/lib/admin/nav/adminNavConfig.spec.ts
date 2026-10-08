import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ADMIN_NAV_ENTRIES } from "@/lib/admin/nav/adminNavConfig";

describe("ADMIN_NAV_ENTRIES", () => {
  it("links site content to /admin/content", () => {
    const content = ADMIN_NAV_ENTRIES.find((e) => e.id === "site-content");
    assert.ok(content);
    assert.equal(content!.kind, "live");
    if (content!.kind === "live") {
      assert.equal(content.href, "/admin/content");
    }
  });

  it("does not include illustration styles admin entry", () => {
    const illus = ADMIN_NAV_ENTRIES.find((e) => e.id === "illustration-styles");
    assert.equal(illus, undefined);
  });

  it("links diagnostics to /admin/diagnostics", () => {
    const diagnostics = ADMIN_NAV_ENTRIES.find((e) => e.id === "diagnostics");
    assert.ok(diagnostics);
    assert.equal(diagnostics!.kind, "live");
    if (diagnostics!.kind === "live") {
      assert.equal(diagnostics.href, "/admin/diagnostics");
    }
  });
});
