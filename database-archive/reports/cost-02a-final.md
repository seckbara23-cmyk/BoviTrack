# SUPABASE-COST-02A — BoviTrack recovery hardening & migration readiness

Date: 2026-10-24 · Project: BoviTrack · Supabase project `vustkojrbefcbzotgorc`.
Preparation and recovery hardening only: **the hosted Supabase project was not
contacted, paused, modified or migrated; production authentication and RLS were
not changed; nothing was deployed; no infrastructure was purchased; no backup
was uploaded anywhere.** The Teranga Broadcast repository was not accessed.

## 1. Verified archive state — VERIFIED

The ARCHIVE-01 package matches its delivery report exactly: branch
`archive/supabase-archive-01` @ `3adbef0` (local = remote, clean), `main`
untouched @ `d5d798e`, 34 archive files + `.gitignore`, two encrypted backup
runs (4 files each), two passphrase files outside the repository with an
owner-only ACL. → [recovery-hardening.md](recovery-hardening.md) §1

## 2. Recovery integrity — VERIFIED

For both runs: file hash = manifest = `SHA256SUMS` = repository docs; both
bundles decrypt with their own key; in-memory structure check finds 13 + 2
tables, 46 + 2 rows, 0 mismatches against the manifest; migration copies equal
the originals. A **fresh full restore rehearsal today** on a disposable
PostgreSQL 18.6 cluster: zero drift, **48/48 rows identical**, cluster deleted.
→ [recovery-hardening.md](recovery-hardening.md) §2

## 3. Off-site backup readiness — PARTIAL (ready; placement pending)

Runbook and checklist written; `stage-offsite.sh` (separated app/auth/metadata
/offline restore-kit packages, never copies keys) and `verify-offsite.sh`
(integrity, source equality, recorded-hash equality, decrypt with off-site keys,
restore-kit clone) added and tested. A simulated two-destination copy verified
9/9, a one-byte tamper was caught three ways, and a **restore using only the
off-site files and the bundled kit returned 48/48 identical rows**.
**Off-site recoverability is not yet verified**: the owner must approve
destinations, place the packages and keys, and run `verify-offsite.sh` there.
→ [offsite-backup-runbook.md](offsite-backup-runbook.md)

## 4. Hosted `pg_dump` readiness — READY, BLOCKED on the password

Tools compatible (pg_dump 18.6 ≥ server 17.6). Session pooler (IPv4, port 5432,
user `postgres.<ref>`) documented; transaction pooler refused; TLS always on,
`verify-full` with the Supabase CA. The export script was hardened (password
never in argv/disk/gpg, atomic outputs, read-only preflight, version guard) and
passed five local scenarios, including a full path-B restore of its own output
(48/48 identical). The dump role needs BYPASSRLS — Supabase's `postgres` has it.
Only the database password is missing; three secure ways to obtain it are
documented (owner's password manager; an approved reset; approved Docker for
the CLI route). → [pgdump-readiness.md](pgdump-readiness.md)

## 5. Deployment mapping — VERIFIED (env-var values not read)

Production = Vercel `bovi-track`, domain **`bovi-track.vercel.app`**, built from
`main` @ `d5d798e`. **Production does not connect to Supabase**: the demo-mode
banner renders, `/dashboard` is served without the auth redirect, and no
`*.supabase.co` host appears in the public JavaScript. Env-var listing is
denied (403); the owner can confirm names in the Vercel dashboard. Disclosure:
pushing the ARCHIVE-01 branch auto-created an SSO-protected Preview
deployment. → [deployment-dependency-map.md](deployment-dependency-map.md)

## 6. Security remediation design — VERIFIED (not applied)

Root cause: `profiles_update` scopes rows, not columns, and `authenticated`
holds table-wide `UPDATE`. Fix: column grant `UPDATE (full_name)` only, plus a
super_admin-only `admin_set_profile_access` function. On a disposable restore:
regression tests **8/11 fail before, 11/11 pass after**; the smoke test's
self-promotion check flips to pass; data unchanged; rollback returns to the
exact hosted state (zero drift). No current app workflow is affected (the app
never writes `profiles`). → [security-remediation-plan.md](security-remediation-plan.md)

## 7. Independent hosting recommendation

- **Rehearsal / pilot:** Option **3a** — one EU VPS running PostgreSQL +
  GoTrue + PostgREST. No application code change (only the two
  `NEXT_PUBLIC_SUPABASE_*` values), bcrypt users import as-is.
- **With real farms:** Option **3b** — managed PostgreSQL for backups/PITR,
  GoTrue + PostgREST on the small VPS.
- **Supabase project:** retire only after off-site verification **and** the
  canonical `pg_dump`; production is unaffected because it does not use it.
→ [hosting-options.md](hosting-options.md)

## 8. Estimated monthly costs (ex VAT; confirm on provider pages)

| Scope | Supabase today (marginal) | 3a all-in-one VPS | 3b managed PG + VPS |
|---|---|---|---|
| Database + auth + API | ≈ $10 (Micro compute on a Pro org) | **≈ €10** (incl. backups + Storage Box) | **≈ €19** (+ ≈ €3 off-site storage) |
| Total app infrastructure | + Vercel, domain, SMTP — **identical in every option** | same | same |

Vercel Hobby is free but for non-commercial use only; commercial operation
needs Vercel Pro (≈ $20 per member/month) regardless of the database choice.

## 9. Outstanding blockers

| # | Blocker | Owner action |
|---|---|---|
| 1 | Canonical hosted `pg_dump` | provide the DB password at the script prompt (or approve a reset / Docker) |
| 2 | Off-site recoverability | approve destinations, place packages + keys, run `verify-offsite.sh` there |
| 3 | Vercel env-var names unconfirmed | check Settings → Environment Variables (names only) |
| 4 | Auth service configuration | record URLs/SMTP/templates from the Supabase dashboard |
| 5 | F1 fix not applied anywhere shared | approve adoption before any real users |
| 6 | Medium finding F2 (viewers can write) | design role-aware write policies (next phase) |
| 7 | Automatic Vercel Previews for pushed branches | decide: keep, delete, or disable builds for `archive/*` |

## 10. Git branch, commit and push status

Branch `archive/supabase-cost-02a`, created from `archive/supabase-archive-01`
@ `3adbef0`; contains sanitized documentation, safe scripts and the proposed
(unapplied) fix only. Staged content was scanned for backups, auth records,
keys and credentials before committing. Not merged into `main`. Push status is
recorded in the delivery summary (pushing a branch triggers a Vercel Preview
build — see blocker 7).

## 11. Verdict for a future migration rehearsal: **CONDITIONAL GO**

**GO** to rehearse a migration to independent PostgreSQL now, from the verified
logical snapshot: the data, auth identities, schema and RLS behaviour are
proven restorable, and production cannot be affected because it does not use
Supabase. **Conditions:** (a) the owner approves the rehearsal target (local
machine, or a VPS purchase); (b) the F1 fix is applied in the rehearsal target
before any user signs in; (c) **no decommissioning of the Supabase project**
until blockers 1, 2 and 4 are closed.

---

## Project status dashboard

| Area | Status | Next action |
|---|---|---|
| Archive integrity (both runs) | ✅ VERIFIED | — |
| Independent restore (today) | ✅ VERIFIED — 48/48 rows, zero drift | — |
| Restore from simulated off-site copy | ✅ VERIFIED locally | repeat on the real off-site copy |
| Off-site recoverability | ⚠️ PARTIAL — ready, not placed | owner: approve destinations, run runbook §2–5 |
| Canonical `pg_dump` | ⛔ BLOCKED — password | owner: run `export-pgdump.sh` with the password |
| Production dependency on Supabase | ✅ VERIFIED — none (demo mode) | owner: confirm env-var names in Vercel |
| Security F1 (self-promotion) | ✅ fix designed + verified, not applied | approve adoption |
| Security F2 (viewers write) | ⚠️ OPEN (medium) | next phase |
| Hosting choice | ✅ recommended: 3a for rehearsal, 3b for production | owner: approve target |
| Migration rehearsal | 🟡 CONDITIONAL GO | approve target, then rehearse |

**Next recommended action:** the owner places the two encrypted packages and
the two keys in approved, separate off-site locations and runs
`verify-offsite.sh` there — that single step closes the largest recovery risk.
