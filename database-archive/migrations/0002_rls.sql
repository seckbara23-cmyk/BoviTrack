-- BoviTrack — Phase 8: Row Level Security (multi-tenant)
--
-- Model: each farm only sees its own data. A user's farm is read from
-- profiles.farm_id. super_admin bypasses all farm scoping.
-- Child tables (locations, alerts, care, …) are scoped via their parent
-- animal's farm_id. Helper functions are SECURITY DEFINER to avoid RLS
-- recursion when reading profiles.

-- ------------------------------------------------------------------
-- Helper functions
-- ------------------------------------------------------------------
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'super_admin'
  );
$$;

create or replace function public.my_farm_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select farm_id from public.profiles where id = auth.uid();
$$;

-- True when the current user may access the given farm.
create or replace function public.can_access_farm(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_super_admin() or target = public.my_farm_id();
$$;

-- True when the current user may access the given animal (via its farm).
create or replace function public.can_access_animal(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.animals a
    where a.id = target
      and (public.is_super_admin() or a.farm_id = public.my_farm_id())
  );
$$;

-- ------------------------------------------------------------------
-- Enable RLS on every table
-- ------------------------------------------------------------------
alter table public.profiles         enable row level security;
alter table public.farms            enable row level security;
alter table public.owners           enable row level security;
alter table public.animals          enable row level security;
alter table public.locations        enable row level security;
alter table public.security_alerts  enable row level security;
alter table public.care_records     enable row level security;
alter table public.vaccine_records  enable row level security;
alter table public.breeding_records enable row level security;
alter table public.birth_records    enable row level security;
alter table public.sale_records     enable row level security;
alter table public.documents        enable row level security;
alter table public.timeline_events  enable row level security;

-- ------------------------------------------------------------------
-- profiles: a user sees/edits their own profile; super_admin sees all
-- ------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_super_admin());

create policy profiles_update on public.profiles
  for update using (id = auth.uid() or public.is_super_admin())
  with check (id = auth.uid() or public.is_super_admin());

-- ------------------------------------------------------------------
-- farms: members of the farm (or super_admin)
-- ------------------------------------------------------------------
create policy farms_select on public.farms
  for select using (public.can_access_farm(id));

create policy farms_write on public.farms
  for all using (public.can_access_farm(id))
  with check (public.can_access_farm(id));

-- ------------------------------------------------------------------
-- owners + animals: scoped by farm_id
-- ------------------------------------------------------------------
create policy owners_select on public.owners
  for select using (public.can_access_farm(farm_id));
create policy owners_write on public.owners
  for all using (public.can_access_farm(farm_id))
  with check (public.can_access_farm(farm_id));

create policy animals_select on public.animals
  for select using (public.can_access_farm(farm_id));
create policy animals_write on public.animals
  for all using (public.can_access_farm(farm_id))
  with check (public.can_access_farm(farm_id));

-- ------------------------------------------------------------------
-- Child tables: scoped via the parent animal
-- ------------------------------------------------------------------
create policy locations_select on public.locations
  for select using (public.can_access_animal(animal_id));
create policy locations_write on public.locations
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy alerts_select on public.security_alerts
  for select using (public.can_access_animal(animal_id));
create policy alerts_write on public.security_alerts
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy care_select on public.care_records
  for select using (public.can_access_animal(animal_id));
create policy care_write on public.care_records
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy vaccine_select on public.vaccine_records
  for select using (public.can_access_animal(animal_id));
create policy vaccine_write on public.vaccine_records
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy breeding_select on public.breeding_records
  for select using (public.can_access_animal(female_animal_id));
create policy breeding_write on public.breeding_records
  for all using (public.can_access_animal(female_animal_id))
  with check (public.can_access_animal(female_animal_id));

create policy birth_select on public.birth_records
  for select using (public.can_access_animal(mother_animal_id));
create policy birth_write on public.birth_records
  for all using (public.can_access_animal(mother_animal_id))
  with check (public.can_access_animal(mother_animal_id));

create policy sale_select on public.sale_records
  for select using (public.can_access_animal(animal_id));
create policy sale_write on public.sale_records
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy documents_select on public.documents
  for select using (public.can_access_animal(animal_id));
create policy documents_write on public.documents
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));

create policy timeline_select on public.timeline_events
  for select using (public.can_access_animal(animal_id));
create policy timeline_write on public.timeline_events
  for all using (public.can_access_animal(animal_id))
  with check (public.can_access_animal(animal_id));
