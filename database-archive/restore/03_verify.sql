-- SUPABASE-ARCHIVE-01 — prove the restored data is identical to the source.
--
-- For every table in the loaded bundle(s) (archive_restore.bundle):
--   bundle_md5_ok   the bundle's rows reproduce the md5 computed ON THE SOURCE
--                   SERVER inside the snapshot transaction (bundle integrity);
--   missing/extra   restored rows vs bundle rows compared as multisets of
--                   canonical jsonb text (restore fidelity);
--   counts          source count = restored count.
-- Together: restored rows ≡ source rows. Also checks every constraint is
-- validated. Fails (non-zero exit with ON_ERROR_STOP) on any mismatch.
--
-- Prints counts and booleans only — never row content.

\set ON_ERROR_STOP on
set timezone = 'UTC';  -- timestamptz → jsonb text must match the source (UTC)

create temp table verify_result (
  fq             text primary key,
  source_count   bigint,
  restored_count bigint,
  bundle_md5_ok  boolean,
  missing        bigint,
  extra          bigint,
  ok             boolean
);

do $$
declare
  r record;
  bundle_md5 text;
  restored bigint;
  n_missing bigint;
  n_extra bigint;
begin
  for r in
    select t.key as fq, t.value as payload
    from archive_restore.bundle b
    cross join lateral jsonb_each(b.doc -> 'tables') t
  loop
    select md5(coalesce(string_agg(e.j::text, E'\n' order by e.ord), ''))
      into bundle_md5
    from jsonb_array_elements(r.payload -> 'rows') with ordinality as e(j, ord);

    execute format($f$
      with restored as (select to_jsonb(x)::text as j from %s x),
           bundle   as (select e.j::text as j from jsonb_array_elements($1) as e(j))
      select (select count(*) from restored),
             (select count(*) from (select j from bundle except all select j from restored) m),
             (select count(*) from (select j from restored except all select j from bundle) m)
    $f$, r.fq::regclass)
    using r.payload -> 'rows'
    into restored, n_missing, n_extra;

    insert into verify_result values (
      r.fq,
      (r.payload ->> 'count')::bigint,
      restored,
      bundle_md5 = r.payload ->> 'md5',
      n_missing,
      n_extra,
      bundle_md5 = r.payload ->> 'md5'
        and n_missing = 0 and n_extra = 0
        and restored = (r.payload ->> 'count')::bigint
    );
  end loop;
end
$$;

\echo '== row-level verification (restored vs source snapshot)'
select fq as "table", source_count, restored_count, bundle_md5_ok, missing, extra, ok
from verify_result order by fq;

\echo '== constraints not validated (expect 0 rows)'
select conrelid::regclass as "table", conname
from pg_constraint
where not convalidated and connamespace in ('public'::regnamespace, 'auth'::regnamespace);

do $$
begin
  if exists (select 1 from verify_result where not ok) then
    raise exception 'VERIFY FAILED: restored data differs from the source snapshot';
  end if;
  if exists (select 1 from pg_constraint where not convalidated
             and connamespace in ('public'::regnamespace, 'auth'::regnamespace)) then
    raise exception 'VERIFY FAILED: unvalidated constraints present';
  end if;
  raise notice 'VERIFY OK: % tables, % rows identical to source',
    (select count(*) from verify_result), (select sum(restored_count) from verify_result);
end
$$;
