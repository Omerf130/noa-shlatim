import { createHash, randomBytes } from "node:crypto";

export function generateSignAssetStagingToken(): {
  token: string;
  tokenHash: string;
} {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashSignAssetStagingToken(token) };
}

export function hashSignAssetStagingToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

const TOKEN_MIN_LENGTH = 16;

export function parseSignAssetStagingToken(raw: unknown): string | null {
  if (typeof raw !== "string") {
    return null;
  }
  const trimmed = raw.trim();
  if (trimmed.length < TOKEN_MIN_LENGTH) {
    return null;
  }
  return trimmed;
}
