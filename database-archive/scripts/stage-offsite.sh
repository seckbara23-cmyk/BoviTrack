#!/usr/bin/env bash
# SUPABASE-COST-02A — stage an encrypted backup run for an off-site destination.
#
# Copies ONE backup run into a destination the owner has approved (a mounted
# external drive, an encrypted volume, a synced folder of an approved store),
# keeping the parts separated and verifiable:
#
#   <dest>/bovitrack-<run>/
#     app/app-data.json.gpg                 encrypted application data
#     auth/auth-restricted.json.gpg         encrypted auth records (or --auth-dest)
#     meta/manifest.json, meta/SHA256SUMS   counts, row-set hashes, bundle checksums
#     recovery/bovitrack-archive.gitbundle  offline copy of the restore kit (git bundle)
#     recovery/README-RECOVERY.md           how to recover (no secrets)
#     OFFSITE-SHA256SUMS                    checksum of every staged file
#
# It NEVER copies encryption keys: keys travel separately (password manager /
# sealed offline media). It refuses destinations inside the repository or the
# key folder, and verifies every copied file against the source checksums.
# It performs no network transfer itself — uploading the staged folder to any
# third-party service requires the owner's explicit approval.
#
# Usage:
#   scripts/stage-offsite.sh --run <backups/RUN> --dest <dir> [--auth-dest <dir>]
#     [--key-dir <dir>] [--branch <branch>]   (default: the current branch)

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ARCHIVE="$(cd "$HERE/.." && pwd)"
REPO="$(cd "$ARCHIVE/.." && pwd)"

RUN="" DEST="" AUTH_DEST="" KEY_DIR="${HOME}/.bovitrack-archive/keys" BRANCH=""
while [ $# -gt 0 ]; do
  case "$1" in
    --run) RUN="$2"; shift 2 ;;
    --dest) DEST="$2"; shift 2 ;;
    --auth-dest) AUTH_DEST="$2"; shift 2 ;;
    --key-dir) KEY_DIR="$2"; shift 2 ;;
    --branch) BRANCH="$2"; shift 2 ;;
    *) echo "unknown argument: $1" >&2; exit 2 ;;
  esac
done
[ -n "$RUN" ] && [ -n "$DEST" ] || { sed -n '2,25p' "$0"; exit 2; }

abs() { (cd "$1" 2>/dev/null && pwd -P); }
RUN_ABS="$(abs "$RUN")" || { echo "run dir not found: $RUN" >&2; exit 1; }
RUN_ID="$(basename "$RUN_ABS")"
mkdir -p "$DEST"; DEST_ABS="$(abs "$DEST")"
REPO_ABS="$(abs "$REPO")"
KEY_ABS="$(abs "$KEY_DIR" || true)"

refuse_inside() {  # refuse_inside <path> <label>
  case "$1/" in
    "$REPO_ABS"/*) echo "refusing: $2 is inside the repository" >&2; exit 1 ;;
  esac
  if [ -n "$KEY_ABS" ]; then
    case "$1/" in "$KEY_ABS"/*) echo "refusing: $2 is inside the key folder" >&2; exit 1 ;; esac
  fi
}
refuse_inside "$DEST_ABS" "--dest"

(cd "$RUN_ABS" && sha256sum -c --quiet SHA256SUMS) || { echo "source run fails its checksums" >&2; exit 1; }

PKG="$DEST_ABS/bovitrack-$RUN_ID"
[ -e "$PKG" ] && { echo "refusing: $PKG already exists (verify it with verify-offsite.sh)" >&2; exit 1; }
mkdir -p "$PKG"/{app,meta,recovery}

if [ -n "$AUTH_DEST" ]; then
  mkdir -p "$AUTH_DEST"; AUTH_ABS="$(abs "$AUTH_DEST")"
  refuse_inside "$AUTH_ABS" "--auth-dest"
  [ "$AUTH_ABS" = "$DEST_ABS" ] && { echo "refusing: --auth-dest equals --dest" >&2; exit 1; }
  AUTH_PKG="$AUTH_ABS/bovitrack-$RUN_ID-auth"
  [ -e "$AUTH_PKG" ] && { echo "refusing: $AUTH_PKG already exists" >&2; exit 1; }
  mkdir -p "$AUTH_PKG/auth"
else
  AUTH_PKG="$PKG"; mkdir -p "$PKG/auth"
fi

cp -p "$RUN_ABS/app-data.json.gpg" "$PKG/app/"
cp -p "$RUN_ABS/auth-restricted.json.gpg" "$AUTH_PKG/auth/"
cp -p "$RUN_ABS/manifest.json" "$RUN_ABS/SHA256SUMS" "$PKG/meta/"

# Offline restore kit: scripts, restore SQL, migrations, docs (no data, no keys).
# HEAD + the branch ref, so `git clone <bundle>` checks out a branch.
[ -n "$BRANCH" ] || BRANCH="$(git -C "$REPO" symbolic-ref --short HEAD)"
git -C "$REPO" bundle create "$PKG/recovery/bovitrack-archive.gitbundle" HEAD "$BRANCH" >/dev/null 2>&1
git -C "$REPO" bundle verify "$PKG/recovery/bovitrack-archive.gitbundle" >/dev/null 2>&1
cp -p "$ARCHIVE/reports/offsite-backup-runbook.md" "$PKG/recovery/README-RECOVERY.md"

# Per-package checksum lists (relative paths).
(cd "$PKG" && find . -type f ! -name OFFSITE-SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > OFFSITE-SHA256SUMS)
if [ "$AUTH_PKG" != "$PKG" ]; then
  (cd "$AUTH_PKG" && find . -type f ! -name OFFSITE-SHA256SUMS -print0 | sort -z | xargs -0 sha256sum > OFFSITE-SHA256SUMS)
fi

# Verify the copies against the SOURCE checksums, not just against themselves.
src_hash() { grep " $1\$" "$RUN_ABS/SHA256SUMS" | cut -d' ' -f1; }
for pair in "app-data.json.gpg:$PKG/app" "auth-restricted.json.gpg:$AUTH_PKG/auth"; do
  f="${pair%%:*}" d="${pair#*:}"
  [ "$(sha256sum "$d/$f" | cut -d' ' -f1)" = "$(src_hash "$f")" ] || { echo "copy mismatch: $f" >&2; exit 1; }
done

echo "staged run $RUN_ID"
echo "  package:      $PKG"
[ "$AUTH_PKG" != "$PKG" ] && echo "  auth package: $AUTH_PKG"
echo "  copies verified against source SHA256SUMS; git bundle verified"
echo "  keys NOT copied — store them separately (see offsite-backup-runbook.md)"
