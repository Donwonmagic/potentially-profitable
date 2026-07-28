#!/usr/bin/env node
/**
 * check-study-datapackage.mjs — descriptor⇄data consistency gate for the menu-pricing study's
 * Frictionless Data Package (cost-index/menu-pricing/study/datapackage.json), built by
 * build-study-dataset.mjs. A datapackage that lies about its own bytes is worse than none, so this
 * gate proves the descriptor never drifts from the two CSV resources it describes:
 *
 *   1. SHA256 + BYTE SYNC — for each resource, the on-disk file's sha256 + byte length equal the
 *      descriptor's hash + bytes. (Either CSV changing without a rebuild fails here.)
 *   2. SCHEMA ⇄ HEADER — the CSV header row equals the schema field names, in order; every data row
 *      RFC4180-parses to exactly fields.length columns (the lossless-CSV guarantee).
 *   3. SHAPE — tabular-data-package profile, a primaryKey that is a real field, per-resource licenses,
 *      and the four-posture enum on menu-pricing.posture.
 *
 *   node scripts/check-study-datapackage.mjs
 *   node scripts/check-study-datapackage.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { parseCsv } from './build-study-dataset.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DP_REL = 'cost-index/menu-pricing/study/datapackage.json';
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// readFile(relToDescriptor) -> string bytes, or throws. Pure so the self-test injects an in-memory map.
function check(dp, readFile) {
  const errs = [];
  if (dp.profile !== 'tabular-data-package') errs.push(`profile is "${dp.profile}", expected "tabular-data-package"`);
  if (!dp.version) errs.push('descriptor has no version');
  if (!Array.isArray(dp.licenses) || !dp.licenses.some((l) => l.name === 'CC-BY-4.0')) errs.push('top-level licenses must include CC-BY-4.0');
  if (!Array.isArray(dp.resources) || !dp.resources.length) { errs.push('descriptor has no resources'); return errs; }

  for (const r of dp.resources) {
    const tag = `resource "${r.name || r.path}"`;
    if (!r.path) { errs.push(`${tag}: no path`); continue; }
    if (!r.schema || !Array.isArray(r.schema.fields) || !r.schema.fields.length) { errs.push(`${tag}: no schema.fields`); continue; }
    if (!Array.isArray(r.licenses) || !r.licenses.some((l) => l.name === 'CC-BY-4.0')) errs.push(`${tag}: missing per-resource CC-BY-4.0 license`);

    const fieldNames = r.schema.fields.map((f) => f.name);
    if (r.schema.primaryKey && !fieldNames.includes(r.schema.primaryKey)) errs.push(`${tag}: primaryKey "${r.schema.primaryKey}" is not a declared field`);

    let raw;
    try { raw = readFile(r.path); } catch (e) { errs.push(`${tag}: cannot read "${r.path}" (${e.message})`); continue; }

    // 1) sha256 + byte sync
    const bytes = Buffer.byteLength(raw, 'utf8');
    if (r.bytes !== bytes) errs.push(`${tag}: descriptor bytes ${r.bytes} ≠ actual ${bytes} — descriptor is stale (rebuild: node scripts/build-study-dataset.mjs)`);
    const want = 'sha256:' + sha256(raw);
    if (r.hash !== want) errs.push(`${tag}: descriptor hash ${r.hash} ≠ actual ${want} — descriptor is stale (rebuild: node scripts/build-study-dataset.mjs)`);

    // 2) schema ⇄ header + column count
    const rows = parseCsv(raw);
    if (!rows.length) { errs.push(`${tag}: parsed 0 rows`); continue; }
    const header = rows[0];
    if (header.join(',') !== fieldNames.join(',')) errs.push(`${tag}: CSV header [${header.join(',')}] ≠ schema fields [${fieldNames.join(',')}]`);
    const bad = [];
    for (let i = 1; i < rows.length; i++) if (rows[i].length !== fieldNames.length) bad.push(`row ${i} has ${rows[i].length}`);
    if (bad.length) errs.push(`${tag}: ${bad.length} row(s) not ${fieldNames.length} columns (${bad.slice(0, 3).join('; ')})`);
  }

  // 3) posture enum (honesty: the four postures are the only valid values)
  const menu = (dp.resources || []).find((r) => r.name === 'menu-pricing');
  const posture = menu && menu.schema.fields.find((f) => f.name === 'posture');
  if (posture && JSON.stringify(posture.constraints && posture.constraints.enum) !== JSON.stringify(['lock', 'cushion', 'float', 'withhold'])) {
    errs.push('menu-pricing.posture must constrain enum [lock,cushion,float,withhold]');
  }
  return errs;
}

function selfTest() {
  const studyCsv = 'a,b\n1,2\n3,4\n';
  const menuCsv = 'posture\nlock\n';
  const mk = () => ({
    profile: 'tabular-data-package', name: 'x', version: '1', licenses: [{ name: 'CC-BY-4.0' }],
    resources: [
      { name: 'study', path: 'study.csv', bytes: Buffer.byteLength(studyCsv, 'utf8'), hash: 'sha256:' + sha256(studyCsv), licenses: [{ name: 'CC-BY-4.0' }], schema: { fields: [{ name: 'a' }, { name: 'b' }], primaryKey: 'a' } },
      { name: 'menu-pricing', path: 'menu.csv', bytes: Buffer.byteLength(menuCsv, 'utf8'), hash: 'sha256:' + sha256(menuCsv), licenses: [{ name: 'CC-BY-4.0' }], schema: { fields: [{ name: 'posture', constraints: { enum: ['lock', 'cushion', 'float', 'withhold'] } }], primaryKey: 'posture' } },
    ],
  });
  const reader = (files) => (p) => { if (files[p] == null) throw new Error('no file'); return files[p]; };
  const files = { 'study.csv': studyCsv, 'menu.csv': menuCsv };

  const clean = check(mk(), reader(files));
  if (clean.length) { console.error('SELF-TEST FAIL — clean descriptor produced errors:', clean); process.exit(1); }

  const cases = [
    ['stale hash', () => { const d = mk(); d.resources[0].hash = 'sha256:deadbeef'; return [d, files]; }, 'hash'],
    ['stale bytes', () => { const d = mk(); d.resources[0].bytes = 999; return [d, files]; }, 'bytes'],
    ['header≠schema', () => { const d = mk(); d.resources[0].schema.fields = [{ name: 'a' }, { name: 'z' }]; return [d, files]; }, 'header'],
    ['ragged row', () => { const f = { ...files, 'study.csv': 'a,b\n1\n' }; const c = 'a,b\n1\n'; const d = mk(); d.resources[0].bytes = Buffer.byteLength(c, 'utf8'); d.resources[0].hash = 'sha256:' + sha256(c); return [d, f]; }, 'columns'],
    ['missing resource license', () => { const d = mk(); d.resources[0].licenses = []; return [d, files]; }, 'CC-BY-4.0 license'],
    ['bad primaryKey', () => { const d = mk(); d.resources[0].schema.primaryKey = 'nope'; return [d, files]; }, 'primaryKey'],
    ['posture enum wrong', () => { const d = mk(); d.resources[1].schema.fields[0].constraints.enum = ['lock']; return [d, files]; }, 'posture'],
    ['wrong profile', () => { const d = mk(); d.profile = 'data-package'; return [d, files]; }, 'profile'],
  ];
  const missed = [];
  for (const [name, build, want] of cases) {
    const [d, f] = build();
    const got = check(d, reader(f));
    if (!got.some((e) => e.includes(want))) missed.push(`${name} (wanted "${want}", got: ${JSON.stringify(got)})`);
  }
  if (missed.length) { console.error('SELF-TEST FAIL — missed:', missed); process.exit(1); }
  console.log('✓ self-test: clean descriptor passes; caught all', cases.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();

let dp;
try { dp = JSON.parse(fs.readFileSync(path.join(repo, DP_REL), 'utf8')); }
catch (e) { console.error(`check-study-datapackage: cannot read ${DP_REL}: ${e.message}`); process.exit(1); }
const dpDir = path.dirname(path.join(repo, DP_REL));
const errors = check(dp, (rel) => fs.readFileSync(path.join(dpDir, rel), 'utf8'));
if (errors.length) {
  console.error(`✗ Study datapackage gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Study datapackage gate — ${dp.resources.length} resource(s): sha256 + bytes in sync, CSV headers match schema, every row well-formed, licenses + posture enum intact.`);
