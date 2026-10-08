import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { operationFailureTtlSeconds } from "@/lib/diagnostics/config";

describe("OperationFailureTrace model", () => {
  it("defines a TTL index on createdAt", () => {
    const src = readFileSync(
      new URL("../../models/OperationFailureTrace.ts", import.meta.url),
      "utf8",
    );
    assert.match(src, /expireAfterSeconds:\s*operationFailureTtlSeconds\(\)/);
    assert.match(src, /createdAt:\s*1/);
  });

  it("uses bounded retention of at least one day", () => {
    assert.ok(operationFailureTtlSeconds() >= 86400);
  });
});
