# SUPABASE-ARCHIVE-01: final report

Date: 2026-10-24 · Project: BoviTrack · Supabase project `vustkojrbefcbzotgorc`
Scope: backup, inventory, verification and documentation only. **The hosted
project was not migrated, paused, deleted, or changed in schema, data or
configuration.** The running application was not modified or deployed.

## 1. Repository and database inventory

**Repository.** A Next.js 15 / React 19 app using `@supabase/ssr` and
`supabase-js`. Supabase is reached from four places only: the auth
middleware, `/login`, `/logout`, and the read-only herd adapter
(`/herd`, `/herd/[animalId]`). Each falls back to mock data. The other 15
routes are mock-only and 3 are placeholders. There are no writes, no Storage,
no Realtime, no Edge Functions, no RPC, and the service-role key is never
used. `database.types.ts` matches the live schema exactly.
→ [inventory-report.md §1](inventory-report.md#1-repository-audit)

**Hosted database.** PostgreSQL 17.6, eu-west-1, 12.4 MB.

- `public`: 13 tables holding **46 rows**: 1 farm, 5 owners, 10 animals,
  5 locations, 3 alerts, 5 care, 5 vaccine, 3 breeding, 2 birth, 3 sale,
  3 timeline, 1 profile, 0 documents.
- RLS is on for all 13 tables, with 26 policies, 5 `SECURITY DEFINER`
  functions and 1 trigger.
- Auth: 1 user and 1 identity.
- Storage, Realtime, Vault and Edge Functions: all empty.
- No custom roles and no migration ledger. The migrations were pasted into the
  SQL editor.
- **No schema drift** versus `supabase/migrations`.

→ [inventory-report.md §2](inventory-report.md#2-hosted-database)

## 2. Archive directory structure

```
database-archive/
├── README.md · .gitignore · .gitattributes
├── schema/      README.md · hosted-inventory-2026-10-24.json · hosted-services-2026-10-24.json
├── migrations/  README.md · 0001_init.sql · 0002_rls.sql · seed.sql · SHA256SUMS
├── security/    README.md                       (RLS model, grants, findings F1–F6)
├── auth/        README.md                       (auth inventory, export scope, options)
├── backups/     README.md                       (tracked)
│   ├── 2026-10-24T172145Z/                      (git-ignored: rehearsed run)
│   │   ├── app-data.json.gpg · auth-restricted.json.gpg
│   │   └── manifest.json · SHA256SUMS
│   └── 2026-10-24T174450Z/                      (git-ignored: repeatability run, same layout)
├── restore/     README.md · 00_supabase_compat.sql · 01_supabase_default_grants.sql
│                02_load_snapshot.sql · 03_verify.sql · 04_rls_smoke_test.sql
│                05_after_pgdump_schema.sql · rehearse.sh
├── reports/     final-report.md · inventory-report.md · restore-rehearsal-2026-10-24.md
│                supabase-dependency-assessment.md
└── scripts/     inventory.sql · hosted-services.sql · snapshot.sql · seal-snapshot.mjs
                 export-snapshot.sh · export-pgdump.sh · compare-inventory.mjs · verify-archive.sh
```

`scripts/` was added beyond the seven requested folders so that the reusable
tooling sits apart from the restore kit.

## 3. Backup status and file locations

| Artifact | Status | Location |
|---|---|---|
| Logical snapshot: all `public` rows + `auth.users` / `auth.identities` (48 rows, one REPEATABLE READ read-only transaction at 2026-10-24T17:21:46Z) | ✅ done | `database-archive/backups/2026-10-24T172145Z/` (git-ignored) |
| Canonical `pg_dump` (schema, data, full DB, roles) | ⛔ **blocked**: no database password here; the CLI route needs Docker (verified error) | `scripts/export-pgdump.sh` is ready and was proven against a local copy |
| Repeatability run via `scripts/export-snapshot.sh` (17:44:55Z) | ✅ 15/15 tables identical in counts and row-set md5s to the first run | `database-archive/backups/2026-10-24T174450Z/` (git-ignored) |
| Encryption keys | ✅ separate from the bundles | `%USERPROFILE%\.bovitrack-archive\keys\` (owner-only ACL) |

**What's included:** every row of every non-empty table that isn't
Supabase-internal. The only non-empty tables left out are the services' own
migration ledgers (`auth.schema_migrations`, `storage.migrations`,
`realtime.schema_migrations`), which a new auth or storage server recreates.

**What's excluded, deliberately:** the Supabase-managed schemas' structure
(platform-provided), cluster roles (all Supabase-managed), Auth service
configuration and JWT keys (stored outside the database and containing
secrets), and platform physical backups (not portable).

A default `pg_dump` wouldn't capture the Auth configuration or the global
roles either. The roles are recreated by `00_supabase_compat.sql`.

## 4. Encryption and checksum verification

- **Encryption:** OpenPGP symmetric, AES-256, iterated+salted SHA-512 S2K,
  SEIPD v1 with MDC (GnuPG 2.4.9). There are **two independent 384-bit random
  passphrases**: app-data and auth-restricted.
- **Round trip:** each bundle was decrypted again and matched its plaintext
  byte for byte. The plaintext was then overwritten and deleted.
- **SHA-256:**
  - `app-data.json.gpg`: `e17e11806acb4ec7250e1b4187c5958e7239d6283aa4080d9ffd17d0bea7433b`
  - `auth-restricted.json.gpg`: `0fa8dca76f0bb6cc0581d37d404cb66c4bdcfb7a169281bb249c7ca53c707088`
- `scripts/verify-archive.sh` passes: checksums, decrypt tests, and migration
  copies identical to the originals.
- **Negative controls behave correctly:** a one-byte corruption is caught by
  both the checksum and the MDC, and the wrong key is rejected.
- **The manifest is complete.** All 15 exported tables carry source counts and
  server-side row-set md5s, and every one was re-verified on restore.

## 5. Restore rehearsal result

**PASS**, on an isolated throwaway PostgreSQL 18.6 cluster (`127.0.0.1:55432`,
deleted afterwards). The existing local PostgreSQL service and every shared or
production database were left untouched.

- The original migrations apply unchanged on top of the compat shim, with
  **zero drift** against the hosted catalog across all 12 compared sections.
- **48/48 rows identical to the source.** Server-side md5s match, there are no
  missing or extra rows, and all constraints are validated.
- RLS farm isolation holds on vanilla PostgreSQL (smoke-test checks 1–9 pass).
- The `pg_dump` restore paths B and C were also proven against a local copy,
  each with 48/48 identical rows.

→ [restore-rehearsal-2026-10-24.md](restore-rehearsal-2026-10-24.md) · runbook: [restore/README.md](../restore/README.md)

## 6. Supabase dependency assessment

Only three services are in use: **PostgreSQL** (portable, done), **Auth**
(data archived, service must be replaced) and the **Data API** (stateless,
must be replaced). RLS is portable with the shim. Storage, Realtime, Edge
Functions, Vault, GraphQL, cron and webhooks are all unused.
→ [supabase-dependency-assessment.md](supabase-dependency-assessment.md)

Security findings recorded for a later phase:

- **F1 (High):** any signed-in user can make themselves `super_admin`, or join
  any farm, by updating their own profile.
- **F2 (Medium):** the policies don't enforce roles, only farms.

→ [security/README.md](../security/README.md)

## 7. Missing items and blockers

1. **Hosted `pg_dump` (blocker).** The local `pg_dump` needs the database
   password, which isn't on this machine, and resetting it would modify the
   project. The Supabase CLI's password-free route was tried and fails here:
   `supabase db dump --linked` → `DockerRunError: docker: command not found
   (podman also not found)`. Either fix works:
   - run `scripts/export-pgdump.sh` with the Session pooler details from
     Dashboard → Connect, or
   - install Docker Desktop or Podman, then use the CLI's `supabase db dump`
     (pipe its output into `gpg`, as `export-pgdump.sh` does).
2. **Auth configuration not captured.** Record the site URL, redirect URLs,
   SMTP settings, email templates and token lifetimes by hand from the
   dashboard.
3. **Single copy on one disk.** Copy the bundles off-site, and the two key
   files into a password manager or offline media, kept apart from each other.
4. **Deployment env unknown.** The Vercel project `bovi-track` exists, but its
   env vars couldn't be read (403). Check whether production points at this
   Supabase project.
5. **Temporary CLI role.** The read-only `supabase db query` calls made the
   CLI create or refresh its self-expiring `cli_login_postgres` login role
   (finding F6). It's the only footprint this archive left on the hosted
   project, and it affects no schema or data.
6. **Supabase MCP server.** It failed to connect, and it's configured for a
   *different* project (`xtpppzhkiagdpmnghdlc`). It played no part in this
   work.
7. **`.env.example` is untracked** because `.gitignore` matches `.env*`.
   Reported only; not changed.

## 8. Git branch and push status

Branch `archive/supabase-archive-01`, created from `main` @ `d5d798e`,
contains only `database-archive/` (documentation, sanitized reports, scripts)
plus `.gitignore` additions. Before the commit, the staged files were checked
to contain no dumps, bundles, keys, auth records or secrets. The branch was
pushed to `origin` and is **not merged**. The push result is recorded in the
commit history and the session summary.

## 9. Migration readiness verdict

| Area | Verdict |
|---|---|
| Database (schema + data) | **Ready.** Restorable and verified without Supabase |
| RLS / security model | **Ready to port** (shim provided). Fix F1 and F2 before real tenants |
| Auth | **Data ready, service not.** Replacement and config capture still needed |
| Data API | **Needs replacement.** One module (`src/lib/db/queries.ts`), read-only |
| Archive completeness | **Complete for all data, verified.** The canonical `pg_dump` is pending (blocker 1) |

---

### Can BoviTrack's database be restored later without relying on the original Supabase project, and what application services would still require replacement?

**Yes.** The encrypted snapshot, the preserved migrations and the restore kit
rebuilt BoviTrack's complete database on plain PostgreSQL 18 with no Supabase
component, and the result was verified rather than assumed:

- the schema is identical to the hosted one;
- all 48 rows (46 application rows plus 1 auth user and 1 identity) are
  byte-identical to the hosted source;
- farm-level RLS isolation works.

Nothing in the restore needs the original project, only the bundles, the two
key files and this repository. So the key files and an off-site copy of the
bundles are the remaining single points of failure.

**Still to be replaced before Supabase can be switched off:**

1. **Authentication.** Supabase Auth backs login, logout, session refresh and
   route gating. Use self-hosted GoTrue or another identity provider, import
   the archived user and its bcrypt hash, and re-create the Auth
   configuration by hand.
2. **The Data API (PostgREST)** that `src/lib/db/queries.ts` calls through
   `supabase-js`. Use self-hosted PostgREST or server-side SQL that passes the
   user's claims, so RLS keeps applying.
3. **The Supabase client wiring and env vars** (`@supabase/ssr`, `supabase-js`,
   `NEXT_PUBLIC_SUPABASE_*`), adapted to the chosen replacements.

Storage, Realtime and Edge Functions need **no replacement today** because
BoviTrack doesn't use them.
