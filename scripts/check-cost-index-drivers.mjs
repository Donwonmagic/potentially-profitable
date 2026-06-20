#!/usr/bin/env node
/**
 * check-cost-index-drivers.mjs — fact gate for the Cost Index driver catalog.
 *
 * The driver layer is the highest-risk surface for overreach (correlation dressed as
 * causation, a fabricated event, a stale source). This gate enforces:
 *   1. Catalog schema: every entry has id, class, affects[], directionExpected (up|down),
 *      strength (correlation|strong-correlation|mechanism-established), mechanism, source,
 *      an https sourceUrl, and a YYYY-MM-DD retrievedAt that is not in the future.
 *   2. No driver prose without a catalog entry: every driver named under a dispatch's
 *      "What's driving the flags" section must match a catalog `label`.
 *   3. Freshness warning: entries with retrievedAt older than 365 days are flagged (warn).
 *
 *   node scripts/check-cost-index-drivers.mjs           # report (exit 0)
 *   node scripts/check-cost-index-drivers.mjs --check   # exit 1 on any violation
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const CATALOG = 'data/cost-index-drivers.json';
const STRENGTHS = new Set(['correlation', 'strong-correlation', 'mechanism-established']);
const DIRS = new Set(['up', 'down']);
const TODAY = new Date().toISOString().slice(0, 10);

const errors = [];
const warns = [];

const catPath = path.join(REPO, CATALOG);
if (!fs.existsSync(catPath)) {
  console.log('check-cost-index-drivers: no catalog present; nothing to check.');
  process.exit(0);
}
let catalog;
try { catalog = JSON.parse(fs.readFileSync(catPath, 'utf8')); }
catch (e) { console.error(`check-cost-index-drivers: ${CATALOG} is not valid JSON — ${e.message}`); process.exit(1); }

const labels = new Set();
const seenIds = new Set();
for (const d of (catalog.drivers || [])) {
  const id = d.id || '(no id)';
  if (!d.id) errors.push(`driver missing id`);
  else if (seenIds.has(d.id)) errors.push(`${id}: duplicate id`);
  seenIds.add(d.id);
  if (!d.label) errors.push(`${id}: missing label`);
  else labels.add(d.label);
  if (!Array.isArray(d.affects) || !d.affects.length) errors.push(`${id}: affects[] must be a non-empty array`);
  if (!DIRS.has(d.directionExpected)) errors.push(`${id}: directionExpected must be one of ${[...DIRS].join('|')}`);
  if (!STRENGTHS.has(d.strength)) errors.push(`${id}: strength must be one of ${[...STRENGTHS].join('|')}`);
  if (!d.mechanism) errors.push(`${id}: missing mechanism`);
  if (!d.source) errors.push(`${id}: missing source`);
  if (!/^https:\/\/\S+$/.test(d.sourceUrl || '')) errors.push(`${id}: sourceUrl must be an https URL`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.retrievedAt || '')) errors.push(`${id}: retrievedAt must be YYYY-MM-DD`);
  else if (d.retrievedAt > TODAY) errors.push(`${id}: retrievedAt ${d.retrievedAt} is in the future`);
  else {
    const ageDays = Math.round((Date.parse(TODAY) - Date.parse(d.retrievedAt)) / 86400000);
    if (ageDays > 365) warns.push(`${id}: retrievedAt ${d.retrievedAt} is ${ageDays}d old — re-review the source`);
  }
}

// Rule 2: every driver named in a dispatch must trace to a catalog label.
const blogDir = path.join(REPO, 'blog');
const dispatches = fs.existsSync(blogDir)
  ? fs.readdirSync(blogDir).filter((n) => /^cost-index-week-\d{4}-\d{2}-\d{2}$/.test(n))
  : [];
for (const slug of dispatches) {
  const fp = path.join(blogDir, slug, 'index.html');
  if (!fs.existsSync(fp)) continue;
  const html = fs.readFileSync(fp, 'utf8');
  const secIdx = html.indexOf('id="whats-driving-the-flags"');
  if (secIdx === -1) continue;
  const end = html.indexOf('<h2', secIdx + 10);
  const section = html.slice(secIdx, end === -1 ? html.length : end);
  const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&mdash;/g, '—').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
  const re = /<li><strong>([^<.]+)\./g;
  let m;
  while ((m = re.exec(section)) !== null) {
    const lbl = unesc(m[1]);
    if (!labels.has(lbl)) errors.push(`${slug}: driver "${lbl}" in prose has no catalog entry (add it to ${CATALOG})`);
  }
}

for (const w of warns) console.warn(`  warn: ${w}`);
if (errors.length) {
  console.error(`check-cost-index-drivers: ${errors.length} violation(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  if (checkOnly) process.exit(1);
} else {
  console.log(`check-cost-index-drivers: clean. ${(catalog.drivers || []).length} driver(s), ${dispatches.length} dispatch(es) scanned.`);
}
