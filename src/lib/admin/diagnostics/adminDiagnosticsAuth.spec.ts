import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

describe("admin diagnostics access", () => {
  it("uses protected admin layout with requireAdminSession", () => {
    const layout = readFileSync(
      new URL("../../../app/admin/(protected)/layout.tsx", import.meta.url),
      "utf8",
    );
    assert.match(layout, /requireAdminSession/);
  });

  it("registers diagnostics under admin nav", () => {
    const nav = readFileSync(
      new URL("../nav/adminNavConfig.ts", import.meta.url),
      "utf8",
    );
    assert.match(nav, /\/admin\/diagnostics/);
    assert.match(nav, /תקלות מערכת/);
  });
});
