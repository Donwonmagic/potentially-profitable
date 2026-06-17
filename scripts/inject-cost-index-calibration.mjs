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
    'trend.medium': pct(report.trend.tiers.medium.hitRate),
    'trend.low': pct(report.trend.tiers.low.hitRate),
    'trend.baseline': pct(report.trend.baseline),
    'band.nominal': pct(report.band.nominal),
    'band.widened': int(report.band.widened),
    'chart.reliability': reliabilityChart(es),
  };
}

// A small, accessible reliability bar chart (the trend tiers, each a horizontal bar) —
// the calibration "picture" the prose ladder describes. Drift-safe: rebuilt from the
// report on every inject, --check keeps it in sync. Inline-styled bar widths; uses the
// page's tokens (var) so it dark-adapts.
function reliabilityChart(es) {
  const t = report.trend.tiers;
  const p = (x) => Math.round(x * 100);
  const rows = [
    [es ? 'Señales débiles' : 'Weak calls', t.low.hitRate],
    [es ? 'Señales intermedias' : 'Middling calls', t.medium.hitRate],
    [es ? 'Señales fuertes' : 'Strong calls', t.high.hitRate],
  ];
  const bars = rows.map(([lab, v]) =>
    `<div class="ci-rel__row"><span class="ci-rel__lab">${lab}</span><span class="ci-rel__track"><span class="ci-rel__bar" style="width:${p(v)}%"></span></span><span class="ci-rel__val">${p(v)}%</span></div>`).join('');
  const cap = es
    ? `Cada nivel más fuerte acierta más a menudo — y todos superan la línea base sin habilidad del ${p(report.trend.baseline)}%.`
    : `Each stronger tier verifies more often — and all clear the ${p(report.trend.baseline)}% no-skill baseline.`;
  const alt = es
    ? `Confiabilidad de la flecha por fuerza de señal: débiles ${p(t.low.hitRate)}%, intermedias ${p(t.medium.hitRate)}%, fuertes ${p(t.high.hitRate)}%, todas por encima de la línea base del ${p(report.trend.baseline)}%.`
    : `Trend-arrow reliability by signal strength: weak ${p(t.low.hitRate)}%, middling ${p(t.medium.hitRate)}%, strong ${p(t.high.hitRate)}%, all above the ${p(report.trend.baseline)}% baseline.`;
  return `<figure class="ci-rel" role="img" aria-label="${alt}">${bars}<figcaption>${cap}</figcaption></figure>`;
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
