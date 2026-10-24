# Deployment and dependency map

SUPABASE-COST-02A · 2026-10-24. Source: the repository on `main` (`d5d798e`),
non-secret Vercel metadata, and plain public HTTP requests to the production
site. **No environment variable value was read or displayed.**

## 1. Production at a glance

| Item | Value | How verified |
|---|---|---|
| Hosting | Vercel project `bovi-track` (Next.js, Node 24.x) | Vercel API (metadata) |
| Production domain | **`bovi-track.vercel.app`** (only domain; no custom domain) | Vercel API |
| Production branch | `main` — every production deployment is built from `main` | deployment list |
| Current production deployment | `dpl_DbewkneC…`, commit **`d5d798e`** (Phase 9), READY | deployment list |
| Access protection | Vercel SSO on all deployment URLs except custom domains; production domain answers publicly (HTTP 200) | Vercel API + HTTP status |
| **Production uses Supabase?** | **No — demo mode, mock data** | see §2 |

## 2. Does production connect to Supabase project `vustkojrbefcbzotgorc`?

**No.** Three independent public observations, none involving secrets:

1. `/login` renders the **"Mode démo : données fictives"** banner, which the
   code shows only when `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   are absent at build time (`src/lib/supabase/env.ts`).
2. `/dashboard` and `/herd` return **200 with no redirect**. With Supabase
   configured, the middleware would redirect anonymous visitors to `/login`.
3. **No `*.supabase.co` host** appears in any of the 10 JavaScript chunks the
   production page loads (the URL would be inlined at build time if set).

Consequence: retiring or pausing the Supabase project would **not** break the
production site today. The env-var listing itself is not readable with the
connected Vercel account (HTTP 403).

**Minimum owner action for certainty:** Vercel dashboard → `bovi-track` →
Settings → Environment Variables → confirm (names only) that no
`NEXT_PUBLIC_SUPABASE_*` variable is set for Production. Optionally check
Preview too.

## 3. Branch → deployment mapping

| Git branch | Vercel target | URL | Notes |
|---|---|---|---|
| `main` | Production | `bovi-track.vercel.app` (+ `bovi-track-git-main-…vercel.app`) | auto-deploys on push |
| `archive/supabase-archive-01` | Preview | `bovi-track-1e9loz16h-…vercel.app` (SSO-protected, HTTP 302 to sign-in) | **created automatically** when the ARCHIVE-01 branch was pushed on 2026-10-24 |
| any other pushed branch | Preview | per-branch URL | Vercel's Git integration builds every pushed branch |

Disclosure: SUPABASE-ARCHIVE-01 did not request a deployment, but pushing its
branch triggered the Preview above. It contains no application change (docs and
scripts only) and is not publicly reachable. Deleting it is the owner's
decision. To push archive branches without builds, the owner can either set an
Ignored Build Step in Vercel, or add `git.deploymentEnabled` for `archive/*`
branches in a `vercel.json` (repository change; needs approval).

## 4. Code-level Supabase dependencies

| Concern | Location | Detail |
|---|---|---|
| Configuration switch | `src/lib/supabase/env.ts` | `isSupabaseConfigured` = both public vars present; everything else falls back to mock data |
| Browser client | `src/lib/supabase/client.ts` | `createBrowserClient` (anon key) — used only by `/login` |
| Server client | `src/lib/supabase/server.ts` | `createServerClient` + Next cookies |
| Session + gating | `src/middleware.ts` → `src/lib/supabase/middleware.ts` | `auth.getUser()` each request; redirect to `/login` when configured and signed out |
| Authentication | `src/app/login/page.tsx`, `src/app/logout/route.ts` | `signInWithPassword`, `signOut` |
| Data API (PostgREST) | `src/lib/db/queries.ts` via `src/lib/herd-data.ts` | read-only `from().select()` on 12 tables; herd list + animal profile only |
| Server vs browser | data reads are **server-side** (React Server Components); the browser talks to Supabase only for sign-in | |
| Not used | — | Storage, Realtime, Edge Functions, RPC, service-role key, any write |

Screens: `/herd`, `/herd/[animalId]` read Supabase when configured; `/login`,
`/logout` use Auth; 15 other screens are mock-only; 3 are placeholders.

## 5. Environment variable names

| Name | Used by code | Scope |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | yes | public (inlined into the browser bundle) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | yes | public |
| `SUPABASE_SERVICE_ROLE_KEY` | **no** (documented in `.env.example` only) | server-only |

Note: `.env.example` is not tracked in git (`.gitignore` matches `.env*`), so
a fresh clone lacks the template. Reported, not changed.

## 6. What a migration changes in deployment

Only the two public variables need new values (pointing at the replacement
auth/API endpoint), plus a redeploy of `main` — no code change if the
replacement keeps the Supabase-compatible API (GoTrue + PostgREST). See
`hosting-options.md`.
