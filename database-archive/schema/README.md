# Schema

The application schema is defined by `supabase/migrations/0001_init.sql`
(tables, enums, indexes, signup trigger) and `0002_rls.sql` (RLS helpers and
policies). The restore rehearsal confirmed that applying these two files
unchanged reproduces the hosted `public` schema exactly. So the migrations
**are** the schema of record, and there's no separate DDL copy to keep in sync.

| File | What it is |
|---|---|
| `hosted-inventory-2026-10-24.json` | Catalog inventory of the hosted database ([`scripts/inventory.sql`](../scripts/inventory.sql)): server, extensions, schemas, every table with exact row counts, columns, constraints, indexes, enums, functions (full definitions), triggers, RLS policies, grants, default privileges, publications, roles. Metadata and counts only. **Reference input for drift checks.** |
| `hosted-services-2026-10-24.json` | Aggregates for Supabase-managed services ([`scripts/hosted-services.sql`](../scripts/hosted-services.sql)): auth counts and column layouts, storage buckets, realtime, vault, optional extensions. No personal data. |

## Shape of the `public` schema (hosted, 2026-10-24)

13 tables · 91 columns · 31 constraints (13 PK, 17 FK, 1 unique) · 29 indexes ·
12 enums · 5 functions · 1 trigger · 26 RLS policies · 0 views · 0 sequences
(all keys are `uuid` with `gen_random_uuid()`).

```
auth.users ──1:1── profiles ──n:1── farms ──1:n── owners
                                      │             │
                                      └──1:n── animals ──n:1┘
                                                 │
     locations · security_alerts · care_records · vaccine_records
     sale_records · documents · timeline_events        (animal_id)
     breeding_records (female_animal_id, male_animal_id)
     birth_records    (mother_animal_id, calf_animal_id, breeding_id)
```

Delete behavior: removing a farm cascades to its owners, animals and every
animal record. `profiles.farm_id` is set to null instead, and removing an
`auth.users` row cascades to its profile.

## Checking drift again later

```bash
# hosted (read-only) → JSON
supabase db query --linked --project-ref vustkojrbefcbzotgorc -o json \
  -f database-archive/scripts/inventory.sql > /tmp/inv.json
node database-archive/scripts/compare-inventory.mjs \
  database-archive/schema/hosted-inventory-2026-10-24.json /tmp/inv.json --counts
```

`compare-inventory.mjs` ignores Supabase-managed sections and treats CRLF vs LF
inside function bodies as a note, not drift. The hosted bodies contain CRLF
because they were pasted into the SQL editor from Windows.
