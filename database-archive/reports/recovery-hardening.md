# Recovery hardening — verification of the SUPABASE-ARCHIVE-01 package

SUPABASE-COST-02A · 2026-10-24. Local, non-destructive checks only. No
plaintext data or key material was printed; decrypted bundles were streamed to
`/dev/null` or parsed in memory for counts only. The hosted Supabase project was
not contacted in this phase.

## 1. Archive state vs the ARCHIVE-01 delivery report

| Item | Reported | Found | |
|---|---|---|---|
| Branch / commit | `archive/supabase-archive-01` @ `3adbef0` | same; local = remote; working tree clean | ✅ |
| `main` | untouched @ `d5d798e` | same, local = remote | ✅ |
| Committed archive files | 34 under `database-archive/` + `.gitignore` | 34 + `.gitignore` | ✅ |
| Backup runs | `2026-10-24T172145Z` (rehearsed), `2026-10-24T174450Z` (repeatability) | both present, 4 files each | ✅ |
| Keys | 2 passphrase files outside the repo, owner-only ACL | `%USERPROFILE%\.bovitrack-archive\keys\`, 64 B each; ACL `BARA\bawiz` only, inheritance removed | ✅ |
| Restore kit | `restore/00…05`, `rehearse.sh`, migrations | all present | ✅ |

## 2. Recovery integrity

| Check | Run 172145Z | Run 174450Z |
|---|---|---|
| `SHA256SUMS` vs files | OK | OK |
| file hash = manifest = `SHA256SUMS` = repository docs | ✅ | ✅ |
| app-data decrypts with app key | ✅ | ✅ |
| auth-restricted decrypts with auth key | ✅ | ✅ |
| bundle structure (parsed in memory) | 13 tables / 46 rows + 2 tables / 2 rows, repeatable-read read-only snapshot, **0 mismatches** vs manifest | same |
| migration copies vs originals | identical | identical |

**Fresh full restore rehearsal (today):** disposable PostgreSQL 18.6 cluster on
127.0.0.1 → checksums OK → original migrations → **zero drift** vs hosted
inventory → **VERIFY OK: 15 tables, 48 rows identical to source** → RLS smoke
test → cluster deleted, port closed. Recoverability is re-proven, not assumed.

**Git exclusion:** every backup file, key/passphrase pattern, dump format,
`.env.local`, CLI state and raw-output path tested as ignored on the archive
branch; `backups/README.md` is the only trackable file in `backups/`. On `main`
(which does not yet carry the archive's ignore rules) the local
`.git/info/exclude` guard hides the backups; merging the archive branch would
make that protection permanent in the repository.

## 3. Off-site readiness (prepared and rehearsed locally)

New scripts:

- [`scripts/stage-offsite.sh`](../scripts/stage-offsite.sh) — copies one run
  into an approved destination as separate packages (app / auth, optionally on
  a different destination / metadata / offline restore kit as a git bundle /
  recovery README), writes `OFFSITE-SHA256SUMS`, verifies every copy against
  the **source** checksums. Never copies keys; refuses destinations inside the
  repository or the key folder; performs no network transfer.
- [`scripts/verify-offsite.sh`](../scripts/verify-offsite.sh) — verifies an
  off-site copy: integrity, equality with the local run, equality with the
  hashes recorded in the repository, decryptability with the **off-site key
  copies**, and that the git bundle clones into a working restore kit.

Simulation (two local scratch folders standing in for two approved drives;
nothing left the machine):

| Test | Result |
|---|---|
| stage to drive A, auth to drive B | ✅ packages separated, 0 key files staged |
| refuse destination inside repo / key folder | ✅ both refused |
| `verify-offsite.sh` with key copies | ✅ all 9 checks OK — `RESULT: off-site copy verified` |
| one byte flipped in the auth copy | ✅ caught three ways (checksum, local-run mismatch, decrypt/MDC) |
| **restore using only the off-site files + the bundled kit** | ✅ **VERIFY OK: 15 tables, 48 rows identical**, zero drift |

Procedure and checklist: [`offsite-backup-runbook.md`](offsite-backup-runbook.md).
**Off-site recoverability itself is NOT yet verified** — that requires the
owner to place the packages and keys in approved locations and run
`verify-offsite.sh` there.

## 4. Hardening of `export-pgdump.sh`

Password no longer exported to `gpg`; atomic `*.partial` outputs with cleanup
on failure; read-only preflight (server version, user, TLS in use); refuses the
transaction pooler and a `pg_dump` older than the server; `--sslrootcert` for
`verify-full`; best-effort full/roles dumps that cannot leave partial files.
Tested in five scenarios — details in [`pgdump-readiness.md`](pgdump-readiness.md).

## 5. Disclosures

- **Automatic Vercel Preview.** Pushing `archive/supabase-archive-01` on
  2026-10-24 triggered a Preview deployment through Vercel's Git integration
  (not production; SSO-protected; docs/scripts only). It was not requested and
  was not noticed in ARCHIVE-01. See `deployment-dependency-map.md` §3.
- No key was regenerated or replaced. No backup was uploaded anywhere.
