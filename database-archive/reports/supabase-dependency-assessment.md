# Supabase dependency assessment

What BoviTrack actually uses from Supabase as of 2026-10-24, what the archive
covers, and what a migration must replace. Evidence: code audit and hosted
inventory ([inventory-report.md](inventory-report.md)).

## Summary

The footprint is small. Only **PostgreSQL**, **Auth**, and the **Data API
(PostgREST)** are in use, and only the herd screens plus login and logout
reach them. Every other screen runs on mock data. Storage, Realtime, Edge
Functions, Vault, GraphQL, cron and webhooks are unused or empty.

| Service | Used? | Where | Archive coverage | Needs replacement |
|---|---|---|---|---|
| **PostgreSQL** | Yes | 13 `public` tables, enums, functions, trigger | ✅ Full: schema = migrations (no drift); data in the encrypted snapshot; restore rehearsed on vanilla PG 18 | No. Any PostgreSQL ≥ 17 (managed or self-hosted) |
| **Row Level Security** | Yes | 26 policies, 4 helper functions | ✅ Portable. Depends on `auth.uid()` and the API roles, both provided by `restore/00_supabase_compat.sql` | Only the claim plumbing: the new API layer must set `request.jwt.claims` and the role per request |
| **Auth (GoTrue)** | Yes | `/login`, `/logout`, middleware session refresh and gating, `getCurrentProfile`, `auth.users` FK + signup trigger | ✅ Users and identities (with bcrypt hashes) exported and restored identically · ⚠️ service config not exported | **Yes.** Self-hosted GoTrue or another identity provider (see [auth/README.md](../auth/README.md)) |
| **Data API (PostgREST)** | Yes | `src/lib/db/queries.ts` (12 tables, read-only) via `supabase-js` | n/a (stateless) | **Yes.** Self-hosted PostgREST, or server-side SQL from Next.js (e.g. `pg`, Drizzle, Kysely) running each request as `authenticated` with the user's claims |
| **Client libraries** | Yes | `@supabase/ssr`, `@supabase/supabase-js` in `src/lib/supabase/*`, middleware, login, logout | n/a | Depends on the Auth and Data API choice; unchanged if self-hosting GoTrue + PostgREST |
| **Env vars** | Yes | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | n/a | New endpoints and keys. The deployed (Vercel) env couldn't be inspected |
| **Storage** | No | `documents.storage_path` column only; 0 buckets, 0 objects | Nothing to migrate | When documents ship: any S3-compatible store |
| **Realtime** | No | publication has 0 tables; no channel code | — | Only if live theft alerts are built (e.g. `LISTEN/NOTIFY`, a websocket service) |
| **Edge Functions** | No | 0 deployed | — | — |
| **Vault / pgsodium** | No | 0 secrets / not installed | — | — |
| **GraphQL, pg_cron, pg_net, webhooks, FDW** | No | not installed | — | — |
| **Platform backups** | Implicitly | 8 daily physical backups, PITR off | Not portable. This archive replaces them | The new provider's backups, plus re-running `export-snapshot.sh` or `export-pgdump.sh` |
| **SQL editor as migration tool** | Yes (process) | how 0001/0002 were applied; no migration ledger | Migrations preserved and verified | Adopt a migration tool with a history table |

## Database objects that only exist because of Supabase

These are recreated by the compatibility shim and must exist on any new
target before the original migrations run:

- `auth.users` (FK target of `profiles.id`; host of the `on_auth_user_created` trigger)
- `auth.uid()` (used by all 4 RLS helpers)
- roles `anon`, `authenticated`, `service_role` (grant targets)
- schema `extensions` with `pgcrypto` (0001 requests `pgcrypto`; the app itself
  uses only the core `gen_random_uuid()`)

## Suggested migration order (for a later phase)

1. Provision PostgreSQL ≥ 17 and restore with **path A** of the restore kit;
   run `03_verify.sql` and `04_rls_smoke_test.sql`.
2. Choose the auth replacement, record the hosted Auth configuration, and
   migrate the one user (bcrypt hash).
3. Replace the Data API calls in `src/lib/db/queries.ts` (the only data-access
   module), keeping the per-request role and claims so RLS still applies.
4. Fix security findings F1 and F2 before onboarding real farms.
5. Switch the env vars, verify, then take a final snapshot from Supabase before
   decommissioning it.
