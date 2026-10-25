# Future restoration guide — bringing BoviTrack's database back

SUPABASE-COST-03A · 2026-10-25. For whoever resumes BoviTrack development
after the Supabase project is retired. Everything here works **without the
original Supabase project**. Inputs: the private GitHub repository (this
archive), the encrypted bundles (local or Google Drive), and the two
passphrases (password manager / offline media).

## 0. Choose the target

| Option | Use when | Notes |
|---|---|---|
| **A. PostgreSQL + self-hosted GoTrue + PostgREST** (one VPS) | resuming development with the current code | no app-code change; see `hosting-options.md` (≈ €10/month) |
| B. Managed PostgreSQL + GoTrue/PostgREST on a small VPS | real farms / production | provider-run backups and PITR (≈ €19/month) |
| C. A new Supabase project | fastest, if staying on Supabase | load data with the canonical dump if one exists (the snapshot loader needs ownership of `auth.users`, which Supabase does not grant) |

## 1. PostgreSQL setup

- PostgreSQL **≥ 17** (archive taken from 17.6; rehearsed on 18.6), UTF-8,
  `pgcrypto` available. Use `en_US.UTF-8` or ICU `en-US` collation for the
  same ordering as before.
- Create an **empty** database. Never restore into a database holding other
  data.

## 2. Restore schema and data

From a checkout of the repository (branch `archive/supabase-cost-03a` or later):

```bash
export PGCLIENTENCODING=UTF8 PGTZ=UTC        # + PGHOST/PGUSER/PGDATABASE of the empty target
RUN=<folder with app-data.json.gpg, auth-restricted.json.gpg, SHA256SUMS>
(cd "$RUN" && sha256sum -c SHA256SUMS)
```

Then follow `database-archive/restore/README.md` **Path A**:
`00_supabase_compat.sql` → `01_supabase_default_grants.sql` →
`supabase/migrations/*.sql` → decrypt both bundles into
`archive_restore.bundle` → `02_load_snapshot.sql` → `03_verify.sql`
(must print `VERIFY OK: 15 tables, 48 rows identical to source`).

If a canonical dump exists (`backups/<UTC>-pgdump/`), verify it first with
`restore/rehearse-pgdump.sh`, then use Path B.

To rehearse safely first, run `restore/rehearse.sh` (throwaway cluster).

If GoTrue (option A/B) will own the `auth` schema: start GoTrue against the
empty database **before** step 2 so it creates `auth.*`, then apply only the
role/extension/`auth.uid()` parts of `00_supabase_compat.sql` it lacks, and
load the auth bundle into GoTrue's tables.

## 3. Apply the security fixes — before any user signs in

```bash
psql -f database-archive/security/proposed/0003_profiles_privilege_guard.sql
psql -f database-archive/security/proposed/0004_role_aware_write_policies.sql
# inside rolled-back transactions; all must pass:
psql -f database-archive/security/proposed/test_0003_profiles_privilege_guard.sql
psql -f database-archive/security/proposed/test_0004_role_aware_write_policies.sql
psql -f database-archive/restore/04_rls_smoke_test.sql     # 12/12 pass
```

Never publish the archived authorization model without these fixes (or
approved equivalents). Rollback files exist for both.

## 4. Auth replacement

- **Self-hosted Supabase Auth (GoTrue)** keeps `@supabase/ssr`/`supabase-js`,
  `auth.uid()` and the bcrypt hashes as-is.
- Configure from `database-archive/auth/auth-config-2026-10-25.md`: set the
  **Site URL** to the real app URL (it was still `localhost`), add redirect
  URLs, configure an **SMTP provider** (none existed), raise the minimum
  password length, decide whether sign-ups are open.
- Generate a **new JWT secret**; derive new `anon` / `service_role` keys.
- Test sign-in for the imported user (or a password reset), plus a fresh
  test account end-to-end — imported hashes alone do not prove a working
  login (see the auth record's test list).

## 5. Database access (Data API)

- Run **PostgREST** with `db-anon-role = anon`, the same JWT secret as GoTrue,
  and schema `public`. It sets `request.jwt.claims` per request, which
  `auth.uid()` and every RLS policy read.
- Any other API layer must do the same per request: `set local role
  authenticated` + `set_config('request.jwt.claims', '{"sub":"<user uuid>"}', true)`
  inside a transaction (pooler-safe).

## 6. Environment configuration

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | the public URL of the GoTrue + PostgREST gateway |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | the new anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | not used by the code; keep server-side only if scripts need it |

Setting the two public variables switches the app from demo mode to live data
at the next build; without them it stays in demo mode (as production is now).

## 7. Security validation before go-live

1. Regression tests 0003 + 0004 and the RLS smoke test pass on the target.
2. Inventory drift check vs `schema/hosted-inventory-2026-10-24.json` shows only
   the intended policy/grant changes from 0003/0004.
3. Sign in as each role (synthetic accounts) and confirm read/write behaviour
   matches the role matrix in `security-remediation-plan.md`.
4. The anon key alone returns no rows from any table.
5. TLS on every endpoint; database not reachable from the internet except via
   the API/pooler.
