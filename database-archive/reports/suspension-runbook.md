# Suspension and reactivation runbook — BoviTrack Supabase project

SUPABASE-COST-02B · owner-executable. **Not executed.** Project
`vustkojrbefcbzotgorc` ("Bovitrack"), organization `ozrngrouyimpyivqxkgt`.

> Pausing is **not available** in the current (paid) organization. The only
> reversible way to stop BoviTrack's compute is to **transfer it to a Free
> organization and pause it there**. Deleting the project is irreversible and
> should wait until every gate in §1 is closed.

## 1. Gates — all must be ✅ before any suspension

| # | Gate | How to verify | Today |
|---|---|---|---|
| G1 | Off-site copies of both encrypted packages on approved storage | `verify-offsite.sh` on the copies, with the off-site key copies → `RESULT: off-site copy verified` | ⛔ |
| G2 | Keys stored independently (password manager + sealed media) | decrypt test in G1 used the stored copies, not the laptop folder | ⛔ |
| G3 | Recovery owner + deputy named | `offsite-backup-runbook.md` §2 filled in | ⛔ |
| G4 | Restore from the off-site copy rehearsed | runbook §5 → `VERIFY OK: 15 tables, 48 rows` | ⛔ (simulated only) |
| G5 | Snapshot still current | run `activity-check.sql` (§2); `public_tables_accessed_after` = `[]` and `public_writes_since_reset` = 47 | ✅ as of 2026-10-25 |
| G6 | No live dependency | `deployment-impact.md`: production independent | ✅ |
| G7 | Auth configuration recorded | `suspension-readiness.md` §4 table filled in from Dashboard → Authentication | ⛔ (required before deletion or a pause that may exceed 90 days) |
| G8 | Canonical `pg_dump` | `pgdump-readiness.md` | ⛔ (required before **deletion**; recommended before a pause) |

## 2. Final pre-suspension checks (same day)

```bash
cd C:/Projects/BoviTrack
# a) database still untouched since the snapshot (read-only; aggregates only)
npx supabase db query --linked --project-ref vustkojrbefcbzotgorc -o json \
  -f database-archive/scripts/activity-check.sql
#    expect: public_tables_accessed_after = [], public_writes_since_reset = 47,
#            api_role_calls = 0, auth_last_sign_in = null
#    otherwise: take a fresh snapshot (scripts/export-snapshot.sh), stage + verify it off-site

# b) production still independent
curl -s https://bovi-track.vercel.app/login | grep -c "Mode démo"        # expect 1
curl -s -o /dev/null -w '%{http_code}\n' https://bovi-track.vercel.app/dashboard   # expect 200
```

Also confirm in Vercel → `bovi-track` → Settings → Environment Variables that
no `NEXT_PUBLIC_SUPABASE_*` variable exists for Production (names only), and
note whether Preview has any.

## 3. Supabase dashboard steps (reversible path)

1. **Confirm the plan:** Dashboard → Organization `ozrngrouyimpyivqxkgt` →
   Billing. If it is a paid plan, "Pause project" is not offered — continue.
2. **Pick the destination:** a Free organization (the account has a second
   organization, `xnxetjjjsgoyhfquubnq`; check its plan and that it has room
   for one more active Free project).
3. **Transfer:** Project `Bovitrack` → Settings → General → *Transfer
   project* → choose the Free organization. Read the dialog's eligibility
   checks (size, add-ons, compute size) and what changes (Free-plan limits; no
   paid backups).
4. **Pause:** in the Free organization, Project → Settings → General →
   *Pause project*. Note the date: restorable for **90 days**.
5. Set a reminder for day **75** to decide: restore, or download the backup and
   delete.

Irreversible path (only when G1–G8 are all ✅): Project → Settings → General →
*Delete project*.

## 4. Expected behaviour after suspension

| Surface | Expected |
|---|---|
| `bovi-track.vercel.app` (production) | unchanged — demo mode, mock data, every page 200 |
| Login / logout on production | unchanged (demo message; logout redirects to `/login`) |
| Preview deployments with Supabase variables (if any) | login/herd calls to the paused project fail; demo fallback may not apply to the middleware |
| Supabase API / Auth endpoints | unavailable while paused |
| Existing Auth user | cannot sign in (has never signed in) |
| Data | retained by Supabase while paused (≤ 90 days); independently preserved in the encrypted archive |

## 5. Monitoring and smoke tests (right after, then after 24 h)

```bash
U=https://bovi-track.vercel.app
for p in / /login /dashboard /herd /herd/SN-BOV-2026-0002 /alerts; do
  printf '%-26s %s\n' "$p" "$(curl -s -o /dev/null -w '%{http_code}' $U$p)"; done   # all 200
curl -s -o /dev/null -w '%{redirect_url}\n' $U/logout                               # …/login
curl -s $U/login | grep -c "Mode démo"                                              # 1
```

Vercel → Deployments: production still `d5d798e` (or later `main`), no new
errors in Runtime Logs.

## 6. Reactivation and rollback

| Situation | Steps |
|---|---|
| Paused in a Free org, ≤ 90 days | Dashboard → project → *Restore project* (minutes). Optionally transfer back to the paid organization. Re-run `activity-check.sql` and the archive's `rehearse.sh` against a fresh snapshot if data matters. |
| Paused > 90 days | Dashboard offers a **download** of the last logical backup: restore it into a new project or plain PostgreSQL. Or restore the encrypted archive (below). |
| Project deleted, or Supabase unavailable | Restore the archive onto PostgreSQL ≥ 17: `restore/README.md` **Path A** (compat shim → migrations → decrypt → load → `03_verify.sql`). For a new Supabase project, apply the migrations and load data with `pg_restore` from the canonical dump (the snapshot loader needs ownership of `auth.users`, which a Supabase project does not grant). Re-create the Auth configuration from the record made in G7. |
| Something unexpectedly depended on it | Restore the project (row 1) — production itself needs no change. |

## 7. Billing verification

1. Before: Dashboard → Organization → Usage → Compute — note BoviTrack's
   compute hours and instance size (expected Micro).
2. 24–48 h after: BoviTrack shows **no compute hours** (paused projects do not
   count toward compute) and appears under the Free organization.
3. Next invoice: the paid organization's compute line is lower by one Micro
   instance (≈ $10/month, billed hourly).
4. If the line does not drop, open the Usage breakdown; the spend cap does not
   cover compute, so do not rely on it.
