-- SUPABASE-COST-02B — read-only database activity check (aggregates only).
--
-- Answers "is anything still using this database?" without reading any row
-- data: last-access timestamps and write counters per public table, Data API
-- (PostgREST) and Auth activity by role from pg_stat_statements, Auth sign-in
-- and session aggregates, and current connections grouped by role/application.
--
-- Safe: SELECT-only inside a READ ONLY transaction; no row content, no query
-- text, no identities are returned. Statistics reflect activity since the last
-- stats reset (`stats_reset`) / server restart.
--
-- supabase db query --linked --project-ref <ref> -o json -f activity-check.sql

set transaction read only;

with tbl as (
  select schemaname, relname, seq_scan, idx_scan, last_seq_scan, last_idx_scan,
         n_tup_ins, n_tup_upd, n_tup_del,
         greatest(last_seq_scan, last_idx_scan) as last_access
  from pg_stat_user_tables
),
pgss as (
  select r.rolname, sum(s.calls)::bigint as calls, min(s.stats_since) as since
  from extensions.pg_stat_statements s
  join pg_roles r on r.oid = s.userid
  group by r.rolname
)
select jsonb_build_object(
  'checked_at', now(),
  'stats_reset', (select stats_reset from pg_stat_database where datname = current_database()),
  'server_started', pg_postmaster_start_time(),

  'public_tables', (select count(*) from tbl where schemaname = 'public'),
  'public_last_access', (select max(last_access) from tbl where schemaname = 'public'),
  'public_tables_accessed_after', (
    -- tables read after the given cut-off (the archive's own last read)
    select coalesce(jsonb_agg(relname order by relname), '[]')
    from tbl where schemaname = 'public'
      and last_access > timestamptz '2026-10-24 17:46:00+00'),
  'public_writes_since_reset', (select sum(n_tup_ins + n_tup_upd + n_tup_del)
                                from tbl where schemaname = 'public'),

  'auth_tables_last_access', (select max(last_access) from tbl
                              where schemaname = 'auth'
                                and relname in ('users', 'identities', 'sessions', 'refresh_tokens')),
  'auth_last_sign_in', (select max(last_sign_in_at) from auth.users),
  'auth_users_total', (select count(*) from auth.users),
  'auth_sessions', (select count(*) from auth.sessions),
  'auth_refresh_tokens', (select count(*) from auth.refresh_tokens),
  'auth_audit_entries', (select count(*) from auth.audit_log_entries),
  'auth_audit_last', (select max(created_at) from auth.audit_log_entries),

  -- Query volume per role since pg_stat_statements was last reset.
  -- anon/authenticated = Data API (PostgREST) on behalf of clients;
  -- supabase_auth_admin = the Auth server; postgres = dashboard / CLI.
  'statements_by_role', (select coalesce(jsonb_object_agg(rolname, calls), '{}') from pgss),
  'statements_since', (select min(since) from pgss),
  'api_role_calls', (select coalesce(sum(calls), 0) from pgss
                     where rolname in ('anon', 'authenticated', 'service_role')),

  'connections_now', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'role', usename, 'application', application_name, 'state', state,
      'backend', backend_type, 'count', n) order by usename, application_name), '[]')
    from (select usename, application_name, state, backend_type, count(*) as n
          from pg_stat_activity
          where pid <> pg_backend_pid() and datname = current_database()
          group by 1, 2, 3, 4) c)
) as activity;
