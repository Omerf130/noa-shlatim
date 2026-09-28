/**
 * Server-only Blob configuration. Never import from client components.
 */

/** Ensures local/scripts can authenticate to a private Blob store. */
export function assertBlobConfiguredForLocal(): void {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Add it to .env.local for local development and verification scripts. On Vercel, use the project-linked private Blob store (OIDC / store env).",
    );
  }
}
