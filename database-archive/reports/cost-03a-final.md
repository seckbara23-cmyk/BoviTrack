# SUPABASE-COST-03A — final archive before Supabase deletion

Date: 2026-10-25 · Project: BoviTrack · Supabase project `vustkojrbefcbzotgorc`
("Bovitrack", eu-west-1, PostgreSQL 17.6). **No hosted project was deleted,
paused, transferred or modified.** Hosted contact was read-only: one
reconciliation query, one `supabase config pull` into a private scratch
directory (local file only), and metadata listings; as before, the CLI
refreshed its own self-expiring `cli_login_postgres` role for the query. Other
Supabase projects (incl. Effitrans Operations, CX Academy, Radiora) were not
touched.

## 1. Canonical dump status — ⛔ BLOCKED

No authorized credentials on this machine (no env vars, no `.pgpass`, no
matching `pgpass.conf` entry) and no Docker for the CLI route. The password was
not requested, reset or rotated. Prepared instead:

- `scripts/export-pgdump.sh` (hardened, Docker-free equivalent of Supabase's
  official roles/schema/data dumps) — tested.
- **New `restore/rehearse-pgdump.sh`** — independently restores a dump run in a
  throwaway cluster (data path + DDL path) and verifies it. End-to-end test on a
  disposable copy: **VERIFY OK 48/48 rows**, zero drift on both paths, full and
  roles dumps readable, one-byte tamper caught.

Owner action: see §11, item 1.

**Update (owner-confirmed parameters):** Session pooler
`aws-0-eu-west-1.pooler.supabase.com:5432`, user `postgres.vustkojrbefcbzotgorc`,
database `postgres`. Verified without logging in: pooler reachable, TLS 1.3,
certificate chain to *Supabase Root 2021 CA* (`verify-full` needs the dashboard
CA file). The script now converts Git Bash CA paths for the native Windows
client, always applies `verify-full` when a CA is given, and records the CA
fingerprint; proven locally (right CA → OK, wrong CA / hostname mismatch →
refused with 0 files, rehearsal 48/48). Exact owner commands:
[canonical-dump-procedure.md](canonical-dump-procedure.md). The dump itself
remains **pending** until the owner types the password at the hidden prompt.

## 2. Encrypted archive status — ✅ VERIFIED

Runs `2026-10-24T172145Z` and `…174450Z` (app + auth bundles) pass checksums,
manifests and decryption. New run `2026-10-25T132152Z-authconfig` holds the
encrypted Auth configuration. All git-ignored; keys outside the repository.

## 3. Latest hosted data reconciliation — ✅ VERIFIED (identical)

Read-only, single repeatable-read transaction at 2026-10-25 13:19 UTC: **all
15 tables identical** to both archive runs (row count + server-side row-set
md5). Writes still 47 lifetime, 0 Data-API client calls, 0 sign-ins. No new
snapshot was needed; earlier runs preserved unchanged.

## 4. Independent restore verification — ✅ VERIFIED

Isolated PostgreSQL 18.6 throwaway clusters: from the local archive and, after
upload, **from the copies downloaded from Google Drive** — both zero drift
(tables, columns, constraints, indexes, enums, functions, triggers, policies,
all grants) and **48/48 rows identical**.

## 5. Authentication configuration preservation — ✅ VERIFIED

Pulled read-only, encrypted (auth key), stored locally and on Drive; non-secret
settings recorded in `auth/auth-config-2026-10-25.md`. Email/password only;
sign-ups open; confirmation required; min length 6; **Site URL still the default
`localhost`**; no custom SMTP, templates, OAuth or hooks. Secrets to recreate:
JWT secret/keys, anon/service keys, a new SMTP provider. Bcrypt hashes are
GoTrue-compatible, but the record lists the sign-in tests a rebuild must pass.

## 6. Off-site recovery verification — ⚠️ PARTIAL

Owner-authorized **Google Drive** copy in two separate restricted folders (app;
auth + auth config), every file downloaded back and SHA-256-matched, restore
from the downloaded copies passed. **Open:** keys exist only on the laptop
(critical — the Drive copy is useless without them), no second independent
copy, no deputy (owner: Bara Seck). → `offsite-recovery-status.md`

## 7. Application dependency verification — ✅ production / ❓ two unknowns

Production `bovi-track.vercel.app` (`main` @ `d5d798e`): demo mode, all screens
200, no Supabase host in the public bundle (re-checked 13:22 UTC); database
statistics show zero client use ever. No crons, webhooks, Edge Functions or API
routes. **UNKNOWN (403 / not exposed):** Vercel environment-variable names
(Preview scope), integrations and webhooks; the one Preview deployment
(`3adbef0`, SSO-protected) cannot be inspected. No usage was ever recorded, but
these must be closed by the owner before deletion.

## 8. Security findings and future remediation — ✅ documented, fixes tested

| Finding | Severity | Fix (not applied) | Verified on disposable restore |
|---|---|---|---|
| F1 users change their own role/farm | High | `0003_profiles_privilege_guard.sql` | 8/11 tests fail before → 11/11 pass after |
| F2 viewers write farm records | Medium | **new** `0004_role_aware_write_policies.sql` | 10/19 fail before → 19/19 pass after |
| Both together | — | 0003 + 0004 | smoke test 12/12; data unchanged; rollback = zero drift |

Rule: never expose the archived authorization model in a new public
environment without these fixes. Full rebuild path: `future-restoration-guide.md`.

## 9. Git branch and commit

Branch `archive/supabase-cost-03a` from `archive/supabase-cost-02b` @ `b68060e`;
sanitized reports, scripts and proposed (unapplied) SQL only; `vercel.json`
names this branch in the archive build exclusion. Commit and push status: see
the delivery summary.

## 10. Estimated compute savings

≈ **$10/month** (≈ $120/year) — BoviTrack's Micro compute instance in the paid
organization (9 active projects). Confirm on the organization's Usage page.

## 11. Outstanding blockers (owner actions)

| # | Blocker | Owner action |
|---|---|---|
| 1 | **Canonical dump** | in your own terminal: `database-archive/scripts/export-pgdump.sh --host <Session pooler host from Dashboard → Connect> --user postgres.vustkojrbefcbzotgorc --app-key ~/.bovitrack-archive/keys/SUPABASE-ARCHIVE-01.app-data.passphrase --auth-key ~/.bovitrack-archive/keys/SUPABASE-ARCHIVE-01.auth-restricted.passphrase --sslrootcert <Supabase CA file>` (type the DB password at the hidden prompt), then `restore/rehearse-pgdump.sh --pgdump-run <new run> --snapshot-run database-archive/backups/2026-10-24T172145Z …` → `RESULT: canonical dump independently restored and verified`; then stage the dump run off-site too |
| 2 | **Keys not independently stored** | password manager + sealed USB; prove them by decrypting the Drive copy with those copies (`offsite-recovery-status.md`) |
| 3 | Second independent backup copy | `stage-offsite.sh` to an encrypted USB drive, `verify-offsite.sh` |
| 4 | Deputy recovery owner | name one with independent key access |
| 5 | Vercel Preview env, integrations, webhooks | Vercel dashboard: Settings → Environment Variables (Preview, names only), Integrations; delete the stale Preview if unneeded |

---

## Verdict for permanent Supabase deletion: **NO-GO**

The data, auth identities and auth configuration are preserved, current,
verified off-site and independently restorable, and production does not depend
on Supabase. But two **critical** recovery gates fail: there is **no canonical
dump**, and the **encryption keys have no independent copy** — losing the laptop
today would make every off-site copy unreadable. Two application-independence
items are also still unknown. Deletion is irreversible, so these must close
first.

When blockers 1–5 are closed and verified, this becomes a GO — and even then
**deletion requires a separate, explicit owner authorization** in a new
request. Nothing was deleted, paused or transferred in this execution.
