-- PROPOSED — rollback for 0004_role_aware_write_policies.sql.
--
-- Restores the exact pre-fix policies of 0002_rls.sql (one FOR ALL `*_write`
-- policy per table) and removes the helper functions added by 0004. Verified
-- by a zero-drift comparison against the hosted inventory of 2026-10-24.

begin;

drop policy farms_insert on public.farms;
drop policy farms_update on public.farms;
drop policy farms_delete on public.farms;
create policy farms_write on public.farms
  for all using (public.can_access_farm(id))
  with check (public.can_access_farm(id));

drop policy owners_insert on public.owners;
drop policy owners_update on public.owners;
drop policy owners_delete on public.owners;
create policy owners_write on public.owners
  for all using (public.can_access_farm(farm_id))
  with check (public.can_access_farm(farm_id));

drop policy animals_insert on public.animals;
drop policy animals_update on public.animals;
drop policy animals_delete on public.animals;
create policy animals_write on public.animals
  for all using (public.can_access_farm(farm_id))
  with check (public.can_access_farm(farm_id));

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
    execute format('drop policy %I on public.%I', r.prefix || '_insert', r.tbl);
    execute format('drop policy %I on public.%I', r.prefix || '_update', r.tbl);
    execute format('drop policy %I on public.%I', r.prefix || '_delete', r.tbl);
    execute format('create policy %I on public.%I for all using (public.can_access_animal(%I)) with check (public.can_access_animal(%I))',
                   r.prefix || '_write', r.tbl, r.col, r.col);
  end loop;
end
$$;

drop function public.can_admin_animal(uuid);
drop function public.can_write_animal(uuid);
drop function public.can_admin_farm(uuid);
drop function public.can_write_farm(uuid);
drop function public.my_role();

commit;
