-- PROPOSED — rollback for 0003_profiles_privilege_guard.sql.
--
-- Restores the exact pre-fix state recorded in the hosted inventory of
-- 2026-10-24: table-wide UPDATE on public.profiles for anon and authenticated
-- (Supabase default), no column-level grants, no admin function. The restore
-- rehearsal verifies this by a zero-drift comparison against the hosted
-- inventory.

begin;

drop function if exists public.admin_set_profile_access(uuid, public.user_role, uuid);

revoke update (full_name) on public.profiles from authenticated;
grant update on public.profiles to authenticated, anon;

commit;
