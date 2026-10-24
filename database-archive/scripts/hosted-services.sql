-- SUPABASE-ARCHIVE-01 — read-only inventory of Supabase-managed services.
--
-- Hosted-only (references auth / storage / realtime / vault). Returns ONE JSON
-- document of AGGREGATES ONLY: no emails, no names, no metadata values, no
-- password hashes, no tokens. Column layouts are returned so a restore target
-- can recreate compatible auth tables.
--
-- supabase db query --linked --project-ref <ref> -o json -f hosted-services.sql

set transaction read only;

select jsonb_build_object(
  'generated_at', now(),

  'auth', jsonb_build_object(
    'users_total',            (select count(*) from auth.users),
    'users_email_confirmed',  (select count(*) from auth.users where email_confirmed_at is not null),
    'users_with_password',    (select count(*) from auth.users where encrypted_password is not null and encrypted_password <> ''),
    'users_bcrypt_hashes',    (select count(*) from auth.users where encrypted_password like '$2%'),
    'users_phone',            (select count(*) from auth.users where phone is not null and phone <> ''),
    'users_anonymous',        (select count(*) from auth.users where is_anonymous),
    'users_sso',              (select count(*) from auth.users where is_sso_user),
    'users_banned',           (select count(*) from auth.users where banned_until is not null and banned_until > now()),
    'users_deleted',          (select count(*) from auth.users where deleted_at is not null),
    'users_by_aud_role',      (select coalesce(jsonb_object_agg(k, n), '{}') from (
                                 select coalesce(aud, '∅') || '/' || coalesce(role, '∅') as k, count(*) as n
                                 from auth.users group by 1) s),
    'users_created_range',    (select jsonb_build_object('min', min(created_at)::date, 'max', max(created_at)::date) from auth.users),
    'users_last_sign_in_max', (select max(last_sign_in_at)::date from auth.users),
    -- metadata KEYS only (never values) — tells a future auth provider what to map
    'user_metadata_keys',     (select coalesce(jsonb_agg(distinct k order by k), '[]')
                               from auth.users, jsonb_object_keys(coalesce(raw_user_meta_data, '{}')) k),
    'app_metadata_keys',      (select coalesce(jsonb_agg(distinct k order by k), '[]')
                               from auth.users, jsonb_object_keys(coalesce(raw_app_meta_data, '{}')) k),
    'identities_by_provider', (select coalesce(jsonb_object_agg(provider, n), '{}') from (
                                 select provider, count(*) as n from auth.identities group by 1) s),
    'sessions',               (select count(*) from auth.sessions),
    'refresh_tokens',         (select count(*) from auth.refresh_tokens),
    'mfa_factors',            (select count(*) from auth.mfa_factors),
    'one_time_tokens',        (select count(*) from auth.one_time_tokens),
    'sso_providers',          (select count(*) from auth.sso_providers),
    'saml_providers',         (select count(*) from auth.saml_providers),
    'oauth_clients',          (select count(*) from auth.oauth_clients),
    'schema_migrations_count',  (select count(*) from auth.schema_migrations),
    'schema_migrations_latest', (select max(version) from auth.schema_migrations),
    'users_columns', (
      select jsonb_agg(jsonb_build_object(
        'column', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
        'not_null', a.attnotnull, 'generated', nullif(a.attgenerated, ''),
        'default', pg_get_expr(d.adbin, d.adrelid)) order by a.attnum)
      from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = 'auth.users'::regclass and a.attnum > 0 and not a.attisdropped),
    'identities_columns', (
      select jsonb_agg(jsonb_build_object(
        'column', a.attname, 'type', format_type(a.atttypid, a.atttypmod),
        'not_null', a.attnotnull, 'generated', nullif(a.attgenerated, ''),
        'default', pg_get_expr(d.adbin, d.adrelid)) order by a.attnum)
      from pg_attribute a left join pg_attrdef d on d.adrelid = a.attrelid and d.adnum = a.attnum
      where a.attrelid = 'auth.identities'::regclass and a.attnum > 0 and not a.attisdropped),
    'users_pk',      (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'auth.users'::regclass and contype = 'p'),
    'identities_pk', (select pg_get_constraintdef(oid) from pg_constraint where conrelid = 'auth.identities'::regclass and contype = 'p'),
    'identities_constraints', (select jsonb_agg(conname || ': ' || pg_get_constraintdef(oid) order by conname)
                               from pg_constraint where conrelid = 'auth.identities'::regclass),
    'auth_functions', (select jsonb_agg(p.proname order by p.proname)
                       from pg_proc p where p.pronamespace = 'auth'::regnamespace)
  ),

  -- Profiles linkage, aggregated (no identities)
  'profiles', jsonb_build_object(
    'total',            (select count(*) from public.profiles),
    'by_role',          (select coalesce(jsonb_object_agg(role, n), '{}') from (
                           select role::text, count(*) as n from public.profiles group by 1) s),
    'without_farm',     (select count(*) from public.profiles where farm_id is null),
    'orphans_vs_auth',  (select count(*) from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id)),
    'auth_without_profile', (select count(*) from auth.users u where not exists (select 1 from public.profiles p where p.id = u.id))
  ),

  'storage', jsonb_build_object(
    'buckets', (select coalesce(jsonb_agg(jsonb_build_object(
                  'id', b.id, 'public', b.public, 'file_size_limit', b.file_size_limit,
                  'allowed_mime_types', b.allowed_mime_types,
                  'objects', (select count(*) from storage.objects o where o.bucket_id = b.id),
                  'bytes', (select coalesce(sum((o.metadata->>'size')::bigint), 0) from storage.objects o where o.bucket_id = b.id)
                ) order by b.id), '[]') from storage.buckets b),
    'objects_total', (select count(*) from storage.objects),
    'documents_with_storage_path', (select count(*) from public.documents where storage_path is not null),
    'migrations_count', (select count(*) from storage.migrations),
    'migrations_latest', (select name from storage.migrations order by id desc limit 1)
  ),

  'realtime', jsonb_build_object(
    'publication_tables', (select coalesce(jsonb_agg(schemaname || '.' || tablename), '[]')
                           from pg_publication_tables where pubname = 'supabase_realtime'),
    'subscriptions', (select count(*) from realtime.subscription),
    'schema_migrations_latest', (select max(version) from realtime.schema_migrations)
  ),

  'vault', jsonb_build_object('secrets', (select count(*) from vault.secrets)),

  'migration_history', jsonb_build_object(
    'supabase_migrations_schema', to_regnamespace('supabase_migrations') is not null
  ),

  'optional_services', jsonb_build_object(
    'pg_cron',       exists (select 1 from pg_extension where extname = 'pg_cron'),
    'pg_net',        exists (select 1 from pg_extension where extname = 'pg_net'),
    'pg_graphql',    exists (select 1 from pg_extension where extname = 'pg_graphql'),
    'db_webhooks',   to_regnamespace('supabase_functions') is not null,
    'pgsodium',      exists (select 1 from pg_extension where extname = 'pgsodium'),
    'wrappers_fdw',  exists (select 1 from pg_foreign_data_wrapper)
  )
) as services;
