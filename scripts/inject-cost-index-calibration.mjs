#!/usr/bin/env node
// Stamp the VERIFIED calibration numbers from data/cost-index-calibration-report.json
// into the <!-- cal:KEY -->…<!-- /cal --> sentinels on the methodology pages (EN + ES),
// so the published track record always matches the re-checked record file and can
// never be hand-edited out of sync. Values only; the page is never regenerated.
//
//   node scripts/inject-cost-index-calibration.mjs           # stamps in place
//   node scripts/inject-cost-index-calibration.mjs --check   # exits non-zero if stale
//
// Idempotent. The --check mode is wired into scripts/check-all.mjs; the plain run
// belongs in the cost-index refresh workflow alongside the report rebuild.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkOnly = process.argv.includes('--check');
const report = JSON.parse(fs.readFileSync(path.join(REPO, 'data/cost-index-calibration-report.json'), 'utf8'));

const pct = (x) => Math.round(x * 100) + '%';
// Locale-formatted values: EN uses a thousands comma, ES (and the page I wrote)
// uses a plain integer.
function values(es) {
  const int = (n) => (es ? String(n) : n.toLocaleString('en-US'));
  return {
    'band.coverage': pct(report.band.pooledCoverage),
    'band.steps': int(report.band.scoredSteps),
    'band.items': int(report.band.items),
    'trend.high': pct(report.trend.tiers.high.hitRate),
    'trend.low': pct(report.trend.tiers.low.hitRate),
    'trend.baseline': pct(report.trend.baseline),
  };
}

const TARGETS = [
  ['cost-index/methodology/index.html', false],
  ['es/cost-index/methodology/index.html', true],
];

function esc(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

let stale = false, changed = 0;
for (const [rel, es] of TARGETS) {
  const file = path.join(REPO, rel);
  let html = fs.readFileSync(file, 'utf8');
  const vals = values(es);
  let next = html;
  for (const [key, val] of Object.entries(vals)) {
    const re = new RegExp('(<!-- cal:' + esc(key) + ' -->)([\\s\\S]*?)(<!-- /cal -->)');
    if (!re.test(next)) { console.error(`inject-cost-index-calibration: sentinel cal:${key} not found in ${rel}`); process.exit(2); }
    next = next.replace(re, (_m, a, _cur, b) => a + val + b);
  }
  if (next !== html) {
    if (checkOnly) { stale = true; console.error(`✗ ${rel} calibration sentinels are stale.`); }
    else { fs.writeFileSync(file, next); changed++; }
  }
}

if (checkOnly) {
  if (stale) { console.error('Run: node scripts/inject-cost-index-calibration.mjs'); process.exit(1); }
  console.log('✓ calibration sentinels in sync on the methodology pages.');
} else {
  console.log(`Calibration sentinels stamped (${changed} file(s) changed).`);
}
