# Independent hosting options

SUPABASE-COST-02A · 2026-10-24. Options for running BoviTrack's database (and,
where noted, its auth/API layer) outside Supabase. **Prices are estimates from
third-party 2026 sources, excluding VAT; confirm on each provider's own pricing
page before deciding** (several providers changed prices during 2026).

## Context that drives the choice

- Data volume is tiny: 13 tables, 48 rows, ~12 MB database (mostly Supabase
  internals). Any entry tier is far above need.
- Production currently runs **in demo mode without any database**
  (`deployment-dependency-map.md`), so there is no live traffic to migrate yet.
- The app depends on **Supabase Auth** (login/session) and the **Data API
  (PostgREST)** through `@supabase/ssr` / `supabase-js`. A plain PostgreSQL
  server alone does not run the app — it also needs an auth and API layer, or a
  code change.
- RLS needs `auth.uid()` (provided by the restore kit's compatibility shim, or
  natively by self-hosted GoTrue).

## Baseline: staying on Supabase

| Plan | Cost | Notes |
|---|---|---|
| Pro organization (current account has daily backups → Pro-style) | $25/org + ~$10/mo per additional Micro project | BoviTrack's **marginal** cost on a shared Pro org ≈ **$10/mo** (one Micro compute); confirm in billing |
| Free organization | $0 | projects pause when inactive; no daily backups; limited projects per org |

## Option 1 — PostgreSQL on a low-cost VPS

| | |
|---|---|
| Example | Hetzner Cloud CX23 (2 vCPU, 4 GB, 40 GB NVMe), Germany/Finland |
| Database hosting | ≈ **€5.50/mo** server + ≈ €1.10 provider backups (+20%) |
| Off-site backups | Hetzner Storage Box BX11 (1 TB) ≈ €3.20/mo, or another approved store |
| Monitoring | free tiers (uptime checks, provider metrics) ≈ €0 |
| **Total DB-related** | **≈ €10/mo** |
| Maintenance | **High** — OS and PostgreSQL patching, upgrades, backups, TLS, firewall, monitoring are the owner's job |
| Availability | single server, no automatic failover |
| Recovery time | ≈ 1–3 h: new VPS + restore from encrypted backup (runbook rehearsed) |
| Security | full control, full responsibility |
| App compatibility | **low on its own** — needs auth/API (see Option 3a) |
| Residency | EU (DE/FI) |
| Migration complexity | medium |

## Option 2 — Managed PostgreSQL

| Provider (entry tier) | DB hosting / mo | Included | Region (EU) |
|---|---|---|---|
| Scaleway DB-DEV-S | ≈ €11 + storage (~€0.10/GB) + backups (~€0.03/GB) → **≈ €12**; HA ≈ €21 | automated backups, PITR up to 7 days | FR / NL / PL |
| DigitalOcean (1 GiB, single node) | **≈ $15** | backups, PITR, TLS | DE / NL / UK |
| Neon | Free **$0** (0.5 GB, 100 CU-h — BoviTrack fits) · Launch usage-based, ≈ $5–15 for a small app | branching, PITR | AWS EU regions |

| | |
|---|---|
| Maintenance | **Low** — patching, backups, PITR handled by the provider |
| Availability | provider-managed; HA available at extra cost |
| Recovery time | minutes (PITR) to ≈ 1 h (new instance + restore) |
| App compatibility | **low on its own** — same auth/API gap as Option 1 (see 3b) |
| Migration complexity | low for the database; Neon Free scales to zero (cold starts) |

## Option 3 — PostgreSQL + independently hosted auth and API

Run the open-source pieces the app already speaks to — **GoTrue** (Supabase
Auth) and **PostgREST** — so `supabase-js` keeps working and only the two
`NEXT_PUBLIC_SUPABASE_*` values change.

| Variant | Monthly estimate | Maintenance | Compatibility |
|---|---|---|---|
| **3a — all-in-one VPS** (PostgreSQL 17 + GoTrue + PostgREST + TLS proxy on one CX23) | **≈ €10** (server + backups + Storage Box) + SMTP for auth e-mails (free tier ≈ €0) | highest | **high — no code change** |
| **3b — managed PostgreSQL + small VPS for GoTrue/PostgREST** | ≈ €12 (Scaleway) + ≈ €6.60 (CX23 + backups) → **≈ €19** | medium | **high — no code change** |
| 3c — managed PG + code change (Auth.js + server-side SQL) | DB tier only (≈ €0–15) | low infra, but **app refactor** | medium — rewrite login, session, data layer |

Users migrate without a password reset: the archived `auth.users` holds bcrypt
hashes that GoTrue reads natively.

## Database cost vs total application infrastructure cost

| Cost line | Supabase (marginal) | Opt 1 + 3a | Opt 3b |
|---|---|---|---|
| Database + auth + API | ≈ $10 | ≈ €10 | ≈ €19 |
| Off-site backup storage | (not portable today) | included above | ≈ €3 |
| Web hosting (Vercel) | same in every option: Hobby $0 is **non-commercial only**; commercial use needs Pro (≈ $20 per member/mo) | same | same |
| Domain, SMTP, monitoring | ≈ €0–2 | ≈ €0–2 | ≈ €0–2 |

The database decision changes only the first two lines; Vercel and the domain
cost the same whichever database option is chosen.

## Data residency

The hosted project is in **eu-west-1 (Ireland)** today. All options above keep
data in the EU, i.e. no change from the status quo. BoviTrack holds personal
data of Senegalese owners and users; confirm the requirements of Senegal's
data-protection authority (CDP) for hosting outside Senegal before production
use. An in-country or African-region host would need a separate evaluation.

## Recommendation

1. **Now (no live users):** keep the Supabase project only until the off-site
   copy is verified **and** the canonical `pg_dump` is obtained; then the owner
   can retire it (saves ≈ $10/mo on a Pro org) with no production impact.
2. **Migration rehearsal target: Option 3a** — one EU VPS running PostgreSQL +
   GoTrue + PostgREST. Lowest cost (≈ €10/mo all-in for DB/auth/API), **no
   application code change**, and the restore kit already rebuilds the schema,
   data and auth users on PostgreSQL.
3. **When real farms are onboarded:** move the database to **Option 3b**
   (managed PostgreSQL) for provider-run backups/PITR and lower maintenance,
   keeping GoTrue/PostgREST on the small VPS. Apply the profile fix
   (`security-remediation-plan.md`) **before** connecting any real users.

## Sources (third-party, 2026; verify on provider pages)

- Hetzner: [Better Stack review](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/), [AgentDeals 2026 adjustments](https://agentdeals.dev/hetzner-pricing-2026), [BestUSAVPS](https://bestusavps.com/reviews/hetzner/), [CostGoat calculator](https://costgoat.com/pricing/hetzner); Storage Box: [whtop.com listing](https://www.whtop.com/compare/hetzner,servdiscount)
- Supabase: [MakerKit](https://makerkit.dev/blog/saas/supabase-pricing), [Jetadmin](https://www.jetadmin.io/blog/supabase-pricing-2026-guide-to-plans-limits-and-real-world-costs/), [omidsaffari.com](https://omidsaffari.com/blog/supabase-pricing)
- Neon: [selfhost.dev](https://selfhost.dev/blog/neon-pricing-cost-of-serverless-postgres/), [budgetforge](https://www.budgetforge.dev/tools/neon-pricing-2026), [srvrlss.io](https://www.srvrlss.io/provider/neon/)
- DigitalOcean: [infratally](https://infratally.com/articles/digitalocean-managed-postgres-deep-dive/), [cloudcompare.dev](https://cloudcompare.dev/digitalocean-managed-database-pricing), [selfhost.dev comparison](https://selfhost.dev/blog/managed-postgresql-comparison-2026/)
- Scaleway: [official pricing page](https://www.scaleway.com/en/pricing/managed-databases/), [HostStack](https://hoststack.dev/blog/scaleway-postgresql-pricing-2026)
