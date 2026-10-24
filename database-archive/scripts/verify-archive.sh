#!/usr/bin/env bash
# SUPABASE-ARCHIVE-01 — quick integrity check (no PostgreSQL needed).
#
#   * SHA256SUMS of the run directory
#   * every *.gpg decrypts with its key (output discarded, never written)
#   * archived migration copies match their checksums and supabase/migrations
#
# Key routing: files whose name contains "auth" or starts with "full-" use the
# auth key; everything else uses the app-data key. A missing key skips that
# file's decrypt test (reported as SKIP).
#
# Usage: scripts/verify-archive.sh <run dir> [--app-key <file>] [--auth-key <file>] [--gnupghome <dir>]
# For a full restore test use restore/rehearse.sh.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

RUN="${1:-}"; [ -n "$RUN" ] && shift || { sed -n '2,13p' "$0"; exit 2; }
APP_KEY="" AUTH_KEY="" GNUPGHOME_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
GPG=(gpg --batch --quiet --no-symkey-cache --pinentry-mode loopback)
[ -n "$GNUPGHOME_ARG" ] && GPG+=(--homedir "$GNUPGHOME_ARG")
CR=$'\r'

fail=0
echo "== checksums ($RUN)"
(cd "$RUN" && sha256sum -c SHA256SUMS) || fail=1

echo "== decrypt tests"
for f in "$RUN"/*.gpg; do
  name="$(basename "$f")"
  case "$name" in *auth*|full-*) key="$AUTH_KEY" ;; *) key="$APP_KEY" ;; esac
  if [ -z "$key" ]; then echo "SKIP  $name (no key given)"; continue; fi
  if "${GPG[@]}" --passphrase-file "$key" --decrypt "$f" > /dev/null; then
    echo "OK    $name"
  else
    echo "FAIL  $name"; fail=1
  fi
done

echo "== archived migrations vs originals"
(cd "$ARCHIVE/migrations" && sha256sum -c SHA256SUMS) || fail=1
for m in "$REPO"/supabase/migrations/*.sql "$REPO"/supabase/seed.sql; do
  copy="$ARCHIVE/migrations/$(basename "$m")"
  # Ignore CR: a Windows checkout of supabase/ may carry CRLF line endings.
  if [ -f "$copy" ] && cmp -s <(tr -d "$CR" < "$m") <(tr -d "$CR" < "$copy"); then
    echo "OK    $(basename "$m") matches the original (line endings ignored)"
  else
    echo "FAIL  $(basename "$m") differs or is missing"; fail=1
  fi
done

if [ "$fail" -eq 0 ]; then echo "RESULT: archive intact"; else echo "RESULT: FAILED"; exit 1; fi
