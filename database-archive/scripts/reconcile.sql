-- SUPABASE-COST-03A — read-only reconciliation of the hosted data with an archive run.
--
-- For every table covered by snapshot.sql (all of `public` + auth.users +
-- auth.identities) returns the exact row count and the row-set md5 computed
-- with the SAME formula as the snapshot (canonical jsonb, sorted, newline-
-- joined), plus change indicators. No row content leaves the database.
--
-- Compare with a run's manifest.json (scripts/reconcile-compare.mjs): identical
-- count + md5 for every table ⇒ the archive still equals the hosted data.
--
-- Hashes of auth tables are hashes of restricted material: keep the raw output
-- private (do not commit it).
--
-- supabase db query --linked --project-ref <ref> -o json -f reconcile.sql > <private file>

set transaction isolation level repeatable read, read only;

with targets as (
  select n.nspname as schema, c.relname as name
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
  union all select 'auth', 'users'
  union all select 'auth', 'identities'
)
select jsonb_build_object(
  'checked_at', now(),
  'transaction_isolation', current_setting('transaction_isolation'),
  'tables', (
    select jsonb_object_agg(t.schema || '.' || t.name,
      (xpath('/row/j/text()', query_to_xml(format(
        $q$select jsonb_build_object(
              'count', count(*),
              'md5', md5(coalesce(string_agg(to_jsonb(x)::text, E'\n' order by to_jsonb(x)::text), ''))
            )::text as j
           from %I.%I x$q$, t.schema, t.name), false, true, '')))[1]::text::jsonb)
    from targets t
  ),
  'public_writes_since_reset', (select sum(n_tup_ins + n_tup_upd + n_tup_del)
                                from pg_stat_user_tables where schemaname = 'public'),
  'api_role_calls', (select coalesce(sum(s.calls), 0)
                     from extensions.pg_stat_statements s join pg_roles r on r.oid = s.userid
                     where r.rolname in ('anon', 'authenticated', 'service_role')),
  'auth_last_sign_in', (select max(last_sign_in_at) from auth.users),
  'auth_audit_entries', (select count(*) from auth.audit_log_entries),
  'auth_sessions', (select count(*) from auth.sessions)
) as reconcile;
