#!/usr/bin/env node
/**
 * check-open-data-catalog.mjs — enforces the open-data licensing split + coverage.
 *
 * The deliberate rights split (ADR-015/ADR-017) must hold for every dataset:
 *   - CC0 1.0  <=>  a raw US-GOVERNMENT passthrough (rights say "public domain"); no Muntin compilation claimed.
 *   - CC BY 4.0 <=>  a MUNTIN value-added compilation (rights credit Muntin); attribution required.
 * Every dataset carries an honesty note and its declared download files (when available) exist.
 *
 *   node scripts/check-open-data-catalog.mjs
 *   node scripts/check-open-data-catalog.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/open-data-catalog.json';
const CC0 = 'https://creativecommons.org/publicdomain/zero/1.0/';
const CCBY = 'https://creativecommons.org/licenses/by/4.0/';

function check(cat, { checkFiles = true } = {}) {
  const errs = [];
  const ds = cat && cat.datasets;
  if (!Array.isArray(ds)) return ['catalog has no datasets[] array'];
  const ids = new Set();
  for (const d of ds) {
    const id = d.id || '(no id)';
    if (!d.id) errs.push('a dataset has no id');
    if (ids.has(d.id)) errs.push(`${id}: duplicate id`);
    ids.add(d.id);
    if (!d.honesty_note || String(d.honesty_note).length < 20) errs.push(`${id}: missing/short honesty_note`);
    const rights = String(d.rights || '');
    if (d.license === 'CC0 1.0') {
      if (d.license_url !== CC0) errs.push(`${id}: CC0 license_url wrong`);
      if (!/public domain/i.test(rights)) errs.push(`${id}: CC0 dataset must state "public domain" in rights`);
      if (/Muntin/i.test(rights)) errs.push(`${id}: CC0 dataset must NOT claim a Muntin compilation (that would be CC-BY)`);
    } else if (d.license === 'CC BY 4.0') {
      if (d.license_url !== CCBY) errs.push(`${id}: CC-BY license_url wrong`);
      if (!/Muntin/i.test(rights)) errs.push(`${id}: CC-BY dataset must credit Muntin in rights`);
    } else {
      errs.push(`${id}: license "${d.license}" is neither CC0 1.0 nor CC BY 4.0`);
    }
    if (checkFiles && d.available) {
      for (const dl of d.downloads || []) {
        if (!dl.path) { errs.push(`${id}: a download has no path`); continue; }
        if (!fs.existsSync(path.join(repo, dl.path))) errs.push(`${id}: download ${dl.path} does not exist (but marked available)`);
      }
    }
  }
  // Every data/*.jsonl is served under the CC0 _headers wildcard, so each one MUST be a catalogued
  // CC0 gov dataset — otherwise a future non-gov .jsonl would silently inherit the CC0 license Link.
  if (checkFiles) {
    let jsonl = [];
    try { jsonl = fs.readdirSync(path.join(repo, 'data')).filter((f) => f.endsWith('.jsonl')); } catch { /* no data dir */ }
    const cc0Paths = new Set(ds.filter((d) => d.license === 'CC0 1.0').flatMap((d) => (d.downloads || []).map((x) => x.path)));
    for (const f of jsonl) {
      if (!cc0Paths.has('data/' + f)) errs.push(`data/${f}: served under the CC0 _headers wildcard but NOT a catalogued CC0 dataset — add it to build-open-data-catalog.mjs or it is mislicensed`);
    }
  }

  // counts must be internally consistent
  const c = cat.counts || {};
  const cc0 = ds.filter((d) => d.license === 'CC0 1.0').length;
  const ccby = ds.filter((d) => d.license === 'CC BY 4.0').length;
  if (c.total != null && c.total !== ds.length) errs.push(`counts.total ${c.total} != ${ds.length}`);
  if (c.cc0 != null && c.cc0 !== cc0) errs.push(`counts.cc0 ${c.cc0} != ${cc0}`);
  if (c.ccby != null && c.ccby !== ccby) errs.push(`counts.ccby ${c.ccby} != ${ccby}`);
  return errs;
}

function selfTest() {
  const bad = { counts: { total: 99, cc0: 1, ccby: 1 }, datasets: [
    { id: 'a', license: 'CC0 1.0', license_url: CC0, rights: 'Compilation © Muntin', honesty_note: 'x'.repeat(30) },
    { id: 'b', license: 'CC BY 4.0', license_url: CC0, rights: 'US Government work — public domain', honesty_note: 'ok note here, long enough' },
    { id: 'c', license: 'MIT', rights: 'public domain', honesty_note: 'short' },
  ] };
  const errs = check(bad, { checkFiles: false });
  const want = ['must NOT claim a Muntin compilation', 'CC-BY license_url wrong', 'CC-BY dataset must credit Muntin', 'neither CC0', 'missing/short honesty_note', 'counts.total'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-open-data-catalog: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Open-data catalog gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Open-data catalog gate — ${data.datasets.length} datasets, licensing split honored (CC0 gov / CC-BY Muntin), every available download resolves.`);
