# Admin authentication (Phase 7)

Server-side admin login with MongoDB sessions. No customer accounts.

## Local bootstrap (one-time)

1. Ensure `MONGODB_URI` is set in `.env.local`.
2. Add **local only** (never commit, not required on Vercel):

   ```env
   ADMIN_SEED_EMAIL=your-admin@example.com
   ADMIN_SEED_PASSWORD=your-secure-password
   ```

3. Run:

   ```bash
   npm run seed:admin
   ```

4. On success, remove `ADMIN_SEED_EMAIL` and `ADMIN_SEED_PASSWORD` from `.env.local` manually. Production login uses the `AdminUser` document in MongoDB only.

The seed script is idempotent: if an admin with that email already exists, it does not create a duplicate or change the password.

## Routes

| Path | Access |
|------|--------|
| `/admin/login` | Public; redirects to `/admin` when already signed in |
| `/admin` | Protected; requires valid session |

## Session model

- Opaque random token in `admin_session` cookie (`httpOnly`, `sameSite=lax`, `path=/`, `secure` in production).
- Only SHA-256 hash of the token is stored in MongoDB (`AdminSession`).
- Sessions expire (default 7 days, override with `ADMIN_SESSION_MAX_AGE_SECONDS`).
- MongoDB TTL index removes expired session documents.
- Logout deletes the session row and clears the cookie.

## Security notes

- Passwords hashed with bcrypt (cost 12 by default).
- Login errors are generic (Hebrew): do not reveal whether an email exists.
- `passwordHash` is never returned to the client.
- Import auth and DB modules only from server code (Route Handlers, Server Actions, server components).

## Optional env

| Variable | Purpose |
|----------|---------|
| `ADMIN_SESSION_MAX_AGE_SECONDS` | Session cookie and DB expiry (default 604800) |
| `BCRYPT_ROUNDS` | bcrypt cost factor (default 12) |
