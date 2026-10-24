# Migrations (preserved copies)

Byte-identical copies of the repository's migration history, kept here so the
archive is self-contained. **The originals in `supabase/migrations/` and
`supabase/seed.sql` were not moved or modified.**

| File | SHA-256 |
|---|---|
| `0001_init.sql` | `eddd8c6a644dd2beae4a7d5f1329b01afec921b3a610d6d9cb633619c5581a46` |
| `0002_rls.sql` | `d6782919afd3cb9dadf5505b6de6e682676c8c7bf48e93669600e16c8bb5999a` |
| `seed.sql` | `8fa9f91caafb517b433720d4f5dfb521c43ba148ca26667d6528c0aa60ee9a4b` |

`scripts/verify-archive.sh` checks these hashes and compares each copy with the
original (ignoring CRLF, since a Windows checkout of `supabase/` may convert
line endings).

## Hosted migration history

- The hosted project has **no `supabase_migrations` schema**, so there's no
  recorded migration history. The migrations were applied by pasting them into
  the Supabase SQL editor. The CRLF line endings stored inside the hosted
  function bodies confirm this.
- The hosted structure nonetheless **matches these files exactly**: tables,
  columns, constraints, indexes, enums, functions, triggers, policies and
  grants, verified by the restore rehearsal's drift check.
- The hosted data matches `seed.sql` in counts (45 business rows), plus 1
  profile created by the signup trigger, for 46 `public` rows in total.
  `seed.sql` is demo data. The real archive of the data is the encrypted
  snapshot in `backups/`.

If the project ever applies migrations through tooling, start a migration
ledger first (for example `supabase migration repair --status applied 0001 0002`
on a fresh link, or the equivalent in whatever tool replaces it), so history
and reality stay aligned.
