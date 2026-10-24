# Inventory report: repository and hosted database

SUPABASE-ARCHIVE-01 · 2026-10-24 · hosted project `vustkojrbefcbzotgorc`.
All hosted queries ran as `SELECT` inside `READ ONLY` transactions. No
credentials or personal data are reproduced here.

## 1. Repository audit

**Stack:** Next.js 15.5, React 19, `@supabase/ssr` 0.10.3,
`@supabase/supabase-js` 2.107. Branch `main` at `d5d798e` (Phase 9).

### Supabase touch points in the code

| File | Uses |
|---|---|
| `src/lib/supabase/env.ts` | Reads `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `isSupabaseConfigured` decides live vs mock. |
| `src/lib/supabase/client.ts`, `server.ts` | Browser and server clients (`createBrowserClient`, `createServerClient`) |
| `src/middleware.ts` → `src/lib/supabase/middleware.ts` | Session refresh (`auth.getUser`) and route gating to `/login`, only when configured |
| `src/app/login/page.tsx`, `src/app/logout/route.ts` | `auth.signInWithPassword`, `auth.signOut` |
| `src/lib/db/queries.ts` | Data API (PostgREST) reads: `from(...).select()` on 12 tables (all except `documents`), read-only |
| `src/lib/herd-data.ts` | Adapter: Supabase when configured and authenticated, mock data on any failure |
| `src/lib/database.types.ts` | Hand-written types. **Match the hosted schema exactly** (13/13 tables, 12/12 enums). |

**Not used anywhere in the code:** Storage, Realtime channels, Edge Functions,
`rpc()`, the service-role key, any write (`insert`, `update`, `delete`).

### Screens: live data vs mock data

| Data source | Routes |
|---|---|
| **Supabase** (when the env is set and the user is signed in; mock fallback otherwise) | `/herd`, `/herd/[animalId]` |
| **Supabase Auth** | `/login`, `/logout`, plus gating of every route by the middleware |
| **Mock only** (`src/lib/mock-data.ts`) | `/dashboard`, `/alerts`, `/alerts/[alertId]`, `/location`, `/care`, `/care/[careId]`, `/vaccines`, `/vaccines/[vaccineId]`, `/breeding`, `/breeding/[breedingId]`, `/births`, `/births/[birthId]`, `/sales`, `/sales/[saleId]`, `/reports` |
| **Placeholders** | `/users`, `/settings`, `/herd/new` (`/` redirects) |

`/herd/[animalId]` also uses mock-data UI helpers and prebuilds the mock animal
codes in `generateStaticParams`.

### Environment and git configuration

- Variable names: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
  both used by the code; `SUPABASE_SERVICE_ROLE_KEY` is documented in
  `.env.example` but never referenced.
- **No `.env.local` on this machine**, so the app runs fully on mock data
  locally.
- **Deployment:** the Vercel project `bovi-track` exists, but its environment
  variables couldn't be read (API 403), so it's **unknown whether the deployed
  app is wired to this Supabase project.**
- `.gitignore` excludes `.env*`, which also leaves **`.env.example` untracked**:
  a fresh clone won't have the template the docs point to.
- `core.autocrlf=true`. The migration files are LF in the working tree. The
  archive pins LF through `database-archive/.gitattributes`.
- Remote: private GitHub repository `seckbara23-cmyk/BoviTrack`.

## 2. Hosted database

| Item | Value |
|---|---|
| Project | Bovitrack · `vustkojrbefcbzotgorc` · eu-west-1 · ACTIVE_HEALTHY · created 2026-06-06 |
| Engine | PostgreSQL 17.6 (image 17.6.1.127, aarch64) · UTF8 · `en_US.UTF-8` · TimeZone UTC |
| Database size | 12.4 MB (mostly Supabase-managed schemas) |
| Extensions | `pgcrypto` 1.3, `uuid-ossp` 1.1, `pg_stat_statements` 1.11 (schema `extensions`) · `supabase_vault` 0.3.1 · `plpgsql` |
| Not installed | `pg_graphql`, `pg_cron`, `pg_net`, `pgsodium`, database webhooks, foreign data wrappers |
| Schemas | `public` (app) · Supabase-managed: `auth`, `storage`, `realtime`, `vault`, `extensions`, `graphql`, `graphql_public`, `pgbouncer` |
| Migration history | **None.** There's no `supabase_migrations` schema; the migrations were applied via the SQL editor. |
| Platform backups | 8 daily physical backups (2026-10-17 → 2026-10-24, all COMPLETED). PITR is off. Usable only inside Supabase. |
| Edge Functions | 0 |
| Roles | 16 non-system roles, all Supabase-managed. **No custom application roles.** |

### `public` tables (exact counts; RLS enabled on all)

| Table | Rows | Row-set md5 (source) |
|---|---:|---|
| animals | 10 | `0f4c25957b937d158ae30e90af0f879f` |
| birth_records | 2 | `260d9c0e0cb6c42a2d7da6ecb1413982` |
| breeding_records | 3 | `1ff1b82cce66bd32d6eea2d4365b463d` |
| care_records | 5 | `b0889fe74fb3fa65e8f4bed726b5c606` |
| documents | 0 | `d41d8cd98f00b204e9800998ecf8427e` |
| farms | 1 | `6ba9ab2876e970b946fc72c182b7ecf8` |
| locations | 5 | `23ce90dce284b96d8717cca5b5cd6fe7` |
| owners | 5 | `6a8ca3978cd6a9b2cfa1100ece7b8374` |
| profiles | 1 | withheld (personal data); kept in the private manifest |
| sale_records | 3 | `6f8542946f2ea1656ec750bf6d5ff916` |
| security_alerts | 3 | `0f6bc4279db99710d37536a6a8ef2ad5` |
| timeline_events | 3 | `6bee494a8b4c8216c3a210f145122ca2` |
| vaccine_records | 5 | `a5b5ccef9ca7bbdbb316f77be49a2163` |
| **Total** | **46** | md5 over the sorted canonical jsonb rows, computed in the snapshot transaction |

Structure: 91 columns · 13 PK, 17 FK, 1 unique (`animals (farm_id,
animal_code)`) · 29 indexes · 12 enums · 5 functions · 1 trigger
(`auth.users` → `handle_new_user`) · 26 policies · 0 sequences. The details,
grants and findings are in [security/README.md](../security/README.md).

### Supabase-managed services

| Service | State |
|---|---|
| Auth | 1 user, 1 identity (email). No sessions, MFA, SSO or OAuth. Details in [auth/README.md](../auth/README.md) |
| Storage | 0 buckets, 0 objects. `documents.storage_path` is unused (0 rows) |
| Realtime | publication `supabase_realtime` has **0 tables**; 0 subscriptions |
| Vault | 0 secrets |
| Other non-empty tables | Only the services' own ledgers: `auth.schema_migrations` (82), `storage.migrations` (61), `realtime.schema_migrations` (73) |

### Schema drift

The repository migrations, applied unchanged to vanilla PostgreSQL (with the
compat shim), match the hosted catalog in **every compared section**: tables,
RLS flags, columns, constraints, indexes, enums, functions, triggers,
policies, table, function and schema grants. The only differences are CRLF
line endings inside the 5 hosted function bodies, which the comparer reports
as notes rather than drift.
