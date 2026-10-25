#!/usr/bin/env bash
# SUPABASE-ARCHIVE-01 / COST-02A — canonical pg_dump export (needs the DB password).
#
# STATUS: not yet run against the hosted project — the database password is not
# available on the development machine, and resetting it would modify the
# hosted project. See database-archive/reports/pgdump-readiness.md for how the
# owner obtains the connection details securely.
#
# Connect through the Supabase **Session pooler** (Dashboard → Connect →
# Session pooler: host aws-<n>-<region>.pooler.supabase.com, port 5432, user
# postgres.<project-ref>). The direct host db.<ref>.supabase.co is IPv6-only
# unless the IPv4 add-on is enabled. The Transaction pooler (port 6543) is
# refused: pg_dump needs a session.
#
# Safe by construction:
#   * read-only: every pg_dump is one consistent REPEATABLE READ, READ ONLY
#     snapshot; a preflight query runs in a read-only transaction;
#   * the password is read from the terminal (or an already-exported
#     PGPASSWORD), never from argv, never written to disk, and handed only to
#     the PostgreSQL client processes — not to gpg;
#   * every output streams straight into gpg (no plaintext dump on disk) and is
#     written as *.partial, renamed only on success; partials are deleted on any
#     failure;
#   * TLS is always on; pass --sslrootcert <Supabase CA file> for full
#     certificate verification (verify-full), recommended.
#
# Usage:
#   scripts/export-pgdump.sh --host <pooler host> --user postgres.<ref> \
#     --app-key <file> --auth-key <file> [--sslrootcert <ca.crt>] [--port 5432] \
#     [--dbname postgres] [--out <run dir>] [--pg-bin <dir>] [--gnupghome <dir>] \
#     [--no-full]
#
# Produces (default: backups/<UTC run id>-pgdump/, git-ignored):
#   schema-public.sql.gpg      app key   --schema-only --schema=public (plain SQL)
#   data-public.dump.gpg       app key   -Fc --data-only --schema=public
#   data-public-auth.dump.gpg  auth key  -Fc --data-only public.* + auth.users +
#                                        auth.identities, ONE snapshot
#   full-database.dump.gpg     auth key  -Fc of the whole database (best effort:
#                                        Supabase-managed objects the `postgres`
#                                        role cannot read make it non-fatal)
#   roles.sql.gpg              app key   pg_dumpall --roles-only --no-role-passwords
#                                        (best effort)
#   SHA256SUMS, manifest.txt
#
# pg_dump must be >= the server's major version (hosted: 17; tested with 18.6).

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

HOST="" PORT=5432 DBUSER="" DBNAME=postgres APP_KEY="" AUTH_KEY="" OUT="" PG_BIN=""
GNUPGHOME_ARG="" SSLROOTCERT="" WITH_FULL=1
while [ $# -gt 0 ]; do
  case "$1" in
    --host) HOST="$2"; shift 2 ;;
    --port) PORT="$2"; shift 2 ;;
    --user) DBUSER="$2"; shift 2 ;;
    --dbname) DBNAME="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --sslrootcert) SSLROOTCERT="$2"; shift 2 ;;
    --out) OUT="$2"; shift 2 ;;
    --pg-bin) PG_BIN="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    --no-full) WITH_FULL=0; shift ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$HOST" ] && [ -n "$DBUSER" ] && [ -n "$APP_KEY" ] && [ -n "$AUTH_KEY" ] || { sed -n '2,45p' "$0"; exit 2; }
[ -r "$APP_KEY" ] && [ -r "$AUTH_KEY" ] || { echo "key files not readable" >&2; exit 1; }
[ "$PORT" = "6543" ] && { echo "refusing: port 6543 is the Transaction pooler; use the Session pooler (5432)" >&2; exit 1; }

if [ -z "$PG_BIN" ]; then
  if command -v pg_dump >/dev/null 2>&1; then PG_BIN="$(dirname "$(command -v pg_dump)")"
  else PG_BIN="/c/Program Files/PostgreSQL/18/bin"; fi
fi
PG_DUMP="$PG_BIN/pg_dump" PG_DUMPALL="$PG_BIN/pg_dumpall" PSQL="$PG_BIN/psql"

if [ -z "$OUT" ]; then
  RUN="$(date -u +%Y-%m-%dT%H%M%SZ)-pgdump"
  OUT="$ARCHIVE/backups/$RUN"
  if ! git -C "$REPO" check-ignore -q "database-archive/backups/$RUN/x.gpg"; then
    echo "refusing: $OUT would not be git-ignored" >&2; exit 1
  fi
fi
[ -e "$OUT" ] && [ -n "$(ls -A "$OUT" 2>/dev/null)" ] && { echo "refusing: $OUT is not empty" >&2; exit 1; }
umask 077; mkdir -p "$OUT"

GPG=(gpg --batch --quiet --yes --no-symkey-cache --pinentry-mode loopback
     --symmetric --cipher-algo AES256 --s2k-mode 3 --s2k-digest-algo SHA512
     --s2k-count 65011712 --compress-algo ZLIB)
[ -n "$GNUPGHOME_ARG" ] && GPG=(gpg --homedir "$GNUPGHOME_ARG" "${GPG[@]:1}")

# Connection settings (non-secret) are exported; the password is not.
export PGHOST="$HOST" PGPORT="$PORT" PGUSER="$DBUSER" PGDATABASE="$DBNAME"
export PGCLIENTENCODING=UTF8 PGTZ=UTC PGCONNECT_TIMEOUT=15
CA_FP="none"
if [ -n "$SSLROOTCERT" ]; then
  # An explicit CA always means full verification (certificate chain + hostname).
  [ -r "$SSLROOTCERT" ] || { echo "CA file not readable: $SSLROOTCERT" >&2; exit 1; }
  if command -v openssl >/dev/null 2>&1; then
    openssl x509 -in "$SSLROOTCERT" -noout 2>/dev/null \
      || { echo "not a PEM certificate: $SSLROOTCERT" >&2; exit 1; }
    CA_FP="$(openssl x509 -in "$SSLROOTCERT" -noout -fingerprint -sha256 | cut -d= -f2)"
  fi
  # Native Windows libpq needs a Windows path (C:/...), not a Git Bash path (/c/...).
  command -v cygpath >/dev/null 2>&1 && SSLROOTCERT="$(cygpath -m "$SSLROOTCERT")"
  export PGSSLMODE=verify-full PGSSLROOTCERT="$SSLROOTCERT"
else
  case "$HOST" in
    127.0.0.1|localhost|::1) export PGSSLMODE="${PGSSLMODE:-prefer}" ;;
    *) export PGSSLMODE="${PGSSLMODE:-require}"
       echo "note: TLS encrypted but the server certificate is NOT verified; pass --sslrootcert for verify-full" >&2 ;;
  esac
fi

DBPASS="${PGPASSWORD:-}"
unset PGPASSWORD
if [ -z "$DBPASS" ]; then read -rsp "Password for $DBUSER@$HOST: " DBPASS; echo; fi
pg() { PGPASSWORD="$DBPASS" "$@"; }        # only PostgreSQL clients see it

cleanup() {
  local rc=$?
  rm -f "$OUT"/*.partial
  DBPASS=""
  if [ "$rc" -ne 0 ]; then echo "export FAILED (exit $rc); partial files removed" >&2; fi
}
trap cleanup EXIT

seal() {  # seal <key file> <output name> -- <pg client command...>
  # Checks the pipeline explicitly: callers use `if seal …`, where set -e is off.
  local key="$1" name="$2"; shift 3
  if ! pg "$@" | "${GPG[@]}" --passphrase-file "$key" --output "$OUT/$name.partial"; then
    rm -f "$OUT/$name.partial"
    return 1
  fi
  mv "$OUT/$name.partial" "$OUT/$name"
  echo "  $name  $(wc -c < "$OUT/$name") bytes"
}

# --- preflight (read-only) -----------------------------------------------------
DUMP_MAJOR="$("$PG_DUMP" --version | sed -E 's/.* ([0-9]+)\..*/\1/')"
PREFLIGHT="$(pg "$PSQL" -X -w -A -t -q -v ON_ERROR_STOP=1 -c \
  "set transaction read only; select current_setting('server_version_num')::int / 10000, current_setting('server_version'), current_user, (select count(*) from pg_namespace where nspname = 'public')")"
IFS='|' read -r SRV_MAJOR SRV_VERSION CUR_USER HAS_PUBLIC <<< "$PREFLIGHT"
[ "$HAS_PUBLIC" = "1" ] || { echo "preflight: no public schema on target" >&2; exit 1; }
if [ "$DUMP_MAJOR" -lt "$SRV_MAJOR" ]; then
  echo "refusing: pg_dump $DUMP_MAJOR is older than server $SRV_MAJOR" >&2; exit 1
fi
SSL_IN_USE="$(pg "$PSQL" -X -w -A -t -q -c "select coalesce((select ssl from pg_stat_ssl where pid = pg_backend_pid())::text, 'unknown')")"
echo "== preflight: server $SRV_VERSION as $CUR_USER · pg_dump $DUMP_MAJOR · sslmode=$PGSSLMODE · ssl=$SSL_IN_USE"
echo "   CA sha256 fingerprint: $CA_FP"

# --- dumps -------------------------------------------------------------------------
echo "== pg_dump -> $OUT"
seal "$APP_KEY"  schema-public.sql.gpg     -- "$PG_DUMP" -w --schema-only --schema=public --no-owner
seal "$APP_KEY"  data-public.dump.gpg      -- "$PG_DUMP" -w -Fc --data-only --schema=public
seal "$AUTH_KEY" data-public-auth.dump.gpg -- "$PG_DUMP" -w -Fc --data-only \
  --table='public.*' --table=auth.users --table=auth.identities

FULL_STATUS="skipped (--no-full)"
if [ "$WITH_FULL" -eq 1 ]; then
  if seal "$AUTH_KEY" full-database.dump.gpg -- "$PG_DUMP" -w -Fc; then FULL_STATUS="ok"
  else FULL_STATUS="failed (non-fatal; usually Supabase-managed objects not readable by postgres)"
       rm -f "$OUT/full-database.dump.gpg.partial"; echo "  full-database.dump: $FULL_STATUS" >&2; fi
fi
ROLES_STATUS="ok"
if ! seal "$APP_KEY" roles.sql.gpg -- "$PG_DUMPALL" -w --roles-only --no-role-passwords; then
  ROLES_STATUS="failed (non-fatal; BoviTrack defines no custom roles)"
  rm -f "$OUT/roles.sql.gpg.partial"; echo "  roles.sql: $ROLES_STATUS" >&2
fi

(cd "$OUT" && sha256sum -- *.gpg > SHA256SUMS)
{
  echo "archive:     SUPABASE-ARCHIVE-01 (pg_dump path, COST-02A script)"
  echo "taken_at:    $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "source:      $DBUSER@$HOST:$PORT/$DBNAME (server $SRV_VERSION)"
  echo "pg_dump:     $("$PG_DUMP" --version)"
  echo "gnupg:       $(gpg --version | head -1)"
  echo "tls:         sslmode=$PGSSLMODE ssl_in_use=$SSL_IN_USE ca_sha256=$CA_FP"
  echo "full dump:   $FULL_STATUS"
  echo "roles dump:  $ROLES_STATUS"
  echo "keys:        app key -> schema-public, data-public, roles; auth key -> data-public-auth, full-database"
  echo "excluded:    public-only dumps exclude Supabase-managed schemas (auth except users/identities,"
  echo "             storage, realtime, vault, extensions, graphql, pgbouncer); see pgdump-readiness.md"
} > "$OUT/manifest.txt"
echo "done: $OUT"
cat "$OUT/SHA256SUMS"
