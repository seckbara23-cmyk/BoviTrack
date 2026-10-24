#!/usr/bin/env bash
# SUPABASE-COST-02A — verify an off-site copy of a BoviTrack backup run.
#
# Checks, in order (each optional input adds a stronger check):
#   1. every staged file matches OFFSITE-SHA256SUMS            (copy integrity)
#   2. bundle hashes match the source run's SHA256SUMS          (--local-run)
#   3. bundle hashes match those recorded in the repository     (always, if found)
#   4. each bundle decrypts with the off-site KEY copy          (--app-key/--auth-key)
#   5. the offline restore kit (git bundle) clones and contains the restore kit
# Decrypted output is discarded; nothing is printed but verdicts.
#
# Usage:
#   scripts/verify-offsite.sh --package <dir> [--auth-package <dir>]
#     [--local-run <backups/RUN>] [--app-key <file>] [--auth-key <file>]
#     [--gnupghome <dir>]

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"

PKG="" AUTH_PKG="" LOCAL_RUN="" APP_KEY="" AUTH_KEY="" GNUPGHOME_ARG=""
while [ $# -gt 0 ]; do
  case "$1" in
    --package) PKG="$2"; shift 2 ;;
    --auth-package) AUTH_PKG="$2"; shift 2 ;;
    --local-run) LOCAL_RUN="$2"; shift 2 ;;
    --app-key) APP_KEY="$2"; shift 2 ;;
    --auth-key) AUTH_KEY="$2"; shift 2 ;;
    --gnupghome) GNUPGHOME_ARG="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$PKG" ] || { sed -n '2,17p' "$0"; exit 2; }
AUTH_PKG="${AUTH_PKG:-$PKG}"
GPG=(gpg --batch --quiet --no-symkey-cache --pinentry-mode loopback)
[ -n "$GNUPGHOME_ARG" ] && GPG+=(--homedir "$GNUPGHOME_ARG")

fail=0
ok()  { echo "OK    $*"; }
bad() { echo "FAIL  $*"; fail=1; }

echo "== 1. copy integrity"
for p in "$PKG" $( [ "$AUTH_PKG" != "$PKG" ] && echo "$AUTH_PKG" ); do
  if (cd "$p" && sha256sum -c --quiet OFFSITE-SHA256SUMS); then ok "$(basename "$p")/OFFSITE-SHA256SUMS"
  else bad "$(basename "$p")/OFFSITE-SHA256SUMS"; fi
done

APP="$PKG/app/app-data.json.gpg"
AUTH="$AUTH_PKG/auth/auth-restricted.json.gpg"
h() { sha256sum "$1" | cut -d' ' -f1; }

echo "== 2. against the source run"
if [ -n "$LOCAL_RUN" ]; then
  for pair in "app-data.json.gpg:$APP" "auth-restricted.json.gpg:$AUTH"; do
    f="${pair%%:*}" path="${pair#*:}"
    want="$(grep " $f\$" "$LOCAL_RUN/SHA256SUMS" | cut -d' ' -f1)"
    [ "$(h "$path")" = "$want" ] && ok "$f = local run" || bad "$f differs from local run"
  done
else
  echo "SKIP  (no --local-run)"
fi

echo "== 3. against hashes recorded in the repository"
for path in "$APP" "$AUTH"; do
  if grep -rqs "$(h "$path")" "$ARCHIVE/backups/README.md" "$ARCHIVE/reports/"; then
    ok "$(basename "$path") hash is recorded in the repository docs"
  else
    echo "WARN  $(basename "$path") hash not found in repository docs (newer run?)"
  fi
done

echo "== 4. decrypt with the off-site key copies"
if [ -n "$APP_KEY" ]; then
  "${GPG[@]}" --passphrase-file "$APP_KEY" -d "$APP" >/dev/null && ok "app-data decrypts" || bad "app-data does not decrypt"
else echo "SKIP  app-data (no --app-key)"; fi
if [ -n "$AUTH_KEY" ]; then
  "${GPG[@]}" --passphrase-file "$AUTH_KEY" -d "$AUTH" >/dev/null && ok "auth-restricted decrypts" || bad "auth-restricted does not decrypt"
else echo "SKIP  auth-restricted (no --auth-key)"; fi

echo "== 5. offline restore kit (clone the git bundle; no network)"
KIT="$(mktemp -d)"
if git clone --quiet "$PKG/recovery/bovitrack-archive.gitbundle" "$KIT/kit" 2>/dev/null \
   && [ -f "$KIT/kit/database-archive/restore/rehearse.sh" ] \
   && [ -f "$KIT/kit/supabase/migrations/0001_init.sql" ]; then
  ok "git bundle clones; restore kit + migrations present"
else
  bad "git bundle missing, invalid, or lacks the restore kit"
fi
rm -rf "$KIT"

if [ "$fail" -eq 0 ]; then echo "RESULT: off-site copy verified"; else echo "RESULT: FAILED"; exit 1; fi
