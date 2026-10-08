import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { persistOperationFailure } from "@/lib/diagnostics/persistOperationFailure";
import type { OperationFailureRecord } from "@/lib/diagnostics/types";

describe("persistOperationFailure", () => {
  it("does not throw when persistence fails", async () => {
    await assert.doesNotReject(() =>
      persistOperationFailure(
        {
          traceId: "11111111-1111-4111-8111-111111111111",
          operation: "cart_convert",
          stage: "persist",
          errorCode: "ORDER_PERSIST_FAILED",
          httpStatus: 500,
          durationMs: 12,
          source: "server",
        },
        {
          connect: async () => {
            throw new Error("db down");
          },
          create: async () => {},
        },
      ),
    );
  });

  it("sanitizes unsafe error codes before create", async () => {
    let captured: OperationFailureRecord | null = null;
    await persistOperationFailure(
      {
        traceId: "22222222-2222-4222-8222-222222222222",
        operation: "generate_final",
        stage: "provider",
        errorCode: "raw openai: timeout at socket",
        httpStatus: 502,
        durationMs: 1,
        source: "server",
      },
      {
        connect: async () => {},
        create: async (doc: OperationFailureRecord) => {
          captured = doc;
        },
      },
    );
    const row = captured as OperationFailureRecord | null;
    assert.ok(row);
    assert.equal(row.errorCode, "UNKNOWN");
  });

  it("never persists sensitive field keys", async () => {
    let captured: Record<string, unknown> | null = null;
    await persistOperationFailure(
      {
        traceId: "33333333-3333-4333-8333-333333333333",
        operation: "payment_init",
        stage: "unknown",
        errorCode: "ORDER_PERSIST_FAILED",
        httpStatus: 500,
        durationMs: 0,
        source: "server",
      },
      {
        connect: async () => {},
        create: async (doc) => {
          captured = doc as Record<string, unknown>;
        },
      },
    );
    assert.ok(captured);
    assert.deepEqual(Object.keys(captured!).sort(), [
      "createdAt",
      "durationMs",
      "errorCode",
      "httpStatus",
      "operation",
      "source",
      "stage",
      "traceId",
    ]);
  });
});
