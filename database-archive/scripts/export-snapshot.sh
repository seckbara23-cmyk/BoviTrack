#!/usr/bin/env bash
# SUPABASE-ARCHIVE-01 — repeatable hosted inventory + encrypted logical snapshot.
#
# Read-only against the hosted project: every query runs inside a READ ONLY
# transaction through `supabase db query --linked --project-ref` (Management
# API, authenticated by your `supabase login`; no database password needed).
#
# Side effect to be aware of: before each query the CLI refreshes Supabase's
# temporary `cli_login_postgres` login role (self-expiring after ~10 minutes).
# That is the CLI's own credential mechanism; it does not touch schema or data.
#
# Usage:
#   scripts/export-snapshot.sh --project-ref <ref> --app-key <file> --auth-key <file> \
#     [--private <dir>] [--gnupghome <dir>] [--supabase "<cli command>"]
#
# Writes:
#   backups/<UTC run id>/            app-data.json.gpg, auth-restricted.json.gpg,
#                                    manifest.json, SHA256SUMS   (git-ignored)
#   <private>/hosted-inventory.json  catalog inventory   (review before copying
#   <private>/hosted-services.json   service aggregates   into schema/ or reports/)
#
# Plaintext snapshot data only ever exists in <private> and is wiped after sealing.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

REF="" APP_KEY="" AUTH_KEY="" PRIVATE="" GNUPGHOME_ARG="" SUPABASE_CMD=""
while [ $# -gt 0 ]; do
  case "$1" in
    --project-ref) REF="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --private) PRIVATE="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    --supabase) SUPABASE_CMD="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$REF" ] && [ -n "$APP_KEY" ] && [ -n "$AUTH_KEY" ] || { sed -n '2,24p' "$0"; exit 2; }
if [ -z "$SUPABASE_CMD" ]; then
  if command -v supabase >/dev/null 2>&1; then SUPABASE_CMD="supabase"; else SUPABASE_CMD="npx --yes supabase"; fi
fi
[ -n "$PRIVATE" ] || PRIVATE="$(mktemp -d)"
mkdir -p "$PRIVATE"; chmod 700 "$PRIVATE"
umask 077

GNUPGHOME_DIR="${GNUPGHOME_ARG:-$PRIVATE/gnupg}"
mkdir -p "$GNUPGHOME_DIR"; chmod 700 "$GNUPGHOME_DIR"

RUN="$(date -u +%Y-%m-%dT%H%M%SZ)"
OUT="$ARCHIVE/backups/$RUN"
if ! git -C "$REPO" check-ignore -q "database-archive/backups/$RUN/app-data.json.gpg"; then
  echo "refusing: $OUT would not be git-ignored" >&2; exit 1
fi

# Run the CLI from the private dir so it never writes supabase/.temp into the repo.
query() {  # query <sql file> <response file>
  (cd "$PRIVATE" && $SUPABASE_CMD db query --linked --project-ref "$REF" -o json -f "$1") > "$2"
}
unwrap() {  # unwrap <response file> <column> <out file>
  node -e '
    const fs = require("fs");
    const v = JSON.parse(fs.readFileSync(process.argv[1], "utf8")).rows[0][process.argv[2]];
    fs.writeFileSync(process.argv[3], JSON.stringify(typeof v === "string" ? JSON.parse(v) : v, null, 2) + "\n");
  ' "$1" "$2" "$3"
  rm -f "$1"
}

echo "== inventory (read-only)"
query "$HERE/inventory.sql" "$PRIVATE/inventory.response.json"
unwrap "$PRIVATE/inventory.response.json" inventory "$PRIVATE/hosted-inventory.json"

echo "== Supabase services (read-only, aggregates)"
query "$HERE/hosted-services.sql" "$PRIVATE/services.response.json"
unwrap "$PRIVATE/services.response.json" services "$PRIVATE/hosted-services.json"

echo "== snapshot (read-only, repeatable read) → sealed bundles"
query "$HERE/snapshot.sql" "$PRIVATE/snapshot.response.json"
node "$HERE/seal-snapshot.mjs" --in "$PRIVATE/snapshot.response.json" --out "$OUT" \
  --work "$PRIVATE/work" --app-key "$APP_KEY" --auth-key "$AUTH_KEY" \
  --gnupghome "$GNUPGHOME_DIR" --project-ref "$REF" --delete-input

echo
echo "run:        $OUT"
echo "inventory:  $PRIVATE/hosted-inventory.json"
echo "services:   $PRIVATE/hosted-services.json"
echo "next:       restore/rehearse.sh --run \"$OUT\" --hosted-inventory \"$PRIVATE/hosted-inventory.json\" ..."
