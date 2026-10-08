import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  signAssetStagingArtworkPath,
  signAssetStagingOriginalPath,
} from "@/lib/signAssetStaging/stagingBlobPaths";
import {
  generateSignAssetStagingToken,
  hashSignAssetStagingToken,
  parseSignAssetStagingToken,
} from "@/lib/signAssetStaging/signAssetStagingToken";
import { userMessageForOrderCode } from "@/lib/orders/errors";
import { signAssetStagingTtlMs } from "@/lib/signAssetStaging/stagingConfig";

const stagingId = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee";

describe("signAssetStagingToken", () => {
  it("generates distinct tokens with stable hashes", () => {
    const a = generateSignAssetStagingToken();
    const b = generateSignAssetStagingToken();
    assert.notEqual(a.token, b.token);
    assert.equal(hashSignAssetStagingToken(a.token), a.tokenHash);
  });

  it("parses non-empty staging tokens", () => {
    const { token } = generateSignAssetStagingToken();
    assert.equal(parseSignAssetStagingToken(token), token);
    assert.equal(parseSignAssetStagingToken("  "), null);
    assert.equal(parseSignAssetStagingToken("short"), null);
  });
});

describe("stagingBlobPaths", () => {
  it("builds stable staging paths under staging/sign-assets", () => {
    assert.equal(
      signAssetStagingOriginalPath(stagingId, "jpeg"),
      `staging/sign-assets/${stagingId}/original.jpeg`,
    );
    assert.equal(
      signAssetStagingArtworkPath(stagingId),
      `staging/sign-assets/${stagingId}/artwork.png`,
    );
  });
});

describe("staging user messages", () => {
  it("maps staging error codes to Hebrew", () => {
    assert.match(userMessageForOrderCode("STAGING_EXPIRED"), /מחדש/);
    assert.match(userMessageForOrderCode("STAGING_INVALID"), /מחדש/);
  });
});

describe("signAssetStagingTtlMs", () => {
  it("defaults to 72 hours when env unset", () => {
    const ttl = signAssetStagingTtlMs();
    assert.equal(ttl, 72 * 60 * 60 * 1000);
  });
});
