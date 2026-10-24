-- SUPABASE-ARCHIVE-01 — path C only: finish a schema restored from pg_dump DDL.
--
-- Use after loading schema-public.sql (from scripts/export-pgdump.sh) into an
-- empty database whose default `public` schema was dropped first, with
-- 00_supabase_compat.sql already applied. A `pg_dump --schema=public
-- --no-owner` dump cannot carry two things BoviTrack relies on:
--
--   1. the stock ownership/ACL of schema public (PostgreSQL 15+ defaults);
--   2. the signup hook, which lives on auth.users — outside the dumped schema.
--
-- The primary path (00 + 01 + original migrations) needs none of this.

alter schema public owner to pg_database_owner;
grant usage on schema public to public;
grant usage on schema public to postgres, anon, authenticated, service_role;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
