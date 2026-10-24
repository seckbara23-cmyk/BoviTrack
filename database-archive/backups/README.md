# Backups (encrypted, git-ignored)

Everything in this folder except this README is excluded from git. Each run
lives in its own UTC-timestamped folder.

## Run `2026-10-24T172145Z` (logical snapshot)

Snapshot taken at `2026-10-24T17:21:46.825343Z` from `vustkojrbefcbzotgorc`
(PostgreSQL 17.6) in a single `REPEATABLE READ, READ ONLY` transaction.

| File | Contents | Key | Bytes | SHA-256 |
|---|---|---|---|---|
| `app-data.json.gpg` | every row of the 13 `public` tables (46 rows). **Contains personal data**: `profiles.email`, owner names and phone numbers | app-data | 2857 | `e17e11806acb4ec7250e1b4187c5958e7239d6283aa4080d9ffd17d0bea7433b` |
| `auth-restricted.json.gpg` | `auth.users` (1) and `auth.identities` (1), including the bcrypt password hash. **Restricted** | auth-restricted | 919 | `0fa8dca76f0bb6cc0581d37d404cb66c4bdcfb7a169281bb249c7ca53c707088` |
| `manifest.json` | per-table counts and row-set md5s computed on the source server, bundle checksums, key names (private: the md5s cover auth rows) | — | — | — |
| `SHA256SUMS` | `sha256sum -c` list for the two bundles | — | — | — |

Per-table row counts and the app-data row-set hashes are listed in
[reports/inventory-report.md](../reports/inventory-report.md).

## Run `2026-10-24T174450Z` (repeatability check)

Produced by [scripts/export-snapshot.sh](../scripts/export-snapshot.sh) at
`2026-10-24T17:44:55Z`. **All 15 tables have the same counts and server-side
row-set md5s as run `172145Z`**: the data hadn't changed and the export is
deterministic. The ciphertext differs because of random S2K salts.

| File | Bytes | SHA-256 |
|---|---|---|
| `app-data.json.gpg` | 2860 | `92dca6896e9b04562a13576e82f2b5193080a5b4905613a2ce9b836e09306c8c` |
| `auth-restricted.json.gpg` | 923 | `e6bebeae9536f31caa1216f5c309fb959005366c07c23407f8b1cb7291b7d05a` |

Both runs use the same keys and are interchangeable. Run `172145Z` is the one
rehearsed.

## Encryption

- **Format:** OpenPGP (RFC 4880) symmetric, GnuPG 2.4.9. That means SKESK v4
  with AES-256, iterated+salted S2K using SHA-512 (65,011,712 iterations),
  and SEIPD v1 with MDC integrity protection, ZLIB-compressed. It's readable
  by any OpenPGP implementation (GnuPG, Sequoia, OpenPGP.js) with no
  vendor-specific AEAD packets.
- **Two independent random passphrases** (48 random bytes each, base64), one
  per bundle, so the app-data custodian can't open the auth records.
- **Each bundle was decrypted again and compared byte-for-byte** before its
  plaintext was overwritten with random bytes and deleted.

## Keys (stored separately, never in git)

```
%USERPROFILE%\.bovitrack-archive\keys\
  SUPABASE-ARCHIVE-01.app-data.passphrase
  SUPABASE-ARCHIVE-01.auth-restricted.passphrase
```

The folder's ACL is reduced to the owning Windows account, with inheritance
removed.

**Do this now:** copy both passphrases into a password manager or onto offline
media, and copy this backups folder to an off-site location, kept apart from
the keys. Without the passphrases the bundles cannot be recovered. With the
bundles and keys on the same disk, a single disk loss takes out both.

## Decrypt by hand (streaming, no plaintext file)

```bash
gpg --batch --pinentry-mode loopback --no-symkey-cache \
    --passphrase-file ~/.bovitrack-archive/keys/SUPABASE-ARCHIVE-01.app-data.passphrase \
    --decrypt app-data.json.gpg | <consumer>
```

Bundle format: one line of JSON,
`{ "meta": {...}, "tables": { "<schema>.<table>": { "count", "md5", "rows": [...] } } }`.
Load it with [restore/02_load_snapshot.sql](../restore/02_load_snapshot.sql).

## Pending: canonical `pg_dump` run

[scripts/export-pgdump.sh](../scripts/export-pgdump.sh) writes a
`<run>-pgdump/` folder (schema SQL, data dumps, full database dump, roles)
using the same key split. It needs the database password, which wasn't
available. See [reports/final-report.md](../reports/final-report.md).
