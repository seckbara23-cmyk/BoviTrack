#!/usr/bin/env node
/**
 * SUPABASE-ARCHIVE-01 — seal a logical snapshot into encrypted bundles.
 *
 * Input: the raw `supabase db query -o json -f snapshot.sql` response.
 * Output (in --out, which must be git-ignored):
 *   app-data.json.gpg        public.* rows        (key: --app-key)
 *   auth-restricted.json.gpg auth.users/identities (key: --auth-key)
 *   manifest.json            counts, row-set md5s, bundle checksums
 *   SHA256SUMS               `sha256sum -c` compatible, encrypted files only
 *
 * Each bundle is encrypted with GnuPG (symmetric AES-256, SHA-512 S2K),
 * decrypted again and compared byte-for-byte before the plaintext is
 * overwritten and removed. Nothing but counts and checksums is printed.
 *
 * Usage:
 *   node seal-snapshot.mjs --in <response.json> --out <run dir> --work <private tmp dir>
 *     --app-key <passphrase file> --auth-key <passphrase file>
 *     --gnupghome <isolated gpg home> --project-ref <ref> [--gpg gpg]
 *     [--delete-input] [--gpg-path-style posix|native]
 */
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, statSync,
  openSync, writeSync, closeSync,
} from "node:fs";
import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import path from "node:path";

const argv = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  if (i === -1) {
    if (fallback !== undefined) return fallback;
    throw new Error(`missing --${name}`);
  }
  return argv[i + 1];
};
const flag = (name) => argv.includes(`--${name}`);

const input = opt("in");
const outDir = opt("out");
const workDir = opt("work");
const appKey = opt("app-key");
const authKey = opt("auth-key");
const gnupgHome = opt("gnupghome");
const projectRef = opt("project-ref");
const gpg = opt("gpg", "gpg");

// Git-for-Windows ships an MSYS gpg that misreads `C:\...` as a relative path
// when spawned from a native process; hand it `/c/...` paths instead.
const msysGpg = process.platform === "win32" &&
  (opt("gpg-path-style", process.env.MSYSTEM ? "posix" : "native") === "posix");
const gpgPath = (p) => {
  const abs = path.resolve(p);
  return msysGpg
    ? abs.replace(/^([A-Za-z]):[\\/]/, (_, d) => `/${d.toLowerCase()}/`).replace(/\\/g, "/")
    : abs;
};

const sha256 = (buf) => createHash("sha256").update(buf).digest("hex");

/** Overwrite with random bytes, then unlink (best effort on SSD/NTFS). */
function wipe(file) {
  const size = statSync(file).size;
  const fd = openSync(file, "r+");
  writeSync(fd, randomBytes(size), 0, size, 0);
  closeSync(fd);
  rmSync(file);
}

const gpgBase = [
  "--homedir", gpgPath(gnupgHome), "--batch", "--yes", "--quiet",
  "--no-symkey-cache", "--pinentry-mode", "loopback",
];

function seal(name, bundle, keyFile) {
  // Compact single-line JSON: loadable with psql \copy (see restore/).
  const plain = Buffer.from(JSON.stringify(bundle) + "\n", "utf8");
  const plainPath = path.join(workDir, `${name}.json`);
  const outPath = path.join(outDir, `${name}.json.gpg`);

  writeFileSync(plainPath, plain, { mode: 0o600 });
  try {
    execFileSync(gpg, [
      ...gpgBase, "--passphrase-file", gpgPath(keyFile),
      "--symmetric", "--cipher-algo", "AES256",
      "--s2k-mode", "3", "--s2k-digest-algo", "SHA512", "--s2k-count", "65011712",
      "--compress-algo", "ZLIB",
      "--output", gpgPath(outPath), gpgPath(plainPath),
    ]);

    const roundTrip = execFileSync(gpg, [
      ...gpgBase, "--passphrase-file", gpgPath(keyFile), "--decrypt", gpgPath(outPath),
    ], { maxBuffer: 1 << 30 });
    if (sha256(roundTrip) !== sha256(plain)) {
      throw new Error(`${name}: decrypt round-trip mismatch`);
    }
  } finally {
    wipe(plainPath);
  }

  const sealed = readFileSync(outPath);
  return {
    file: path.basename(outPath),
    bytes: sealed.length,
    sha256: sha256(sealed),
    plaintext_bytes: plain.length,
    plaintext_sha256: sha256(plain),
    encryption: "OpenPGP symmetric (GnuPG), AES-256, S2K iterated+salted SHA-512, ZLIB",
    round_trip_verified: true,
  };
}

// ---------------------------------------------------------------------------

mkdirSync(outDir, { recursive: true });
mkdirSync(workDir, { recursive: true });

const response = JSON.parse(readFileSync(input, "utf8"));
const raw = response?.rows?.[0]?.snapshot;
if (raw == null) throw new Error("response has no rows[0].snapshot");
const snapshot = typeof raw === "string" ? JSON.parse(raw) : raw;
const { meta, tables } = snapshot;

if (meta.transaction_isolation !== "repeatable read" || meta.transaction_read_only !== "on") {
  throw new Error(`snapshot was not taken in a read-only repeatable-read transaction: ${JSON.stringify(meta)}`);
}
for (const [fq, t] of Object.entries(tables)) {
  if (t.rows.length !== t.count) {
    throw new Error(`${fq}: ${t.rows.length} rows exported but count() = ${t.count}`);
  }
}

const pick = (prefix) =>
  Object.fromEntries(Object.entries(tables).filter(([fq]) => fq.startsWith(prefix)));

const runMeta = { ...meta, project_ref: projectRef };
const bundles = {
  "app-data": seal("app-data", { meta: { ...runMeta, bundle: "app-data" }, tables: pick("public.") }, appKey),
  "auth-restricted": seal("auth-restricted", { meta: { ...runMeta, bundle: "auth-restricted" }, tables: pick("auth.") }, authKey),
};

const manifest = {
  archive: "SUPABASE-ARCHIVE-01",
  snapshot: runMeta,
  tables: Object.fromEntries(
    Object.entries(tables).map(([fq, t]) => [fq, {
      bundle: fq.startsWith("auth.") ? "auth-restricted" : "app-data",
      count: t.count,
      md5: t.md5,
    }]),
  ),
  bundles,
  keys: {
    "app-data": path.basename(appKey),
    "auth-restricted": path.basename(authKey),
    note: "Passphrase files are stored outside the repository; never alongside the bundles.",
  },
};

writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
writeFileSync(
  path.join(outDir, "SHA256SUMS"),
  Object.values(bundles).map((b) => `${b.sha256}  ${b.file}`).join("\n") + "\n",
);

if (flag("delete-input")) wipe(input);

// Safe summary only.
console.log(`snapshot taken_at=${meta.taken_at} isolation=${meta.transaction_isolation} read_only=${meta.transaction_read_only}`);
for (const [fq, t] of Object.entries(manifest.tables)) {
  console.log(`  ${fq.padEnd(26)} ${String(t.count).padStart(5)} rows  -> ${t.bundle}`);
}
for (const b of Object.values(bundles)) {
  console.log(`  ${b.file}  ${b.bytes} bytes  sha256=${b.sha256}  round-trip=ok`);
}
