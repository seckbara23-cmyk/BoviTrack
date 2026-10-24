-- SUPABASE-ARCHIVE-01 — portable, read-only catalog inventory.
--
-- Returns ONE JSON document describing the database structure: server,
-- extensions, schemas, tables (with exact row counts), columns, constraints,
-- indexes, sequences, enums, views, functions, triggers, RLS policies, grants,
-- default privileges, publications and roles.
--
-- Safe by construction:
--   * SELECT-only, inside a READ ONLY transaction (any write would error);
--   * no row data is returned — only counts and catalog metadata;
--   * no password material (pg_roles never exposes it).
--
-- Portable: runs unchanged on hosted Supabase and on a vanilla PostgreSQL
-- restore, so the `public` sections can be diffed to detect schema drift.
--
-- Hosted:   supabase db query --linked --project-ref <ref> -o json -f inventory.sql
-- Restored: psql -X -At -f inventory.sql <restored-db-url>

set transaction read only;

with
user_schemas as (
  select n.oid, n.nspname, n.nspowner, n.nspacl
  from pg_namespace n
  where n.nspname not in ('pg_catalog', 'information_schema', 'pg_toast')
    and n.nspname not like 'pg\_temp\_%'
    and n.nspname not like 'pg\_toast\_temp\_%'
),
tbls as (
  select c.oid, n.nspname as schema, c.relname as name, c.relkind,
         c.relrowsecurity, c.relforcerowsecurity, c.reltuples, c.relowner
  from pg_class c
  join user_schemas n on n.oid = c.relnamespace
  where c.relkind in ('r', 'p')
),
pub_tbls as (
  select * from tbls where schema = 'public'
),
pub_funcs as (
  select p.*
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind in ('f', 'p')
    -- exclude functions owned by extensions installed into public
    and not exists (
      select 1 from pg_depend d
      where d.classid = 'pg_proc'::regclass and d.objid = p.oid and d.deptype = 'e'
    )
)
select jsonb_build_object(
  'inventory_version', 1,
  'generated_at', now(),

  'server', (
    select jsonb_build_object(
      'version', version(),
      'server_version_num', current_setting('server_version_num')::int,
      'database', current_database(),
      'encoding', pg_encoding_to_char(d.encoding),
      'collate', d.datcollate,
      'ctype', d.datctype,
      'size_bytes', pg_database_size(current_database()),
      'timezone', current_setting('TimeZone'),
      'current_user', current_user,
      'current_user_bypassrls', (select rolbypassrls from pg_roles where rolname = current_user),
      'transaction_read_only', current_setting('transaction_read_only')
    )
    from pg_database d where d.datname = current_database()
  ),

  'extensions', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', e.extname, 'version', e.extversion, 'schema', n.nspname
    ) order by e.extname), '[]')
    from pg_extension e join pg_namespace n on n.oid = e.extnamespace
  ),

  'schemas', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', nspname, 'owner', pg_get_userbyid(nspowner)
    ) order by nspname), '[]')
    from user_schemas
  ),

  -- Every table in every non-system schema, with an exact count where the
  -- inventory role may read it (null otherwise). Counts only — no rows.
  'tables', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', t.schema,
      'name', t.name,
      'kind', t.relkind,
      'owner', pg_get_userbyid(t.relowner),
      'rls_enabled', t.relrowsecurity,
      'rls_forced', t.relforcerowsecurity,
      'estimated_rows', t.reltuples::bigint,
      'exact_rows', case when has_table_privilege(t.oid, 'SELECT') then
        (xpath('/row/c/text()', query_to_xml(
          format('select count(*) as c from %I.%I', t.schema, t.name),
          false, true, '')))[1]::text::bigint
      end,
      'total_bytes', pg_total_relation_size(t.oid)
    ) order by t.schema, t.name), '[]')
    from tbls t
  ),

  'columns', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', t.name,
      'column', a.attname,
      'ordinal', a.attnum,
      'type', format_type(a.atttypid, a.atttypmod),
      'not_null', a.attnotnull,
      'default', pg_get_expr(ad.adbin, ad.adrelid),
      'identity', nullif(a.attidentity, ''),
      'generated', nullif(a.attgenerated, '')
    ) order by t.name, a.attnum), '[]')
    from pub_tbls t
    join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
    left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
  ),

  'constraints', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', t.name,
      'name', c.conname,
      'type', c.contype,
      'definition', pg_get_constraintdef(c.oid)
    ) order by t.name, c.conname), '[]')
    from pg_constraint c join pub_tbls t on t.oid = c.conrelid
    where c.contype in ('p', 'f', 'u', 'c', 'x')
  ),

  'indexes', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', i.tablename, 'name', i.indexname, 'definition', i.indexdef
    ) order by i.tablename, i.indexname), '[]')
    from pg_indexes i where i.schemaname = 'public'
  ),

  'sequences', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', s.schemaname, 'name', s.sequencename, 'data_type', s.data_type::text
    ) order by s.schemaname, s.sequencename), '[]')
    from pg_sequences s
    where s.schemaname not in ('pg_catalog', 'information_schema')
  ),

  'enums', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', ty.typname,
      'labels', (select jsonb_agg(e.enumlabel order by e.enumsortorder)
                 from pg_enum e where e.enumtypid = ty.oid)
    ) order by ty.typname), '[]')
    from pg_type ty join pg_namespace n on n.oid = ty.typnamespace
    where n.nspname = 'public' and ty.typtype = 'e'
  ),

  'views', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', c.relname, 'kind', c.relkind, 'definition', pg_get_viewdef(c.oid, true)
    ) order by c.relname), '[]')
    from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('v', 'm')
  ),

  'functions', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_identity_arguments(p.oid),
      'returns', pg_get_function_result(p.oid),
      'language', l.lanname,
      'security_definer', p.prosecdef,
      'volatility', p.provolatile,
      'config', p.proconfig,
      'owner', pg_get_userbyid(p.proowner),
      'body_md5', md5(p.prosrc),
      'definition', pg_get_functiondef(p.oid)
    ) order by p.proname, pg_get_function_identity_arguments(p.oid)), '[]')
    from pub_funcs p join pg_language l on l.oid = p.prolang
  ),

  -- User triggers on public tables, plus any trigger (anywhere) that calls a
  -- public function — this is how the auth.users → profiles hook shows up.
  'triggers', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', tn.nspname || '.' || tc.relname,
      'name', tg.tgname,
      'enabled', tg.tgenabled,
      'function', fn.nspname || '.' || p.proname,
      'definition', pg_get_triggerdef(tg.oid)
    ) order by tn.nspname, tc.relname, tg.tgname), '[]')
    from pg_trigger tg
    join pg_class tc on tc.oid = tg.tgrelid
    join pg_namespace tn on tn.oid = tc.relnamespace
    join pg_proc p on p.oid = tg.tgfoid
    join pg_namespace fn on fn.oid = p.pronamespace
    where not tg.tgisinternal
      and (tn.nspname = 'public' or fn.nspname = 'public')
  ),

  'policies', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', p.schemaname,
      'table', p.tablename,
      'name', p.policyname,
      'permissive', p.permissive,
      'roles', to_jsonb(p.roles),
      'command', p.cmd,
      'using', p.qual,
      'with_check', p.with_check
    ) order by p.schemaname, p.tablename, p.policyname), '[]')
    from pg_policies p
    where p.schemaname in ('public', 'storage')
  ),

  'table_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'table', g.name, 'grantee', g.grantee, 'privileges', g.privs
    ) order by g.name, g.grantee), '[]')
    from (
      select t.name,
             case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end as grantee,
             jsonb_agg(x.privilege_type order by x.privilege_type) as privs
      from pub_tbls t
      join pg_class c on c.oid = t.oid
      cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
      group by 1, 2
    ) g
  ),

  'function_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'function', g.fname, 'grantee', g.grantee, 'privileges', g.privs
    ) order by g.fname, g.grantee), '[]')
    from (
      select p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')' as fname,
             case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end as grantee,
             jsonb_agg(x.privilege_type order by x.privilege_type) as privs
      from pub_funcs p
      cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
      group by 1, 2
    ) g
  ),

  'schema_grants', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'schema', g.nspname, 'grantee', g.grantee, 'privileges', g.privs
    ) order by g.nspname, g.grantee), '[]')
    from (
      select s.nspname,
             case when x.grantee = 0 then 'PUBLIC' else pg_get_userbyid(x.grantee) end as grantee,
             jsonb_agg(x.privilege_type order by x.privilege_type) as privs
      from user_schemas s
      cross join lateral aclexplode(coalesce(s.nspacl, acldefault('n', s.nspowner))) x
      where s.nspname = 'public'
      group by 1, 2
    ) g
  ),

  'default_privileges', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'owner', pg_get_userbyid(d.defaclrole),
      'schema', n.nspname,
      'object_type', d.defaclobjtype,
      'acl', d.defaclacl::text[]
    ) order by pg_get_userbyid(d.defaclrole), n.nspname, d.defaclobjtype), '[]')
    from pg_default_acl d left join pg_namespace n on n.oid = d.defaclnamespace
    where n.nspname = 'public' or n.nspname is null
  ),

  'publications', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', p.pubname,
      'all_tables', p.puballtables,
      'tables', (select coalesce(jsonb_agg(pt.schemaname || '.' || pt.tablename
                   order by pt.schemaname, pt.tablename), '[]')
                 from pg_publication_tables pt where pt.pubname = p.pubname)
    ) order by p.pubname), '[]')
    from pg_publication p
  ),

  -- Role names and attributes only. pg_roles never exposes passwords.
  'roles', (
    select coalesce(jsonb_agg(jsonb_build_object(
      'name', r.rolname,
      'superuser', r.rolsuper,
      'login', r.rolcanlogin,
      'bypassrls', r.rolbypassrls,
      'createrole', r.rolcreaterole,
      'createdb', r.rolcreatedb,
      'replication', r.rolreplication,
      'valid_until', r.rolvaliduntil,
      'member_of', (select coalesce(jsonb_agg(pg_get_userbyid(m.roleid)
                      order by pg_get_userbyid(m.roleid)), '[]')
                    from pg_auth_members m where m.member = r.oid)
    ) order by r.rolname), '[]')
    from pg_roles r
    where r.rolname not like 'pg\_%'
  )
) as inventory;
