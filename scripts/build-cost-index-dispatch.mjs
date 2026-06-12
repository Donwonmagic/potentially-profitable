/* build-cost-index-dispatch.mjs — the weekly Cost Index write-up.
 *
 * Turns the scheduled measured-index refresh (data/cost-index.json) into an honest,
 * dated dispatch: where the basket stands, which ingredients are flashing a re-price
 * or watch signal, the biggest gaps from each item's tracked baseline, and the driver
 * context (feed/diesel) behind the moves. Every number is the measured index's own
 * read — nothing invented — so it stays inside the fact gate.
 *
 * HONESTY: trend.pct is each ingredient's read vs ITS OWN tracked baseline window, not a
 * week-over-week delta (we don't archive weekly snapshots yet). So the framing is a
 * state-of-play "what's flashing this week", never "X moved Y% since last week".
 *
 *   node scripts/build-cost-index-dispatch.mjs --dry-run   # print the computed narrative, write nothing
 *   node scripts/build-cost-index-dispatch.mjs             # (later) emit the dated dispatch + register it
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
// The SAME predicate the hub uses to decide a live reading vs an "expanding
// coverage" page — so the email never flags an ingredient the hub can't show.
const { isShippable } = require('../tools/_shared/cost-confidence.js');
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const arg = (f) => process.argv.includes(f);
const pct = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;

// ---- compute the week's insight from the measured index --------------------
function computeInsight() {
  const ci = rd('data/cost-index.json');
  const labels = (rd('data/cost-index-labels.json').labels) || {};
  const driverNames = (rd('data/cost-index-labels.json').drivers) || {};
  const name = (k) => (labels[k] && labels[k].en) || k;
  const nameEs = (k) => (labels[k] && (labels[k].es || labels[k].en)) || k;

  const items = [];
  for (const [key, r] of Object.entries(ci.ingredients || {})) {
    const p = (r.points || [])[0] || {};   // points[0] is the CURRENT read (the hub's canonical point); later entries are older baseline
    const t = p.trend || {};
    const f = r.flag || {};
    if (typeof t.pct !== 'number') continue;
    // Only ingredients that earn a live reading on the hub — never flag an item
    // a clicked-through subscriber would find under "expanding coverage".
    if (!isShippable(p)) continue;
    items.push({
      key, name: name(key), nameEs: nameEs(key), pct: t.pct, dir: t.dir || (t.pct > 0 ? 'up' : t.pct < 0 ? 'down' : 'flat'),
      verdict: f.verdict || null, bias: f.actionBias || null, reason: f.reason || null,
      confidence: p.confidence || null, seasonal: !!(labels[key] && labels[key].seasonal)
    });
  }

  const up = items.filter((i) => i.dir === 'up').length;
  const down = items.filter((i) => i.dir === 'down').length;
  const flat = items.length - up - down;

  // Actionable signals first (the calibrated suggestion, low-regret order): re-price > watch.
  const reprice = items.filter((i) => i.bias === 're-price').sort((a, b) => b.pct - a.pct);
  const watch = items.filter((i) => i.bias === 'watch').sort((a, b) => b.pct - a.pct);

  // Biggest gaps from baseline, both directions (the "movers").
  const risers = items.filter((i) => i.dir === 'up').sort((a, b) => b.pct - a.pct).slice(0, 4);
  const fallers = items.filter((i) => i.dir === 'down').sort((a, b) => a.pct - b.pct).slice(0, 4);

  // Driver context — only inputs with a named lead set AND a sane move (diesel/electricity
  // come through with empty leads + artifact %, so they're filtered out as not-credible).
  const drivers = Object.entries(ci.drivers || {}).map(([dk, d]) => ({
    key: dk, name: (driverNames[dk] && driverNames[dk].en) || dk,
    nameEs: (driverNames[dk] && (driverNames[dk].es || driverNames[dk].en)) || dk,
    pct: (d.trend || {}).pct, dir: (d.trend || {}).dir, leads: (d.leads || []).map(name)
  })).filter((d) => typeof d.pct === 'number' && d.leads.length > 0 && Math.abs(d.pct) < 1);

  // "Week of" = the freshest read across the panel (not the first item's).
  const asOfs = [];
  for (const r of Object.values(ci.ingredients || {})) { const a = ((r.points || [])[0] || {}).asOf; if (a) asOfs.push(a); }
  const asOf = asOfs.sort().slice(-1)[0] || ci._lastReviewed || ci.generatedAt || new Date().toISOString().slice(0, 10);
  const basket = ci.basket || null;

  return { asOf, count: items.length, up, down, flat, reprice, watch, risers, fallers, drivers, basket };
}

// ---- dry-run: print the narrative (no file written) ------------------------
function narrate(ins) {
  const L = [];
  L.push(`MUNTIN RESTAURANT COST INDEX — week of ${ins.asOf}\n`);
  if (ins.basket && typeof ins.basket.pct === 'number')
    L.push(`Basket${ins.basket.asOf ? ` (as of ${ins.basket.asOf})` : ''}: ${pct(ins.basket.pct)} ${ins.basket.dir || ''} (${ins.basket.confidence || '?'} confidence, ${ins.basket.nContributing || ins.count} ingredients).`);
  L.push(`Spread: ${ins.up} of ${ins.count} reading above their tracked baseline, ${ins.down} below, ${ins.flat} flat.\n`);

  L.push('WHAT\'S FLASHING (calibrated suggestions — directional, not advice):');
  if (ins.reprice.length) for (const i of ins.reprice) L.push(`  • RE-PRICE  ${i.name} — ${pct(i.pct)}, ${i.reason || i.verdict || 'structural'}${i.seasonal ? ' (typically eases in season)' : ''}`);
  if (ins.watch.length) for (const i of ins.watch) L.push(`  • WATCH     ${i.name} — ${pct(i.pct)}, ${i.reason || i.verdict || 'emerging'}`);
  if (!ins.reprice.length && !ins.watch.length) L.push('  • Nothing structural this week — the panel reads hold across the board.');
  L.push('');

  L.push('BIGGEST GAPS FROM BASELINE:');
  L.push('  Up:   ' + (ins.risers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('  Down: ' + (ins.fallers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('');

  if (ins.drivers.length) {
    L.push('DRIVER CONTEXT:');
    for (const d of ins.drivers) L.push(`  • ${d.name} ${pct(d.pct)} ${d.dir || ''} — leads ${d.leads.slice(0, 4).join(', ')}${d.leads.length > 4 ? ', …' : ''}`);
  }
  return L.join('\n');
}

const ins = computeInsight();
if (arg('--dry-run') || arg('--json')) {
  if (arg('--json')) console.log(JSON.stringify(ins, null, 2));
  else console.log(narrate(ins));
  process.exit(0);
}
console.log('Dispatch HTML emission is the next step. Run with --dry-run to preview the computed insight.');
console.log(narrate(ins));
