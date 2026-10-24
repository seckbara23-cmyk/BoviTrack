#!/usr/bin/env bash
# SUPABASE-ARCHIVE-01 — canonical pg_dump export (needs the database password).
#
# STATUS: not run against the hosted project in SUPABASE-ARCHIVE-01. The
# database password is not available on this machine, and resetting it would
# modify the hosted project. Run this once you have the Session pooler
# connection details (Dashboard → Connect → Session pooler, port 5432; the
# direct host db.<ref>.supabase.co is IPv6-only).
#
# Safe by construction:
#   * every dump is a single consistent snapshot (pg_dump uses REPEATABLE READ,
#     READ ONLY); nothing is written to the source database;
#   * every output is streamed straight into gpg — no plaintext dump touches disk;
#   * the password is read from the terminal (or a pre-set PGPASSWORD) and only
#     lives in this process's environment.
#
# Usage:
#   scripts/export-pgdump.sh --host <pooler host> --user postgres.<ref> \
#     --app-key <file> --auth-key <file> [--port 5432] [--dbname postgres] \
#     [--out <run dir>] [--pg-bin <dir>] [--gnupghome <dir>]
#
# Produces (default: backups/<UTC run id>-pgdump/, git-ignored):
#   schema-public.sql.gpg      app key   --schema-only --schema=public (plain SQL)
#   data-public.dump.gpg       app key   -Fc --data-only --schema=public
#   data-public-auth.dump.gpg  auth key  -Fc --data-only public.* + auth.users +
#                                        auth.identities, ONE snapshot
#   full-database.dump.gpg     auth key  -Fc of the whole database, for restoring
#                                        into a Supabase-compatible target
#   roles.sql.gpg              app key   pg_dumpall --roles-only --no-role-passwords
#   SHA256SUMS, manifest.txt
#
# pg_dump must be >= the server major version (hosted: 17). Restore with the
# same or newer pg_restore/psql (plain SQL from pg_dump >= 17.6/18 contains
# \restrict lines that older psql rejects).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

HOST="" PORT=5432 DBUSER="" DBNAME=postgres APP_KEY="" AUTH_KEY="" OUT="" PG_BIN="" GNUPGHOME_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --user) DBUSER="$2"; shift 2 ;;
    --dbname) DBNAME="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --pg-bin) PG_BIN="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$HOST" ] && [ -n "$DBUSER" ] && [ -n "$APP_KEY" ] && [ -n "$AUTH_KEY" ] || { sed -n '2,38p' "$0"; exit 2; }

if [ -z "$PG_BIN" ]; then
  if command -v pg_dump >/dev/null 2>&1; then PG_BIN="$(dirname "$(command -v pg_dump)")"
  else PG_BIN="/c/Program Files/PostgreSQL/18/bin"; fi
fi
PG_DUMP="$PG_BIN/pg_dump" PG_DUMPALL="$PG_BIN/pg_dumpall"

if [ -z "$OUT" ]; then
  RUN="$(date -u +%Y-%m-%dT%H%M%SZ)-pgdump"
  OUT="$ARCHIVE/backups/$RUN"
  if ! git -C "$REPO" check-ignore -q "database-archive/backups/$RUN/x.gpg"; then
    echo "refusing: $OUT would not be git-ignored" >&2; exit 1
  fi
fi
umask 077
mkdir -p "$OUT"

GPG=(gpg --batch --quiet --yes --no-symkey-cache --pinentry-mode loopback
     --symmetric --cipher-algo AES256 --s2k-mode 3 --s2k-digest-algo SHA512
     --s2k-count 65011712 --compress-algo ZLIB)
[ -n "$GNUPGHOME_ARG" ] && GPG=(gpg --homedir "$GNUPGHOME_ARG" "${GPG[@]:1}")

if [ -z "${PGPASSWORD:-}" ]; then
  read -rsp "Password for $DBUSER@$HOST: " PGPASSWORD; echo
fi
export PGPASSWORD PGHOST="$HOST" PGPORT="$PORT" PGUSER="$DBUSER" PGDATABASE="$DBNAME"
export PGCLIENTENCODING=UTF8 PGTZ=UTC
case "$HOST" in
  127.0.0.1|localhost) export PGSSLMODE="${PGSSLMODE:-prefer}" ;;
  *) export PGSSLMODE="${PGSSLMODE:-require}" ;;
esac

seal() {  # seal <key file> <output name> -- <command...>
  local key="$1" name="$2"; shift 3
  "$@" | "${GPG[@]}" --passphrase-file "$key" --output "$OUT/$name"
  echo "  $name  $(wc -c < "$OUT/$name") bytes"
}

echo "== pg_dump $("$PG_DUMP" --version | awk '{print $3}') → $HOST:$PORT/$DBNAME"
seal "$APP_KEY"  schema-public.sql.gpg     -- "$PG_DUMP" --schema-only --schema=public --no-owner
seal "$APP_KEY"  data-public.dump.gpg      -- "$PG_DUMP" -Fc --data-only --schema=public
seal "$AUTH_KEY" data-public-auth.dump.gpg -- "$PG_DUMP" -Fc --data-only \
  --table='public.*' --table=auth.users --table=auth.identities
seal "$AUTH_KEY" full-database.dump.gpg    -- "$PG_DUMP" -Fc
if ! seal "$APP_KEY" roles.sql.gpg -- "$PG_DUMPALL" --roles-only --no-role-passwords; then
  echo "  (roles dump failed — non-fatal: BoviTrack defines no custom roles)" >&2
  rm -f "$OUT/roles.sql.gpg"
fi

(cd "$OUT" && sha256sum -- *.gpg > SHA256SUMS)
{
  echo "archive:   SUPABASE-ARCHIVE-01 (pg_dump path)"
  echo "taken_at:  $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "source:    $DBUSER@$HOST:$PORT/$DBNAME"
  echo "pg_dump:   $("$PG_DUMP" --version)"
  echo "keys:      app key → schema-public, data-public, roles; auth key → data-public-auth, full-database"
} > "$OUT/manifest.txt"
echo "done: $OUT"
cat "$OUT/SHA256SUMS"
