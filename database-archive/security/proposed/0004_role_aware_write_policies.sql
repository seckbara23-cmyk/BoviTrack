-- PROPOSED — NOT APPLIED. SUPABASE-COST-03A security remediation for finding F2.
--
-- Kept outside supabase/migrations/ on purpose. Adopt only after approval (see
-- reports/security-remediation-plan.md), together with or after 0003.
--
-- Problem: every write policy in 0002_rls.sql checks only that the row belongs
-- to the caller's farm (`can_access_farm` / `can_access_animal`), never the
-- caller's role — so a `viewer` can insert, update and delete farm records,
-- and any farm member can delete the farm itself (which cascades to all data).
--
-- Fix: split each `*_write` FOR ALL policy into per-command policies that also
-- check the role. Role matrix (product assumption — confirm before adoption):
--
--   role           read   insert/update   delete records   farms: update   farms: insert/delete
--   super_admin    all    all             all              all             yes
--   farm_admin     farm   farm            farm             own farm        no
--   field_agent    farm   farm            no               no              no
--   veterinarian   farm   farm            no               no              no
--   viewer         farm   no              no               no              no
--
-- SELECT policies, farm isolation and the helper functions from 0002 are
-- unchanged. Rollback: rollback_0004_role_aware_write_policies.sql.

begin;

-- ------------------------------------------------------------------
-- Helpers (SECURITY DEFINER, fixed search_path, schema-qualified)
-- ------------------------------------------------------------------
create or replace function public.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select p.role from public.profiles p where p.id = auth.uid();
$$;

-- May create or edit records of the target farm.
create or replace function public.can_write_farm(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin()
      or (target = public.my_farm_id()
          and public.my_role() in ('farm_admin', 'field_agent', 'veterinarian'));
$$;

-- May delete records of the target farm / edit the farm itself.
create or replace function public.can_admin_farm(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select public.is_super_admin()
      or (target = public.my_farm_id() and public.my_role() = 'farm_admin');
$$;

create or replace function public.can_write_animal(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.animals a
                 where a.id = target and public.can_write_farm(a.farm_id));
$$;

create or replace function public.can_admin_animal(target uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (select 1 from public.animals a
                 where a.id = target and public.can_admin_farm(a.farm_id));
$$;

-- ------------------------------------------------------------------
-- farms: members read (unchanged); farm_admin edits own farm;
-- only super_admin creates or deletes farms.
-- ------------------------------------------------------------------
drop policy farms_write on public.farms;
create policy farms_insert on public.farms
  for insert with check (public.is_super_admin());
create policy farms_update on public.farms
  for update using (public.can_admin_farm(id)) with check (public.can_admin_farm(id));
create policy farms_delete on public.farms
  for delete using (public.is_super_admin());

-- ------------------------------------------------------------------
-- owners, animals: scoped by farm_id
-- ------------------------------------------------------------------
drop policy owners_write on public.owners;
create policy owners_insert on public.owners
  for insert with check (public.can_write_farm(farm_id));
create policy owners_update on public.owners
  for update using (public.can_write_farm(farm_id)) with check (public.can_write_farm(farm_id));
create policy owners_delete on public.owners
  for delete using (public.can_admin_farm(farm_id));

drop policy animals_write on public.animals;
create policy animals_insert on public.animals
  for insert with check (public.can_write_farm(farm_id));
create policy animals_update on public.animals
  for update using (public.can_write_farm(farm_id)) with check (public.can_write_farm(farm_id));
create policy animals_delete on public.animals
  for delete using (public.can_admin_farm(farm_id));

-- ------------------------------------------------------------------
-- Child tables: scoped via the parent animal
-- ------------------------------------------------------------------
do $$
declare
  r record;
begin
  for r in
    select * from (values
      ('locations',        'locations',  'animal_id'),
      ('security_alerts',  'alerts',     'animal_id'),
      ('care_records',     'care',       'animal_id'),
      ('vaccine_records',  'vaccine',    'animal_id'),
      ('breeding_records', 'breeding',   'female_animal_id'),
      ('birth_records',    'birth',      'mother_animal_id'),
      ('sale_records',     'sale',       'animal_id'),
      ('documents',        'documents',  'animal_id'),
      ('timeline_events',  'timeline',   'animal_id')
    ) as t(tbl, prefix, col)
  loop
    execute format('drop policy %I on public.%I', r.prefix || '_write', r.tbl);
    execute format('create policy %I on public.%I for insert with check (public.can_write_animal(%I))',
                   r.prefix || '_insert', r.tbl, r.col);
    execute format('create policy %I on public.%I for update using (public.can_write_animal(%I)) with check (public.can_write_animal(%I))',
                   r.prefix || '_update', r.tbl, r.col, r.col);
    execute format('create policy %I on public.%I for delete using (public.can_admin_animal(%I))',
                   r.prefix || '_delete', r.tbl, r.col);
  end loop;
end
$$;

commit;
