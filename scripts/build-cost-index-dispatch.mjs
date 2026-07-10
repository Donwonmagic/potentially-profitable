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
 *   node scripts/build-cost-index-dispatch.mjs --json      # print the computed insight as JSON, write nothing
 *   node scripts/build-cost-index-dispatch.mjs --dry-run   # print the computed narrative, write nothing
 *   node scripts/build-cost-index-dispatch.mjs             # emit the dated dispatch at blog/cost-index-week-<asOf>/
 *
 * The default invocation writes one dated post per week, unique by the insight's
 * asOf date. Re-running for the same week overwrites in place and bumps dateModified.
 * It also upserts the post's blog-index card source (data/library-tags.json) — every
 * weekly edition is RETAINED now (the dated editions are the publication's archive),
 * and appended to the longitudinal spine (data/cost-index-editions.json) plus a citable
 * per-week snapshot (cost-index/week-<asOf>.json + .csv). After emission, run the
 * build-chain inject/build scripts (build-cost-index-archive, build-blog-index, build-rss,
 * build-sitemap, build-llms-txt, inject-library-cost-index-hero, inject-* CTAs) so the post
 * registers in the archive, blog index, RSS, sitemap, smart-next, and the post-end CTA.
 * NOTE: do not run sync-includes here — the _includes footer template is stale vs the live
 * count sentinels and would regress them; the generators copy chrome from live donor pages.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
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

// Human labels for the Pressure layer's driving-factor indicators — mirrored from the
// canonical map in tools/_shared/pressure-lab-ui.js (EN side). The dispatch is EN-only,
// so we copy the EN labels rather than import the browser UI module. Keep in sync if a
// new indicator is added there.
const INDICATOR_LABEL = {
  'feed-futures': 'feed (corn/soy) futures', 'broiler-placements': 'broiler chick placements',
  'cattle-on-feed-placements': 'cattle-on-feed placements', 'hogs-market-supply': 'market-hog supply',
  'cold-storage-poultry': 'cold-storage stocks', 'cold-storage-beef': 'cold-storage stocks',
  'cold-storage-pork': 'cold-storage stocks', 'cold-storage-butter': 'cold-storage stocks',
  'cold-storage-cheese': 'cold-storage stocks', 'milk-production': 'milk production',
  'ams-shipments': 'produce shipments', 'onion-shipments': 'shipment volume',
  'lettuce-shipments': 'shipment volume', 'tomato-shipments': 'shipment volume',
  'potato-shipments': 'shipment volume', 'onion-imports': 'import share', 'lettuce-imports': 'import share',
  'tomato-imports': 'import share', 'potato-imports': 'import share', 'onion-pace': 'shipments vs last year',
  'lettuce-pace': 'shipments vs last year', 'tomato-pace': 'shipments vs last year',
  'potato-pace': 'shipments vs last year', 'freeze-alert': 'freeze warnings', 'drought-ca-az': 'drought (CA/AZ)',
  'drought-fl-ca': 'drought (FL/CA)', 'drought-id': 'drought (Idaho)', 'drought': 'drought',
  'crop-condition': 'crop condition', 'onion-transition': 'growing-region transition',
  'lettuce-transition': 'growing-region transition', 'tomato-transition': 'growing-region transition',
  'potato-transition': 'growing-region transition', 'feed-grain': 'feed grain (corn)', 'diesel': 'diesel / freight',
};
const indLabel = (id) => INDICATOR_LABEL[id] || id;

// ---- compute the week's insight from the measured index --------------------
// Pull the dominant driving factor (the highest-weight contributor) and lead time from a
// Pressure read — the inferred-direction layer (data/cost-pressure.json), never a price.
function pressureRead(items, key) {
  const it = items && items[key];
  if (!it || !it.direction || it.direction === 'flat') return null;
  const top = (it.contributors || []).slice().sort((a, b) => (b.weight || 0) - (a.weight || 0))[0];
  if (!top) return null;
  // ADR-014 §4: cold-storage stocks are a COINCIDENT supply-context read, not a
  // leading indicator — never attach a lead-lag ("N-week lead") phrase to them.
  const coincident = top.coincident === true || top.source === 'nass-cold-storage';
  // Singular unit — the lead reads adjectivally ("a 16–26 week lead").
  const lead = (!coincident && top.lead && typeof top.lead.min === 'number')
    ? `${top.lead.min}–${top.lead.max} ${top.lead.unit || 'week'}`
    : null;
  return { dir: it.direction, confidence: it.confidence || null, force: indLabel(top.indicator), lead, coincident, asOf: it.as_of || it.asOf || null };
}

function computeInsight() {
  const ci = rd('data/cost-index.json');
  // Disclosable versions of the two things that can break commensurability between
  // editions: the frozen basket weights and the methodology. The longitudinal spine
  // (cost-index-editions.json) records these so a week-over-week claim is only ever
  // made across editions built with the SAME ruler.
  let basketWeightsVersion = null, methodologyVersion = null;
  try { basketWeightsVersion = rd('data/cost-basket-weights.json')._version || null; } catch { /* optional */ }
  try { methodologyVersion = JSON.parse(readFileSync(path.join(repoRoot, 'cost-index/methodology.json'), 'utf8')).methodologyVersion || null; } catch { /* optional */ }
  const labels = (rd('data/cost-index-labels.json').labels) || {};
  // The Pressure layer: inferred building/easing direction per staple from public lead
  // indicators (feed, placements, cold storage, shipments, drought, diesel). Optional —
  // preview-status, may be absent; the dispatch degrades to "no pressure read" cleanly.
  let pressureItems = {}, pressureAsOf = null;
  try { const pf = rd('data/cost-pressure.json'); pressureItems = pf.items || {}; pressureAsOf = pf.asOf || pf.generatedAt || null; } catch { /* optional */ }
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
    // The measured dollar LEVEL behind the percentage — so the write-up can ground
    // every "+4.1%" in a real wholesale price ("about $12.14/lb"), not an abstraction.
    const lvl = p.level || {};
    items.push({
      key, name: name(key), nameEs: nameEs(key), pct: t.pct, dir: t.dir || (t.pct > 0 ? 'up' : t.pct < 0 ? 'down' : 'flat'),
      verdict: f.verdict || null, bias: f.actionBias || null, reason: f.reason || null,
      confidence: p.confidence || null, seasonal: !!(labels[key] && labels[key].seasonal),
      // Per-ingredient sustained-elevation counter (already measured in cost-index.json).
      // Surfacing it is the first honest longitudinal claim — needs no snapshot archive.
      elevatedWeeks: typeof f.elevatedWeeks === 'number' ? f.elevatedWeeks : null,
      medianCents: typeof lvl.medianCents === 'number' ? lvl.medianCents : null,
      rangeCents: Array.isArray(lvl.rangeCents) && lvl.rangeCents.length === 2 ? lvl.rangeCents : null,
      unit: (labels[key] && labels[key].unit_en) || null,
      unitEs: (labels[key] && labels[key].unit_es) || null,
      pressure: pressureRead(pressureItems, key),
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

  // Decompose the basket so the headline number is a story, not a figure to take on
  // faith: each staple's CONTRIBUTION is its weight × its own read (points = weight*pct,
  // in the same units as the basket %). A heavy item barely moving anchors the basket;
  // a light item moving hard can still swing it. We use the basket's OWN contributor
  // reads (not the live per-item trend) so the parts reconcile to the whole it explains.
  const contributors = ((basket && basket.contributors) || [])
    .filter((c) => typeof c.pct === 'number' && typeof c.weight === 'number')
    .map((c) => ({
      key: c.ingredient, name: name(c.ingredient), nameEs: nameEs(c.ingredient),
      pct: c.pct, weight: c.weight, points: c.weight * c.pct, pressure: pressureRead(pressureItems, c.ingredient),
    }))
    .sort((a, b) => Math.abs(b.points) - Math.abs(a.points));
  const heaviest = contributors.length
    ? contributors.reduce((m, c) => (c.weight > m.weight ? c : m), contributors[0]) : null;
  // Biggest pusher / easer by signed contribution (not the smallest by magnitude).
  const topPush = contributors.filter((c) => c.points > 0).sort((a, b) => b.points - a.points)[0] || null;
  const topEase = contributors.filter((c) => c.points < 0).sort((a, b) => a.points - b.points)[0] || null;

  // The driving-factors digest: every staple that carries a pressure read, building
  // first then easing, each with the named lead force behind it. This is the "why" the
  // dispatch threads through — inferred direction from public lead indicators, no price.
  const pressure = Object.keys(pressureItems)
    .map((k) => { const r = pressureRead(pressureItems, k); return r ? { key: k, name: name(k), ...r } : null; })
    .filter(Boolean)
    .sort((a, b) => (a.dir === b.dir ? 0 : a.dir === 'building' ? -1 : 1));

  return { asOf, count: items.length, up, down, flat, reprice, watch, risers, fallers, drivers, basket, contributors, heaviest, topPush, topEase, pressure, pressureAsOf, items, basketWeightsVersion, methodologyVersion };
}

// ---- longitudinal spine: the append-only edition archive -------------------
// data/cost-index-editions.json is the publication's time series. One frozen entry per
// asOf, never deleted (same immutability rule as cost-revisions.json). Each entry records
// the basket reading, the spread, every panel member's read, and the two version stamps —
// so an honest week-over-week is computable ONLY across commensurable editions, and is
// withheld (with a stated reason) across a re-weight or a re-anchor.
const EDITIONS_FILE = 'data/cost-index-editions.json';

function loadEditions() {
  try { return rd(EDITIONS_FILE); }
  catch { return { _doc: 'Append-only archive of weekly Cost Index dispatch snapshots. One entry per asOf; never overwrite a prior entry except via a dated revision. The publication\'s citable time series.', _version: '1.0', editions: [] }; }
}

// Build the frozen snapshot object for one edition from a computed insight.
function editionFromInsight(ins, { reconstructed = false, publishedAt = null } = {}) {
  const b = ins.basket || {};
  const reads = {};
  for (const it of (ins.items || [])) if (typeof it.pct === 'number') reads[it.key] = it.pct;
  return {
    asOf: ins.asOf,
    publishedAt: publishedAt || `${ins.asOf}T13:00:00-04:00`,
    ...(reconstructed ? { reconstructed: true } : {}),
    basketWeightsVersion: ins.basketWeightsVersion || null,
    methodologyVersion: ins.methodologyVersion || null,
    basket: {
      pct: typeof b.pct === 'number' ? b.pct : null,
      dir: b.dir || null,
      confidence: b.confidence || null,
      asOf: b.asOf || null,
      nContributing: b.nContributing || null,
      contributors: (ins.contributors || []).map((c) => ({ ingredient: c.key, pct: c.pct, weight: c.weight, points: c.points })),
    },
    spread: { above: ins.up, below: ins.down, flat: ins.flat, panel: ins.count },
    flags: [...ins.reprice, ...ins.watch].map((i) => ({ ingredient: i.key, name: i.name, pct: i.pct, bias: i.bias, medianCents: i.medianCents, elevatedWeeks: i.elevatedWeeks })),
    panelMembers: (ins.items || []).map((i) => i.key),
    reads,
    drivers: (ins.drivers || []).map((d) => ({ key: d.key, pct: d.pct, dir: d.dir })),
    pressureAsOf: ins.pressureAsOf || null,
    ...(ins.editorsNote ? { editorsNote: ins.editorsNote } : {}),
  };
}

function upsertEdition(archive, ins) {
  const entry = editionFromInsight(ins);
  archive.editions = (archive.editions || []).filter((e) => e.asOf !== ins.asOf);
  archive.editions.push(entry);
  archive.editions.sort((a, b) => (a.asOf < b.asOf ? -1 : a.asOf > b.asOf ? 1 : 0));
  writeFileSync(path.join(repoRoot, EDITIONS_FILE), JSON.stringify(archive, null, 2) + '\n');
  return entry;
}

// The newest archived edition strictly BEFORE this asOf — the honest prior reading.
function priorEdition(archive, asOf) {
  const before = (archive.editions || []).filter((e) => e.asOf < asOf);
  return before.length ? before[before.length - 1] : null;
}

// Compute the honest week-over-week story. The whole point is the GUARD: a basket delta is
// only reported across editions built with the same weights AND a refreshed basket anchor;
// otherwise the move is withheld and the reason stated. Per-ingredient deltas need the prior
// edition to carry a reads-map (reconstructed basket-only seeds don't, so they degrade clean).
function computeWoW(ins, prev) {
  if (!prev) return { state: 'first' };
  const wv = ins.basketWeightsVersion, pv = prev.basketWeightsVersion;
  if (wv && pv && wv !== pv) return { state: 'reweighted', from: pv, to: wv };
  const curAnchor = (ins.basket || {}).asOf, prevAnchor = (prev.basket || {}).asOf;
  const curPct = (ins.basket || {}).pct, prevPct = (prev.basket || {}).pct;
  let basket;
  if (curAnchor && prevAnchor && curAnchor === prevAnchor) {
    basket = { state: 'anchor-unchanged', anchor: curAnchor };
  } else if (typeof curPct === 'number' && typeof prevPct === 'number') {
    basket = { state: 'moved', from: prevPct, to: curPct, deltaPts: curPct - prevPct, fromAsOf: prevAnchor, toAsOf: curAnchor };
  } else {
    basket = { state: 'unavailable' };
  }
  // Per-ingredient moves for the flagged set, where the prior edition can back them.
  const reads = prev.reads || {};
  const ingredient = [];
  if (Object.keys(reads).length) {
    for (const i of ins.reprice.concat(ins.watch)) {
      if (typeof reads[i.key] === 'number' && typeof i.pct === 'number') {
        ingredient.push({ key: i.key, name: i.name, from: reads[i.key], to: i.pct, deltaPts: i.pct - reads[i.key] });
      }
    }
  }
  return { state: 'available', prevAsOf: prev.asOf, prevReconstructed: !!prev.reconstructed, basket, ingredient };
}

// ---- dry-run: print the narrative (no file written) ------------------------
function narrate(ins) {
  const L = [];
  L.push(`MUNTIN RESTAURANT COST INDEX — week of ${ins.asOf}\n`);
  if (ins.basket && typeof ins.basket.pct === 'number')
    L.push(`Basket${ins.basket.asOf ? ` (as of ${ins.basket.asOf})` : ''}: ${pct(ins.basket.pct)} ${ins.basket.dir || ''} (${ins.basket.confidence || '?'} confidence, ${ins.basket.nContributing || ins.count} ingredients).`);
  L.push(`Spread: ${ins.up} of ${ins.count} reading above their tracked baseline, ${ins.down} below, ${ins.flat} flat.\n`);

  if (ins.contributors && ins.contributors.length) {
    L.push('WHAT\'S MOVING THE BASKET (weight × each staple\'s own read = contribution):');
    for (const c of ins.contributors.slice(0, 6))
      L.push(`  • ${c.name} (${Math.round(c.weight * 100)}% of basket, ${pct(c.pct)}) → ${(c.points >= 0 ? '+' : '-')}${Math.abs(c.points * 100).toFixed(1)} pts`);
    L.push('');
  }

  L.push('WHAT\'S FLASHING (calibrated suggestions — directional, not advice):');
  const dol = (i) => { const d = dollarPhrase(i); return d ? `, ${d}` : ''; };
  if (ins.reprice.length) for (const i of ins.reprice) L.push(`  • RE-PRICE  ${i.name} — ${pct(i.pct)}${dol(i)}, ${i.reason || i.verdict || 'structural'}${i.seasonal ? ' (typically eases in season)' : ''}`);
  if (ins.watch.length) for (const i of ins.watch) L.push(`  • WATCH     ${i.name} — ${pct(i.pct)}${dol(i)}, ${i.reason || i.verdict || 'emerging'}`);
  if (!ins.reprice.length && !ins.watch.length) L.push('  • Nothing structural this week — the panel reads hold across the board.');
  L.push('');

  L.push('BIGGEST GAPS FROM BASELINE:');
  L.push('  Up:   ' + (ins.risers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('  Down: ' + (ins.fallers.map((i) => `${i.name} ${pct(i.pct)}`).join(' · ') || '—'));
  L.push('');

  if (ins.pressure && ins.pressure.length) {
    L.push('WHAT\'S BEHIND THE MOVES (pressure layer — inferred direction on a lead, no price):');
    for (const p of ins.pressure) L.push(`  • ${p.name} — ${p.dir}, led by ${p.force}${p.lead ? ` (${p.lead} lead)` : p.coincident ? ' (concurrent)' : ''}${p.confidence ? `, ${p.confidence} conf` : ''}`);
    L.push('');
  }

  if (ins.drivers.length) {
    L.push('FEED DRIVER CONTEXT:');
    for (const d of ins.drivers) L.push(`  • ${d.name} ${pct(d.pct)} ${d.dir || ''} — leads ${d.leads.slice(0, 4).join(', ')}${d.leads.length > 4 ? ', …' : ''}`);
  }
  return L.join('\n');
}

// ---- HTML emission ---------------------------------------------------------
// The donor supplies byte-identical chrome (head boilerplate, batch banner,
// platform-script + nav, footer, tail scripts) so sync-includes and every
// idempotency gate accept the generated post without a rewrite.
const DONOR = 'blog/ai-local-pack-restaurant-phone-calls-2026/index.html';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const widthOf = (p, max) => (max > 0 ? Math.min(1, Math.abs(p) / max) : 0);
const fmtPct = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)}%`; // − for display
const fmtPctPlain = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x * 100).toFixed(1)}%`; // ascii, for narration
const money = (cents) => `$${(cents / 100).toFixed(2)}`;
const fmtPts = (x) => `${x >= 0 ? '+' : '−'}${Math.abs(x * 100).toFixed(1)} pts`; // basket contribution, display
const fmtPtsPlain = (x) => `${x >= 0 ? '+' : '-'}${Math.abs(x * 100).toFixed(1)} points`; // for narration
// Ground a percentage in the measured wholesale dollar level behind it, so a "+4.1%"
// reads as a real price ("about $12.14/lb, range $11.72–$12.56"). Empty when the item
// carries no level — never invents one.
function dollarPhrase(i, { es = false } = {}) {
  if (!i || i.medianCents == null) return '';
  const u = (es ? i.unitEs : i.unit) ? `/${es ? i.unitEs : i.unit}` : '';
  // A degenerate range (lo === hi) is a single observation, not a range — printing it as
  // "$5.51–$5.51" reads as false precision. Suppress the range and say single-source.
  const degenerate = i.rangeCents && i.rangeCents[0] === i.rangeCents[1];
  const range = (i.rangeCents && !degenerate)
    ? ` (${es ? 'rango' : 'range'} ${money(i.rangeCents[0])}–${money(i.rangeCents[1])})`
    : (degenerate ? (es ? ' (fuente única)' : ' (single-source)') : '');
  return `${es ? 'unos' : 'about'} ${money(i.medianCents)}${u} ${es ? 'mayorista' : 'wholesale'}${range}`;
}

// Sign-aware flag reason. The measured `reason` string in cost-index.json is keyed to the
// verdict, so a NEGATIVE re-price read inherits "the increase looks real" — a contradiction
// the audio renderer would speak aloud. Override when the sign disagrees with the wording.
function flagReason(i) {
  let r = i.reason || i.verdict || 'a move worth tracking';
  if (i.pct < 0 && /increase/i.test(r)) {
    r = i.bias === 're-price'
      ? 'reading well below baseline and holding — the move looks structural'
      : 'a downward move worth tracking — watch the next read';
  }
  return r;
}
// "elevated N weeks running" — the per-ingredient longitudinal claim, when the counter
// supports it (≥2). Honest because it is the measured sustained-elevation count, not a delta.
function elevatedClause(i) {
  return (typeof i.elevatedWeeks === 'number' && i.elevatedWeeks >= 2)
    ? ` It has flagged ${i.elevatedWeeks} weeks running.` : '';
}
// Render a Pressure read as a clause naming the force and its lead time, e.g.
// "the pressure read is building, led by cattle-on-feed placements on a 16–26 weeks lead".
function pressurePhrase(p) {
  if (!p) return '';
  const lead = p.lead ? ` on a ${p.lead} lead` : p.coincident ? ' as a concurrent supply read' : '';
  return `the pressure read is <strong>${esc(p.dir)}</strong>, led by ${esc(p.force)}${lead}`;
}

function sliceDonor(html, startMarker, endMarker, { includeStart = true, includeEnd = true } = {}) {
  const s = html.indexOf(startMarker);
  const e = html.indexOf(endMarker, s + startMarker.length);
  if (s === -1 || e === -1) throw new Error(`donor missing marker ${startMarker} / ${endMarker}`);
  return html.slice(includeStart ? s : s + startMarker.length, includeEnd ? e + endMarker.length : e);
}

function buildBars(ins) {
  const movers = [...ins.risers, ...ins.fallers]
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))
    .slice(0, 6);
  const max = Math.max(...movers.map((m) => Math.abs(m.pct)), 0.0001);
  const rows = movers.map((m) => {
    const tone = m.pct >= 0 ? 'rust' : 'teal';
    const w = widthOf(m.pct, max).toFixed(3);
    return `          <div class="viz-bars__row">
            <p class="viz-bars__label">${esc(m.name)}</p>
            <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-bars__num">${fmtPct(m.pct)}</p>
          </div>`;
  }).join('\n');

  const narr = movers.map((m) => `${m.name} ${fmtPctPlain(m.pct)} vs its tracked baseline`).join('; ');
  const alt = `The widest gaps from baseline across the tracked panel this week, with bars scaled so the largest mover fills the track. Rust bars are ingredients reading above their own baseline window (cost building); teal bars are reading below it (cost easing). Each percentage is a state-of-play read versus that ingredient's own tracked baseline, not a week-over-week change. Reading the bars: ${narr}.`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-bars">
          <p class="viz-bars__title">Widest gaps from baseline this week (bars scaled to the largest mover; rust is building cost, teal is easing)</p>
${rows}
          <p class="viz-bars__note">Each bar is a read versus <strong>that ingredient's own tracked baseline window</strong> &mdash; a state-of-play snapshot of what's flashing, not a move since last week.</p>
        </div>
        <figcaption>The widest gaps from each ingredient's tracked baseline, week of ${ins.asOf}. Rust bars are building cost; teal bars are easing.</figcaption>
      </figure>`;
}

function buildRings(ins) {
  const total = ins.count || (ins.up + ins.down + ins.flat);
  const upScore = total > 0 ? Math.round((ins.up / total) * 100) : 0;
  const basket = ins.basket || {};
  const basketPct = typeof basket.pct === 'number' ? basket.pct : null;
  const basketScore = basketPct == null ? 0 : Math.min(100, Math.round((Math.abs(basketPct) / 0.5) * 100));
  const basketBand = basketPct == null ? 'warn' : basketPct > 0 ? 'bad' : 'good';

  const alt = `Two readings of where the panel sits this week. The first ring shows the spread: ${ins.up} of ${total} tracked ingredients are reading above their own baseline window, ${ins.down} below, and ${ins.flat} flat. The second ring shows the weighted basket${basket.asOf ? `, as of ${basket.asOf}` : ''}: it reads ${basketPct == null ? 'no value this week' : fmtPctPlain(basketPct)} against its baseline at ${basket.confidence || 'unstated'} confidence across ${basket.nContributing || total} contributing ingredients. Both are state-of-play reads versus each baseline window, never a move since last week.`;

  const spreadRing = `          <div class="viz-ring" data-band="${ins.up > ins.down ? 'bad' : 'good'}" style="--score:${upScore};">
            <svg class="viz-ring__svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="ring-spread" focusable="false">
              <title id="ring-spread">${ins.up} of ${total} ingredients reading above baseline</title>
              <circle class="viz-ring__track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
              <circle class="viz-ring__fill" cx="60" cy="60" r="52" fill="none" stroke-width="8" transform="rotate(-90 60 60)"/>
              <text class="viz-ring__num" x="60" y="60" text-anchor="middle">${ins.up}/${total}</text>
            </svg>
            <p class="viz-ring__label"><strong>Above baseline</strong>${ins.down} below &middot; ${ins.flat} flat</p>
          </div>`;
  const basketRing = `          <div class="viz-ring" data-band="${basketBand}" style="--score:${basketScore};--delay:120ms;">
            <svg class="viz-ring__svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="ring-basket" focusable="false">
              <title id="ring-basket">Weighted basket reads ${basketPct == null ? 'no value' : fmtPctPlain(basketPct)} against baseline</title>
              <circle class="viz-ring__track" cx="60" cy="60" r="52" fill="none" stroke-width="8"/>
              <circle class="viz-ring__fill" cx="60" cy="60" r="52" fill="none" stroke-width="8" transform="rotate(-90 60 60)"/>
              <text class="viz-ring__num" x="60" y="60" text-anchor="middle">${basketPct == null ? '&mdash;' : fmtPct(basketPct)}</text>
            </svg>
            <p class="viz-ring__label"><strong>Weighted basket</strong>${basket.confidence || 'n/a'} confidence &middot; ${basket.nContributing || total} ingredients</p>
          </div>`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-rings">
${spreadRing}
${basketRing}
        </div>
        <figcaption>Where the panel sits, week of ${ins.asOf}: the spread of reads above baseline, and the weighted basket's own reading. Both are reads versus each baseline window, not a week-over-week move.</figcaption>
      </figure>`;
}

function buildFlow(ins) {
  if (!ins.drivers.length) return '';
  const d = ins.drivers[0];
  const leads = d.leads.slice(0, 4).join(', ');
  const dir = d.dir === 'down' ? 'easing' : 'building';
  const tone = d.dir === 'down' ? 'teal' : 'rust';
  const alt = `How the feed and input drivers connect to the proteins on the panel. Step one: ${d.name} reads ${fmtPctPlain(d.pct)} against its baseline this week. Step two: ${d.name} is a tracked input behind ${d.leads.length} of the proteins on the panel, including ${leads}. Step three: a feed read that is ${dir} flows through to those proteins on a lag, which is the context behind their own reads above or below baseline this week. The chain is directional context drawn from the measured index, never a forecast and never a delivered price.`;
  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-flow">
          <ol class="viz-flow__list">
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">1</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">${esc(d.name)} reads ${fmtPct(d.pct)}</p>
                <p class="viz-flow__detail">A tracked feed input, read against its own baseline window this week.</p>
              </div>
            </li>
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">2</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">It sits behind ${d.leads.length} proteins on the panel</p>
                <p class="viz-flow__detail">Including ${esc(leads)} &mdash; the items whose cost the feed market helps set.</p>
              </div>
            </li>
            <li class="viz-flow__step" data-tone="${tone}">
              <span class="viz-flow__num">3</span>
              <div class="viz-flow__body">
                <p class="viz-flow__title">The read flows through on a lag</p>
                <p class="viz-flow__detail">A ${dir} feed market is the context behind those proteins' own reads &mdash; directional, not a forecast.</p>
              </div>
            </li>
          </ol>
        </div>
        <figcaption>The feed-to-protein chain behind the reads for the week of ${ins.asOf}. Directional context from the measured index, never a forecast.</figcaption>
      </figure>`;
}

function buildContrib(ins) {
  const rows = (ins.contributors || []).slice(0, 6);
  if (rows.length < 2) return '';
  const max = Math.max(...rows.map((c) => Math.abs(c.points)), 0.0001);
  const barRows = rows.map((c) => {
    const tone = c.points >= 0 ? 'rust' : 'teal';
    const w = widthOf(c.points, max).toFixed(3);
    const wpct = Math.round(c.weight * 100);
    return `          <div class="viz-bars__row">
            <p class="viz-bars__label">${esc(c.name)} <span style="opacity:.6">(${wpct}% of basket)</span></p>
            <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-bars__num">${fmtPts(c.points)}</p>
          </div>`;
  }).join('\n');

  const narr = rows.map((c) => `${c.name}, ${Math.round(c.weight * 100)} percent of the basket and reading ${fmtPctPlain(c.pct)} against baseline, contributes ${fmtPtsPlain(c.points)}`).join('; ');
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const alt = `What makes up the basket reading this week, ingredient by ingredient. The weighted basket reads ${basketPlain} against baseline, and that single number is the sum of each staple's weight times its own read. Rust bars push the basket up, teal bars pull it down; the bars are scaled so the largest contributor fills the track. ${narr}. The contributions sum, with offsets, to the headline basket figure — a couple of movers usually do most of the talking while the steady staples hold it down.`;

  return `      <figure class="viz-figure article-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-bars">
          <p class="viz-bars__title">What's moving the basket this week (each staple's weight × its own read; rust pushes the basket up, teal pulls it down)</p>
${barRows}
          <p class="viz-bars__note">A "point" is one one-hundredth of the basket percentage. Each bar is <strong>weight × that ingredient's read</strong> &mdash; a heavy staple barely moving anchors the basket, a light one moving hard can still swing it.</p>
        </div>
        <figcaption>The basket figure for the week of ${ins.asOf}, decomposed: each staple's contribution is its weight times its own read. Rust pushes up, teal pulls down.</figcaption>
      </figure>`;
}

function repriceList(ins) {
  const items = [];
  for (const i of ins.reprice) items.push({ tag: 'Re-price', i });
  for (const i of ins.watch) items.push({ tag: 'Watch', i });
  if (!items.length) return '<p>Nothing structural is flashing this week &mdash; the panel reads hold across the board. That is its own signal: hold your prices and keep watching.</p>';
  const lis = items.map(({ tag, i }) => {
    const seasonal = i.seasonal ? ' This one is seasonal, so it eases when the season turns.' : '';
    const dollar = dollarPhrase(i);
    const grounded = dollar ? ` &mdash; ${dollar}` : '';
    return `        <li><strong>${tag} &mdash; ${esc(i.name)}.</strong> It reads ${fmtPct(i.pct)} against its baseline${grounded}; ${esc(flagReason(i))}.${elevatedClause(i)}${seasonal}</li>`;
  }).join('\n');
  return `      <ul>\n${lis}\n      </ul>`;
}

function upsertLibraryTags(slug, asOf, basketPlain, ins) {
  // build-blog-index.mjs renders the blog index card from this entry. Every weekly
  // dispatch is RETAINED now (the prior prune-to-one drifted from the ItemList and left
  // half-pruned editions) — the dated editions are the publication's archive. They carry
  // hide_from_recents so they don't flood the homepage "Recently Added" strip; the Cost
  // Index archive page (build-cost-index-archive.mjs) is their canonical home.
  const f = path.join(repoRoot, 'data/library-tags.json');
  const data = JSON.parse(readFileSync(f, 'utf8'));
  data.blog_posts = data.blog_posts || {};
  data.blog_posts[slug] = {
    topics: ['operations-margin'],
    title: `Restaurant Cost Index: where the basket stands, week of ${asOf}`,
    dek: `The weekly read on wholesale ingredient costs: the basket sits at ${basketPlain} against baseline, ${ins.up} of ${ins.count} ingredients above their tracked window. What's flashing a re-price or watch signal, and the feed context behind it. Public wholesale levels, never your delivered price.`,
    date: asOf,
    read_min: 5,
    hide_from_recents: true,
  };
  writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
}

// Per-edition machine snapshot — the citable dataset behind each dispatch. Mirrors the
// feed.json conventions (CC0, sourced, never a forecast) so an analyst or AI pulls a
// stable, addressable record per week, not prose scraped from HTML.
function writePerWeekData(ins) {
  const dir = path.join(repoRoot, 'cost-index');
  mkdirSync(dir, { recursive: true });
  const edition = editionFromInsight(ins);
  const json = {
    _doc: 'Frozen weekly snapshot of the Muntin Restaurant Cost Index dispatch. Public wholesale levels, never delivered prices. Measured levels only — never a forecast.',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    methodology: 'https://muntin.digital/cost-index/methodology/',
    edition: 'https://muntin.digital/blog/cost-index-week-' + ins.asOf + '/',
    ...edition,
  };
  writeFileSync(path.join(dir, `week-${ins.asOf}.json`), JSON.stringify(json, null, 2) + '\n');

  // Flat CSV mirror (one row per panel ingredient), matching the series.csv convention.
  const rows = [['ingredient', 'pct_vs_baseline', 'direction', 'flag', 'median_cents', 'elevated_weeks']];
  const flagByKey = {};
  for (const fl of edition.flags) flagByKey[fl.ingredient] = fl;
  for (const it of (ins.items || [])) {
    const fl = flagByKey[it.key] || {};
    rows.push([it.key, (it.pct).toFixed(4), it.dir || '', fl.bias || '', it.medianCents == null ? '' : it.medianCents, it.elevatedWeeks == null ? '' : it.elevatedWeeks]);
  }
  const csv = rows.map((r) => r.map((c) => /[",\n]/.test(String(c)) ? `"${String(c).replace(/"/g, '""')}"` : String(c)).join(',')).join('\n') + '\n';
  writeFileSync(path.join(dir, `week-${ins.asOf}.csv`), csv);
}

// ---- prose builders for the longitudinal + citability layers ---------------
// The honesty paragraph, now WoW-aware. When a commensurable prior edition exists it ADDS
// the move-since-last-edition; when the basket re-anchored or re-weighted it WITHHOLDS the
// number and says why. Withholding, stated plainly, is itself the trust signal.
function honestyPara(ins, wow, basketPlain) {
  const fixed = `And every figure is a <strong>public wholesale level, never your delivered price</strong>: this is a read on the <a href="/glossary/cost-index/">cost index</a>, not a line for your <a href="/glossary/food-cost/">food cost</a> sheet. The point is direction and gap, not a number to paste into a cost sheet.`;
  let lead;
  if (!wow || wow.state === 'first') {
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em> &mdash; a state-of-play "what's flashing this week." This is the first edition written into the dispatch's permanent archive, so from next week the panel can also show the honest move since the prior edition; this week it reports the standing gap.`;
  } else if (wow.state === 'reweighted') {
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em>. The basket weights changed version this edition (${esc(wow.from)} &rarr; ${esc(wow.to)}), so a week-over-week basket number would compare two different rulers &mdash; I am not printing one. The standing gap is below.`;
  } else {
    // state available
    const b = wow.basket || {};
    let bsent;
    if (b.state === 'anchor-unchanged') {
      bsent = `The basket's data anchor has not refreshed since the prior edition (still ${esc(b.anchor)}), so there is no new basket move to report &mdash; rather than invent one, I say so. The weekly panel underneath it did move, and the per-ingredient reads below are current.`;
    } else if (b.state === 'moved') {
      const dir = b.deltaPts > 0 ? 'widened' : b.deltaPts < 0 ? 'narrowed' : 'held';
      bsent = `Move since the prior edition (${esc(wow.prevAsOf)}): the basket's gap to baseline ${dir} ${fmtPts(Math.abs(b.deltaPts))}, from ${fmtPct(b.from)} to ${fmtPct(b.to)}.`;
    } else {
      bsent = `The per-ingredient reads below are current; a basket week-over-week is withheld this edition because the anchors are not comparable.`;
    }
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em> &mdash; the gap, not a price. New: the dispatch now carries a permanent edition archive, so it can show the honest move since last week where the rulers match. ${bsent}`;
  }
  return `<p>One honesty line before the numbers, because it changes how you read every one of them. ${lead} ${fixed}</p>`;
}

// "Cite this edition" — the copy-paste citation + reproducibility statement. Delivers four
// north-star pieces at once: versioned-basket disclosure, named sources, the stable
// permalink, and the reproducibility recipe.
function citeBlock(ins, url) {
  const wv = ins.basketWeightsVersion ? `basket weights v${esc(ins.basketWeightsVersion)}, ` : '';
  const mv = ins.methodologyVersion ? `methodology v${esc(ins.methodologyVersion)}` : 'methodology';
  return `  <aside class="cite-this" data-llm="citation" aria-label="How to cite this edition" style="margin:32px auto;max-width:720px;padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px">
    <p class="cite-this__eyebrow" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--teal);margin:0 0 8px">Cite this edition</p>
    <p class="cite-this__text" style="margin:0 0 10px;font-size:14.5px;line-height:1.55">Muntin Digital. &ldquo;Restaurant Cost Index: where the basket stands, week of ${esc(ins.asOf)}.&rdquo; Muntin Restaurant Cost Index, ${wv}${mv}. Published ${esc(ins.asOf)}. <a href="${url}">${url}</a>. Data: <a href="https://muntin.digital/cost-index/week-${esc(ins.asOf)}.json">/cost-index/week-${esc(ins.asOf)}.json</a> (CC0).</p>
    <p class="cite-this__repro" style="margin:0;font-size:13.5px;line-height:1.5;color:var(--ink-soft)">Reproducible from public USDA, BLS, and FRED data via the methodology's <a href="/cost-index/methodology/#reproduce">worked example</a>. Public wholesale levels, never your delivered price.</p>
  </aside>`;
}

// "Go deeper" — the tiered-depth descent. Keeps the top read short by LINKING the heavier
// layers (per-ingredient pages, the machine feed, the archive) instead of inlining them.
function goDeeperBlock(ins) {
  return `      <h2 id="go-deeper">Go deeper</h2>
      <p>This dispatch is the surface read. The layers underneath it are addressable, so an analyst &mdash; or an answer engine &mdash; can descend without the top read bloating:</p>
      <ul>
        <li><strong>Per-ingredient pages</strong> &mdash; every flagged item has its own live page with the full reading and its sources, e.g. <a href="/cost-index/">the Cost Index hub</a>.</li>
        <li><strong>This edition as data</strong> &mdash; <a href="/cost-index/week-${esc(ins.asOf)}.json">week-${esc(ins.asOf)}.json</a> and <a href="/cost-index/week-${esc(ins.asOf)}.csv">.csv</a>: the frozen per-ingredient snapshot behind this page.</li>
        <li><strong>The full series &amp; feed</strong> &mdash; <a href="/cost-index/feed.json">feed.json</a> (machine catalog) and the <a href="/cost-index/weekly/">edition archive</a> (every week).</li>
        <li><strong>Methodology &amp; confidence</strong> &mdash; the <a href="/cost-index/methodology/">versioned methodology</a>${ins.methodologyVersion ? ` (v${esc(ins.methodologyVersion)})` : ''}, including why nothing here is rated <em>high</em> (that needs two independent dollar sources) and the published band-coverage backtest.</li>
      </ul>`;
}

// host label for a TLD/landing URL, e.g. "https://www.aphis.usda.gov/" -> "aphis.usda.gov".
function hostOf(url) {
  try { return new URL(url).host.replace(/^www\./, ''); } catch { return url; }
}

// ---- the citable driver layer ----------------------------------------------
// Attaches STANDING, public-sourced driver context to the flagged movers — but only the
// clusters whose measured direction this week agrees with the catalog's directionExpected.
// Never a magnitude, never causation, never a forecast: each line is "association, not a
// measured cause" with a cite drawer. This is the Urner-Barry discipline — the dramatic
// story (e.g. HPAI for eggs) is withheld when the number disagrees (eggs easing -> no HPAI).
function buildFlagDrivers(ins, catalog) {
  const flagged = [...(ins.reprice || []), ...(ins.watch || [])];
  if (!flagged.length) return '';
  const groups = [];
  for (const d of (catalog.drivers || [])) {
    if (!Array.isArray(d.affects)) continue;
    const matched = flagged.filter((i) => d.affects.includes(i.key) && i.dir === d.directionExpected);
    if (matched.length) groups.push({ d, matched });
  }
  if (!groups.length) return '';
  const rows = groups.map(({ d, matched }) => {
    const names = matched.map((m) => esc(m.name)).join(', ');
    return `        <li><strong>${esc(d.label)}.</strong> ${names}. ${esc(d.mechanism)} &mdash; the standing context behind these reads, an association and not a measured cause of this week's prints.
          <details class="cite"><summary>Source</summary><p>${esc(d.source)} &mdash; <a href="${escAttr(d.sourceUrl)}" rel="nofollow">${esc(hostOf(d.sourceUrl))}</a>. Retrieved ${esc(d.retrievedAt)}. Standing correlation, direction-gated to this week's measured read; no delivered price, no forecast.</p></details></li>`;
  }).join('\n');
  return `      <h2 id="whats-driving-the-flags">What's driving the flags</h2>
      <p>The flags above are measured reads; this layer adds the public, standing context behind clusters of them &mdash; what an item moves with, sourced and pitched as association, never a measured cause. A driver appears only where this week's read agrees with it, so the page never tells a supply-shock story over a number that is easing.</p>
      <ul>
${rows}
      </ul>`;
}

// ---- the human seat: a gated "from the floor" note -------------------------
// Optional, absent by default. The note is authored by Don in data/cost-index-editors-notes.json
// keyed by asOf; it interprets what is ON the page and may not introduce a new number,
// ingredient, or forecast. Same fact gate as any dispatch text, plus the dedicated
// scripts/check-cost-index-editors-note.mjs (numeric traceability + no-forecast + bio).
function editorsNoteBlock(note) {
  if (!note || !note.text) return '';
  return `  <aside class="editors-note" data-llm="commentary" aria-label="From the floor" style="margin:32px auto;max-width:720px;padding:20px 24px;background:var(--cream-2);border-left:3px solid var(--ink);border-radius:8px">
    <p class="editors-note__eyebrow" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--ink-soft);margin:0 0 8px">From the floor &mdash; ${esc(note.author || 'Don Goldstein')}</p>
    <p style="margin:0;font-size:16px;line-height:1.6;font-style:italic">${esc(note.text)}</p>
  </aside>`;
}

function emit() {
  const ins = computeInsight();
  const asOf = ins.asOf;
  const slug = `cost-index-week-${asOf}`;
  const url = `https://muntin.digital/blog/${slug}/`;
  const today = new Date().toISOString().slice(0, 10);

  // Longitudinal spine: read the archive and the honest prior edition BEFORE upserting
  // this one, so the week-over-week story compares against last week, not itself.
  const archive = loadEditions();
  const prevEd = priorEdition(archive, asOf);
  const wow = computeWoW(ins, prevEd);

  // The citable driver catalog (standing, sourced correlations) and the optional Don note.
  let driverCatalog = { drivers: [] };
  try { driverCatalog = rd('data/cost-index-drivers.json'); } catch { /* optional */ }
  let editorsNote = null;
  try { editorsNote = (rd('data/cost-index-editors-notes.json').notes || {})[asOf] || null; } catch { /* optional */ }
  if (editorsNote && editorsNote.text) ins.editorsNote = editorsNote.text;
  const flagDriversSection = buildFlagDrivers(ins, driverCatalog);
  const noteBlock = editorsNoteBlock(editorsNote);

  const donorHtml = readFileSync(path.join(repoRoot, DONOR), 'utf8');
  const headBoiler = sliceDonor(donorHtml,
    '<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-variable-latin-wght-normal.woff2" crossorigin>',
    '<!-- /lazy-load:p -->');
  const plausibleInit = sliceDonor(donorHtml,
    "<script>window.plausible=window.plausible", '})</script>');
  const batchBanner = sliceDonor(donorHtml, '<!-- batch-banner:start -->', '<!-- batch-banner:end -->');
  const navBlock = sliceDonor(donorHtml, '<script>\n  /* Platform-aware kbd hint.', '</header>');
  const footerBlock = sliceDonor(donorHtml, '<footer>', '</footer>');
  const tailScripts = sliceDonor(donorHtml, '<!-- Phase 3D-perf', '<!-- /lazy-load:site -->');

  const title = `Restaurant Cost Index: where the basket stands, week of ${asOf}`;
  const descFull = `Week of ${asOf}: the basket reads ${fmtPctPlain(ins.basket && ins.basket.pct)} against baseline, ${ins.up} of ${ins.count} ingredients above their tracked window. Wholesale levels, not your delivered price.`;
  const desc = descFull.length <= 155 ? descFull : (descFull.slice(0, 152).replace(/\s+\S*$/, '') + '…');
  const basketRead = ins.basket && typeof ins.basket.pct === 'number' ? fmtPct(ins.basket.pct) : '&mdash;';
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const basketConf = (ins.basket && ins.basket.confidence) || 'unstated';

  // The honest week-over-week line for the surface read — only when the rulers match.
  const wowTldr = (() => {
    if (!wow || wow.state !== 'available') return null;
    const b = wow.basket || {};
    if (b.state === 'moved') { const dir = b.deltaPts > 0 ? 'widened' : b.deltaPts < 0 ? 'narrowed' : 'held'; return `Since the prior edition (${wow.prevAsOf}), the basket's gap to baseline ${dir} ${fmtPtsPlain(Math.abs(b.deltaPts))}.`; }
    if (b.state === 'anchor-unchanged') return `The basket's data anchor has not refreshed since the prior edition (${wow.prevAsOf}), so there is no new basket move to report; the weekly panel below is current.`;
    return null;
  })();
  const topReprice = ins.reprice[0];
  const tldr = [
    `The weekly restaurant cost index for the week of ${asOf}: the weighted basket reads ${basketPlain} against its baseline at ${basketConf} confidence.`,
    `${ins.up} of ${ins.count} tracked ingredients are reading above their own baseline window, ${ins.down} below, ${ins.flat} flat.`,
    ins.reprice.length
      ? `${ins.reprice.length} re-price signal${ins.reprice.length > 1 ? 's' : ''}, led by ${topReprice.name} (${fmtPctPlain(topReprice.pct)}${typeof topReprice.elevatedWeeks === 'number' && topReprice.elevatedWeeks >= 2 ? `, ${topReprice.elevatedWeeks} weeks running` : ''}). Each read is state-of-play versus that item's baseline.`
      : `Nothing structural is flashing this week; the panel reads hold across the board.`,
  ].concat(wowTldr ? [wowTldr] : []);
  const takeaways = [
    `The basket reads ${basketPlain} against its baseline this week &mdash; public wholesale levels, never your delivered price.`,
    `Each ingredient's percentage is a read versus its own tracked baseline window, a state-of-play "what's flashing", not a week-over-week move.`,
    ins.reprice.length
      ? `${ins.reprice[0].name} is the structural signal to act on first; ${ins.watch.length ? `${ins.watch[0].name} is on watch.` : 'nothing else is flashing yet.'}`
      : `Nothing structural this week is a signal too: hold your prices and keep the panel in view.`,
    (() => {
      const fb = ins.pressure.find((p) => p.dir === 'building');
      const fe = ins.pressure.find((p) => p.dir === 'easing');
      if (ins.pressure.length && (fb || fe)) {
        const parts = [];
        if (fb) parts.push(`${fb.name} is building (${fb.force}${fb.lead ? `, ${fb.lead} lead` : ''})`);
        if (fe) parts.push(`${fe.name} is easing (${fe.force})`);
        return `What's behind the moves: ${parts.join('; ')}. The pressure layer points a direction on a multi-week lead, never a price — watch your delivered invoices against it.`;
      }
      return `${ins.drivers.length ? `Feed context: ${ins.drivers.map((d) => `${d.name} ${fmtPctPlain(d.pct)}`).join(', ')}.` : 'No credible driver read this week.'} Watch your own delivered invoices, not the wholesale panel alone.`;
    })(),
  ];

  const barsFig = buildBars(ins);
  const ringsFig = buildRings(ins);
  const flowFig = buildFlow(ins);
  const contribFig = buildContrib(ins);

  // Plain-language decomposition of the basket headline — names the staple doing the
  // pushing, the one easing, and the heavy anchor, all from the basket's own contributors.
  const heaviest = ins.heaviest, topPush = ins.topPush, topEase = ins.topEase;
  const pushWhy = (topPush && topPush.pressure) ? ` &mdash; ${pressurePhrase(topPush.pressure)}` : '';
  const easeWhy = (topEase && topEase.pressure) ? ` (${pressurePhrase(topEase.pressure)})` : '';
  const contribLead = (contribFig && topPush)
    ? `<p>The basket is not one number &mdash; it is a weighted blend of ${ins.basket && ins.basket.nContributing || ins.count} staples, so the headline ${basketRead} is really a tug-of-war. ${heaviest ? `A heavy line barely moving anchors it: ${esc(heaviest.name)} is ${Math.round(heaviest.weight * 100)}% of the basket, so it steadies the whole read. ` : ''}But the swing comes from elsewhere. This week ${esc(topPush.name)}, at just ${Math.round(topPush.weight * 100)}% of the basket but reading ${fmtPct(topPush.pct)} against its baseline, adds about ${fmtPts(topPush.points)}${pushWhy}${topEase ? `, while ${esc(topEase.name)} pulls back ${fmtPts(topEase.points)}${easeWhy}` : ''}. Here is the headline taken apart, so ${basketRead} is a story you can see rather than a figure to take on faith.</p>`
    : '';
  const contribClose = (contribFig && topPush)
    ? `<p>That is the honest shape of an index: a couple of volatile lines do most of the talking, and the steady staples keep it from whipping around. So read ${basketRead} as &ldquo;${esc(topPush.name)} pushing${topEase ? `, ${esc(topEase.name)} easing` : ''}&rdquo; &mdash; not as every shelf in the walk-in moving together. If the line doing the pushing is not one you carry, the basket may be louder than your own invoice this week.</p>`
    : '';
  const contribSection = contribFig
    ? `      <h2 id="what-s-moving-the-basket">What's moving the basket</h2>
${contribLead}
${contribFig}
${contribClose}
`
    : '';

  const tldrLis = tldr.map((t) => `        <li>${esc(t)}</li>`).join('\n');
  const takeLis = takeaways.map((t) => `        <li>${esc(t)}</li>`).join('\n');

  const risersStr = ins.risers.map((i) => `${esc(i.name)} ${fmtPct(i.pct)}`).join(' &middot; ') || '&mdash;';
  const fallersStr = ins.fallers.map((i) => `${esc(i.name)} ${fmtPct(i.pct)}`).join(' &middot; ') || '&mdash;';
  const driverCtx = ins.drivers.length
    ? ins.drivers.map((d) => `${esc(d.name)} reads ${fmtPct(d.pct)} against its baseline`).join(', and ')
    : '';

  // "What's behind the moves" — the driving-factors layer. Names the force and lead time
  // under each staple's direction (cost-pressure.json), with the feed flow as one visual
  // chain. Inferred direction only, sourced, never a price.
  const pressureRows = ins.pressure.map((p) => {
    const lead = p.lead ? ` <span style="opacity:.6">(${esc(p.lead)} lead)</span>` : p.coincident ? ` <span style="opacity:.6">(concurrent)</span>` : '';
    const conf = p.confidence ? `, ${esc(p.confidence)} confidence` : '';
    return `        <li><strong>${esc(p.name)}</strong> &mdash; <strong>${esc(p.dir)}</strong>, led by ${esc(p.force)}${lead}${conf}.</li>`;
  }).join('\n');
  const pressureSection = (ins.pressure.length || driverCtx)
    ? `      <h2 id="whats-behind-the-moves">What's behind the moves</h2>
      <p>A percentage tells you <em>what</em> moved; it does not tell you <em>why</em>. The cost index carries a second, slower read for that &mdash; the <strong>pressure layer</strong>, which infers whether each staple is building or easing from the public lead indicators underneath it: feed grain and cattle-on-feed placements for proteins, cold-storage stocks for dairy, shipment volume and drought for produce. (Freight/diesel is a common-mode cost that rides every delivered price roughly equally, so it is carried index-wide in the measured drivers, not as a per-ingredient pressure arrow.) It points a direction on a lead, never a price.</p>
${ins.pressure.length ? `      <p>Where the panel's tracked staples sit this week${ins.pressureAsOf ? `, as of ${ins.pressureAsOf}` : ''}:</p>
      <ul>
${pressureRows}
      </ul>
      <details class="cite"><summary>Sources for the pressure read</summary><p>Inferred direction only &mdash; composed from public USDA NASS (Cattle-on-Feed, Broiler Hatchery, Cold Storage), USDA AMS movement and shipment reports, and the U.S. Drought Monitor. No delivered price. See the <a href="/cost-index/methodology/">Cost Index methodology</a>.</p></details>
` : ''}${driverCtx ? `      <p>The feed market is the clearest of these chains. This week, ${driverCtx} &mdash; a feed read that flows through to the proteins it sits behind on a lag:</p>

${flowFig}
` : ''}      <p>Read the pressure layer like a forecast, not a thermometer: it tells you which way the wind is blowing on a multi-week lead, so a vendor quote moving the other way is worth a question. The dollar level above is today; this is the direction underneath it.</p>
`
    : '';

  const body = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${esc(title)} | Muntin Digital</title>
<meta name="description" content="${escAttr(desc)}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${url}" />
<!-- i18n:hreflang START (generated by scripts/stamp-hreflang.mjs) -->
<link rel="alternate" hreflang="en" href="${url}" />
<link rel="alternate" hreflang="x-default" href="${url}" />
<meta property="og:locale" content="en_US" />
<!-- i18n:hreflang END -->

<meta property="og:type" content="article" />
<meta property="og:title" content="${escAttr(title)}" />
<meta property="og:description" content="${escAttr(desc)}" />
<meta property="og:url" content="${url}" />
<meta property="og:site_name" content="Muntin Digital" />

<meta property="og:image" content="https://muntin.digital/brand/og/blog-restaurant-cost.png" />
<meta property="og:image:type" content="image/png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="article:published_time" content="${asOf}T13:00:00-04:00" />
<meta property="article:author" content="Don Goldstein" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Article",
      "@id": "${url}#article",
      "headline": ${JSON.stringify(title)},
      "description": ${JSON.stringify(desc)},
      "url": "${url}",
      "inLanguage": "en-US",
      "datePublished": "${asOf}T13:00:00-04:00",
      "dateModified": "${today}",
      "author": {
        "@id": "https://muntin.digital/#don-goldstein",
        "@type": "Person",
        "name": "Don Goldstein",
        "url": "https://muntin.digital/about/"
      },
      "publisher": {
        "@id": "https://muntin.digital/#business"
      },
      "image": {
        "@type": "ImageObject",
        "url": "https://muntin.digital/brand/og/blog-restaurant-cost.png",
        "width": 1200,
        "height": 630,
        "caption": ${JSON.stringify(title)}
      },
      "mainEntityOfPage": {
        "@id": "${url}"
      },
      "keywords": [
        "restaurant cost index ${asOf}",
        "restaurant food cost trends 2026",
        "wholesale ingredient prices restaurant",
        "restaurant menu re-price signal",
        "restaurant cost pulse weekly"
      ],
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": [
          "article#post-body",
          "h1",
          ".post-dek"
        ]
      }
    },
    {
      "@type": "Dataset",
      "@id": "${url}#dataset",
      "name": "Muntin Restaurant Cost Index — weekly reading, ${asOf}",
      "description": ${JSON.stringify(`Weighted 16-staple wholesale-cost basket reading (${basketPlain} vs baseline) and per-ingredient flags for the week of ${asOf}. Public wholesale levels, not delivered prices. Measured levels only — never a forecast.`)},
      "url": "${url}",
      "isPartOf": { "@id": "https://muntin.digital/cost-index/#index-dataset" },
      "datePublished": "${asOf}",
      "dateModified": "${today}",
      "temporalCoverage": "${asOf}",
      "license": "https://creativecommons.org/publicdomain/zero/1.0/",
      "creator": { "@id": "https://muntin.digital/#business" },
      "publisher": { "@id": "https://muntin.digital/#business" },
      "variableMeasured": [
        {
          "@type": "PropertyValue",
          "name": "Weighted basket vs baseline",
          "value": "${basketPlain}",
          "measurementTechnique": "Weighted median of 16 staples, each read against its own tracked baseline window"
        }
      ],
      "isBasedOn": ["USDA AMS/LMR", "USDA NASS", "BLS", "FRED", "EIA"],
      "distribution": [
        { "@type": "DataDownload", "encodingFormat": "application/json", "contentUrl": "https://muntin.digital/cost-index/week-${asOf}.json" },
        { "@type": "DataDownload", "encodingFormat": "text/csv", "contentUrl": "https://muntin.digital/cost-index/week-${asOf}.csv" }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Muntin Digital",
          "item": "https://muntin.digital/"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Articles",
          "item": "https://muntin.digital/blog/"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": ${JSON.stringify(title)},
          "item": "${url}"
        }
      ]
    }
  ]
}
</script>

<style>
.breadcrumb{padding-top:100px}
.callout{padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px;margin:24px 0}
.callout p{margin:0;font-size:15.5px;line-height:1.6;color:var(--ink)}
</style>
<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--max:1200px;--pad-x:clamp(20px,4vw,64px)}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px;-webkit-font-smoothing:antialiased}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#16181D;color:#F6F7F8;padding:12px 16px;z-index:100}
a{color:inherit}
.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer}
.btn-primary{background:var(--ink);color:var(--cream)}
.btn-ghost{background:transparent;color:var(--ink);border:1px solid #D7DAE0}
header.nav{min-height:64px}
</style>
${headBoiler}
${plausibleInit}
</head>
<body>

<a class="skip-link" href="#main">Skip to main content</a>

${batchBanner}
${navBlock}

<main id="main">
  <nav class="breadcrumb container" aria-label="Breadcrumb" style="margin-top:90px">
    <ol style="list-style:none;padding:0;margin:0;display:flex;gap:8px;font-size:13px;color:var(--stone)">
      <li><a href="/" style="color:var(--teal)">Home</a></li>
      <li aria-hidden="true">›</li>
      <li><a href="/blog/" style="color:var(--teal)">Articles</a></li>
      <li aria-hidden="true">›</li>
      <li aria-current="page">Cost Index &middot; week of ${asOf}</li>
    </ol>
  </nav>

  <article class="container article-body" id="post-body" style="max-width:720px;margin:32px auto 80px;padding:0 var(--pad-x)">
    <header style="margin-bottom:32px">
      <p class="eyebrow">The Cost Index &middot; week of ${asOf} &middot; 5 min read &middot; By <a href="/about/#don-goldstein" style="color:var(--teal)">Don Goldstein</a></p>
      <h1 style="font-family:var(--font-display);font-size:clamp(36px,5.5vw,56px);font-weight:500;line-height:1.05;letter-spacing:-0.5px;margin:0 0 18px">
        Where the basket stands this week. <span class="serif-italic">What's flashing.</span>
      </h1>
      <p class="post-dek" style="font-size:18px;line-height:1.55;color:var(--ink-soft);margin:0">The restaurant cost index for the week of ${asOf}: the weighted basket reads ${basketRead} against its baseline, ${ins.up} of ${ins.count} tracked ingredients above their own window. These are public wholesale levels, never your delivered price &mdash; a read on the market, so you can tell a real move from a vendor markup.</p>
    </header>

      <!-- article-tldr:start -->
            <aside class="tldr" data-llm="tldr" aria-label="In short">
              <p class="tldr__eyebrow">In short</p>
              <ul class="tldr__list">
${tldrLis}
              </ul>
            </aside>
            <!-- article-tldr:end -->

      <p>Here is the read I run on a Tuesday between the produce drop and the pre-shift, and it is the same read this dispatch carries. The cost index for the week of ${asOf} has the weighted basket sitting at <strong>${basketRead}</strong> against its baseline, at ${basketConf} confidence across ${ins.basket && ins.basket.nContributing || ins.count} contributing ingredients. You already watch your own invoices &mdash; this is the wholesale market underneath them, so a delivered-price jump can be checked against whether the market actually moved or your vendor did.</p>

      ${honestyPara(ins, wow, basketPlain)}

${ringsFig}

${contribSection}
      <h2 id="what-s-flashing-this-week">What's flashing this week</h2>
      <p>The panel sorts into a short action list: ${ins.reprice.length ? `${ins.reprice.length} re-price signal${ins.reprice.length > 1 ? 's' : ''}` : 'no re-price signal'}, ${ins.watch.length ? `${ins.watch.length} on watch` : 'nothing on watch'}. A re-price flag means the move looks structural &mdash; elevated and sustained against the baseline. A watch flag means a real move that has not persisted long enough to act on yet. Neither is advice; both are calibrated, low-regret reads off the measured index.</p>

${repriceList(ins)}

      <p>If nothing here matches a line on your own menu, that is fine &mdash; only act where the flashing item is something you actually buy. The whole panel is filtered to the index's shippable set, so every name above is an ingredient the hub can show a live reading for.</p>

      <h2 id="the-widest-gaps-from-baseline">The widest gaps from baseline</h2>
      <p>Beyond the action flags, here is the full spread of movement. Reading above baseline this week: ${risersStr}. Reading below: ${fallersStr}. The bars below scale to the largest mover so the gaps are legible &mdash; rust where cost is building, teal where it is easing.</p>

${barsFig}

      <p>Read these as gaps, not verdicts. A wide rust bar on a seasonal item often unwinds when the season turns; a wide teal bar can be a vendor clearing inventory rather than a durable easing. The bar tells you where to look; your delivered invoice tells you whether it reached your back door.</p>

${pressureSection}

${flagDriversSection}

${noteBlock}

${goDeeperBlock(ins)}

      <h2 id="how-to-read-this-and-what-it-is-not">How to read this, and what it is not</h2>
      <p>Three rules keep this honest. First, every number is a <strong>public wholesale level, never your delivered price</strong> &mdash; freight, contract, and pack size all sit between this panel and your invoice. Second, each percentage is a read versus that ingredient's <em>own tracked baseline window</em>, a state-of-play snapshot of what is flashing; where this dispatch reports a move since last edition, it says so explicitly and only where the basket's ruler has not changed. Third, the panel is drawn from public USDA, BLS, and FRED data; when an input cannot earn a credible reading, it stays off the page rather than showing you a guess. Watch your own delivered invoices against these reads &mdash; the gap between the two is where a vendor conversation lives, and it is the first place a moving <a href="/glossary/prime-cost/">prime cost</a> shows up.</p>

${citeBlock(ins, url)}

  <!-- article-takeaways:start -->
            <aside class="key-takeaways" data-llm="takeaways" aria-label="Key takeaways">
              <p class="key-takeaways__eyebrow">Key takeaways</p>
              <ul class="key-takeaways__list">
${takeLis}
              </ul>
            </aside>
            <!-- article-takeaways:end -->
  </article>

  <aside class="post-end-mark" aria-hidden="true">
    <hr/>
    <span class="post-end-glyph"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true">
      <rect x="4" y="4" width="16" height="16"/>
      <line x1="12" y1="4" x2="12" y2="20"/>
      <line x1="4" y1="10" x2="20" y2="10"/>
    </svg></span>
    <p>More from the library.</p>
  </aside>

  <!-- post-end-cta:start -->
    <aside class="post-end-cta" aria-label="Workshop next step">
      <p class="post-end-cta-headline">Get this read in your inbox every week.</p>
      <p class="post-end-cta-body">The Cost Index sends one short note a week &mdash; where the basket stands, what's flashing a re-price or watch signal, and the feed context behind the proteins. Sign up on the hub, then open the live Cost Index to see every tracked ingredient at once. Public wholesale levels, never your delivered price.</p>
      <a class="btn btn-primary" href="/cost-index/">Open the Cost Index<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="14 6 20 12 14 18"/></svg></a>
    </aside>
    <!-- post-end-cta:end -->
<!-- knit-rail:start --><!-- knit-rail:end -->

  <!-- smart-next:start --><!-- smart-next:end -->

</main>

${footerBlock}
${tailScripts}
  <!-- listen-script:start --><!-- listen-script:end -->

</body>
</html>
`;

  upsertLibraryTags(slug, asOf, basketPlain, ins);
  // Write the publication's time series: append this edition to the archive, and emit the
  // citable per-week machine snapshot (JSON + CSV) referenced by the Dataset markup.
  upsertEdition(archive, ins);
  writePerWeekData(ins);

  const outDir = path.join(repoRoot, 'blog', slug);
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  const existed = existsSync(outFile);
  writeFileSync(outFile, body);
  console.log(`${existed ? 'overwrote' : 'wrote'} blog/${slug}/index.html  (basket ${basketPlain}, ${ins.up}/${ins.count} above baseline, asOf ${asOf})`);
  console.log('Next: node scripts/sync-includes.mjs  +  node scripts/inject-library-cost-index-hero.mjs  +  the build-chain inject/build scripts, then node scripts/check-all.mjs');
  return { slug, url, asOf };
}

if (arg('--json') || arg('--dry-run')) {
  const ins = computeInsight();
  if (arg('--json')) console.log(JSON.stringify(ins, null, 2));
  else console.log(narrate(ins));
  process.exit(0);
}

emit();
