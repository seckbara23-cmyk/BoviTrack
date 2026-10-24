# Authentication (Supabase Auth / GoTrue)

**Restricted material.** The exported auth records are only in the encrypted
`auth-restricted.json.gpg` bundle under `backups/`, which has its own key. This
folder holds documentation and aggregates only.

## Hosted inventory (2026-10-24, aggregates)

| Item | Value |
|---|---|
| Users | 1: email/password, email confirmed, bcrypt hash, created 2026-06-06, **never signed in** |
| Identities | 1 (provider `email`) |
| Anonymous / SSO / phone / banned / deleted users | 0 / 0 / 0 / 0 / 0 |
| Sessions, refresh tokens, one-time tokens | 0, 0, 0 |
| MFA factors, SSO / SAML providers, OAuth clients | 0, 0 / 0, 0 |
| Metadata keys in use | user: `email_verified` · app: `provider`, `providers` |
| Linked profile | 1 `super_admin`, no farm. Every auth user has a profile and no profile is orphaned |
| Auth schema version | `20260831180000` (82 GoTrue migrations) |

## What was exported

| Table | Rows | Notes |
|---|---|---|
| `auth.users` | 1 | All 35 columns, including `encrypted_password` (bcrypt). `confirmed_at` is a generated column and is recomputed on restore. |
| `auth.identities` | 1 | All 9 columns. `email` is generated and recomputed on restore. |

Restored and verified **byte-identical** (canonical jsonb) on vanilla
PostgreSQL 18, into tables that copy the hosted layout column for column
([restore/00_supabase_compat.sql](../restore/00_supabase_compat.sql)).

## What was not exported, and why

- **Sessions, refresh tokens, MFA, flow state, audit log:** empty, and tokens
  would be useless once the JWT signing keys change anyway.
- **`auth.schema_migrations`:** GoTrue's internal ledger. A new auth server
  recreates it.
- **Auth service configuration** (site URL, redirect allow-list, email
  confirmation settings, SMTP credentials, email templates, rate limits,
  provider settings, JWT expiry): not stored in the database. It lives in the
  platform config, which also contains secrets, so it wasn't pulled. **Record
  it by hand from Dashboard → Authentication before decommissioning.**
- **JWT secret and signing keys:** deliberately not exported. A new platform
  issues new keys, and every user signs in again.

## How the app depends on auth

- `src/app/login/page.tsx`: `supabase.auth.signInWithPassword`
- `src/app/logout/route.ts`: `supabase.auth.signOut`
- `src/lib/supabase/middleware.ts`: `auth.getUser()` refreshes the cookie
  session and redirects unauthenticated users to `/login` (only when the
  Supabase env vars are set)
- `src/lib/db/queries.ts`: `getCurrentProfile()` via `auth.getUser()`
- In the database: `profiles.id → auth.users(id) ON DELETE CASCADE`, the
  `on_auth_user_created` trigger, and every RLS policy through `auth.uid()`.

## Replacement options (decision for a later phase)

| Option | Keeps | Work needed |
|---|---|---|
| **Self-hosted Supabase Auth (GoTrue)** on the new PostgreSQL | `@supabase/ssr` code, `auth.uid()`, the users table as-is, bcrypt passwords | Run GoTrue, let it create the `auth` schema (skip the auth section of `00_supabase_compat.sql`), load the auth bundle, and configure the JWT secret, SMTP and URLs. |
| **Other identity provider** (e.g. Keycloak, Zitadel, Authentik, Auth.js or Better Auth, Clerk) | User ids, by mapping the existing UUIDs as external ids | Import users (most accept bcrypt hashes), replace the login, logout and middleware code, and have the API layer set `request.jwt.claims` (or an equivalent setting) so `auth.uid()` and the RLS keep working. |

The compatibility shim already lets the RLS policies run on vanilla
PostgreSQL. Any API layer that runs each request as
`set local role authenticated` plus `set_config('request.jwt.claims',
'{"sub": "<user uuid>"}', true)` gets the same farm isolation that was proved
in the rehearsal.
