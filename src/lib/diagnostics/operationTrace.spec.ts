import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRACE_ID_HEADER } from "@/lib/diagnostics/config";
import { beginOperationTrace } from "@/lib/diagnostics/operationTrace";

describe("beginOperationTrace", () => {
  it("includes traceId on success JSON and X-Trace-Id header", async () => {
    const trace = beginOperationTrace("cart_add_item");
    const res = trace.okJson({ ok: true, lineId: "x" });
    assert.equal(res.headers.get(TRACE_ID_HEADER), trace.traceId);
    const body = (await res.json()) as { traceId: string; ok: boolean };
    assert.equal(body.traceId, trace.traceId);
    assert.equal(body.ok, true);
  });

  it("includes traceId on failure JSON", async () => {
    const trace = beginOperationTrace("payment_init");
    const res = trace.failJson({
      stage: "auth",
      code: "PAYMENT_NOT_READY",
      status: 400,
      message: "msg",
    });
    const body = (await res.json()) as {
      ok: boolean;
      traceId: string;
      code: string;
    };
    assert.equal(body.ok, false);
    assert.equal(body.traceId, trace.traceId);
    assert.equal(body.code, "PAYMENT_NOT_READY");
  });
});
