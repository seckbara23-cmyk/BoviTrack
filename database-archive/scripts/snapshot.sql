-- SUPABASE-ARCHIVE-01 — consistent, read-only logical data snapshot.
--
-- Exports every row of every table in `public`, plus auth.users and
-- auth.identities (restricted material), as ONE JSON document:
--
--   { meta: {...}, tables: { "<schema>.<table>": { count, md5, rows: [...] } } }
--
-- * REPEATABLE READ + READ ONLY: every table is read from the same snapshot,
--   and the transaction cannot write.
-- * `md5` is computed server-side over the canonical jsonb text of each row,
--   sorted, newline-joined. A restore is verified by recomputing it
--   (see restore/verify.sql) — identical hash ⇒ identical row set.
-- * New public tables are picked up automatically; auth tables are explicit.
--
-- THE OUTPUT CONTAINS PRIVATE DATA (auth emails, password hashes). Never print
-- it, never commit it: pipe it straight to scripts/seal-snapshot.mjs, which
-- splits app vs auth data and encrypts each with its own key.
--
-- supabase db query --linked --project-ref <ref> -o json -f snapshot.sql > <private file>

set transaction isolation level repeatable read, read only;

with targets as (
  select n.nspname as schema, c.relname as name
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
  union all select 'auth', 'users'
  union all select 'auth', 'identities'
)
select jsonb_build_object(
  'meta', jsonb_build_object(
    'format', 'bovitrack-logical-snapshot/1',
    'taken_at', now(),
    'database', current_database(),
    'server_version_num', current_setting('server_version_num')::int,
    'transaction_isolation', current_setting('transaction_isolation'),
    'transaction_read_only', current_setting('transaction_read_only'),
    'timezone', current_setting('TimeZone')
  ),
  'tables', (
    select jsonb_object_agg(t.schema || '.' || t.name,
      -- query_to_xml runs the per-table query inside this same transaction;
      -- base64 keeps the JSON payload opaque to XML escaping.
      convert_from(decode((xpath('/row/j/text()', query_to_xml(format(
        $q$select encode(convert_to(jsonb_build_object(
              'count', count(*),
              'md5', md5(coalesce(string_agg(to_jsonb(x)::text, E'\n' order by to_jsonb(x)::text), '')),
              'rows', coalesce(jsonb_agg(to_jsonb(x) order by to_jsonb(x)::text), '[]')
            )::text, 'UTF8'), 'base64') as j
           from %I.%I x$q$, t.schema, t.name), false, true, '')))[1]::text, 'base64'), 'UTF8')::jsonb)
    from targets t
  )
) as snapshot;
