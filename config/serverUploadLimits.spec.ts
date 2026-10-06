import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  maxImageUploadBytes,
  serverActionBodySizeLimitBytes,
} from "./serverUploadLimits";

describe("serverUploadLimits", () => {
  it("server action limit is at least max upload plus multipart headroom", () => {
    const upload = maxImageUploadBytes();
    const action = serverActionBodySizeLimitBytes();
    assert.ok(action > upload);
    assert.ok(action - upload >= 256 * 1024);
  });
});
