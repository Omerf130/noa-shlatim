# Object storage (Vercel Blob)

Phase 8A adds a **server-only** wrapper around [@vercel/blob](https://vercel.com/docs/vercel-blob) for our **private** Blob store (Frankfurt). No customer images are uploaded during the builder.

## Product rules

| Phase | Behavior |
|-------|----------|
| **Builder (now)** | Original upload, AI attempts, and editing are **temporary** in the browser (`blob:` URLs). **No** persistent Blob uploads. |
| **Finalization (Phase 8B+)** | When the customer explicitly proceeds with a final design/order, persist **only**: (1) original customer image, (2) **selected/final** illustration. Rejected AI attempts are **never** stored. |

## Private access

- The store is **private**: blob URLs are **not** publicly readable.
- Never expose `BLOB_READ_WRITE_TOKEN` or other Blob credentials to the client.
- Do **not** use `NEXT_PUBLIC_*` for Blob secrets.
- Import `@vercel/blob` only from server modules under `src/lib/storage/` (not from builder or `"use client"` code).

## Environment

| Variable | When |
|----------|------|
| `BLOB_READ_WRITE_TOKEN` | Local dev and `npm run verify:blob` (required for scripts outside Vercel OIDC). |
| Vercel-linked store | Production/preview: OIDC + `BLOB_STORE_ID` injected when the store is connected to the project. |

`BLOB_WEBHOOK_PUBLIC_KEY` is **not** required — we do not use Blob webhooks.

Copy placeholders from `env.example`; never commit `.env.local`.

## Server helpers

See [`src/lib/storage/privateBlob.ts`](../src/lib/storage/privateBlob.ts):

- `putPrivateBlob` — upload with `access: 'private'`
- `getPrivateBlob` / `readPrivateBlobUtf8` — authenticated read
- `deletePrivateBlob` — delete by pathname or blob URL (for rollback in Phase 8B)

## Local verification

```bash
npm run verify:blob
```

Uploads a tiny text file to `_dev/blob-verify/{uuid}.txt`, reads it back, deletes it, and confirms it is gone. No HTTP route, no customer images.

## Future pathname convention (Phase 8B)

When `Order` exists, use server-generated IDs only (no email/name in paths):

- `orders/{orderId}/original.{validatedExt}` — ext from magic-byte validation (`jpeg`, `png`, `webp`)
- `orders/{orderId}/illustration.png`

Path helpers will live with the Order model in Phase 8B, not in 8A.

## Future admin delivery

Private images must **not** be shown via raw blob URLs in the browser. Plan for Phase 8B/9:

1. Authenticated admin route (e.g. verify `requireAdminSession()`).
2. Server calls `get(pathname, { access: 'private' })` and **streams** the response with correct `Content-Type` and `X-Content-Type-Options: nosniff`.

Signed URLs are optional later for time-limited downloads; default is admin session + server proxy.

## Phase 8B finalization (outline)

1. Customer confirms final design (explicit action — not automatic on review).
2. Create order/draft record in MongoDB.
3. Upload original + **final** illustration only (server-side validation reusing `validateImageBuffer` where applicable).
4. Save design JSON + blob pathnames on the order.
5. On partial failure: delete uploaded blobs via `deletePrivateBlob` before leaving inconsistent state.

See [database.md](./database.md) for MongoDB; [admin-auth.md](./admin-auth.md) for admin sessions.
