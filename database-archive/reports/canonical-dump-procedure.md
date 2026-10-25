# Canonical hosted `pg_dump` — owner procedure

SUPABASE-COST-03A · 2026-10-25. Uses the existing
[`scripts/export-pgdump.sh`](../scripts/export-pgdump.sh) and
[`restore/rehearse-pgdump.sh`](../restore/rehearse-pgdump.sh). Read-only
against the hosted project: nothing is modified, paused or deleted, and no
other Supabase project is involved.

## Confirmed connection parameters (non-secret)

| Parameter | Value |
|---|---|
| Project | `vustkojrbefcbzotgorc` (Bovitrack, eu-west-1, PostgreSQL 17.6) |
| Method | Session pooler (IPv4, session mode — required by `pg_dump`) |
| Host / port | `aws-0-eu-west-1.pooler.supabase.com` / `5432` |
| Database / user | `postgres` / `postgres.vustkojrbefcbzotgorc` (role `postgres`, which has BYPASSRLS) |

## Verified before running (2026-10-25)

| Check | Result |
|---|---|
| Client tools | `pg_dump`/`pg_restore`/`psql` **18.6** ≥ server 17.6 ✅ |
| Pooler reachable, TLS | TLS **1.3**, `TLS_AES_256_GCM_SHA384` (handshake-only probe; no login attempted) ✅ |
| Server certificate | `CN=*.pooler.supabase.com` ← *Supabase Intermediate 2021 CA* ← *Supabase Root 2021 CA* (private CA; Windows system roots do not trust it, so the CA file is required for `verify-full`) |
| Root seen on the wire | SHA-256 `80:70:25:AD:50:D4:ED:21:9D:2C:9C:7D:29:9C:00:4F:82:4E:B0:0C:F7:F6:5A:FE:F6:07:D0:7B:72:E6:CA:FA`, valid to 2031-04-26 — **cross-check only**; trust the file you download from the dashboard |
| Script on Windows with `verify-full` | proven on a local TLS server: right CA → export OK; wrong CA → refused, 0 files; hostname mismatch → refused, 0 files; Git Bash CA path converted automatically |
| Independent restore of a dump run | `rehearse-pgdump.sh`: 48/48 rows identical, zero drift on both restore paths, full + roles dumps readable |

## Step 1 — Download Supabase's root certificate

Dashboard → project **Bovitrack** → Project Settings → Database → **SSL
Configuration** → *Download certificate* (`prod-ca-2021.crt`). Save it, e.g. to
`C:\Users\bawiz\Downloads\prod-ca-2021.crt`. Optional cross-check in Git Bash:

```bash
openssl x509 -in ~/Downloads/prod-ca-2021.crt -noout -subject -fingerprint -sha256
# subject should be "Supabase Root 2021 CA"; fingerprint should equal the value above
```

## Step 2 — Run the export (Git Bash window)

Open **Git Bash** (Start → Git Bash), then:

```bash
cd /c/Projects/BoviTrack
KEYS=~/.bovitrack-archive/keys
database-archive/scripts/export-pgdump.sh \
  --host aws-0-eu-west-1.pooler.supabase.com \
  --port 5432 \
  --dbname postgres \
  --user postgres.vustkojrbefcbzotgorc \
  --sslrootcert ~/Downloads/prod-ca-2021.crt \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase
```

It asks `Password for postgres.vustkojrbefcbzotgorc@aws-0-eu-west-1.pooler.supabase.com:`
— type the database password; **nothing is echoed, logged or written**. Do not
put the password on the command line or in an exported variable in a shared
shell.

Expected output:

```
== preflight: server 17.6 as postgres · pg_dump 18 · sslmode=verify-full · ssl=true
   CA sha256 fingerprint: 80:70:25:AD:…:CA:FA
== pg_dump -> …/database-archive/backups/<UTC>-pgdump
  schema-public.sql.gpg …   data-public.dump.gpg …   data-public-auth.dump.gpg …
  full-database.dump.gpg …  (or a non-fatal note)    roles.sql.gpg …
done: …
```

Every artifact is streamed straight into GnuPG (AES-256), written as
`*.partial` and renamed only on success; a failure leaves no files. The run
folder is git-ignored.

| Artifact | Key | Covers |
|---|---|---|
| `schema-public.sql.gpg` | app | DDL of `public`: tables, constraints, indexes, enums, functions, triggers, **RLS policies, grants** |
| `data-public.dump.gpg` | app | all application rows |
| `data-public-auth.dump.gpg` | **auth** | application rows + `auth.users` + `auth.identities`, one snapshot |
| `full-database.dump.gpg` | **auth** | whole database incl. Supabase-managed schemas (best effort; non-fatal if a managed object is unreadable) |
| `roles.sql.gpg` | app | role definitions without passwords (best effort) |

## Step 3 — Verify checksum, currency, and restore

```bash
DUMP=$(ls -d database-archive/backups/*-pgdump | tail -1)
(cd "$DUMP" && sha256sum -c SHA256SUMS)                       # every line OK

# hosted data still equal to the verified archive? (read-only; keep output private)
PRIV=$(mktemp -d)
npx supabase db query --linked --project-ref vustkojrbefcbzotgorc -o json \
  -f database-archive/scripts/reconcile.sql > "$PRIV/reconcile.json"
node database-archive/scripts/reconcile-compare.mjs "$PRIV/reconcile.json" \
  database-archive/backups/2026-10-24T172145Z/manifest.json      # RESULT: identical
rm -rf "$PRIV"

# independent restoration rehearsal (throwaway cluster, deleted afterwards)
database-archive/restore/rehearse-pgdump.sh \
  --pgdump-run "$DUMP" \
  --snapshot-run database-archive/backups/2026-10-24T172145Z \
  --hosted-inventory database-archive/schema/hosted-inventory-2026-10-24.json \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase \
  --work "$(mktemp -d)"
# expect: VERIFY OK: 15 tables, 48 rows identical · no drift (both paths) ·
#         RESULT: canonical dump independently restored and verified
```

Steps 3's verification needs no password; it can also be run by the archive
maintainer afterwards. Then stage the new run off-site like the others
(`offsite-backup-runbook.md`).

## If the database password is not available

The dashboard never displays the existing password. Options **without changing
any credential**:

1. Retrieve it from where it was saved when the project was created (password
   manager, browser password store, an old private `.env` / connection string
   kept by the owner).
2. **Password-free route:** with separate approval, install Docker Desktop or
   Podman, then run `supabase db dump --linked --project-ref vustkojrbefcbzotgorc`
   (the CLI uses its own temporary login role) and pipe each output into `gpg`
   exactly as the script does — never write a plaintext dump.

Option that **changes** credentials (not authorized in this phase): Dashboard →
Project Settings → Database → *Reset database password*. If ever approved:
the BoviTrack app does not use the database password (production does not use
Supabase at all), and no repository file references it — but record the new
password in the password manager immediately.

The platform's daily backups for this project are physical backups and cannot
be downloaded as a portable dump.
