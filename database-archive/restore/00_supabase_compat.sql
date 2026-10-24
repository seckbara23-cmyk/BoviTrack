-- SUPABASE-ARCHIVE-01 — Supabase compatibility layer for a vanilla PostgreSQL target.
--
-- Recreates the Supabase-provided objects BoviTrack's schema depends on, so
-- supabase/migrations/*.sql apply UNCHANGED on plain PostgreSQL (rehearsed on 18):
--
--   roles      anon / authenticated / service_role — NOLOGIN grant targets
--              used by the hosted grants and by API layers such as PostgREST
--   schemas    extensions (pgcrypto lives here on Supabase), auth
--   tables     auth.users, auth.identities — column-for-column copies of the
--              hosted Supabase Auth tables (auth schema version 20260831180000),
--              so the auth-restricted bundle restores losslessly. Only the keys
--              needed by the data are recreated, not every GoTrue index.
--   functions  auth.uid(), auth.role(), auth.email(), auth.jwt() — read the same
--              request.jwt.* settings Supabase/PostgREST set, so the RLS policies
--              in 0002_rls.sql keep working behind any layer that sets them.
--
-- If the new stack runs a real Supabase Auth (GoTrue) server, let GoTrue create
-- the auth schema itself and skip the "auth" section (see restore/README.md).
-- Idempotent: safe to re-run.

-- ------------------------------------------------------------------
-- Roles
-- ------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'anon') then
    create role anon nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'authenticated') then
    create role authenticated nologin noinherit;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'service_role') then
    create role service_role nologin noinherit bypassrls;
  end if;
end
$$;

-- ------------------------------------------------------------------
-- Extensions (same placement as Supabase; 0001_init.sql then no-ops)
-- ------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ------------------------------------------------------------------
-- auth schema
-- ------------------------------------------------------------------
create schema if not exists auth;

create table if not exists auth.users (
  instance_id                 uuid,
  id                          uuid not null primary key,
  aud                         varchar(255),
  role                        varchar(255),
  email                       varchar(255),
  encrypted_password          varchar(255),
  email_confirmed_at          timestamptz,
  invited_at                  timestamptz,
  confirmation_token          varchar(255),
  confirmation_sent_at        timestamptz,
  recovery_token              varchar(255),
  recovery_sent_at            timestamptz,
  email_change_token_new      varchar(255),
  email_change                varchar(255),
  email_change_sent_at        timestamptz,
  last_sign_in_at             timestamptz,
  raw_app_meta_data           jsonb,
  raw_user_meta_data          jsonb,
  is_super_admin              boolean,
  created_at                  timestamptz,
  updated_at                  timestamptz,
  phone                       text default null::character varying,
  phone_confirmed_at          timestamptz,
  phone_change                text default ''::character varying,
  phone_change_token          varchar(255) default ''::character varying,
  phone_change_sent_at        timestamptz,
  confirmed_at                timestamptz generated always as (least(email_confirmed_at, phone_confirmed_at)) stored,
  email_change_token_current  varchar(255) default ''::character varying,
  email_change_confirm_status smallint default 0,
  banned_until                timestamptz,
  reauthentication_token      varchar(255) default ''::character varying,
  reauthentication_sent_at    timestamptz,
  is_sso_user                 boolean not null default false,
  deleted_at                  timestamptz,
  is_anonymous                boolean not null default false
);

create table if not exists auth.identities (
  provider_id     text not null,
  user_id         uuid not null references auth.users (id) on delete cascade,
  identity_data   jsonb not null,
  provider        text not null,
  last_sign_in_at timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz,
  email           text generated always as (lower(identity_data ->> 'email')) stored,
  id              uuid not null default gen_random_uuid() primary key,
  constraint identities_provider_id_provider_unique unique (provider_id, provider)
);

create or replace function auth.uid() returns uuid
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid
$$;

create or replace function auth.role() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role'
  )::text
$$;

create or replace function auth.email() returns text
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email'
  )::text
$$;

create or replace function auth.jwt() returns jsonb
language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;

grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid(), auth.role(), auth.email(), auth.jwt()
  to anon, authenticated, service_role;
