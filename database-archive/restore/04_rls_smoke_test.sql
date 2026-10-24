-- SUPABASE-ARCHIVE-01 — RLS smoke test on a restored database (non-destructive).
--
-- Everything runs in ONE transaction that is ROLLED BACK. Requests are
-- simulated the way Supabase/PostgREST does it: set request.jwt.claims, then
-- switch to the API role. Proves the policies from 0002_rls.sql still enforce
-- farm isolation on vanilla PostgreSQL via the auth.uid() compatibility shim,
-- and records the two known policy findings (rows marked FINDING).
--
-- Prints counts and verdicts only.

\set ON_ERROR_STOP on

begin;

create function pg_temp.visible(p_role text, p_sub uuid, p_table regclass)
returns bigint language plpgsql as $$
declare n bigint;
begin
  perform set_config('request.jwt.claims',
    case when p_sub is null then '' else json_build_object('sub', p_sub, 'role', p_role)::text end, true);
  execute format('set local role %I', p_role);
  execute format('select count(*) from %s', p_table) into n;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return n;
end
$$;

-- Attempts a write as an authenticated user; returns 'allowed' or 'blocked'.
create function pg_temp.try_as(p_sub uuid, p_sql text)
returns text language plpgsql as $$
declare
  n bigint;
  verdict text;
begin
  perform set_config('request.jwt.claims',
    json_build_object('sub', p_sub, 'role', 'authenticated')::text, true);
  set local role authenticated;
  begin
    execute p_sql;
    get diagnostics n = row_count;
    verdict := case when n > 0 then 'allowed' else 'blocked' end;
  exception when insufficient_privilege then
    verdict := 'blocked';
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return verdict;
end
$$;

create temp table rls_result (
  seq int, check_name text, expected text, actual text, verdict text
);

do $$
declare
  farm1   uuid := (select id from public.farms order by created_at, id limit 1);
  farm2   uuid := '00000000-0000-4000-8000-00000000f002';
  u_farm  uuid := '00000000-0000-4000-8000-0000000000a1';  -- viewer on farm1
  u_other uuid := '00000000-0000-4000-8000-0000000000b2';  -- no farm, later farm2
  u_admin uuid := (select id from public.profiles where role = 'super_admin' order by id limit 1);
  farm1_animals bigint := (select count(*) from public.animals where farm_id = farm1);
  all_animals   bigint := (select count(*) from public.animals);
begin
  -- Throwaway users; the signup trigger creates their 'viewer' profiles.
  insert into auth.users (id, aud, role, email) values
    (u_farm,  'authenticated', 'authenticated', 'rls-farm@example.invalid'),
    (u_other, 'authenticated', 'authenticated', 'rls-other@example.invalid');
  update public.profiles set farm_id = farm1 where id = u_farm;

  insert into rls_result values
    (1, 'anon (no JWT) sees animals', '0',
        pg_temp.visible('anon', null, 'public.animals')::text, null),
    (2, 'super_admin sees all animals', all_animals::text,
        coalesce(pg_temp.visible('authenticated', u_admin, 'public.animals')::text, 'n/a'), null),
    (3, 'farm1 viewer sees farm1 animals', farm1_animals::text,
        pg_temp.visible('authenticated', u_farm, 'public.animals')::text, null),
    (4, 'user without farm sees animals', '0',
        pg_temp.visible('authenticated', u_other, 'public.animals')::text, null),
    (5, 'user without farm sees farms', '0',
        pg_temp.visible('authenticated', u_other, 'public.farms')::text, null);

  -- Second tenant: one farm, one animal, bound to u_other.
  insert into public.farms (id, name) values (farm2, 'RLS test farm');
  insert into public.animals (farm_id, animal_code) values (farm2, 'RLS-TEST-F2-0001');
  update public.profiles set farm_id = farm2 where id = u_other;

  insert into rls_result values
    (6, 'farm1 viewer cannot see farm2', farm1_animals::text,
        pg_temp.visible('authenticated', u_farm, 'public.animals')::text, null),
    (7, 'farm2 user sees only farm2', '1',
        pg_temp.visible('authenticated', u_other, 'public.animals')::text, null),
    (8, 'farm1 viewer writes into farm2', 'blocked',
        pg_temp.try_as(u_farm, format(
          'insert into public.animals (farm_id, animal_code) values (%L, %L)', farm2, 'RLS-X-1')), null),
    (9, 'farm2 user sees farm1 care (child table)', '0',
        pg_temp.visible('authenticated', u_other, 'public.care_records')::text, null);

  -- Known policy findings (see security/README.md). Secure design ⇒ 'blocked'.
  insert into rls_result values
    (10, 'viewer role writes animals in own farm', 'blocked',
         pg_temp.try_as(u_farm, format(
           'insert into public.animals (farm_id, animal_code) values (%L, %L)', farm1, 'RLS-X-2')), null),
    (11, 'viewer promotes own profile to super_admin', 'blocked',
         pg_temp.try_as(u_farm, format(
           'update public.profiles set role = %L where id = %L', 'super_admin', u_farm)), null);

  insert into rls_result values
    (12, '…after self-promotion, farm1 viewer sees', farm1_animals::text,
         pg_temp.visible('authenticated', u_farm, 'public.animals')::text, null);

  update rls_result set verdict = case
    when expected = actual then 'pass'
    when seq >= 10 then 'FINDING'
    else 'FAIL' end;
end
$$;

\echo '== RLS smoke test (transaction will be rolled back)'
select seq, check_name, expected, actual, verdict from rls_result order by seq;

do $$
begin
  if exists (select 1 from rls_result where verdict = 'FAIL') then
    raise exception 'RLS SMOKE TEST FAILED';
  end if;
end
$$;

rollback;
