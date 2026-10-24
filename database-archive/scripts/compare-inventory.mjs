#!/usr/bin/env node
/**
 * SUPABASE-ARCHIVE-01 — schema drift check between two inventory.sql outputs.
 *
 * Compares the application-owned structure (schema `public`, plus the
 * auth.users → profiles trigger): tables & RLS flags, columns, constraints,
 * indexes, enums, views, functions (definition + security attributes),
 * triggers, policies and grants. Supabase-managed sections (extensions, roles,
 * other schemas) are intentionally ignored.
 *
 * Text is compared after normalising CRLF → LF: SQL pasted into the Supabase
 * SQL editor from Windows stores CRLF inside function bodies. Such
 * line-ending-only differences are listed as notes, not counted as drift.
 *
 * Usage: node compare-inventory.mjs <reference.json> <candidate.json> [--counts]
 *   --counts  also compare exact row counts of public tables
 * Exit code 1 when any difference is found.
 */
import { readFileSync } from "node:fs";

const [refPath, candPath] = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const withCounts = process.argv.includes("--counts");

const load = (p) => {
  const doc = JSON.parse(readFileSync(p, "utf8"));
  // Accept a bare inventory or a raw `supabase db query -o json` response.
  const inv = doc?.rows?.[0]?.inventory ?? doc;
  return typeof inv === "string" ? JSON.parse(inv) : inv;
};
const ref = load(refPath);
const cand = load(candPath);

const SECTIONS = {
  tables: {
    rows: (i) => i.tables.filter((t) => t.schema === "public"),
    key: (t) => t.name,
    fields: ["kind", "owner", "rls_enabled", "rls_forced", ...(withCounts ? ["exact_rows"] : [])],
  },
  columns: { key: (c) => `${c.table}.${c.column}`, fields: ["ordinal", "type", "not_null", "default", "identity", "generated"] },
  constraints: { key: (c) => `${c.table}.${c.name}`, fields: ["type", "definition"] },
  indexes: { key: (x) => `${x.table}.${x.name}`, fields: ["definition"] },
  enums: { key: (e) => e.name, fields: ["labels"] },
  views: { key: (v) => v.name, fields: ["kind", "definition"] },
  functions: {
    key: (f) => `${f.name}(${f.arguments})`,
    // definition (pg_get_functiondef) covers the body; body_md5 is raw bytes.
    fields: ["returns", "language", "security_definer", "volatility", "config", "owner", "definition"],
  },
  triggers: { key: (t) => `${t.table}.${t.name}`, fields: ["enabled", "function", "definition"] },
  policies: {
    rows: (i) => i.policies.filter((p) => p.schema === "public"),
    key: (p) => `${p.table}.${p.name}`,
    fields: ["permissive", "roles", "command", "using", "with_check"],
  },
  table_grants: { key: (g) => `${g.table} → ${g.grantee}`, fields: ["privileges"] },
  function_grants: { key: (g) => `${g.function} → ${g.grantee}`, fields: ["privileges"] },
  schema_grants: { key: (g) => `${g.schema} → ${g.grantee}`, fields: ["privileges"] },
};

const raw = (v) => JSON.stringify(v ?? null);
const norm = (v) => JSON.stringify(v ?? null,
  (_, x) => (typeof x === "string" ? x.replace(/\r\n/g, "\n") : x));
const same = (a, b) => norm(a) === norm(b);
const notes = [];

let drift = 0;
const lines = [];
for (const [name, s] of Object.entries(SECTIONS)) {
  const rows = s.rows ?? ((i) => i[name] ?? []);
  const a = new Map(rows(ref).map((r) => [s.key(r), r]));
  const b = new Map(rows(cand).map((r) => [s.key(r), r]));
  const onlyRef = [...a.keys()].filter((k) => !b.has(k));
  const onlyCand = [...b.keys()].filter((k) => !a.has(k));
  for (const k of [...a.keys()].filter((k) => b.has(k))) {
    const eol = s.fields.filter((f) => same(a.get(k)[f], b.get(k)[f]) && raw(a.get(k)[f]) !== raw(b.get(k)[f]));
    if (eol.length) notes.push(`${name} ${k}: ${eol.join(", ")} differ in line endings only (CRLF vs LF)`);
  }
  const changed = [...a.keys()].filter((k) => b.has(k))
    .map((k) => [k, s.fields.filter((f) => !same(a.get(k)[f], b.get(k)[f]))])
    .filter(([, f]) => f.length > 0);

  const n = onlyRef.length + onlyCand.length + changed.length;
  drift += n;
  lines.push(`${n === 0 ? "OK   " : "DRIFT"} ${name.padEnd(16)} reference=${a.size} candidate=${b.size}` +
    (n ? `  missing=${onlyRef.length} extra=${onlyCand.length} changed=${changed.length}` : ""));
  for (const k of onlyRef) lines.push(`        - only in reference: ${k}`);
  for (const k of onlyCand) lines.push(`        + only in candidate: ${k}`);
  for (const [k, f] of changed) lines.push(`        ~ ${k}: ${f.join(", ")}`);
}

console.log(lines.join("\n"));
for (const note of notes) console.log(`NOTE  ${note}`);
console.log(drift === 0
  ? "RESULT: no drift — candidate matches reference."
  : `RESULT: ${drift} difference(s).`);
process.exit(drift === 0 ? 0 : 1);
