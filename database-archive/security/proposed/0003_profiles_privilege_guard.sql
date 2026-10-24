-- PROPOSED — NOT APPLIED. SUPABASE-COST-02A security remediation for finding F1.
--
-- Kept outside supabase/migrations/ on purpose so it cannot be pushed to the
-- hosted project by accident. To adopt it after approval, copy it to
-- supabase/migrations/0003_profiles_privilege_guard.sql and apply it through
-- the normal migration path (rehearse on a restored copy first).
--
-- Problem: RLS policy profiles_update limits WHICH ROW a user may update (their
-- own), but the `authenticated` role holds table-wide UPDATE (Supabase default
-- grant), so every column of that row — including `role` and `farm_id` — is
-- writable by its owner.
--
-- Fix: column-level privileges. Ordinary users may update only their display
-- name. Changing a user's role or farm becomes an explicit, privileged
-- operation that only a super_admin can perform.
--
-- Unchanged: RLS policies, the signup trigger, service_role and SQL-editor
-- (postgres) administration. Rollback: rollback_0003_profiles_privilege_guard.sql.

begin;

-- 1. Self-service updates: display name only.
revoke update on public.profiles from authenticated, anon;
grant update (full_name) on public.profiles to authenticated;

-- 2. Privileged path for access changes (role / farm assignment).
create or replace function public.admin_set_profile_access(
  target_user uuid,
  new_role    public.user_role,
  new_farm_id uuid
)
returns public.profiles
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.profiles;
begin
  if not public.is_super_admin() then
    raise exception 'admin_set_profile_access: super_admin required'
      using errcode = '42501';   -- insufficient_privilege
  end if;

  if new_role <> 'super_admin' and new_farm_id is null then
    raise exception 'admin_set_profile_access: farm-scoped roles need a farm'
      using errcode = '22023';   -- invalid_parameter_value
  end if;

  update public.profiles
     set role = new_role,
         farm_id = new_farm_id
   where id = target_user
  returning * into result;

  if not found then
    raise exception 'admin_set_profile_access: profile not found'
      using errcode = 'P0002';   -- no_data_found
  end if;

  return result;
end;
$$;

comment on function public.admin_set_profile_access(uuid, public.user_role, uuid) is
  'Sets a user''s role and farm. super_admin only (checked inside). The only '
  'supported way to change profile access through the API.';

revoke all on function public.admin_set_profile_access(uuid, public.user_role, uuid)
  from public, anon;
grant execute on function public.admin_set_profile_access(uuid, public.user_role, uuid)
  to authenticated, service_role;

commit;
