# Deployment impact of suspending Supabase project `vustkojrbefcbzotgorc`

SUPABASE-COST-02B · 2026-10-25. Every row below is backed by evidence gathered
today or in the archive phases; nothing was inferred from the homepage alone.
Classification: **VERIFIED INDEPENDENT** · **VERIFIED DEPENDENT** · **UNKNOWN**
· **NOT APPLICABLE**.

## Evidence base

| Source | What it shows |
|---|---|
| Vercel metadata (read-only) | production = `main` @ `d5d798e` on `bovi-track.vercel.app`; no deployment for `6cfe5e1` / `496c382` (the `archive/*` build exclusion works); one Preview from `archive/supabase-archive-01` @ `3adbef0` (SSO-protected) |
| Public HTTP requests to production | `/`, `/login`, `/dashboard`, `/herd`, `/herd/SN-BOV-2026-0002`, `/alerts` → 200 with no auth redirect; `/logout` → 307 to `/login`; demo-mode banner on `/login`; mock animal rendered on the herd profile; **no `*.supabase.co` host in any public JavaScript chunk** |
| Source code (`main` = deployed commit) | Supabase is used only when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are both set at build time; otherwise every screen uses mock data; the only route handler is `/logout`; no `vercel.json` at `d5d798e` (no Vercel crons) |
| Hosted database statistics (read-only, [`hosted-activity-2026-10-25.json`](../schema/hosted-activity-2026-10-25.json)) | since project creation (2026-06-06): **0** statements from `anon`/`authenticated`/`service_role` (the Data API was never used by any client); 0 sign-ins, 0 sessions, 0 Auth audit entries; last read of any `public` table = 2026-10-24 17:44:55 UTC (the archive's own snapshot); connections only from Supabase's own services |
| Hosted inventory (2026-10-24) | 0 Edge Functions, no `cron` schema / `pg_cron` / `pg_net` extensions in the database, no database webhooks, 0 storage buckets, empty Realtime publication |
| Not readable (HTTP 403) | Vercel environment-variable names, Vercel integrations, Vercel webhooks |

## Impact classification

| Dependency | Classification | Impact of suspending Supabase |
|---|---|---|
| Vercel production availability | **VERIFIED INDEPENDENT** | none — production is built without Supabase variables and serves every route from mock data |
| Login (`/login`) | **VERIFIED INDEPENDENT** | none — in demo mode the page shows "Supabase n'est pas configuré" on submit and never contacts Supabase |
| Logout (`/logout`) | **VERIFIED INDEPENDENT** | none — redirects to `/login` without calling Supabase when unconfigured (observed 307) |
| Herd screens (`/herd`, `/herd/[animalId]`) | **VERIFIED INDEPENDENT** | none — adapter returns mock data when unconfigured (observed) |
| All other screens | **VERIFIED INDEPENDENT** | none — mock-only by code |
| Database-backed API routes | **NOT APPLICABLE** | the app has no API routes; `/logout` is the only route handler |
| Scheduled jobs | **NOT APPLICABLE** | no Vercel crons (no `vercel.json` in production), no `pg_cron` jobs, no Edge Functions |
| Database webhooks / triggers to external systems | **NOT APPLICABLE** | none in the database (`supabase_functions` absent, `pg_net` not installed in the DB) |
| External consumers of the Supabase API | **VERIFIED INDEPENDENT** | zero client queries and zero sign-ins over the project's whole life — nothing consumes it |
| Vercel integrations / webhooks | **UNKNOWN** | cannot be listed (403). Low risk: any integration-supplied Supabase variables would appear in the production bundle (they do not), and the database recorded no client traffic |
| Preview deployments | **UNKNOWN** | one Preview (`3adbef0`) exists; whether Preview-scope variables point at this project cannot be read. No client traffic was ever recorded, so nobody uses it; if it is configured, its login/herd would fail or fall back while Supabase is suspended |
| Existing Auth users | **VERIFIED DEPENDENT** | 1 user (never signed in) lives in Supabase Auth; while suspended nobody can sign in. The account (with bcrypt hash) is preserved in the encrypted auth bundle |
| Database recoverability | **VERIFIED** (local) / **BLOCKED** (off-site) | the encrypted logical snapshot restores to PostgreSQL 18 with 48/48 rows identical (re-proven today); no off-site copy exists yet — see [`offsite-recovery-status.md`](offsite-recovery-status.md) |
| Reactivation | see [`suspension-runbook.md`](suspension-runbook.md) | depends on the suspension mechanism (unpause ≤ 90 days on Free, or restore from backups) |

## Conclusion

**No live workflow depends on the Supabase project.** Production, every screen,
login/logout, and all scheduled or external paths are verified independent or
not applicable. The two UNKNOWN rows (Vercel integrations/webhooks, Preview
variables) cannot affect production and show no usage; the owner can close
them in the Vercel dashboard (Settings → Environment Variables, names only;
Integrations).
