# Off-site recovery status

SUPABASE-COST-02B · 2026-10-25. **Gate: BLOCKED** — no actual off-site copy of
the backups exists, the keys have a single copy, and no recovery owner is named.
Nothing was uploaded or copied anywhere during this audit.

## Checks

| Requirement | Status | Evidence |
|---|---|---|
| Bundles on approved storage separate from the dev machine | ⛔ **BLOCKED** | no other drive connected; no `app-data.json.gpg` / `auth-restricted.json.gpg` / `bovitrack-2026*` package anywhere in the user profile outside the repository (incl. the OneDrive folder); no matching file in the connected Google Drive |
| Encryption keys independently recoverable | ⛔ **BLOCKED** | the two passphrases exist only in `%USERPROFILE%\.bovitrack-archive\keys\` (owner-only ACL); no second copy can be confirmed (password manager / sealed media are outside what can be checked) |
| Backup file checksums match | ✅ **VERIFIED (local)** | both runs: `SHA256SUMS` OK, decrypt OK, manifest consistent (`verify-archive.sh`, 2026-10-25) |
| Recovery owner identified | ⛔ **BLOCKED** | the checklist in `offsite-backup-runbook.md` §2 is still blank |
| Documented procedure restores without Supabase | ✅ **VERIFIED** | `restore/README.md` Path A + `rehearse.sh`: zero drift, 48/48 rows identical on PostgreSQL 18 (re-run 2026-10-25); restore from a *simulated* off-site copy using only the bundled kit verified on 2026-10-24 |
| Off-site tooling ready | ✅ **READY** | `stage-offsite.sh`, `verify-offsite.sh` (tested, tamper detection proven) |

## Why this blocks suspension

Today the only copies of the BoviTrack data outside Supabase are on one laptop
disk, encrypted with keys stored on the same disk. If the project were
suspended or later lost and that disk failed, the data would be unrecoverable.
Owner acceptance cannot replace the missing copy.

## To unblock (owner, ≈ 30–60 minutes)

1. Name the recovery owner and a deputy (runbook §2).
2. Choose approved destinations: an encrypted external drive for the app
   package, a second one (or the same with a separate folder) for the auth
   package. Using any cloud store requires explicit approval first.
3. Stage and copy: `database-archive/scripts/stage-offsite.sh --run
   database-archive/backups/2026-10-24T172145Z --dest <drive A> --auth-dest <drive B>`.
4. Put both passphrase files in the password manager **and** on sealed offline
   media stored apart from the drives.
5. From another machine if possible, run `verify-offsite.sh` on the copies with
   the off-site key copies → `RESULT: off-site copy verified`; then the
   restore in runbook §5 → `VERIFY OK: 15 tables, 48 rows`.
6. Record run id, bundle SHA-256s and locations in the password-manager entry.

When step 5 passes, this gate becomes **VERIFIED**.
