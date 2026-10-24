# BoviTrack off-site backup runbook

SUPABASE-COST-02A · for the **recovery owner**. This procedure copies the
encrypted BoviTrack backups away from the development computer, stores the keys
separately, and proves the copies can be recovered — without the original
Supabase project.

> Nothing in this runbook uploads data automatically. Placing backups with any
> third-party storage service requires the owner's explicit approval first.

## 1. What must be kept, and where

Four things, deliberately kept apart:

| Item | What it is | Where it may live | Must never sit with |
|---|---|---|---|
| **A. App backup** | `app-data.json.gpg` — encrypted farm data (includes personal data) | off-site location 1 (and 2) | the keys |
| **B. Auth backup** | `auth-restricted.json.gpg` — encrypted user accounts incl. password hashes | a *separate* off-site location, more restricted than A | the keys, ideally not with A |
| **C. Keys** | `SUPABASE-ARCHIVE-01.app-data.passphrase`, `SUPABASE-ARCHIVE-01.auth-restricted.passphrase` | password manager **and** sealed offline media (USB in a safe) | any backup copy |
| **D. Recovery kit** | the git bundle + this runbook + manifest + checksums (no secrets) | with A, and in the private GitHub repo | — (safe anywhere) |

Why: a stolen backup without its key is useless; a lost key without a second
copy makes every backup useless. Keeping A and B apart lets someone hold the
farm data without ever seeing account records.

**Current state (2026-10-24):** A, B and C exist only on the development
computer (`database-archive/backups/…` and `%USERPROFILE%\.bovitrack-archive\keys\`).
D is in the private GitHub repository. **Off-site recoverability is not yet
established** until steps 3–5 are done and verified.

## 2. Recovery checklist (tick every line)

- [ ] Recovery owner named: ______________________ · deputy: ______________________
- [ ] Off-site location 1 approved (type, owner, access list): ______________________
- [ ] Off-site location 2 / auth location approved: ______________________
- [ ] Both passphrases stored in the password manager (entry name recorded)
- [ ] Both passphrases on sealed offline media, stored apart from every backup copy
- [ ] Package staged with `stage-offsite.sh` and copied to location 1
- [ ] Auth package copied to the auth location
- [ ] `verify-offsite.sh` run **on the off-site copy** with the **off-site key copies** → `RESULT: off-site copy verified`
- [ ] Restore rehearsal run from the off-site copy (step 5) → `VERIFY OK`
- [ ] Date, run id and bundle SHA-256s recorded in the password-manager entry
- [ ] Next refresh date set (quarterly, or after significant data changes)

## 3. Stage the package (on the development computer)

Choose a destination the owner has approved — for example an encrypted external
drive mounted as `E:` (`/e` in Git Bash). The script copies, separates and
verifies; it never copies keys and refuses destinations inside the repository
or the key folder.

```bash
cd C:/Projects/BoviTrack
database-archive/scripts/stage-offsite.sh \
  --run database-archive/backups/2026-10-24T172145Z \
  --dest /e/bovitrack-offsite \
  --auth-dest /f/bovitrack-auth-offsite      # optional: a second, more restricted drive
```

It creates:

```
/e/bovitrack-offsite/bovitrack-2026-10-24T172145Z/
  app/app-data.json.gpg
  meta/manifest.json  meta/SHA256SUMS
  recovery/bovitrack-archive.gitbundle  recovery/README-RECOVERY.md
  OFFSITE-SHA256SUMS
/f/bovitrack-auth-offsite/bovitrack-2026-10-24T172145Z-auth/
  auth/auth-restricted.json.gpg
  OFFSITE-SHA256SUMS
```

Without `--auth-dest`, the auth bundle goes to `auth/` inside the same package.

If the approved off-site destination is a cloud store (only after approval),
stage to a local folder first, then upload that folder with the provider's own
client. The files are already encrypted; upload them unchanged.

## 4. Store the keys

1. Open the password manager; create an entry "BoviTrack archive keys".
2. Attach (or paste the single line of) each passphrase file. Do not retype —
   a single changed character makes the backups unreadable.
3. Record in the entry: run id `2026-10-24T172145Z`, the two bundle SHA-256s
   from `meta/SHA256SUMS`, the repository URL, and the off-site locations.
4. Copy both passphrase files to a USB stick; seal it; store it apart from
   every backup copy.

## 5. Verify the off-site copy (the step that makes it count)

Run on any machine with Git Bash (or Linux/macOS), GnuPG and git — ideally
**not** the development computer — using the off-site files and the off-site
key copies:

```bash
# from a checkout of the repo, or from the git bundle (git clone <bundle> kit)
database-archive/scripts/verify-offsite.sh \
  --package      /e/bovitrack-offsite/bovitrack-2026-10-24T172145Z \
  --auth-package /f/bovitrack-auth-offsite/bovitrack-2026-10-24T172145Z-auth \
  --app-key  <usb>/SUPABASE-ARCHIVE-01.app-data.passphrase \
  --auth-key <usb>/SUPABASE-ARCHIVE-01.auth-restricted.passphrase
```

Expected: every line `OK`, ending `RESULT: off-site copy verified`. This proves
(1) the copy is intact, (2) it is the same backup the repository records,
(3) the stored keys open it, and (4) the restore kit travels with it.

Then prove an actual restore from the off-site copy (needs PostgreSQL ≥ 17):

```bash
PKG=/e/bovitrack-offsite/bovitrack-2026-10-24T172145Z
AUTHPKG=/f/bovitrack-auth-offsite/bovitrack-2026-10-24T172145Z-auth   # or $PKG if not split
KEYS=/g                                                               # the sealed USB with both passphrases

git clone "$PKG/recovery/bovitrack-archive.gitbundle" kit             # restore kit, no network needed
mkdir -p run
cp "$PKG/app/app-data.json.gpg" "$AUTHPKG/auth/auth-restricted.json.gpg" "$PKG/meta/SHA256SUMS" run/
kit/database-archive/restore/rehearse.sh --run run --work "$(mktemp -d)" \
  --app-key  "$KEYS/SUPABASE-ARCHIVE-01.app-data.passphrase" \
  --auth-key "$KEYS/SUPABASE-ARCHIVE-01.auth-restricted.passphrase" \
  --hosted-inventory kit/database-archive/schema/hosted-inventory-2026-10-24.json
```

This exact sequence was rehearsed on 2026-10-24 with two local folders standing
in for the drives (`reports/recovery-hardening.md` §3).

Expected: `VERIFY OK: 15 tables, 48 rows identical to source`. Only after this
succeeds may off-site recovery be recorded as **verified**.

## 6. Recover for real (Supabase gone)

Follow `database-archive/restore/README.md`, **Path A**, using the off-site
bundles and keys: compatibility shim → original migrations → decrypt into
`psql` → load → `03_verify.sql`. Then point the replacement auth/API services at
the new database (`database-archive/reports/hosting-options.md`).

## 7. Keep it current

- **Quarterly**, or after significant data changes: take a new snapshot
  (`scripts/export-snapshot.sh`), stage it, verify it off-site, update the
  password-manager entry. Keep at least the two most recent runs.
- **When the canonical `pg_dump` becomes possible**
  (`reports/pgdump-readiness.md`), stage its run the same way.
- **When custody changes**, rotate the passphrases (new snapshot sealed with new
  keys), verify, then retire old copies.
