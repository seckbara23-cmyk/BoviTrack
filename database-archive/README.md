# BoviTrack database archive (SUPABASE-ARCHIVE-01)

A portable, verified archive of BoviTrack's Supabase database
(project `vustkojrbefcbzotgorc`, PostgreSQL 17.6, eu-west-1). Its purpose is to
let BoviTrack leave Supabase later without losing data, structure or security
rules. Nothing on the hosted project was migrated, paused, deleted or altered.

**Start here:** [reports/final-report.md](reports/final-report.md)

## Status at a glance (2026-10-24)

| Item | Status |
|---|---|
| Hosted inventory (schema, RLS, grants, auth, storage, services) | ✅ done, read-only — [reports/inventory-report.md](reports/inventory-report.md) |
| Schema drift: hosted vs `supabase/migrations` | ✅ none (line endings only) |
| Logical snapshot: all `public` data + `auth.users` / `auth.identities` | ✅ 48 rows, encrypted, checksummed |
| Restore rehearsal on vanilla PostgreSQL 18 (throwaway cluster) | ✅ every row identical to source, RLS works |
| Canonical `pg_dump` of the hosted database | ⛔ blocked: no database password here, and the CLI route needs Docker. The script is ready and tested locally |
| Auth service configuration (site URL, SMTP, templates, JWT keys) | ⚠️ not exported (contains secrets); needs a manual record |
| Off-site copy of bundles + keys | ⚠️ your action, see [backups/README.md](backups/README.md) |

## Layout

```
database-archive/
├── README.md                 this file
├── .gitignore                allow-list: only docs, sanitized reports, scripts
├── .gitattributes            LF everywhere (keeps checksums and bash stable)
├── schema/                   sanitized hosted inventory (drift reference) + schema overview
├── migrations/               byte-identical copies of supabase/migrations + seed, SHA256SUMS
├── security/                 RLS model, grants, security findings
├── auth/                     auth inventory, what was exported, replacement options
├── backups/                  ENCRYPTED bundles per run (git-ignored, README only in git)
├── restore/                  restore kit: compat shim, loader, verifier, RLS test, rehearsal
├── reports/                  inventory, rehearsal, dependency assessment, final report
└── scripts/                  read-only export, seal/encrypt, drift compare, integrity check
```

## Common tasks

All scripts are bash and run in Git Bash on Windows as well as on Linux and macOS.
They need PostgreSQL client tools (rehearsed with 18.6), GnuPG, Node.js, and the
Supabase CLI for exports.

```bash
KEYS=~/.bovitrack-archive/keys
RUN=database-archive/backups/2026-10-24T172145Z

# integrity check (checksums + decrypt test + migration copies)
database-archive/scripts/verify-archive.sh "$RUN" \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase

# full restore rehearsal into a throwaway local cluster (deleted afterwards)
database-archive/restore/rehearse.sh --run "$RUN" --work "$(mktemp -d)" \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase \
  --hosted-inventory database-archive/schema/hosted-inventory-2026-10-24.json

# take a fresh read-only snapshot later (uses your `supabase login`)
database-archive/scripts/export-snapshot.sh --project-ref vustkojrbefcbzotgorc \
  --app-key  $KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key $KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase
```

## Git safety rules

- Committed: documentation, sanitized reports (metadata and counts only), scripts.
- Never committed: anything under `backups/` except its README, any `*.gpg`,
  `*.dump` or key file, raw query output, decrypted material. These rules are
  enforced by `database-archive/.gitignore` and the root `.gitignore`.
- Encryption keys live outside the repository
  (`%USERPROFILE%\.bovitrack-archive\keys\`) and never next to the bundles.
