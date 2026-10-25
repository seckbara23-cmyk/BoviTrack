# SUPABASE-COST-02B — BoviTrack final suspension readiness

Date: 2026-10-25 · Project: BoviTrack · Supabase project `vustkojrbefcbzotgorc`.
Read-only audit: **nothing hosted was paused, deleted, migrated, deployed or
modified**; no credentials were obtained; no data was uploaded or copied
externally.

## 1. Production dependency verdict — ✅ VERIFIED INDEPENDENT

Production (`bovi-track.vercel.app`, `main` @ `d5d798e`) is built without
Supabase variables: demo banner on `/login`, every screen served from mock data
with no auth redirect, no `*.supabase.co` host in the public JavaScript. The
database itself confirms it: since the project started (2026-06-06) the Data API
executed **0** client statements, Auth recorded **0** sign-ins, and no
application table was read after the archive snapshot. No crons, webhooks, Edge
Functions or API routes depend on it. Two Vercel-side listings (integrations /
webhooks, Preview variables) are UNKNOWN (403) but show no usage and cannot
reach production. → [deployment-impact.md](deployment-impact.md)

## 2. Backup recovery verdict — ✅ VERIFIED (local)

Both encrypted runs (app + auth) pass checksums, manifests and decryption; keys
are outside Git. Re-proven today on an isolated PostgreSQL 18 database: zero
schema drift, **48/48 rows identical**. GitHub holds only sanitized tooling.
→ [suspension-readiness.md](suspension-readiness.md) §2

## 3. Off-site recovery verdict — ⛔ BLOCKED

No off-site copy exists (no external drive, nothing in the user profile outside
the repo, nothing in the connected Google Drive); keys have a single copy; no
recovery owner is named. Tooling and procedure are ready and were rehearsed on a
simulated copy. → [offsite-recovery-status.md](offsite-recovery-status.md)

## 4. Canonical dump status — ⛔ BLOCKED

No authorized database credentials on this machine (the only `pgpass.conf`
belongs to an unrelated local project and was not used). Script ready and
tested. The logical snapshot fully covers application data and auth identities
and is restore-verified, but it is not a substitute for a dump before deletion.

## 5. Auth configuration status — ⚠️ NOT PRESERVED

Not stored in the database and not readable without exposing secrets. The app
uses only email/password sign-in, sign-out and `getUser`; the settings to record
are listed in [suspension-readiness.md](suspension-readiness.md) §4. Required
before deletion or a pause that could exceed 90 days.

## 6. Security findings

| Finding | Severity | Confirmed today | Affects deployed demo app |
|---|---|---|---|
| F1 users can change their own role/farm | High | yes (isolated restore, check 11) | no — production does not use Supabase |
| F2 viewers can write farm records | Medium | yes (check 10) | no |

Fix for F1 designed and verified (not applied); F2 open. Suspending Supabase
removes the hosted attack surface.

## 7. Suspension impact

Production, login/logout, herd screens: **VERIFIED INDEPENDENT**. API routes,
scheduled jobs, DB webhooks: **NOT APPLICABLE**. External API consumers:
**VERIFIED INDEPENDENT** (zero usage ever). Vercel integrations and Preview
variables: **UNKNOWN**. Existing Auth user (1, never signed in):
**VERIFIED DEPENDENT** — cannot sign in while suspended; preserved in the
encrypted archive. **Pausing is not available in the current paid
organization** (9 active projects); the reversible route is transfer to a Free
organization, then pause (restorable 90 days).

## 8. Reactivation procedure

≤ 90 days paused in a Free organization: *Restore project* in the dashboard.
Beyond 90 days: download Supabase's logical backup, or restore the encrypted
archive onto PostgreSQL (`restore/README.md` Path A). Full owner runbook with
gates, dashboard steps, smoke tests and billing checks:
[suspension-runbook.md](suspension-runbook.md)

## 9. Expected monthly savings

≈ **$10/month** (≈ $120/year): BoviTrack's Micro compute instance in the paid
organization. Paused projects do not count toward compute usage. Confirm on the
organization's Usage → Compute page before and after.

## 10. GitHub delivery status

Branch `archive/supabase-cost-02b`, derived from `archive/supabase-cost-02a` @
`496c382`; contains sanitized reports, the read-only `activity-check.sql`, and
the sanitized activity aggregates. The `archive/*` Vercel build exclusion is
preserved. Staged content was scanned for backups, auth records, keys and
secrets before committing. Not merged; not deployed. Push status is recorded in
the delivery summary.

---

## Decision: **NO-GO** (for suspension today)

Production is verified independent, so suspension would not break the live
site — but **material recovery gaps remain**: there is no off-site copy, the keys
exist only on the development disk, and no recovery owner is named. Owner
acceptance cannot substitute for a missing backup. In addition, the pause action
is **not available** on the project's current paid plan.

### What turns this into a GO (reversible pause path)

| # | Condition | Effort |
|---|---|---|
| 1 | Off-site packages placed and verified with `verify-offsite.sh`, keys stored independently, restore from the off-site copy rehearsed | ≈ 30–60 min |
| 2 | Recovery owner and deputy named | minutes |
| 3 | Auth configuration recorded (table in `suspension-readiness.md` §4) | ≈ 15 min |
| 4 | Destination Free organization confirmed eligible; transfer + pause per runbook §3 | ≈ 15 min |
| 5 | Same-day `activity-check.sql` still shows no access/writes since the snapshot | 2 min |

With 1–5 done, a **transfer-and-pause** is a GO: production unaffected,
reversible for 90 days, data independently recoverable. **Deletion** additionally
requires the canonical `pg_dump`.
