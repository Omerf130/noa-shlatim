import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

describe("Admin promotions P0 — auth and safety", () => {
  it("create action requires admin session", () => {
    const src = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/promotions/actions.ts"),
      "utf8",
    );
    assert.match(src, /createPromotionAction/);
    assert.match(src, /await requireAdminSession\(\)/);
  });

  it("update action requires admin session", () => {
    const src = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/promotions/actions.ts"),
      "utf8",
    );
    assert.match(src, /updatePromotionAction/);
    const updateBlock = src.slice(src.indexOf("export async function updatePromotionAction"));
    assert.match(updateBlock, /requireAdminSession/);
  });

  it("no delete action in promotions admin", () => {
    const actions = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/promotions/actions.ts"),
      "utf8",
    );
    assert.doesNotMatch(actions, /deletePromotion/i);
    assert.doesNotMatch(actions, /\.deleteOne\(/);
    assert.doesNotMatch(actions, /findOneAndDelete/);

    const listUi = readFileSync(
      join(repoRoot, "src/components/admin/promotions/AdminPromotionsList.tsx"),
      "utf8",
    );
    assert.doesNotMatch(listUi, /מחיקה/);
    assert.doesNotMatch(listUi, /delete/i);

    const formUi = readFileSync(
      join(repoRoot, "src/components/admin/promotions/AdminPromotionForm.tsx"),
      "utf8",
    );
    assert.doesNotMatch(formUi, /מחיקה/);
  });

  it("Admin form uses human-readable magnet labels, not raw id fields", () => {
    const formUi = readFileSync(
      join(repoRoot, "src/components/admin/promotions/AdminPromotionForm.tsx"),
      "utf8",
    );
    assert.doesNotMatch(formUi, /htmlFor="promotionId"/);
    assert.doesNotMatch(formUi, /promotionId.*label/i);
    assert.match(formUi, /גודל מגנט/);
    assert.match(formUi, /opt\.label/);
  });

  it("promotionId generated server-side on create", () => {
    const actions = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/promotions/actions.ts"),
      "utf8",
    );
    assert.match(actions, /randomUUID\(\)/);
    const createBlock = srcBetween(actions, "createPromotionAction", "updatePromotionAction");
    assert.match(createBlock, /Promotion\.create/);
    assert.doesNotMatch(createBlock, /formData\.get\("promotionId"\)/);
  });

  it("Admin nav includes מבצעים", () => {
    const nav = readFileSync(
      join(repoRoot, "src/lib/admin/nav/adminNavConfig.ts"),
      "utf8",
    );
    assert.match(nav, /מבצעים/);
    assert.match(nav, /\/admin\/promotions/);
  });
});

function srcBetween(src: string, startMarker: string, endMarker: string): string {
  const start = src.indexOf(startMarker);
  const end = src.indexOf(endMarker, start + 1);
  return end === -1 ? src.slice(start) : src.slice(start, end);
}
