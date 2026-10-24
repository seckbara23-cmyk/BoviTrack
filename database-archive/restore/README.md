# Restore kit

Restores BoviTrack onto **plain PostgreSQL with no Supabase services**. Path A
was rehearsed end to end against the hosted snapshot on PostgreSQL 18.6.
Paths B and C were exercised with `scripts/export-pgdump.sh` run against a
local copy (the hosted `pg_dump` is still pending). Each run produced zero
schema drift and every row was identical to the source.

> Never restore into an existing production or shared database. Use an empty
> database on the new platform, or run `rehearse.sh`, which builds and deletes
> its own throwaway cluster.

## Files

| File | Purpose |
|---|---|
| `00_supabase_compat.sql` | Roles `anon`, `authenticated`, `service_role`; `extensions.pgcrypto`; `auth.users` and `auth.identities` (hosted column layout); `auth.uid()`, `role()`, `email()`, `jwt()` reading `request.jwt.claims`. Idempotent. |
| `01_supabase_default_grants.sql` | Supabase's default privilege model on `public` (optional; reproduces the hosted grants exactly). |
| `02_load_snapshot.sql` | Loads decrypted bundles from `archive_restore.bundle` in FK order with all constraints enforced, recomputes generated columns, and suspends the signup trigger while users load. |
| `03_verify.sql` | Proves restored rows ≡ source rows: the bundle reproduces the server-side md5, restored and bundle rows compare as exact multisets, counts match, and every constraint is validated. |
| `04_rls_smoke_test.sql` | Simulates API requests per role (anon, super_admin, farm users) and checks farm isolation. Rolled back. |
| `05_after_pgdump_schema.sql` | Path C only: restores `public` schema ownership and ACLs and the `auth.users` signup trigger. |
| `rehearse.sh` | Automated path A in a throwaway cluster on `127.0.0.1:55432` with drift and count comparison. |

## Target requirements

- PostgreSQL **≥ 17** (the hosted version is 17.6; rehearsed on 18.6) with
  `pgcrypto`, plus `psql` and `pg_restore` of the same or a newer major version.
- UTF-8 encoding. To keep text ordering identical to the hosted database, use
  `en_US.UTF-8` (glibc) or ICU `en-US` collation. Verification doesn't depend
  on this; the rehearsal used `C`.
- Ownership of `auth.users` for the loader. That's always true on a
  self-managed target, but **not** on a Supabase project, where
  `supabase_auth_admin` owns it.

Session settings used throughout: `PGCLIENTENCODING=UTF8`, `PGTZ=UTC`.

## Path A: from the logical snapshot (primary)

```bash
export PGCLIENTENCODING=UTF8 PGTZ=UTC        # plus PGHOST/PGUSER/PGDATABASE of the EMPTY target
RUN=database-archive/backups/2026-10-24T172145Z
KEYS=~/.bovitrack-archive/keys
PSQL="psql -X -v ON_ERROR_STOP=1"
GPG="gpg --batch --quiet --pinentry-mode loopback --no-symkey-cache"
COPY="copy archive_restore.bundle (doc) from stdin with (format csv, quote e'\x01', delimiter e'\x02')"

(cd "$RUN" && sha256sum -c SHA256SUMS)

$PSQL -1 -f database-archive/restore/00_supabase_compat.sql
$PSQL -1 -f database-archive/restore/01_supabase_default_grants.sql   # optional, see file
for m in supabase/migrations/*.sql; do $PSQL -1 -f "$m"; done

$PSQL -c "create schema archive_restore; create table archive_restore.bundle (doc jsonb not null);"
$GPG --passphrase-file $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase        -d "$RUN/app-data.json.gpg"        | $PSQL -c "$COPY"
$GPG --passphrase-file $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase -d "$RUN/auth-restricted.json.gpg" | $PSQL -c "$COPY"

$PSQL -f database-archive/restore/02_load_snapshot.sql
$PSQL -f database-archive/restore/03_verify.sql          # must end with: VERIFY OK
$PSQL -f database-archive/restore/04_rls_smoke_test.sql  # optional; rows 1-9 must pass
$PSQL -c "drop schema archive_restore cascade;"          # removes the staged plaintext
```

If GoTrue (self-hosted Supabase Auth) will own the `auth` schema, start GoTrue
against the empty database first, then apply only the roles, extensions and
`auth.uid()` parts of `00` that GoTrue doesn't create, and continue from the
migrations.

## Path B: from `pg_dump` data (once `export-pgdump.sh` has run)

Same schema steps as path A, then:

```bash
$GPG --passphrase-file $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase \
     -d "$PGDUMP_RUN/data-public-auth.dump.gpg" \
  | pg_restore --data-only --disable-triggers --exit-on-error -d "$PGDATABASE"
```

`--disable-triggers` needs a superuser. It also keeps the signup trigger from
inventing profiles. To verify, compare counts with `scripts/inventory.sql` +
`compare-inventory.mjs --counts`. If the data hasn't changed since the
snapshot, also stage the snapshot bundles and run `03_verify.sql`.

## Path C: from `pg_dump` DDL

On an empty database: `drop schema public cascade;` → `00_supabase_compat.sql`
→ `gpg -d schema-public.sql.gpg | psql` → `05_after_pgdump_schema.sql`, then
the data as in path B. Use this only if the migrations and the hosted schema
ever diverge; today they're identical.

## Rehearse

```bash
database-archive/restore/rehearse.sh --run "$RUN" --work "$(mktemp -d)" \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase \
  --hosted-inventory database-archive/schema/hosted-inventory-2026-10-24.json
```

The script refuses to run if the port is already in use or the cluster
directory exists, binds to `127.0.0.1` only with a random scram password, and
deletes the cluster on exit. It exits non-zero on drift, a count mismatch, a
verification failure or an RLS failure.
