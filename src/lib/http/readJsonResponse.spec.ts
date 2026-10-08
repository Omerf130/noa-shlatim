import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRACE_ID_HEADER } from "@/lib/diagnostics/config";
import { readJsonResponse } from "@/lib/http/readJsonResponse";

describe("readJsonResponse", () => {
  it("returns parsed data and header traceId", async () => {
    const res = new Response(JSON.stringify({ ok: false, code: "X", message: "m" }), {
      status: 400,
      headers: { [TRACE_ID_HEADER]: "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee" },
    });
    const out = await readJsonResponse<{ ok: boolean }>(res);
    assert.equal(out.parseFailed, false);
    assert.equal(out.status, 400);
    assert.equal(out.traceId, "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee");
    assert.equal(out.data?.ok, false);
  });

  it("falls back to body traceId", async () => {
    const res = new Response(
      JSON.stringify({
        ok: false,
        traceId: "11111111-1111-4111-8111-111111111111",
      }),
      { status: 500 },
    );
    const out = await readJsonResponse(res);
    assert.equal(out.traceId, "11111111-1111-4111-8111-111111111111");
  });

  it("marks HTML responses as parseFailed", async () => {
    const res = new Response("<html>502 Bad Gateway</html>", {
      status: 502,
      headers: { [TRACE_ID_HEADER]: "22222222-2222-4222-8222-222222222222" },
    });
    const out = await readJsonResponse(res);
    assert.equal(out.parseFailed, true);
    assert.equal(out.data, null);
    assert.equal(out.status, 502);
    assert.equal(out.traceId, "22222222-2222-4222-8222-222222222222");
  });
});
