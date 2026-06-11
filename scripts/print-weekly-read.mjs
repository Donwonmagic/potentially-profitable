#!/usr/bin/env node
/**
 * print-weekly-read.mjs — the weekly dispatch digest.
 *
 * Reads the vendored data/cost-index.json and prints the week's
 * headline numbers in writing-ready form: the basket trend, the
 * biggest movers (by blended trend), every ingredient's hold/watch/act
 * flag, confidence, and asOf — so the weekly "basket read" blog post
 * is a fill-in, not a blank page. Prints; never writes.
 *
 * Pair with blog/drafts/weekly-basket-read/README.md (the post
 * playbook). Usage:  node scripts/print-weekly-read.mjs [--es]
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ES = process.argv.includes('--es');
const data = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index.json'), 'utf8'));
// Units live in the bounds map (lb/carton/sack/dozen…), not on the point —
// printing "$80/lb" for a per-carton romaine read would be exactly the kind
// of honest-number-dishonest-label mistake the site exists to prevent.
const bounds = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-bounds.json'), 'utf8')).bounds || {};

const ingredients = data.ingredients || {};
const rows = [];
for (const [key, ing] of Object.entries(ingredients)) {
  const p = Array.isArray(ing.points) ? ing.points[0] : null;
  if (!p) continue;
  const level = p.level || {};
  const trend = p.trend || {};
  const flag = p.flag || ing.flag || {};
  rows.push({
    key,
    asOf: p.asOf || '—',
    median: typeof level.medianCents === 'number' ? (level.medianCents / 100).toFixed(2) : null,
    unit: (bounds[key] && bounds[key].unit) || level.unit || 'lb',
    basis: level.basis || '—',
    pct: typeof trend.pct === 'number' ? trend.pct : null,
    confidence: p.confidence || '—',
    flagClass: flag.class || 'hold',
    flagReason: flag.reason || '',
  });
}

if (!rows.length) {
  console.error('No points in data/cost-index.json — run the weekly refresh first.');
  process.exit(1);
}

const fmtPct = (x) => (x == null ? '—' : (x > 0 ? '+' : '') + (x * 100).toFixed(1) + '%');
const newest = rows.map((r) => r.asOf).sort().at(-1);
const basket = data.basket || {};

const t = ES
  ? { title: 'Lectura semanal de la canasta', asOf: 'datos al', basket: 'Canasta (mediana ponderada)', movers: 'Mayores movimientos', table: 'Tabla completa', flags: { hold: 'mantener', watch: 'vigilar', act: 'actuar' } }
  : { title: 'Weekly basket read', asOf: 'data as of', basket: 'Basket (weighted median)', movers: 'Biggest movers', table: 'Full table', flags: { hold: 'hold', watch: 'watch', act: 'act' } };

console.log(`# ${t.title} — ${t.asOf} ${newest}\n`);
if (typeof basket.pct === 'number') {
  console.log(`${t.basket}: ${fmtPct(basket.pct)}${basket.version ? `  (weights ${basket.version})` : ''}\n`);
}

const movers = rows.filter((r) => r.pct != null).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 5);
console.log(`${t.movers}:`);
for (const m of movers) {
  console.log(`  ${m.key}: ${fmtPct(m.pct)}${m.median ? ` (median $${m.median}/${m.unit}, ${m.basis})` : ''} — ${t.flags[m.flagClass] || m.flagClass}${m.flagReason ? `: ${m.flagReason}` : ''} [${m.confidence}]`);
}

console.log(`\n${t.table}:`);
for (const r of rows.sort((a, b) => a.key.localeCompare(b.key))) {
  console.log(`  ${r.key.padEnd(18)} ${String(fmtPct(r.pct)).padStart(7)}  ${r.median ? ('$' + r.median + '/' + r.unit).padStart(10) : '        —'}  ${String(r.confidence).padEnd(11)} ${t.flags[r.flagClass] || r.flagClass}  (${r.asOf})`);
}
