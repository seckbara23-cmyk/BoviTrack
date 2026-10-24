# Restore rehearsal: 2026-10-24

**Result: PASS.** The archive restores onto plain PostgreSQL without any
Supabase service: zero schema drift, every row identical to the hosted source,
and RLS farm isolation intact.

## Environment

- Throwaway cluster created by `restore/rehearse.sh`: PostgreSQL **18.6**
  (Windows x64), `initdb --no-locale -E UTF8`, listening on `127.0.0.1:55432`
  only with a random scram-sha-256 password. **Deleted after the run** (port
  confirmed closed). The PostgreSQL service already on this machine
  (`localhost:5432`) was not touched.
- Input: run `backups/2026-10-24T172145Z` (both bundles) and the hosted
  inventory `schema/hosted-inventory-2026-10-24.json`.
- Plaintext was never written to disk: bundles were decrypted by `gpg`
  straight into `psql` `COPY … FROM STDIN`, and the staging schema was dropped
  after verification.

## Steps and results

| Step | Result |
|---|---|
| 1. `sha256sum -c SHA256SUMS` | both bundles OK |
| 2. Throwaway cluster | created |
| 3. `00_supabase_compat.sql`, `01_supabase_default_grants.sql`, then **original** `0001_init.sql`, `0002_rls.sql` | applied cleanly (`pgcrypto` already present → skipped, as on Supabase) |
| 4. Drift check (hosted vs fresh schema) | **no drift** in all 12 sections: tables 13/13, columns 91/91, constraints 31/31, indexes 29/29, enums 12/12, views 0/0, functions 5/5, triggers 1/1, policies 26/26, table grants 52/52, function grants 25/25, schema grants 6/6. Note: CRLF vs LF inside the 5 hosted function bodies only. |
| 5. Decrypt bundles | app-data and auth-restricted staged |
| 6. Load (`02_load_snapshot.sql`) | 15 tables loaded in FK order with all constraints enforced |
| 6b. Verify (`03_verify.sql`) | **VERIFY OK: 15 tables, 48 rows identical to source.** Bundle md5 = server md5 for every table, 0 missing, 0 extra, 0 unvalidated constraints |
| 7. RLS smoke test (`04`, rolled back) | checks 1–9 pass; 10–12 reproduce findings F2 and F1 |
| 7b. Structure + exact row counts vs hosted | **no drift, counts identical** |

### Row-level verification

| Table | Source | Restored | md5 ok | Missing | Extra |
|---|---:|---:|:-:|---:|---:|
| auth.identities | 1 | 1 | ✔ | 0 | 0 |
| auth.users | 1 | 1 | ✔ | 0 | 0 |
| public.animals | 10 | 10 | ✔ | 0 | 0 |
| public.birth_records | 2 | 2 | ✔ | 0 | 0 |
| public.breeding_records | 3 | 3 | ✔ | 0 | 0 |
| public.care_records | 5 | 5 | ✔ | 0 | 0 |
| public.documents | 0 | 0 | ✔ | 0 | 0 |
| public.farms | 1 | 1 | ✔ | 0 | 0 |
| public.locations | 5 | 5 | ✔ | 0 | 0 |
| public.owners | 5 | 5 | ✔ | 0 | 0 |
| public.profiles | 1 | 1 | ✔ | 0 | 0 |
| public.sale_records | 3 | 3 | ✔ | 0 | 0 |
| public.security_alerts | 3 | 3 | ✔ | 0 | 0 |
| public.timeline_events | 3 | 3 | ✔ | 0 | 0 |
| public.vaccine_records | 5 | 5 | ✔ | 0 | 0 |

### RLS smoke test

| # | Check | Expected | Actual | Verdict |
|---|---|---|---|---|
| 1 | anon (no JWT) sees animals | 0 | 0 | pass |
| 2 | super_admin sees all animals | 10 | 10 | pass |
| 3 | farm-1 viewer sees farm-1 animals | 10 | 10 | pass |
| 4 | user without farm sees animals | 0 | 0 | pass |
| 5 | user without farm sees farms | 0 | 0 | pass |
| 6 | farm-1 viewer cannot see farm 2 | 10 | 10 | pass |
| 7 | farm-2 user sees only farm 2 | 1 | 1 | pass |
| 8 | farm-1 viewer writes into farm 2 | blocked | blocked | pass |
| 9 | farm-2 user sees farm-1 care (child table) | 0 | 0 | pass |
| 10 | viewer writes animals in own farm | blocked | allowed | FINDING (F2) |
| 11 | viewer promotes own profile to super_admin | blocked | allowed | FINDING (F1) |
| 12 | after self-promotion, viewer sees | 10 | 12 | FINDING (F1) |

## Supplementary: `pg_dump` paths (local copy, not the hosted database)

`scripts/export-pgdump.sh` was run against a throwaway cluster rebuilt from the
snapshot, to prove the script and restore paths B and C mechanically.

| Check | Result |
|---|---|
| 5 encrypted artifacts produced, `sha256sum -c` | OK |
| Path B: migrations + `pg_restore --data-only` of `data-public-auth.dump` | VERIFY OK: 15 tables, 48 rows identical |
| Path C: `schema-public.sql` DDL + `05_after_pgdump_schema.sql`, then data | no drift; VERIFY OK: 48 rows identical |
| `full-database.dump` readable by `pg_restore --list` | 15 TABLE DATA entries |

## Negative controls

- Changing one policy and one count in a copy of the inventory → the comparer
  reports `DRIFT` and exits with 1.
- Changing one byte of a copied bundle → `sha256sum` FAILED and decrypt FAIL
  (MDC).
- Decrypting with the other bundle's key → rejected.
