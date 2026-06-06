# Phase 9 — Auth + Herd Read Migration

This phase connects **only the herd module** to Supabase, **read-only**, behind a
safe mock fallback. Every other module still uses mock data. See
[database.md](./database.md) for the schema and
[offline-first-architecture.md](./offline-first-architecture.md) for direction.

## What changed

- **Auth UI**: `/login` (email/password) and `/logout` (route handler).
- **Route gating**: middleware redirects unauthenticated users to `/login`
  **only when Supabase is configured**. With no env, the app stays fully open on
  mock data.
- **Data-access layer**: `src/lib/db/queries.ts` (read-only, RLS-scoped).
- **Source adapter**: `src/lib/herd-data.ts` — returns the existing UI shapes
  from Supabase when available, else mock data. No component changed.
- **Herd read migration**: `/herd` and `/herd/[animalId]` now load through the
  adapter. Cards, search/filters, security visuals and all profile panels are
  unchanged.

## How mock fallback works

`src/lib/supabase/env.ts` exposes `isSupabaseConfigured` (true only when both
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set).

The adapter decides the source per call:

```
getHerdAnimals()  / getHerdAnimal(code)
  ├─ not configured           → mock data (no cookies touched → stays static)
  ├─ configured + authed      → Supabase, mapped into the mock UI shapes
  └─ any error / build-time   → caught → mock data
```

Because every Supabase path is wrapped in `try/catch` returning mock data, the
herd screens can never break due to the backend. The DB→UI mappers translate the
flatter SQL rows into the rich UI types the components already expect, so there
is **no duplicated UI logic**.

## Data-access functions (`src/lib/db/queries.ts`)

- `getCurrentProfile()` → the signed-in user's `profiles` row (or null).
- `getAnimals()` → all animals visible to the caller (RLS-scoped), by code.
- `getAnimalByCode(code)` → one animal row, or null.
- `getAnimalWithRelations(code)` → animal + farm + owner + locations + alerts +
  care + vaccines + breeding (female/male) + births (mother/calf) + sales +
  timeline.
- Batched helpers (`getOwnersByIds`, `getAlertsByAnimalIds`,
  `getLocationsByAnimalIds`, `getCareByAnimalIds`) enrich the herd list.

## Configure `.env.local`

```bash
cp .env.example .env.local
# fill from Supabase → Project Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# service role only needed for seeding/admin scripts (never in the browser)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Restart `npm run dev` after editing env.

## How to log in

1. Ensure the migrations + `seed.sql` have been applied (see `database.md`).
2. Create a user in Supabase Auth (or sign up), then in the SQL editor:
   ```sql
   update public.profiles
   set role = 'super_admin'           -- sees all farms
   where email = 'seckbara23@gmail.com';
   -- a farm-scoped user instead:
   -- set role = 'farm_admin',
   --     farm_id = '11111111-1111-1111-1111-111111111111'
   ```
3. Visit the app → middleware redirects to `/login` → sign in → `/dashboard`.
4. Open **Mon troupeau** → the herd now comes from Supabase (10 seeded animals
   for the super_admin). Sign out via `/logout`.

## How to test RLS

1. **Super admin** (`seckbara23@gmail.com`, `farm_id = null`): `/herd` shows
   **all** animals across all farms (10 from the seed).
2. **Farm-scoped user**: create a second user, set
   `role = 'farm_admin', farm_id = <demo farm>`. They see only that farm's
   animals.
3. **Second farm isolation**: create another farm + a user bound to it. That
   user sees **0** of the demo farm's animals — confirming no cross-farm access.
4. Direct check in the SQL editor while impersonating (or via the API with a
   user's JWT): `select count(*) from animals;` returns only the caller's farm
   (or all, for super_admin).

## What to test in Supabase mode

- Login / logout flow and the unauthenticated → `/login` redirect.
- `/herd`: 10 seeded animals, search by code/RFID/owner, the 🔴 alerte filter,
  and the security pill (alerts → "Alerte active").
- `/herd/SN-BOV-2026-0002` (Samba): security panel shows the active alert; care
  & vaccine panels show seeded records; timeline shows seeded events.
- Quick stats on `/herd` reflect the live counts.
- Turn env off again → the app returns to mock data with no errors.

## Scope / limits (intentional, Phase 9)

- **Read-only.** No create/update; the "Ajouter / Marquer …" buttons remain
  placeholders.
- **Herd only.** Dashboard, Alerts, Location, Care, Vaccines, Reproduction,
  Births, Sales and Reports still read mock data directly.
- DB→UI mapping is lossy where the SQL schema is leaner than the mock domain
  (e.g. herder contact, breeding method/notes, birth sex/breed when no calf
  record). Missing values render as friendly placeholders.
- Live Supabase animals whose codes are not in the mock seed render on demand
  (`dynamicParams`), not prebuilt.

## Recommended next (Phase 10)

Extend the adapter pattern to the remaining read screens (Alerts, Location,
Care, Vaccines, Reproduction, Births, Sales, Reports), then begin **write**
actions (RLS already enforces tenancy), starting with creating a theft alert.
