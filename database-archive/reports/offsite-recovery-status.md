# Off-site recovery status

Updated SUPABASE-COST-03A · 2026-10-25. **Gate: PARTIAL** — one verified
off-site copy now exists and a restore from it passed, but the encryption keys
still exist only on the development computer, there is no second independent
copy, and no deputy is named. **Deletion is not authorized while this gate is
PARTIAL.**

## Requirements

| # | Requirement | Status | Evidence |
|---|---|---|---|
| 1 | One verified copy outside the development computer | ✅ **VERIFIED** | Google Drive (owner-authorized): two folders, *APP DATA* and *AUTH RESTRICTED*, inherited sharing disabled. Every file downloaded back and matched its SHA-256 (`app-data` `e17e1180…`, `auth-restricted` `0fa8dca7…`, auth config `e94d9bf7…`) |
| 2 | Second independent copy where feasible | ⛔ **OPEN** | only Drive so far (GitHub holds tooling, not data). Recommended: encrypted USB drive stored apart from the laptop |
| 3 | Keys in an approved password manager **and** an offline location, separate from the backups | ⛔ **OPEN — critical** | the two passphrases exist only in `%USERPROFILE%\.bovitrack-archive\keys\`. If the laptop is lost, the Drive copy cannot be decrypted |
| 4 | Recovery owner and deputy | ⚠️ **PARTIAL** | owner: **Bara Seck** (recorded 2026-10-25); deputy: not named |
| 5 | SHA-256 verification of copied archives | ✅ **VERIFIED** | see #1 |
| 6 | Restore rehearsal from the off-site copy with separately recovered keys | ⚠️ **PARTIAL** | restore from the **Drive-downloaded** files: zero drift, **VERIFY OK: 15 tables, 48 rows identical**. The keys used came from the laptop folder, not from an independent key copy — to be repeated once #3 is done |

Keys were never uploaded. Data uploaded to Drive is ciphertext only.

## Remaining owner actions (≈ 30 minutes)

1. **Keys (critical):** copy both `SUPABASE-ARCHIVE-01.*.passphrase` files into
   the password manager (attach the files or paste the single line exactly),
   and onto a sealed USB stick kept apart from the laptop and any backup drive.
2. **Prove the key copies:** on any machine, download the two Drive bundles
   and run
   `database-archive/scripts/verify-archive.sh <dir> --app-key <copy> --auth-key <copy>`
   using the **password-manager or USB** copies → `RESULT: archive intact`;
   then the restore in `offsite-backup-runbook.md` §5 → `VERIFY OK`.
3. **Second copy:** `stage-offsite.sh --run database-archive/backups/2026-10-24T172145Z --dest <encrypted USB>`,
   then `verify-offsite.sh` on it.
4. **Deputy:** name one and give them independent access to the password-manager
   entry.
