-- SUPABASE-ARCHIVE-01 — Supabase's default privilege model on schema public.
--
-- On Supabase, the API roles receive full privileges on every new table,
-- function and sequence in `public`, and Row Level Security is the only
-- barrier. Applying this BEFORE supabase/migrations reproduces the hosted
-- grants exactly (verified by the restore rehearsal's drift check).
--
-- Optional: if the new stack does not expose anon/authenticated/service_role
-- (e.g. a server-side API that connects as one application role), skip this
-- file and grant least privilege explicitly instead.

grant usage on schema public to postgres, anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on functions to anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  grant all on sequences to anon, authenticated, service_role;
