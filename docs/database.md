# BoviTrack — Database & Supabase Foundation (Phase 8)

This phase adds the **backend foundation only**. The UI still runs entirely on
mock data (`src/lib/mock-data.ts`); no screens are migrated yet. Phase 9 will
start reading from Supabase.

## Stack

- **Supabase** (PostgreSQL + Auth + RLS)
- `@supabase/supabase-js` + `@supabase/ssr` for typed clients in Next.js

## Files

```
.env.example                      # required env vars
src/middleware.ts                 # refreshes the auth session (no-op until configured)
src/lib/supabase/
  env.ts                          # env access + isSupabaseConfigured guard
  client.ts                       # browser client (Client Components)
  server.ts                       # server client (RSC / route handlers / actions)
  middleware.ts                   # updateSession() helper
src/lib/database.types.ts         # `Database` type for the typed client
src/lib/db/models.ts              # friendly domain models (Row/Insert/Update)
supabase/migrations/0001_init.sql # schema: enums, tables, indexes, auth trigger
supabase/migrations/0002_rls.sql  # RLS helpers + policies
supabase/seed.sql                 # demo farm + Senegal mock business data
```

## Architecture — Animal is the core entity

```
Animal
 ├─ Owner            (owners.id           → animals.owner_id)
 ├─ Farm             (farms.id            → animals.farm_id)        [tenant]
 ├─ Security Alert    (security_alerts.animal_id)
 ├─ Location          (locations.animal_id)
 ├─ Health Record     (care_records.animal_id)
 ├─ Vaccine Record    (vaccine_records.animal_id)
 ├─ Breeding Record   (breeding_records.female_animal_id / male_animal_id)
 ├─ Birth Record      (birth_records.mother_animal_id / calf_animal_id)
 ├─ Sale Record       (sale_records.animal_id)
 ├─ Document          (documents.animal_id)
 └─ Timeline Event    (timeline_events.animal_id)
```

## Tables (13)

`profiles`, `farms`, `owners`, `animals`, `locations`, `security_alerts`,
`care_records`, `vaccine_records`, `breeding_records`, `birth_records`,
`sale_records`, `documents`, `timeline_events`.

Enums mirror the UI domain (e.g. `care_status`, `vaccine_status`,
`breeding_status`, `birth_status`, `sale_status`, `location_risk`,
`alert_status`, `user_role`).

> **Schema note (deviation):** `profiles` gains a nullable `farm_id` to bind a
> user to their farm for multi-tenant isolation (null for `super_admin`). Two
> fields beyond the spec were added for fidelity with the UI: `animals.name`,
> `vaccine_records.done_date`/`batch_number`, `sale_records.seller_name`/
> `market`, `security_alerts.last_known_location`, `birth_records.breeding_id`.

## Authentication

- Roles: `super_admin`, `farm_admin`, `field_agent`, `veterinarian`, `viewer`
  (more can be added to the `user_role` enum later).
- A trigger (`handle_new_user`) auto-creates a `profiles` row on signup with the
  default `viewer` role. An admin then sets the user's `farm_id` and `role`.

## Multi-tenant security (RLS)

Each farm only sees its own data. Enforced entirely in the database:

- `is_super_admin()` — true if the caller's profile role is `super_admin`.
- `my_farm_id()` — the caller's `profiles.farm_id`.
- `can_access_farm(farm_id)` — super admin **or** the caller's own farm.
- `can_access_animal(animal_id)` — the animal belongs to an accessible farm.

Helpers are `SECURITY DEFINER` with a fixed `search_path`, so reading
`profiles` inside them does not recurse through RLS.

Policy model:
- `farms`, `owners`, `animals` → scoped by `farm_id` via `can_access_farm`.
- all child tables → scoped via their parent animal with `can_access_animal`.
- `profiles` → a user sees/updates only their own row (super admin sees all).
- Each table has a `SELECT` policy and a `FOR ALL` write policy with matching
  `WITH CHECK`. **No farm can read or write another farm's animals.**
- `super_admin` bypasses farm scoping everywhere.

The seed runs with the **service role**, which bypasses RLS.

## Seed data (Senegal context)

1 demo farm · 5 owners · 10 animals (`SN-BOV-2026-0001..0010`) · 5 locations ·
3 security alerts · 5 care records · 5 vaccine records · 3 breeding records ·
2 birth records · 3 sale records · 3 timeline events. Breeds, zones, vets and
FCFA prices match the mock data so screens map cleanly later.

## How to apply

Using the Supabase CLI against a linked project (or local stack):

```bash
# 1. set env
cp .env.example .env.local   # fill in URL + anon key (+ service role for seed)

# 2. apply schema then RLS
supabase db push             # or run the two files in supabase/migrations in order

# 3. load demo data (service role / SQL editor)
supabase db execute --file supabase/seed.sql   # or paste seed.sql in the SQL editor

# 4. (optional) regenerate types after schema changes
supabase gen types typescript --local > src/lib/database.types.ts
```

To create a usable login: sign up a user via Supabase Auth, then in the SQL
editor set their farm + role:

```sql
update public.profiles
set farm_id = '11111111-1111-1111-1111-111111111111', role = 'farm_admin'
where email = 'you@example.com';
```

## Verifying RLS (quick check)

1. Sign in as a `farm_admin` of the demo farm → `select * from animals;` returns
   the 10 demo animals.
2. Create a second farm + user → that user sees **0** of the demo farm's animals.
3. A `super_admin` sees animals from **all** farms.

## Recommended Phase 9

Migrate screens to Supabase incrementally, behind `isSupabaseConfigured` so the
mock UI keeps working when env is absent:

1. **Auth UI** — login/logout, route gating in `middleware.ts`, a farm switcher
   for `super_admin`.
2. **Data-access layer** — `src/lib/db/queries.ts` returning the domain models
   (start with `animals` + `AnimalWithRelations`).
3. **Read migration** — Herd list & animal profile first (the core entity),
   then Alerts, Health, Vaccines, Reproduction, Births, Sales, Reports.
4. **Write migration** — wire the "Ajouter / Marquer …" placeholders to inserts/
   updates (RLS already enforces tenancy).
5. **Realtime** (optional) — subscribe to `security_alerts` for live theft alerts.
6. **Storage** — back the `documents` table with a Supabase Storage bucket.
