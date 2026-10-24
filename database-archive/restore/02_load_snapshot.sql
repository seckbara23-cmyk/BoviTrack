-- SUPABASE-ARCHIVE-01 — load decrypted snapshot bundle(s) into a migrated schema.
--
-- Prerequisites: 00_supabase_compat.sql, (01_supabase_default_grants.sql),
-- supabase/migrations/*.sql applied; archive_restore.bundle(doc jsonb) holds
-- the decrypted bundle(s). Plaintext never needs to touch disk:
--
--   gpg -d app-data.json.gpg | psql -c "copy archive_restore.bundle (doc)
--     from stdin with (format csv, quote e'\x01', delimiter e'\x02')"
--
-- Rows are inserted in foreign-key order with every constraint enforced, so a
-- clean load also proves referential integrity. Generated columns are
-- recomputed by the database. The signup trigger on auth.users is suspended
-- while users are restored so it cannot create duplicate profiles.
-- Requires ownership of auth.users (true on any self-managed target).

\set ON_ERROR_STOP on

begin;

create temp table restore_payload on commit drop as
select t.key as fq, t.value as payload
from archive_restore.bundle b
cross join lateral jsonb_each(b.doc -> 'tables') t;

do $$
declare
  -- Parents before children. Extend when the schema gains tables: the load
  -- refuses to run if the snapshot holds a table not listed here.
  load_order constant text[] := array[
    'auth.users', 'auth.identities',
    'public.farms', 'public.profiles', 'public.owners', 'public.animals',
    'public.locations', 'public.security_alerts', 'public.care_records',
    'public.vaccine_records', 'public.breeding_records', 'public.birth_records',
    'public.sale_records', 'public.documents', 'public.timeline_events'
  ];
  unknown text;
  t text;
  target_cols text;
  source_cols text;
  n bigint;
  has_signup_trigger boolean;
begin
  select string_agg(fq, ', ') into unknown
  from restore_payload where fq <> all (load_order);
  if unknown is not null then
    raise exception 'snapshot holds tables with no load order: % (extend load_order)', unknown;
  end if;

  if exists (select 1 from restore_payload group by fq having count(*) > 1) then
    raise exception 'a table appears in more than one loaded bundle';
  end if;

  has_signup_trigger := exists (
    select 1 from pg_trigger
    where tgname = 'on_auth_user_created' and tgrelid = 'auth.users'::regclass
  );
  if has_signup_trigger then
    alter table auth.users disable trigger on_auth_user_created;
  end if;

  foreach t in array load_order loop
    continue when not exists (select 1 from restore_payload where fq = t);

    select string_agg(quote_ident(attname), ', ' order by attnum),
           string_agg('r.' || quote_ident(attname), ', ' order by attnum)
      into target_cols, source_cols
    from pg_attribute
    where attrelid = t::regclass and attnum > 0 and not attisdropped and attgenerated = '';

    execute format(
      'insert into %s (%s) select %s from restore_payload p '
      'cross join lateral jsonb_populate_recordset(null::%s, p.payload -> ''rows'') r '
      'where p.fq = %L',
      t::regclass, target_cols, source_cols, t::regclass, t);
    get diagnostics n = row_count;
    raise notice 'restored % rows into %', n, t;
  end loop;

  if has_signup_trigger then
    alter table auth.users enable trigger on_auth_user_created;
  end if;
end
$$;

commit;

analyze;
