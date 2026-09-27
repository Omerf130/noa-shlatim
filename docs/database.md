# Database setup (MongoDB + Mongoose)

Phase 6 provides a **server-only** connection layer. No domain models or builder persistence yet.

## Local development

1. Create `.env.local` in the project root (gitignored).
2. Set `MONGODB_URI` to your MongoDB Atlas connection string (or local MongoDB URI).
3. Run `npm run dev`.
4. Verify: `GET http://localhost:3000/api/health/db` should return `{ "ok": true }`.

If `MONGODB_URI` is missing, the health route returns `{ "ok": false, "error": "Database connection failed" }` with HTTP 503. Error messages never include the connection string.

## MongoDB Atlas

- Create a cluster and database user with least privilege needed for the app.
- Allow network access from your IP for local dev; for Vercel, use Atlas **Network Access** allowlist appropriate to your deployment (e.g. `0.0.0.0/0` only if you accept Atlas IP restrictions tradeoffs, or Vercel static IPs if available on your plan).
- Copy the **connection string** into `MONGODB_URI` (not into any `NEXT_PUBLIC_*` variable).

## Vercel

Add `MONGODB_URI` in the project **Environment Variables** for Production, Preview, and Development as needed. Redeploy after adding secrets.

## Server-only rule

- Import `@/lib/db/connect` and `@/lib/db/env` only from Route Handlers, server modules, or future admin APIs.
- **Never** import database code from `"use client"` components.
- **Never** expose `MONGODB_URI` in API responses or client bundles.

## Connection caching

`connectDb()` reuses a global cached connection and in-flight promise so Next.js hot reload and serverless invocations do not open unbounded new connections. See `src/lib/db/connect.ts`.

## OpenAI (unchanged)

Illustration generation still uses the existing OpenAI env vars documented in `env.example` and `src/lib/openai/config.ts`.
