# Security model and findings

Source: hosted inventory of 2026-10-24
([schema/hosted-inventory-2026-10-24.json](../schema/hosted-inventory-2026-10-24.json)),
plus the RLS smoke test from the restore rehearsal
([restore/04_rls_smoke_test.sql](../restore/04_rls_smoke_test.sql)). **This phase
documents only; no policy or grant was changed.**

## Model (identical on hosted and in the restored copy)

- **RLS is enabled on all 13 `public` tables** (not `FORCE`d; the table owner
  `postgres` and `service_role` bypass it).
- **Tenancy is per farm.** `profiles.farm_id` binds a user to one farm, and
  `super_admin` sees everything.
- **Helper functions** (all `SECURITY DEFINER`, `search_path=public`, owner
  `postgres`): `is_super_admin()`, `my_farm_id()`, `can_access_farm(uuid)`,
  `can_access_animal(uuid)`. They read `auth.uid()`.
- **26 policies**, all for role `public`: a `SELECT` policy and a `FOR ALL`
  write policy on every table except `profiles`, which has `SELECT` and
  `UPDATE` only. `farms`, `owners` and `animals` are scoped by `farm_id`. Child
  tables are scoped through their parent animal (`breeding_records` via
  `female_animal_id`, `birth_records` via `mother_animal_id`).
- **Grants follow the Supabase default.** `anon`, `authenticated`,
  `service_role` and `postgres` hold every table privilege on all 13 tables,
  and `EXECUTE` on all 5 functions (also granted to `PUBLIC`). The schema's
  default privileges grant the same to future objects. RLS is therefore the
  only barrier between the public API key and the data.
- **Signup hook.** Trigger `on_auth_user_created` on `auth.users` calls
  `handle_new_user()`, which inserts a `viewer` profile.

On vanilla PostgreSQL the same model is reproduced by
[restore/00_supabase_compat.sql](../restore/00_supabase_compat.sql) (roles and
`auth.uid()` reading `request.jwt.claims`) plus
[01_supabase_default_grants.sql](../restore/01_supabase_default_grants.sql). The
rehearsal proved isolation still holds: anonymous callers see 0 animals, a
farm-1 user sees farm 1 only, a farm-2 user sees farm 2 only, cross-farm
writes are blocked, and child tables are isolated.

## Findings (not fixed in this phase)

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | **High** | **Any signed-in user can promote themselves to `super_admin` or join any farm.** `profiles_update` allows `id = auth.uid()`, and `authenticated` holds `UPDATE` on every column, so a user can set their own `role` or `farm_id` and then read and write every farm. | Smoke test #11 → `allowed`; #12: after self-promotion, the farm-1 viewer sees 12 animals across both farms instead of 10. |
| F2 | Medium | **Roles aren't enforced; only the farm is.** `viewer`, `field_agent` and the other roles can insert, update and delete every record of their farm, including `DELETE` on the farm row itself, which cascades to all of its data. | Smoke test #10 → `allowed`. |
| F3 | Medium | **API roles hold full table privileges** (Supabase default), so a future table created without RLS would be fully exposed to the anon key. All 13 tables are protected today. | Inventory `table_grants`, `default_privileges`. |
| F4 | Low | The `SECURITY DEFINER` helpers are executable by `PUBLIC` and `anon` (Supabase default), so they can be called through the Data API as RPCs. They return only the caller's own context (booleans or the caller's farm id). `handle_new_user()` returns `trigger` and can't be called directly. | Inventory `function_grants`. |
| F5 | Info | `profiles` has no `INSERT` or `DELETE` policy, so profiles come only from the signup trigger. That's intended, but it should be documented in the app. | Inventory `policies`. |
| F6 | Info | A temporary Supabase CLI role, `cli_login_postgres`, exists on the hosted database (`LOGIN`, member of `postgres`, `VALID UNTIL` about 10 minutes after each CLI query). This archive's read-only CLI queries created or refreshed it. It expires on its own and touches no schema or data. | Inventory `roles`. |

### Suggested direction for a future phase

- F1: revoke column-wide `UPDATE` on `profiles` from `authenticated` and grant
  only the self-editable columns (for example `grant update (full_name) on
  public.profiles to authenticated`). Alternatively, add a `WITH CHECK` or
  trigger that rejects changes to `role` and `farm_id` unless the caller is a
  `super_admin`.
- F2: add role predicates to the write policies (for example writes only for
  `farm_admin` and `field_agent`, `DELETE` on `farms` only for `super_admin`).
- F3: on the next platform, grant least privilege explicitly instead of
  inheriting Supabase's default ACLs.

Re-run `restore/04_rls_smoke_test.sql` after any fix. Rows 10–12 should then
report `pass`.
