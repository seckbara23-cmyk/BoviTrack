-- PROPOSED — regression tests for 0003_profiles_privilege_guard.sql.
--
-- Run ONLY against a disposable restored copy (e.g. a rehearse.sh cluster),
-- after the migrations, the snapshot load and the proposed fix. Everything
-- runs in ONE transaction that is ROLLED BACK; it uses two synthetic accounts
-- and the restored super_admin, and prints check names and verdicts only.
--
-- Requests are simulated as Supabase/PostgREST does: request.jwt.claims plus
-- `set local role`. Exit is non-zero (ON_ERROR_STOP) if any expectation fails,
-- so running it BEFORE the fix is expected to fail — that is how the test
-- proves it detects the problem.

\set ON_ERROR_STOP on

begin;

create function pg_temp.attempt(p_role text, p_sub uuid, p_sql text)
returns text language plpgsql as $$
declare n bigint; v text;
begin
  perform set_config('request.jwt.claims',
    case when p_sub is null then '' else json_build_object('sub', p_sub, 'role', p_role)::text end, true);
  execute format('set local role %I', p_role);
  begin
    execute p_sql;
    get diagnostics n = row_count;
    v := case when n > 0 then 'allowed' else 'no-rows' end;
  exception
    when insufficient_privilege then v := 'denied';
    when undefined_function then v := 'missing-function';
    when others then v := 'error:' || sqlstate;
  end;
  reset role;
  perform set_config('request.jwt.claims', '', true);
  return v;
end
$$;

create temp table regression (seq int, check_name text, expected text, actual text, ok boolean);

do $$
declare
  u1 uuid := '00000000-0000-4000-8000-00000000c0a1';   -- synthetic ordinary user
  u2 uuid := '00000000-0000-4000-8000-00000000c0b2';   -- second synthetic user
  admin uuid := (select id from public.profiles where role = 'super_admin' order by id limit 1);
  farm uuid := (select id from public.farms order by created_at, id limit 1);
  r public.profiles;
begin
  insert into auth.users (id, aud, role, email) values
    (u1, 'authenticated', 'authenticated', 'regression-1@example.invalid'),
    (u2, 'authenticated', 'authenticated', 'regression-2@example.invalid');
  update public.profiles set farm_id = farm where id in (u1, u2);   -- viewers on the farm

  insert into regression (seq, check_name, expected, actual) values
    (1, 'user updates own full_name', 'allowed',
        pg_temp.attempt('authenticated', u1, format(
          'update public.profiles set full_name = %L where id = %L', 'Nom test', u1))),
    (2, 'user cannot change own role', 'denied',
        pg_temp.attempt('authenticated', u1, format(
          'update public.profiles set role = %L where id = %L', 'farm_admin', u1))),
    (3, 'user cannot change own farm_id', 'denied',
        pg_temp.attempt('authenticated', u1, format(
          'update public.profiles set farm_id = null where id = %L', u1))),
    (4, 'user cannot change own profile email', 'denied',
        pg_temp.attempt('authenticated', u1, format(
          'update public.profiles set email = %L where id = %L', 'other@example.invalid', u1))),
    (5, 'user cannot rename another user', 'no-rows',
        pg_temp.attempt('authenticated', u1, format(
          'update public.profiles set full_name = %L where id = %L', 'x', u2))),
    (6, 'non-admin cannot use admin_set_profile_access', 'denied',
        pg_temp.attempt('authenticated', u1, format(
          'select public.admin_set_profile_access(%L, %L, %L)', u1, 'farm_admin', farm))),
    (7, 'anon cannot use admin_set_profile_access', 'denied',
        pg_temp.attempt('anon', null, format(
          'select public.admin_set_profile_access(%L, %L, %L)', u1, 'farm_admin', farm))),
    (8, 'super_admin edits role column directly: blocked', 'denied',
        pg_temp.attempt('authenticated', admin, format(
          'update public.profiles set role = %L where id = %L', 'farm_admin', u2))),
    (9, 'super_admin assigns access via function', 'allowed',
        pg_temp.attempt('authenticated', admin, format(
          'select public.admin_set_profile_access(%L, %L, %L)', u2, 'farm_admin', farm)));

  -- 10: the function's change actually landed (checked as the owner).
  select * into r from public.profiles where id = u2;
  insert into regression (seq, check_name, expected, actual) values
    (10, 'assigned role and farm persisted', 'farm_admin@farm',
         r.role::text || case when r.farm_id = farm then '@farm' else '@other' end),
    (11, 'farm-scoped role without farm rejected', 'error:22023',
         pg_temp.attempt('authenticated', admin, format(
           'select public.admin_set_profile_access(%L, %L, null)', u2, 'viewer')));

  update regression set ok = (expected = actual);
end
$$;

\echo '== profiles privilege-guard regression tests (rolled back)'
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
