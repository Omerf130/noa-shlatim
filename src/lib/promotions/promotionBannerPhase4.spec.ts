import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import {
  BANNER_STATIC_DESKTOP_CYCLE_REPEATS,
  BANNER_STATIC_MOBILE_CYCLE_REPEATS,
  expandStaticBannerVisualSequence,
  staticBannerAccessibleSummary,
} from "@/lib/promotions/buildStaticBannerVisualSequence";
import {
  buildPublicPromotionBannerDtoFromRows,
  type PromotionBannerSourceRow,
} from "@/lib/promotions/publicPromotionBannerDto";

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");

function row(
  partial: Partial<PromotionBannerSourceRow> & Pick<PromotionBannerSourceRow, "promotionId">,
): PromotionBannerSourceRow {
  return {
    enabled: true,
    showInBanner: true,
    bannerText: "מבצע משפחתי",
    bannerSortOrder: 0,
    ...partial,
  };
}

describe("public promotion banner DTO", () => {
  it("1-3: enabled showInBanner visibility rules", () => {
    const visible = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "a", bannerText: "א" }),
    ]);
    assert.equal(visible.items.length, 1);

    const hiddenFlag = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "a", showInBanner: false }),
    ]);
    assert.equal(hiddenFlag.items.length, 0);

    const disabled = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "a", enabled: false }),
    ]);
    assert.equal(disabled.items.length, 0);
  });

  it("4: empty banner text excluded", () => {
    const dto = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "a", bannerText: "   " }),
    ]);
    assert.equal(dto.items.length, 0);
  });

  it("5-6: bannerSortOrder and promotionId tie-break", () => {
    const dto = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "b", bannerText: "B", bannerSortOrder: 2 }),
      row({ promotionId: "a", bannerText: "A", bannerSortOrder: 1 }),
      row({ promotionId: "c", bannerText: "C", bannerSortOrder: 1 }),
    ]);
    assert.deepEqual(
      dto.items.map((i) => i.bannerText),
      ["A", "C", "B"],
    );
  });

  it("7-11: public DTO exposes bannerText only", () => {
    const dto = buildPublicPromotionBannerDtoFromRows([
      row({ promotionId: "secret-id", bannerText: "טקסט" }),
    ]);
    const json = JSON.stringify(dto);
    assert.deepEqual(Object.keys(dto.items[0]!), ["bannerText"]);
    assert.doesNotMatch(json, /promotionId|internalName|bundlePrice|requirements|magnetSizeId/i);
  });
});

describe("PromotionBanner static presentation", () => {
  it("12: zero items → component returns null", () => {
    const tsx = readFileSync(
      join(repoRoot, "src/components/promotions/PromotionBanner.tsx"),
      "utf8",
    );
    assert.match(tsx, /baseCycle\.length === 0/);
    assert.match(tsx, /return null/);
  });

  it("13: one Promotion repeats visually for static fill", () => {
    const expanded = expandStaticBannerVisualSequence(
      ["מבצע משפחתי"],
      BANNER_STATIC_DESKTOP_CYCLE_REPEATS,
    );
    assert.equal(expanded.length, BANNER_STATIC_DESKTOP_CYCLE_REPEATS);
    assert.ok(expanded.every((label) => label === "מבצע משפחתי"));
  });

  it("14-15: multiple Promotions repeat ordered sequence with separators", () => {
    const expanded = expandStaticBannerVisualSequence(
      ["א", "ב", "ג"],
      2,
    );
    assert.deepEqual(expanded, ["א", "ב", "ג", "א", "ב", "ג"]);

    const tsx = readFileSync(
      join(repoRoot, "src/components/promotions/PromotionBanner.tsx"),
      "utf8",
    );
    const scss = readFileSync(
      join(repoRoot, "src/components/promotions/PromotionBanner.module.scss"),
      "utf8",
    );
    assert.match(tsx, /styles\.separator/);
    assert.match(tsx, /contentDesktop/);
    assert.match(tsx, /contentMobile/);
    assert.match(scss, /justify-content:\s*space-evenly/);
    assert.match(scss, /white-space:\s*nowrap/);
  });

  it("15b: accessible summary lists each unique promotion once", () => {
    assert.equal(
      staticBannerAccessibleSummary(["א", "ב", "א"]),
      "א · ב",
    );
  });

  it("15c: mobile uses fewer presentation cycles than desktop", () => {
    assert.ok(BANNER_STATIC_MOBILE_CYCLE_REPEATS < BANNER_STATIC_DESKTOP_CYCLE_REPEATS);
  });

  it("16-20: no marquee, accessible region, static styles", () => {
    const tsx = readFileSync(
      join(repoRoot, "src/components/promotions/PromotionBanner.tsx"),
      "utf8",
    );
    const scss = readFileSync(
      join(repoRoot, "src/components/promotions/PromotionBanner.module.scss"),
      "utf8",
    );
    assert.match(tsx, /role="region"/);
    assert.match(tsx, /aria-label="מבצעים"/);
    assert.match(tsx, /srOnly/);
    assert.match(tsx, /aria-hidden="true"/);
    assert.doesNotMatch(tsx, /PromotionBannerMarquee/i);
    assert.doesNotMatch(tsx, /ResizeObserver|useLayoutEffect|useState/i);
    assert.doesNotMatch(scss, /marquee|@keyframes|animation|marquee-distance/i);
    assert.match(scss, /overflow-x:\s*hidden/);
    assert.match(tsx, /expandStaticBannerVisualSequence/);
    assert.doesNotMatch(tsx, /carousel|swiper|slide/i);
  });
});

describe("customer surface integration", () => {
  it("21-24: banner mounted on customer routes, not admin", () => {
    const home = readFileSync(join(repoRoot, "src/app/page.tsx"), "utf8");
    const create = readFileSync(join(repoRoot, "src/app/create/page.tsx"), "utf8");
    const cart = readFileSync(join(repoRoot, "src/app/cart/page.tsx"), "utf8");
    const checkout = readFileSync(
      join(repoRoot, "src/app/checkout/[orderId]/page.tsx"),
      "utf8",
    );
    const adminLayout = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/layout.tsx"),
      "utf8",
    );

    assert.match(home, /CustomerPublicTopChrome|PromotionBannerServer/);
    assert.match(create, /PromotionBannerServer/);
    assert.match(cart, /CustomerPublicTopChrome/);
    assert.match(checkout, /PromotionBannerServer/);
    assert.doesNotMatch(adminLayout, /PromotionBanner/);
  });

  it("25: admin promotion mutations revalidate banner cache", () => {
    const actions = readFileSync(
      join(repoRoot, "src/app/admin/(protected)/promotions/actions.ts"),
      "utf8",
    );
    assert.match(actions, /revalidatePublicPromotionBannerSurfaces/);
  });
});
