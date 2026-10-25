-- PROPOSED — regression tests for 0004_role_aware_write_policies.sql.
--
-- Run ONLY against a disposable restored copy, after the migrations, the
-- snapshot load and the proposed fix. ONE transaction, ROLLED BACK; synthetic
-- accounts per role plus the restored super_admin; prints verdicts only.
-- Exit is non-zero (ON_ERROR_STOP) if any expectation fails, so running it
-- BEFORE the fix is expected to fail — proving the tests detect the problem.
--
-- Verdicts: allowed = statement changed ≥ 1 row; no-rows = RLS filtered the
-- target (UPDATE/DELETE); denied = rejected by a policy check or privilege.

\set ON_ERROR_STOP on

begin;

create function pg_temp.attempt(p_sub uuid, p_sql text)
returns text language plpgsql as $$
declare n bigint; v text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics n = row_count;
    v := case when n > 0 then 'allowed' else 'no-rows' end;
  exception
    when insufficient_privilege then v := 'denied';
    when others then v := 'error:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end
$$;

create function pg_temp.visible(p_sub uuid, p_table regclass)
returns bigint language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  execute format('select count(*) from %s', p_table) into n;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return n;
end
$$;

create temp table regression (seq int, check_name text, expected text, actual text, ok boolean);

do $$
declare
  farm1 uuid := (select id from public.farms order by created_at, id limit 1);
  farm2 uuid := '00000000-0000-4000-8000-00000000f204';
  u_view  uuid := '00000000-0000-4000-8000-00000000d0a1';
  u_agent uuid := '00000000-0000-4000-8000-00000000d0a2';
  u_vet   uuid := '00000000-0000-4000-8000-00000000d0a3';
  u_admin uuid := '00000000-0000-4000-8000-00000000d0a4';
  u_admin2 uuid := '00000000-0000-4000-8000-00000000d0b5';
  u_super uuid := (select id from public.profiles where role = 'super_admin' order by id limit 1);
  an1 uuid := (select id from public.animals where farm_id = farm1 order by animal_code limit 1);
  an2 uuid;
  farm1_animals bigint := (select count(*) from public.animals where farm_id = farm1);
begin
  insert into auth.users (id, aud, role, email) values
    (u_view,   'authenticated', 'authenticated', 'rt-viewer@example.invalid'),
    (u_agent,  'authenticated', 'authenticated', 'rt-agent@example.invalid'),
    (u_vet,    'authenticated', 'authenticated', 'rt-vet@example.invalid'),
    (u_admin,  'authenticated', 'authenticated', 'rt-admin@example.invalid'),
    (u_admin2, 'authenticated', 'authenticated', 'rt-admin2@example.invalid');
  insert into public.farms (id, name) values (farm2, 'Regression farm 2');
  insert into public.animals (farm_id, animal_code) values (farm2, 'RT-F2-0001') returning id into an2;
  update public.profiles set farm_id = farm1, role = 'viewer'       where id = u_view;
  update public.profiles set farm_id = farm1, role = 'field_agent'  where id = u_agent;
  update public.profiles set farm_id = farm1, role = 'veterinarian' where id = u_vet;
  update public.profiles set farm_id = farm1, role = 'farm_admin'   where id = u_admin;
  update public.profiles set farm_id = farm2, role = 'farm_admin'   where id = u_admin2;

  insert into regression (seq, check_name, expected, actual) values
    (1,  'viewer still reads farm animals', farm1_animals::text,
         pg_temp.visible(u_view, 'public.animals')::text),
    (2,  'viewer cannot create an animal', 'denied',
         pg_temp.attempt(u_view, format('insert into public.animals (farm_id, animal_code) values (%L, %L)', farm1, 'RT-V-1'))),
    (3,  'viewer cannot edit an animal', 'no-rows',
         pg_temp.attempt(u_view, format('update public.animals set color = %L where id = %L', 'x', an1))),
    (4,  'viewer cannot delete an animal', 'no-rows',
         pg_temp.attempt(u_view, format('delete from public.animals where id = %L', an1))),
    (5,  'viewer cannot add a care record', 'denied',
         pg_temp.attempt(u_view, format('insert into public.care_records (animal_id, diagnosis) values (%L, %L)', an1, 'x'))),
    (6,  'field_agent creates an animal', 'allowed',
         pg_temp.attempt(u_agent, format('insert into public.animals (farm_id, animal_code) values (%L, %L)', farm1, 'RT-FA-1'))),
    (7,  'field_agent edits an animal', 'allowed',
         pg_temp.attempt(u_agent, format('update public.animals set color = %L where id = %L', 'edited', an1))),
    (8,  'field_agent cannot delete an animal', 'no-rows',
         pg_temp.attempt(u_agent, format('delete from public.animals where animal_code = %L', 'RT-FA-1'))),
    (9,  'veterinarian adds a care record', 'allowed',
         pg_temp.attempt(u_vet, format('insert into public.care_records (animal_id, diagnosis) values (%L, %L)', an1, 'RT care'))),
    (10, 'veterinarian cannot delete a care record', 'no-rows',
         pg_temp.attempt(u_vet, format('delete from public.care_records where diagnosis = %L', 'RT care'))),
    (11, 'farm_admin deletes an animal', 'allowed',
         pg_temp.attempt(u_admin, format('delete from public.animals where animal_code = %L', 'RT-FA-1'))),
    (12, 'farm_admin edits own farm', 'allowed',
         pg_temp.attempt(u_admin, format('update public.farms set village = %L where id = %L', 'RT', farm1))),
    (13, 'farm_admin cannot create a farm', 'denied',
         pg_temp.attempt(u_admin, format('insert into public.farms (id, name) values (%L, %L)', gen_random_uuid(), 'x'))),
    (14, 'farm1 admin cannot create in farm2', 'denied',
         pg_temp.attempt(u_admin, format('insert into public.animals (farm_id, animal_code) values (%L, %L)', farm2, 'RT-X'))),
    (15, 'farm1 admin cannot edit farm2 animal', 'no-rows',
         pg_temp.attempt(u_admin, format('update public.animals set color = %L where id = %L', 'x', an2))),
    (16, 'super_admin creates in farm2', 'allowed',
         pg_temp.attempt(u_super, format('insert into public.animals (farm_id, animal_code) values (%L, %L)', farm2, 'RT-SA-1'))),
    -- destructive checks last (cascades are rolled back with everything else)
    (17, 'farm2 admin cannot delete own farm', 'no-rows',
         pg_temp.attempt(u_admin2, format('delete from public.farms where id = %L', farm2))),
    (18, 'farm1 admin cannot delete own farm', 'no-rows',
         pg_temp.attempt(u_admin, format('delete from public.farms where id = %L', farm1))),
    (19, 'super_admin deletes a farm', 'allowed',
         pg_temp.attempt(u_super, format('delete from public.farms where id = %L', farm2)));

  update regression set ok = (expected = actual);
end
$$;

\echo '== role-aware write policy regression tests (rolled back)'
select seq, check_name, expected, actual, case when ok then 'pass' else 'FAIL' end as verdict
from regression order by seq;

do $$
begin
  if exists (select 1 from regression where not ok) then
    raise exception 'REGRESSION FAILED: % of % checks',
      (select count(*) from regression where not ok), (select count(*) from regression);
  end if;
  raise notice 'REGRESSION OK: % checks pass', (select count(*) from regression);
end
$$;

rollback;
