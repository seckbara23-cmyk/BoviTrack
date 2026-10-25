#!/usr/bin/env bash
# SUPABASE-COST-03A — independent restore verification of a canonical pg_dump run.
#
# Takes a run produced by scripts/export-pgdump.sh (backups/<UTC>-pgdump/) and
# proves it restores, in a THROWAWAY cluster (127.0.0.1 only, random password,
# deleted on exit):
#
#   1. SHA256SUMS of the pg_dump run (and of the reference snapshot run)
#   2. path B: compat shim + ORIGINAL migrations, then pg_restore of
#      data-public-auth.dump — every row compared with the reference logical
#      snapshot (restore/03_verify.sql) and exact counts vs the hosted inventory
#   3. path C: schema rebuilt from the dump's own DDL (schema-public.sql +
#      05_after_pgdump_schema.sql) — drift-checked against the hosted inventory
#   4. full-database.dump and roles.sql (if present) decrypt and are readable
#
# The row comparison is valid when the hosted data has not changed since the
# reference snapshot (check with scripts/reconcile.sql); otherwise take a fresh
# snapshot first and pass it as --snapshot-run.
#
# Usage:
#   restore/rehearse-pgdump.sh --pgdump-run <backups/RUN-pgdump> \
#     --snapshot-run <backups/RUN> --hosted-inventory <inventory json> \
#     --app-key <file> --auth-key <file> --work <private empty dir> \
#     [--port 55436] [--pg-bin <dir>] [--gnupghome <dir>] [--keep]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

DUMP="" SNAP="" INV="" APP_KEY="" AUTH_KEY="" WORK="" PORT=55436 PG_BIN="" GNUPGHOME_ARG="" KEEP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --pgdump-run) DUMP="$2"; shift 2 ;;
    --snapshot-run) SNAP="$2"; shift 2 ;;
    --hosted-inventory) INV="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --work) WORK="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --pg-bin) PG_BIN="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    --keep) KEEP=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$DUMP" ] && [ -n "$SNAP" ] && [ -n "$INV" ] && [ -n "$APP_KEY" ] && [ -n "$AUTH_KEY" ] && [ -n "$WORK" ] \
  || { sed -n '2,25p' "$0"; exit 2; }

if [ -z "$PG_BIN" ]; then
  if command -v initdb >/dev/null 2>&1; then PG_BIN="$(dirname "$(command -v initdb)")"
  else PG_BIN="/c/Program Files/PostgreSQL/18/bin"; fi
fi
GPG=(gpg --batch --quiet --no-symkey-cache --pinentry-mode loopback)
[ -n "$GNUPGHOME_ARG" ] && GPG+=(--homedir "$GNUPGHOME_ARG")
step() { printf '\n=== %s\n' "$*"; }
fail=0

step "1. checksums"
(cd "$DUMP" && sha256sum -c SHA256SUMS)
(cd "$SNAP" && sha256sum -c SHA256SUMS)
for f in schema-public.sql.gpg data-public-auth.dump.gpg; do
  [ -f "$DUMP/$f" ] || { echo "missing required artifact: $f" >&2; exit 1; }
done

step "2. throwaway cluster (127.0.0.1:$PORT)"
"$PG_BIN/pg_isready" -q -h 127.0.0.1 -p "$PORT" && { echo "refusing: port $PORT in use" >&2; exit 1; }
mkdir -p "$WORK"; chmod 700 "$WORK"
CLUSTER="$WORK/cluster"; [ -e "$CLUSTER" ] && { echo "refusing: $CLUSTER exists" >&2; exit 1; }
PWFILE="$WORK/superuser.pw"; head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$PWFILE"
cleanup() {
  set +e
  [ -f "$CLUSTER/postmaster.pid" ] && "$PG_BIN/pg_ctl" -D "$CLUSTER" -m fast -w stop >/dev/null
  [ "$KEEP" -eq 0 ] && { rm -rf "$CLUSTER" "$WORK/postgres.log"; echo "(throwaway cluster deleted)"; }
  rm -f "$PWFILE"
}
trap cleanup EXIT
"$PG_BIN/initdb" -D "$CLUSTER" -U postgres -A scram-sha-256 --pwfile="$PWFILE" -E UTF8 --no-locale >/dev/null
"$PG_BIN/pg_ctl" -D "$CLUSTER" -l "$WORK/postgres.log" -w \
  -o "-p $PORT -c listen_addresses=127.0.0.1 -c timezone=UTC" start >/dev/null
export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres PGPASSWORD="$(cat "$PWFILE")" PGCLIENTENCODING=UTF8 PGTZ=UTC
PSQL=("$PG_BIN/psql" -X -q -v ON_ERROR_STOP=1)
COPY_SQL="copy archive_restore.bundle (doc) from stdin with (format csv, quote e'\x01', delimiter e'\x02')"

step "3. path B — migrations + pg_restore of data-public-auth.dump"
"$PG_BIN/createdb" restore_b
"${PSQL[@]}" -d restore_b -1 -f "$HERE/00_supabase_compat.sql" >/dev/null
"${PSQL[@]}" -d restore_b -1 -f "$HERE/01_supabase_default_grants.sql"
for m in "$REPO"/supabase/migrations/*.sql; do "${PSQL[@]}" -d restore_b -1 -f "$m" >/dev/null 2>&1; done
"${GPG[@]}" --passphrase-file "$AUTH_KEY" -d "$DUMP/data-public-auth.dump.gpg" \
  | "$PG_BIN/pg_restore" --data-only --disable-triggers --exit-on-error -d restore_b
"${PSQL[@]}" -d restore_b -c "create schema archive_restore; create table archive_restore.bundle (doc jsonb not null);"
"${GPG[@]}" --passphrase-file "$APP_KEY"  -d "$SNAP/app-data.json.gpg"        | "${PSQL[@]}" -d restore_b -c "$COPY_SQL"
"${GPG[@]}" --passphrase-file "$AUTH_KEY" -d "$SNAP/auth-restricted.json.gpg" | "${PSQL[@]}" -d restore_b -c "$COPY_SQL"
"${PSQL[@]}" -d restore_b -f "$HERE/03_verify.sql" 2>&1 | grep -E "VERIFY (OK|FAILED)" | sed 's/^psql:[^ ]* //' || fail=1
"${PSQL[@]}" -d restore_b -c "drop schema archive_restore cascade;" >/dev/null 2>&1
"${PSQL[@]}" -d restore_b -A -t -1 -f "$ARCHIVE/scripts/inventory.sql" > "$WORK/b-inventory.json"
node "$ARCHIVE/scripts/compare-inventory.mjs" "$INV" "$WORK/b-inventory.json" --counts | grep -E "^(DRIFT|RESULT)|^ +[~+-]" || fail=1

step "4. path C — schema from the dump's own DDL"
"$PG_BIN/createdb" restore_c
"${PSQL[@]}" -d restore_c -c "drop schema public cascade;"
"${PSQL[@]}" -d restore_c -1 -f "$HERE/00_supabase_compat.sql" >/dev/null
"${GPG[@]}" --passphrase-file "$APP_KEY" -d "$DUMP/schema-public.sql.gpg" | "${PSQL[@]}" -d restore_c >/dev/null
"${PSQL[@]}" -d restore_c -1 -f "$HERE/05_after_pgdump_schema.sql" 2>&1 | grep -v "does not exist, skipping" || true
"${PSQL[@]}" -d restore_c -A -t -1 -f "$ARCHIVE/scripts/inventory.sql" > "$WORK/c-inventory.json"
node "$ARCHIVE/scripts/compare-inventory.mjs" "$INV" "$WORK/c-inventory.json" | grep -E "^(DRIFT|RESULT)|^ +[~+-]" || fail=1

step "5. optional artifacts"
if [ -f "$DUMP/full-database.dump.gpg" ]; then
  n=$("${GPG[@]}" --passphrase-file "$AUTH_KEY" -d "$DUMP/full-database.dump.gpg" | "$PG_BIN/pg_restore" --list | grep -c "TABLE DATA" || true)
  echo "  full-database.dump readable: $n TABLE DATA entries"; [ "$n" -gt 0 ] || fail=1
else echo "  full-database.dump: not present (allowed: best effort)"; fi
if [ -f "$DUMP/roles.sql.gpg" ]; then
  "${GPG[@]}" --passphrase-file "$APP_KEY" -d "$DUMP/roles.sql.gpg" | grep -qi "create role" \
    && echo "  roles.sql readable" || { echo "  roles.sql unreadable"; fail=1; }
else echo "  roles.sql: not present (allowed: best effort)"; fi

step "pgdump rehearsal finished"
if [ "$fail" -eq 0 ]; then echo "RESULT: canonical dump independently restored and verified"
else echo "RESULT: FAILED"; exit 1; fi
