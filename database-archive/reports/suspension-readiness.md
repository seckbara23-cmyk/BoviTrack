# Suspension readiness — Supabase project `vustkojrbefcbzotgorc`

SUPABASE-COST-02B · 2026-10-25 · read-only audit. Nothing hosted was paused,
deleted, migrated, deployed or modified. The only hosted contact was one
read-only, aggregate-only statistics query (`scripts/activity-check.sql`) and
read-only metadata listings; as before, the Supabase CLI refreshed its own
self-expiring `cli_login_postgres` login role for that query.

## 1. Repository and deployment

| Check | Result |
|---|---|
| Git | branch `archive/supabase-cost-02b` from `archive/supabase-cost-02a` @ `496c382` (pushed by the owner; local = remote); clean tree; `main` @ `d5d798e` unchanged |
| Archive branches vs `main` | 0 application-source differences (`src/`, `package.json`, `next.config.mjs`) |
| Production | Vercel `bovi-track`, `main` @ `d5d798e`, `bovi-track.vercel.app` — **demo mode, no Supabase** (see `deployment-impact.md`) |
| Vercel build exclusion | `vercel.json` `git.deploymentEnabled: false` for `archive/*` — **works**: no deployment exists for `6cfe5e1` or `496c382` |
| Supabase client init / feature flag | `src/lib/supabase/env.ts`: `isSupabaseConfigured` requires both public variables; unconfigured ⇒ mock data everywhere, no gating |
| Environment variable names | code: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`; documented only: `SUPABASE_SERVICE_ROLE_KEY` (never referenced). Vercel's actual variable list: **UNKNOWN** (403) |
| Production vs Preview environments | production build has no Supabase URL (verified from the public bundle); Preview-scope variables **UNKNOWN** |
| Scheduled jobs, webhooks, integrations | Vercel crons: none (no `vercel.json` in production). Database: no `pg_cron`/`pg_net` in the DB, no webhooks, 0 Edge Functions. Vercel integrations/webhooks: **UNKNOWN** (403) |
| External consumers | **none, ever**: 0 Data-API statements by `anon`/`authenticated`/`service_role` since the project started on 2026-06-06; 0 sign-ins; no `public` table read after the archive snapshot (2026-10-24 17:44:55 UTC) |

**Verdict: no live workflow depends on this Supabase project** (VERIFIED). The
two UNKNOWNs are Vercel-side listings that cannot affect production (its bundle
carries no Supabase URL) and correspond to zero recorded usage.

## 2. Recovery readiness

| # | Requirement | Status |
|---|---|---|
| 1 | Encrypted application archive exists | ✅ 2 runs (`172145Z` rehearsed, `174450Z`) |
| 2 | Encrypted authentication archive exists | ✅ in both runs, separate key |
| 3 | Both keys available outside Git | ✅ `%USERPROFILE%\.bovitrack-archive\keys\` (single copy — see §3) |
| 4 | Checksums and manifests pass | ✅ re-verified today |
| 5 | Restore instructions complete | ✅ `restore/README.md` (paths A–C), `offsite-backup-runbook.md` |
| 6 | Schema + data reconstructable | ✅ today: zero drift, **48/48 rows identical** on PostgreSQL 18 |
| 7 | Recovery scripts work on an isolated DB | ✅ throwaway cluster on 127.0.0.1, deleted after |
| 8 | GitHub holds only sanitized tooling | ✅ 0 backups/keys/dumps/env files on `main`, `archive/supabase-archive-01`, `archive/supabase-cost-02a`; no secret patterns |

The snapshot appears **current**: no `public` table has been read since it was
taken, and the lifetime write counter (47) is consistent with the 46
snapshotted rows plus one documented profile update. Read-access timestamps do
not capture pure inserts, so the runbook re-checks this right before any
suspension: if `public_writes_since_reset` is above 47, or any table shows a
later access, take a fresh snapshot first.

## 3. Off-site recovery gate — ⛔ BLOCKED

No off-site copy exists, keys have one copy, no recovery owner is named.
Details and the unblock procedure: [`offsite-recovery-status.md`](offsite-recovery-status.md).

## 4. Canonical dump and Auth configuration

| Item | Status |
|---|---|
| Authorized DB credentials on this machine | ⛔ **none** — no env vars, no `.pgpass`; the only `pgpass.conf` holds unrelated local entries (other project, `127.0.0.1`) and was not used |
| Hosted `pg_dump` | ⛔ **BLOCKED** on the password; script ready and tested (`pgdump-readiness.md`) |
| Logical snapshot coverage | ✅ every row of all 13 `public` tables + `auth.users` + `auth.identities`, consistent single transaction, restore-verified; schema = migrations (zero drift). Not covered: Supabase-managed internals (empty or recreated by services), role passwords, Auth service configuration |
| Auth configuration preserved | ⚠️ **NOT PRESERVED** — not stored in the database; not readable without exposing secrets |

Auth settings to record by hand (Dashboard → Authentication), with relevance to
BoviTrack's code (which uses only `signInWithPassword`, `signOut`, `getUser`):

| Setting | Relevant to BoviTrack? |
|---|---|
| Email provider enabled; confirm-email; secure password change | **yes** — the only sign-in method |
| Allow new sign-ups | yes — decides who can create accounts |
| Password minimum length / requirements | yes |
| JWT expiry, refresh-token rotation, session settings | yes |
| Site URL and Redirect URLs | low — no OAuth, magic-link or callback routes in the code |
| Custom SMTP and e-mail templates | low — no password-reset or sign-up flow in the code; record if customised |
| OAuth providers | none used (only the `email` identity exists); record if any are switched on |
| Rate limits, CAPTCHA, MFA | record current values |

For a **pause** that is later undone, Supabase keeps this configuration; it
must be recorded before any **deletion** or any pause that could exceed the
90-day restore window.

## 5. Security findings (re-confirmed today on an isolated restore)

| Finding | Severity | Today's evidence | Affects the deployed demo app? |
|---|---|---|---|
| F1 — users can change their own privileged role / farm | High | smoke test check 11 = allowed | **No** — production does not connect to Supabase |
| F2 — viewers can write farm records | Medium | smoke test check 10 = allowed | **No** — same reason |

Hosted exposure is limited: the Supabase Auth/API endpoints are reachable on
the internet, but the anon key is not published (not in the production bundle,
not in the repository) and no client has ever called the API. Suspending the
project removes this surface entirely. A verified fix for F1 exists
(`security-remediation-plan.md`); F2 remains open. Neither was applied.

## 6. Can the project be paused on its current plan?

**No — not in its current organization.**

- The project's organization (`ozrngrouyimpyivqxkgt`) has **9 active projects**.
  A Free organization allows only 2 active projects, so this organization is on
  a **paid plan** (confirm the plan name in Dashboard → Organization → Billing).
- Supabase: **projects on paid plans cannot be paused**; only Free-plan projects
  can, and they remain restorable for **90 days** (after that only a backup
  download is offered). Paused projects do not count toward compute usage.
  ([billing docs](https://supabase.com/docs/guides/platform/billing-on-supabase),
  [changelog: 90-day window](https://supabase.com/changelog/27497-paused-free-plan-projects-are-restorable-for-90-days),
  [staff reply, Feb 2026](https://github.com/orgs/supabase/discussions/27399),
  [compute usage](https://supabase.com/docs/guides/platform/manage-your-usage/compute))
- Supported ways to stop BoviTrack's compute charge:
  1. **Transfer the project to a Free organization, then pause it** (Supabase
     staff's documented workaround for projects under 500 MB; BoviTrack is
     ≈ 12 MB). The account has a second organization (`xnxetjjjsgoyhfquubnq`,
     1 project) whose plan must be checked. Reversible within 90 days.
  2. **Delete the project** after the recovery gates are closed. Irreversible
     inside Supabase; recovery then relies entirely on the archive.

Expected saving: BoviTrack's own compute, ≈ **$10/month** (one Micro instance in
a paid organization; ≈ $120/year). Confirm on the organization's Usage page.

## 7. Decision

**NO-GO for suspension today** — production dependencies are cleared, but
material recovery gaps remain and the pause action is not available on the
current plan. See [`cost-02b-final.md`](cost-02b-final.md) for the conditions
that turn this into a GO.
