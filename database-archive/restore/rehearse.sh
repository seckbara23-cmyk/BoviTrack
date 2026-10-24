#!/usr/bin/env bash
# SUPABASE-ARCHIVE-01 — restore rehearsal into a THROWAWAY PostgreSQL cluster.
#
# Never touches an existing server: it initialises a brand-new cluster inside
# a private work directory, listens on 127.0.0.1 only (default port 55432)
# with a random scram password, and deletes the cluster on exit.
#
#   1. verify bundle checksums (SHA256SUMS)
#   2. initdb + start the throwaway cluster
#   3. apply 00_supabase_compat.sql, 01_supabase_default_grants.sql and the
#      ORIGINAL supabase/migrations/*.sql, unchanged
#   4. drift check: restored structure vs the hosted inventory
#   5. decrypt bundles straight into psql (plaintext never written to disk)
#   6. load (02), verify every row against the source hashes (03)
#   7. RLS smoke test (04, rolled back), row-count comparison, teardown
#
# Usage:
#   restore/rehearse.sh --run <backups/RUN> --work <private empty dir> \
#     --app-key <passphrase file> [--auth-key <passphrase file>] \
#     [--hosted-inventory <inventory json>] [--port 55432] \
#     [--pg-bin <dir with initdb/psql>] [--gnupghome <dir>] [--keep]
#
# Without --auth-key only the app-data bundle is restored (auth.users stays
# empty, so profiles cannot load: use --auth-key for a full rehearsal).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

RUN="" WORK="" APP_KEY="" AUTH_KEY="" HOSTED_INV="" PORT=55432 PG_BIN="" GNUPGHOME_ARG="" KEEP=0
while [ $# -gt 0 ]; do
  case "$1" in
    --run) RUN="$2"; shift 2 ;;
    --work) WORK="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --hosted-inventory) HOSTED_INV="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --pg-bin) PG_BIN="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    --keep) KEEP=1; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$RUN" ] && [ -n "$WORK" ] && [ -n "$APP_KEY" ] || { sed -n '2,30p' "$0"; exit 2; }

if [ -z "$PG_BIN" ]; then
  if command -v initdb >/dev/null 2>&1; then PG_BIN="$(dirname "$(command -v initdb)")"
  else PG_BIN="/c/Program Files/PostgreSQL/18/bin"; fi
fi
INITDB="$PG_BIN/initdb" PG_CTL="$PG_BIN/pg_ctl" PSQL_BIN="$PG_BIN/psql"
CREATEDB="$PG_BIN/createdb" PG_ISREADY="$PG_BIN/pg_isready"

GPG=(gpg --batch --quiet --no-symkey-cache --pinentry-mode loopback)
[ -n "$GNUPGHOME_ARG" ] && GPG+=(--homedir "$GNUPGHOME_ARG")

step() { printf '\n=== %s\n' "$*"; }

# --- 1. checksums -----------------------------------------------------------
step "1. verify bundle checksums"
(cd "$RUN" && sha256sum -c SHA256SUMS)

# --- 2. throwaway cluster ----------------------------------------------------
step "2. initialise throwaway cluster (127.0.0.1:$PORT)"
if "$PG_ISREADY" -q -h 127.0.0.1 -p "$PORT"; then
  echo "refusing: something already listens on 127.0.0.1:$PORT — pick another --port" >&2
  exit 1
fi
mkdir -p "$WORK"; chmod 700 "$WORK"
CLUSTER="$WORK/cluster"
[ -e "$CLUSTER" ] && { echo "refusing: $CLUSTER already exists" >&2; exit 1; }
PWFILE="$WORK/superuser.pw"
head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' > "$PWFILE"

cleanup() {
  set +e
  if [ -f "$CLUSTER/postmaster.pid" ]; then "$PG_CTL" -D "$CLUSTER" -m fast -w stop >/dev/null; fi
  if [ "$KEEP" -eq 0 ]; then rm -rf "$CLUSTER" "$WORK/postgres.log"; echo "(throwaway cluster deleted)"; fi
  rm -f "$PWFILE"
}
trap cleanup EXIT

"$INITDB" -D "$CLUSTER" -U postgres -A scram-sha-256 --pwfile="$PWFILE" -E UTF8 --no-locale >/dev/null
"$PG_CTL" -D "$CLUSTER" -l "$WORK/postgres.log" -w \
  -o "-p $PORT -c listen_addresses=127.0.0.1 -c timezone=UTC" start >/dev/null
"$PSQL_BIN" --version

export PGHOST=127.0.0.1 PGPORT="$PORT" PGUSER=postgres PGPASSWORD="$(cat "$PWFILE")"
export PGCLIENTENCODING=UTF8 PGTZ=UTC
"$CREATEDB" bovitrack_restore
export PGDATABASE=bovitrack_restore
PSQL=("$PSQL_BIN" -X -q -v ON_ERROR_STOP=1)

# --- 3. schema ---------------------------------------------------------------
step "3. apply compat shim + original migrations"
"${PSQL[@]}" -1 -f "$HERE/00_supabase_compat.sql"
"${PSQL[@]}" -1 -f "$HERE/01_supabase_default_grants.sql"
for m in "$REPO"/supabase/migrations/*.sql; do
  echo "  applying $(basename "$m")"
  "${PSQL[@]}" -1 -f "$m"
done

# --- 4. drift ----------------------------------------------------------------
DRIFT_RC=0
if [ -n "$HOSTED_INV" ]; then
  step "4. drift check (hosted inventory vs freshly migrated schema)"
  "${PSQL[@]}" -A -t -1 -f "$ARCHIVE/scripts/inventory.sql" > "$WORK/restored-inventory.schema.json"
  node "$ARCHIVE/scripts/compare-inventory.mjs" "$HOSTED_INV" "$WORK/restored-inventory.schema.json" || DRIFT_RC=$?
else
  step "4. drift check skipped (no --hosted-inventory)"
fi

# --- 5. decrypt + stage --------------------------------------------------------
step "5. decrypt bundles into staging (streamed)"
"${PSQL[@]}" -c "create schema archive_restore; create table archive_restore.bundle (doc jsonb not null);"
COPY_SQL="copy archive_restore.bundle (doc) from stdin with (format csv, quote e'\x01', delimiter e'\x02')"
"${GPG[@]}" --passphrase-file "$APP_KEY" --decrypt "$RUN/app-data.json.gpg" | "${PSQL[@]}" -c "$COPY_SQL"
echo "  app-data staged"
if [ -n "$AUTH_KEY" ]; then
  "${GPG[@]}" --passphrase-file "$AUTH_KEY" --decrypt "$RUN/auth-restricted.json.gpg" | "${PSQL[@]}" -c "$COPY_SQL"
  echo "  auth-restricted staged"
fi

# --- 6. load + verify --------------------------------------------------------
step "6. load snapshot"
"${PSQL[@]}" -f "$HERE/02_load_snapshot.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'
step "6b. verify every row against source hashes"
"${PSQL[@]}" -f "$HERE/03_verify.sql" 2>&1 | sed 's/^psql:[^:]*:[0-9]*: //'

# --- 7. RLS + counts ---------------------------------------------------------
step "7. RLS smoke test (rolled back)"
"${PSQL[@]}" -f "$HERE/04_rls_smoke_test.sql"

"${PSQL[@]}" -c "drop schema archive_restore cascade;"   # staged plaintext

COUNT_RC=0
if [ -n "$HOSTED_INV" ]; then
  step "7b. structure + row counts after load (hosted vs restored)"
  "${PSQL[@]}" -A -t -1 -f "$ARCHIVE/scripts/inventory.sql" > "$WORK/restored-inventory.data.json"
  node "$ARCHIVE/scripts/compare-inventory.mjs" "$HOSTED_INV" "$WORK/restored-inventory.data.json" --counts || COUNT_RC=$?
fi

step "rehearsal finished: drift_rc=$DRIFT_RC counts_rc=$COUNT_RC"
[ "$DRIFT_RC" -eq 0 ] && [ "$COUNT_RC" -eq 0 ]
