# Security remediation plan — profile self-promotion (finding F1)

SUPABASE-COST-02A · 2026-10-24. **Design and local verification only; nothing
was applied to the hosted Supabase project.** Applying the fix to any shared or
production database requires separate approval.

## 1. Finding (confirmed against local evidence)

| | |
|---|---|
| Severity | **High** |
| Affected | table `public.profiles`; policy `profiles_update`; table privileges of role `authenticated` |
| Effect | a signed-in user can change the authorization fields of **their own** profile (`role`, `farm_id`), gaining access beyond their farm |
| Confirmed | yes — reproduced on 2026-10-24 in a disposable restore of the archived schema (smoke-test check 11), identical to the hosted catalog (zero drift) |
| Live exposure today | **low**: production runs in demo mode and does not use Supabase (`deployment-dependency-map.md`); the hosted project has 1 user. The issue becomes live the moment the app is connected to a database with this schema. |

## 2. Root cause

- `profiles_update` limits **which row** may be updated:
  `using (id = auth.uid() or is_super_admin()) with check (same)`.
- Row Level Security does not limit **which columns** change.
- Supabase's default privileges grant `authenticated` table-wide `UPDATE` on
  every table, so every column of the user's own row is writable — including
  the two columns that drive authorization (`is_super_admin()`, `my_farm_id()`).

## 3. Proposed fix (minimal)

File: [`security/proposed/0003_profiles_privilege_guard.sql`](../security/proposed/0003_profiles_privilege_guard.sql)
— kept **outside** `supabase/migrations/` so it cannot be pushed by accident.

1. **Column-level privileges:**
   `revoke update on public.profiles from authenticated, anon;`
   `grant update (full_name) on public.profiles to authenticated;`
   Users may still edit their display name; `role`, `farm_id` and `email` are no
   longer writable through the API.
2. **Privileged path for access changes:** new function
   `public.admin_set_profile_access(target_user, new_role, new_farm_id)` —
   `SECURITY DEFINER`, `search_path = ''`, raises `42501` unless the caller
   `is_super_admin()`, requires a farm for farm-scoped roles, executable by
   `authenticated` and `service_role` only (revoked from `PUBLIC`/`anon`).

RLS policies, the signup trigger, `service_role` and SQL-editor administration
are unchanged.

Alternative considered: a `BEFORE UPDATE` trigger rejecting changes to `role`/
`farm_id` unless `is_super_admin()`. Equivalent protection, but more moving
parts; column privileges are simpler, declarative and visible in the catalog.

Out of scope here (separate finding F2, Medium): write policies do not check the
user's role, so a `viewer` can still write farm records. Fix later with role
predicates in the write policies.

## 4. Regression tests

File: [`security/proposed/test_0003_profiles_privilege_guard.sql`](../security/proposed/test_0003_profiles_privilege_guard.sql)
— runs in one rolled-back transaction on a disposable restored copy, with two
synthetic accounts plus the restored super_admin; prints verdicts only.

| # | Expectation | Before fix | After fix |
|---|---|---|---|
| 1 | user may update own `full_name` | pass | pass |
| 2 | user may not change own `role` | **FAIL** | pass |
| 3 | user may not change own `farm_id` | **FAIL** | pass |
| 4 | user may not change own profile `email` | **FAIL** | pass |
| 5 | user may not rename another user | pass | pass |
| 6 | non-admin may not use the admin function | **FAIL** | pass |
| 7 | anonymous caller may not use the admin function | **FAIL** | pass |
| 8 | even super_admin changes access only via the function | **FAIL** | pass |
| 9 | super_admin can assign role + farm via the function | **FAIL** | pass |
| 10 | the assignment persists | pass | pass |
| 11 | farm-scoped role without a farm is rejected | **FAIL** | pass |

Result: **8/11 fail before the fix (the tests detect the problem); 11/11 pass
after it.** Additional evidence from the same disposable run:

- existing RLS smoke test: self-promotion check **flips to pass**; farm
  isolation checks 1–9 still pass;
- `restore/03_verify.sql`: **48/48 rows identical** — the fix changes no data;
- after rollback, the schema shows **zero drift** against the hosted inventory,
  and the regression tests fail again (as expected).

## 5. Rollback plan

File: [`security/proposed/rollback_0003_profiles_privilege_guard.sql`](../security/proposed/rollback_0003_profiles_privilege_guard.sql)
— drops the function, removes the column grant, restores table-wide `UPDATE` for
`authenticated` and `anon`. Verified to return the catalog to **exactly** the
hosted state of 2026-10-24.

## 6. Impact on legitimate workflows

| Workflow | Today | After the fix |
|---|---|---|
| User edits own display name | possible via API (no UI yet) | unchanged |
| Admin assigns a user's farm/role | done in the SQL editor as `postgres` (documented in `docs/`) | unchanged; additionally possible via `admin_set_profile_access` for a future admin screen |
| Seed / admin scripts (`service_role`) | unaffected | unaffected |
| Current app code | **never writes `profiles`** (read-only herd module) | no change needed |

## 7. Adoption steps (after approval)

1. Copy the fix to `supabase/migrations/0003_profiles_privilege_guard.sql`.
2. Rehearse on a disposable restore: apply, run the regression tests and
   `restore/04_rls_smoke_test.sql`, run the rollback, confirm zero drift.
3. Apply to the target database through the normal migration path, run the
   regression tests there **inside their rolled-back transaction**.
4. If anything misbehaves, run the rollback file.
