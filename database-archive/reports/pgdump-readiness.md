# Canonical `pg_dump` readiness

SUPABASE-COST-02A · 2026-10-24 · project `vustkojrbefcbzotgorc` (PostgreSQL 17.6,
eu-west-1). **Status: READY TO RUN — BLOCKED only on the database password.**
The export script was hardened and tested end-to-end against a disposable local
copy; it has not been run against the hosted project.

## 1. Tooling (verified on the development machine)

| Tool | Version | Requirement | OK |
|---|---|---|---|
| `pg_dump` / `pg_dumpall` / `pg_restore` / `psql` | 18.6 | ≥ server major (17) | ✅ |
| GnuPG | 2.4.9 | symmetric AES-256 | ✅ |
| Docker / Podman | not installed | only for the CLI's password-free route | — |

The script refuses to run if `pg_dump` is older than the server.

## 2. How to connect

| Option | Host / port | User | Use for `pg_dump`? |
|---|---|---|---|
| **Session pooler** (recommended) | `aws-<n>-eu-west-1.pooler.supabase.com:5432` (exact host shown in the dashboard) | `postgres.vustkojrbefcbzotgorc` | ✅ IPv4, full session |
| Direct connection | `db.vustkojrbefcbzotgorc.supabase.co:5432` | `postgres` | ⚠️ IPv6-only unless the IPv4 add-on is enabled |
| Transaction pooler | port 6543 | — | ❌ refused by the script (no session) |

Find the exact pooler host in **Dashboard → Connect → Session pooler**. Only
the host and user are needed; never paste the full connection string anywhere.

**TLS.** Always on. Default `sslmode=require` encrypts but does not verify the
server certificate, and the script prints a warning. For full verification,
download the Supabase root CA (**Dashboard → Project Settings → Database → SSL
Configuration → Download certificate**) and pass `--sslrootcert <file>`; the
script then uses `sslmode=verify-full`. The preflight reports whether TLS is
actually in use.

**Role.** `pg_dump` turns row security off and **fails on RLS tables unless the
role has BYPASSRLS** (reproduced in testing: "query would be affected by
row-level security policy for table farms"). Supabase's `postgres` role has
BYPASSRLS (hosted inventory), so connect as `postgres` / `postgres.<ref>`. A
custom read-only role would need BYPASSRLS too.

## 3. Obtaining the credentials securely

The database password is the only missing input. In order of preference:

1. **The owner already has it** (it was set when the project was created) →
   retrieve it from the password manager. Nothing else is needed.
2. **The owner does not have it** → the dashboard does not show it; it can only
   be **reset** (Project Settings → Database → Reset database password). A
   reset **changes the hosted project** and therefore needs explicit approval.
   Impact assessment: the BoviTrack app never uses the database password (it
   talks to Supabase over HTTPS with the anon key, and production does not use
   Supabase at all — see `deployment-dependency-map.md`), and no repository
   file references it. Store the new password in the password manager
   immediately.
3. **Password-free alternative** → install Docker Desktop or Podman (separate
   approval), then `supabase db dump --linked --project-ref vustkojrbefcbzotgorc`.
   The CLI then uses its temporary `cli_login_postgres` role. Pipe its output
   into `gpg` exactly as `export-pgdump.sh` does; never write a plaintext dump.

Rules: never send the password through chat, email or tickets; type it only at
the script's hidden prompt (or export `PGPASSWORD` in your own terminal session
just before running); never put it in a command line, a file, or the repository.

Platform backups are not an alternative: the project's 8 daily backups are
**physical** (WAL-G), restorable only inside Supabase, not downloadable as a
portable dump.

## 4. Running it

> Owner-confirmed parameters, TLS findings and the exact Windows (Git Bash)
> commands are in [canonical-dump-procedure.md](canonical-dump-procedure.md)
> (SUPABASE-COST-03A).

```bash
cd C:/Projects/BoviTrack
KEYS=~/.bovitrack-archive/keys
database-archive/scripts/export-pgdump.sh \
  --host aws-<n>-eu-west-1.pooler.supabase.com --port 5432 \
  --user postgres.vustkojrbefcbzotgorc \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase \
  --sslrootcert ~/Downloads/prod-ca-2021.crt          # recommended
# prompts: Password for postgres.vustkojrbefcbzotgorc@…: (hidden)
```

Output: `database-archive/backups/<UTC>-pgdump/` (git-ignored). Then verify and
rehearse:

```bash
(cd database-archive/backups/<UTC>-pgdump && sha256sum -c SHA256SUMS)
# restore path B (restore/README.md) into a disposable cluster, then 03_verify.sql
```

## 5. Scope and exclusions

| Artifact | Key | Contents |
|---|---|---|
| `schema-public.sql.gpg` | app | DDL of schema `public` (`--schema-only --no-owner`) |
| `data-public.dump.gpg` | app | all `public` rows (custom format) |
| `data-public-auth.dump.gpg` | auth | `public.*` + `auth.users` + `auth.identities`, **one snapshot** |
| `full-database.dump.gpg` | auth | whole database, best effort (non-fatal if Supabase-managed objects are not readable) |
| `roles.sql.gpg` | app | role definitions without passwords, best effort |

Deliberately **excluded** from the public-schema dumps: Supabase-managed
schemas — `auth` (except users/identities), `storage`, `realtime`, `vault`,
`extensions`, `graphql`, `graphql_public`, `pgbouncer` — and all global roles'
passwords. A default `pg_dump` never contains the Auth service configuration,
the JWT signing keys, or the platform's role passwords; those are platform
state, documented in `auth/README.md`.

## 6. Script review (COST-02A hardening)

| Check | Result |
|---|---|
| Password in argv | ❌ never — hidden prompt or pre-exported `PGPASSWORD`, captured then unset |
| Password visible to `gpg` | ❌ no — passed only to PostgreSQL client processes |
| Password written to disk | ❌ never |
| Plaintext dump on disk | ❌ never — streamed into `gpg` |
| Partial files on failure | ❌ none — written as `*.partial`, renamed on success, removed on any failure |
| Read-only | ✅ `pg_dump` snapshots are REPEATABLE READ READ ONLY; preflight runs `set transaction read only` |
| Version guard | ✅ refuses `pg_dump` older than the server |
| Pooler guard | ✅ refuses port 6543 |
| TLS | ✅ always; `verify-full` with `--sslrootcert` |
| Credentials in committed files | ✅ none (staged-content scan) |

### Test evidence (disposable local cluster, 2026-10-24)

| Test | Result |
|---|---|
| T1 normal export | 5 encrypted artifacts, `SHA256SUMS` OK, preflight reported versions/TLS |
| T1b restore path B from that export | **VERIFY OK: 15 tables, 48 rows identical to source** |
| T1c `full-database.dump` readable | 15 TABLE DATA entries |
| T2 wrong password | exit 2, "export FAILED", **0 files left** |
| T3 port 6543 | refused before connecting |
| T4 role without BYPASSRLS | clean failure, 0 partial files (documents the BYPASSRLS requirement) |
| T4b role with BYPASSRLS, one unreadable schema | core dumps OK; full dump **non-fatal**, recorded in manifest; 0 partials |

## 7. What remains

Only the owner action in §3. After the first hosted run: verify checksums,
rehearse restore path B, stage it off-site (`offsite-backup-runbook.md`), and
record the run in `backups/README.md`.
