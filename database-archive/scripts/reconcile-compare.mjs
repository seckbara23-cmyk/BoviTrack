#!/usr/bin/env node
/**
 * SUPABASE-COST-03A — compare a reconcile.sql result with an archive manifest.
 *
 * Prints only per-table verdicts (match / CHANGED / missing) and the change
 * indicators — never the hashes themselves. Exit 1 when anything differs, so
 * a fresh snapshot is needed.
 *
 * Usage: node reconcile-compare.mjs <reconcile response.json> <backups/RUN/manifest.json>
 */
import { readFileSync } from "node:fs";

const [respPath, manifestPath] = process.argv.slice(2);
const doc = JSON.parse(readFileSync(respPath, "utf8"));
const raw = doc?.rows?.[0]?.reconcile ?? doc;
const live = typeof raw === "string" ? JSON.parse(raw) : raw;
const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

let changed = 0;
const names = [...new Set([...Object.keys(live.tables), ...Object.keys(manifest.tables)])].sort();
for (const t of names) {
  const a = manifest.tables[t];
  const b = live.tables[t];
  let verdict;
  if (!a) verdict = "NEW TABLE (not in archive)";
  else if (!b) verdict = "MISSING on hosted";
  else if (a.count === b.count && a.md5 === b.md5) verdict = "match";
  else verdict = `CHANGED (archive ${a.count} rows, hosted ${b.count} rows)`;
  if (verdict !== "match") changed++;
  console.log(`${verdict === "match" ? "OK   " : "DIFF "} ${t.padEnd(26)} ${verdict}`);
}
console.log(`indicators: writes_since_reset=${live.public_writes_since_reset} api_role_calls=${live.api_role_calls} ` +
  `auth_last_sign_in=${live.auth_last_sign_in} auth_audit_entries=${live.auth_audit_entries} auth_sessions=${live.auth_sessions}`);
console.log(`checked_at=${live.checked_at} isolation=${live.transaction_isolation}`);
console.log(changed === 0
  ? `RESULT: hosted data identical to archive run (${names.length} tables)`
  : `RESULT: ${changed} table(s) differ — take a fresh snapshot`);
process.exit(changed === 0 ? 0 : 1);
