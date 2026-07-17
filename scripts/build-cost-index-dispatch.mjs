/* build-cost-index-dispatch.mjs — the Cost Index dispatch write-up (monthly since
 * the 2026-07-06 cadence pivot; the weekly emit path is retained for the dated
 * archive family).
 *
 * Turns the scheduled measured-index refresh (data/cost-index.json) into an honest,
 * dated edition: where the basket stands, the month's arcs, which stories cleared the
 * panel's own false-discovery gate, the full expandable board, what stayed quiet, the
 * licensed forward blocks, and the record. Every number is the measured index's own
 * read (or a --check-gated committed artifact) — nothing invented — so it stays
 * inside the fact gate.
 *
 * NAMING (founder-signed 2026-07-06; monthly-dispatch plan §2):
 *   - MONTHLY editions emit at blog/cost-index-<YYYY-MM>/ (e.g. cost-index-2026-07),
 *     keyed on the EDITION date, not the data asOf — the data date is stated inside
 *     ("read as of <asOf> — a dated read, not a month average").
 *   - The edition date comes from the EDITION_DATE env var (YYYY-MM-DD); when unset
 *     it defaults to the data's own asOf. Both dates are recorded in the editions
 *     spine entry (editionDate + asOf, additive — prior entries are never mutated).
 *   - COLLISION CONVENTION: one edition per month is the design. If a month ever
 *     genuinely needs a second edition (a material data correction after publish),
 *     the second slug takes an `-update` suffix — blog/cost-index-YYYY-MM-update/ —
 *     and the first edition stays untouched (slugs are final-forever). The freshness
 *     gate (check-cost-index-dispatch-fresh.mjs) recognizes both.
 *   - WEEKLY editions (blog/cost-index-week-<asOf>/) are the legacy dated family:
 *     final-forever, still emitted by --weekly, never renamed.
 *
 * MODE SWITCH (monthly is the DEFAULT emit since the pivot):
 *   node scripts/build-cost-index-dispatch.mjs             # emit the MONTHLY edition at blog/cost-index-<YYYY-MM>/
 *   node scripts/build-cost-index-dispatch.mjs --monthly   # same (explicit alias)
 *   node scripts/build-cost-index-dispatch.mjs --weekly    # legacy weekly emit at blog/cost-index-week-<asOf>/
 *   node scripts/build-cost-index-dispatch.mjs --json      # print the computed insight payload, write nothing
 *   node scripts/build-cost-index-dispatch.mjs --dry-run   # print the computed narrative, write nothing
 *   EDITION_DATE=YYYY-MM-DD …                              # pin the edition date (monthly emit + payload)
 *
 * ARC WINDOW (monthly): per-ingredient month arcs window over dated committed reads
 * from (editionDate − 31 days), exclusive, through asOf — one calendar-month frame
 * regardless of when the prior edition landed. wow/continuity is separate and still
 * compares vs the prior editions-spine entry (computeWoW), with its commensurability
 * guards intact. In the legacy payload (--json without EDITION_DATE) the arc window
 * stays edition-over-edition (prior entry's asOf), byte-stable for the email preview.
 *
 * HONESTY: trend.pct is each ingredient's read vs ITS OWN tracked baseline window.
 * Month-over-month claims appear only where the editions spine licenses them; arcs
 * are dated reads of a single named source series, never a blend, never a forecast.
 *
 * The monthly emit is idempotent per edition: re-running for the same EDITION_DATE
 * overwrites the post in place, bumps dateModified, and re-upserts its own spine
 * entry only. It also upserts the blog-index card source (data/library-tags.json)
 * and writes the citable per-read snapshot (cost-index/week-<asOf>.json + .csv) IF
 * absent — an existing frozen snapshot is never rewritten. After emission, run the
 * build-chain inject/build scripts (build-cost-index-archive, build-blog-index,
 * build-rss, build-sitemap, build-llms-txt, inject-library-cost-index-hero,
 * inject-* CTAs) so the post registers everywhere.
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
// The graphics gate's OWN parsers, imported in module mode, so the monthly
// emit-time asserts (data-audio-alt floor, figcaption, tone balance, variety)
// can never disagree with what check-article-graphics.mjs will enforce in CI.
import {
  collectContentFigures, getDataAudioAlt, hasFigcaption, detectVizKinds,
  findAutolinkInAttribute, DATA_AUDIO_ALT_MIN,
} from './check-article-graphics.mjs';
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const arg = (f) => process.argv.includes(f);
const pct = (x) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(1)}%`;
// ISO date arithmetic for the monthly arc window (editionDate − 31 days).
const isoMinusDays = (iso, days) => new Date(Date.parse(iso) - days * 86400000).toISOString().slice(0, 10);
const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNameOf = (iso) => `${MONTHS_EN[parseInt(iso.slice(5, 7), 10) - 1]} ${iso.slice(0, 4)}`;
const humanDateOf = (iso) => `${MONTHS_EN[parseInt(iso.slice(5, 7), 10) - 1]} ${parseInt(iso.slice(8, 10), 10)}, ${iso.slice(0, 4)}`;
// Validated EDITION_DATE env (YYYY-MM-DD) or null.
function editionDateEnv() {
  const v = (process.env.EDITION_DATE || '').trim();
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v))) {
    console.error(`✗ EDITION_DATE must be a valid YYYY-MM-DD date (got "${v}")`);
    process.exit(1);
  }
  return v;
}

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

// computeInsight({ editionDate, monthly }) — the one payload both renders consume.
//   editionDate — YYYY-MM-DD edition key (EDITION_DATE env). Presence switches the
//                 arc window to the calendar-month frame (see below).
//   monthly     — set by the monthly emit; when editionDate is unset it defaults
//                 the edition date to the data asOf.
// MONTHLY MODE (editionDate set, or monthly:true): arcs window from
// (editionDate − 31 days) so every edition reads one month of dated committed
// reads regardless of when the prior edition landed; items additionally carry
// arc + nHistory for the full board. LEGACY MODE (bare --json): the payload is
// byte-identical to the pre-pivot shape — the arc window stays edition-over-
// edition — so the committed email preview re-derives unchanged.
function computeInsight({ editionDate = null, monthly = false } = {}) {
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
    const item = {
      key, name: name(key), nameEs: nameEs(key), pct: t.pct, dir: t.dir || (t.pct > 0 ? 'up' : t.pct < 0 ? 'down' : 'flat'),
      verdict: f.verdict || null, bias: f.actionBias || null, reason: f.reason || null,
      // CRIT-5 multiplicity verdict (build-cost-index.mjs wires cost-null-gate.js):
      // true only when this read survived the moving-block-bootstrap null with
      // BY FDR across the panel. The action lists below filter on it.
      gated: f.gated === true,
      confidence: p.confidence || null, seasonal: !!(labels[key] && labels[key].seasonal),
      // Per-ingredient sustained-elevation counter (already measured in cost-index.json).
      // Surfacing it is the first honest longitudinal claim — needs no snapshot archive.
      elevatedWeeks: typeof f.elevatedWeeks === 'number' ? f.elevatedWeeks : null,
      medianCents: typeof lvl.medianCents === 'number' ? lvl.medianCents : null,
      rangeCents: Array.isArray(lvl.rangeCents) && lvl.rangeCents.length === 2 ? lvl.rangeCents : null,
      unit: (labels[key] && labels[key].unit_en) || null,
      unitEs: (labels[key] && labels[key].unit_es) || null,
      pressure: pressureRead(pressureItems, key),
    };
    // Sign-correct the reason AT THE SOURCE (2026-07-06). flagReason() (hoisted,
    // below) was applied only in emit() for the blog post, so the POSTed payload
    // shipped the raw verdict-keyed string — the live 07-06 data pairs bell-pepper
    // -17.1% with "the increase looks real". The email template renders the payload
    // verbatim; correct it here so every downstream twin (EN/ES html/text) agrees
    // with the sign. Idempotent: the corrected strings contain no increase-vocabulary.
    if (item.reason) item.reason = flagReason(item);
    items.push(item);
  }

  const up = items.filter((i) => i.dir === 'up').length;
  const down = items.filter((i) => i.dir === 'down').length;
  const flat = items.length - up - down;

  // Actionable signals first (the calibrated suggestion, low-regret order): re-price > watch.
  // GATED ONLY (2026-07-06): an action verb may ride only on a read that survived
  // the panel's own false-discovery gate (flag.gated, from cost-null-gate.js —
  // built because ~99.5% of items earn a non-HOLD read under a vol-matched random
  // walk). The hub's verdict voice already withholds gated:false to a neutral note;
  // the dispatch surfaced all 15 raw re-price biases as commands. When nothing
  // clears the gate, the quiet-week fallback IS the read: hold, and know why.
  // Ungated flagged items still appear in risers/fallers as measured gaps.
  const reprice = items.filter((i) => i.bias === 're-price' && i.gated).sort((a, b) => b.pct - a.pct);
  const watch = items.filter((i) => i.bias === 'watch' && i.gated).sort((a, b) => b.pct - a.pct);

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
  let basket = ci.basket || null;
  // Never ship an uncalibrated "high" label (2026-07-06): the methodology page
  // itself explains why nothing is rated high (needs two independent dollar
  // sources), data/cost-index-health.json says highEligible: 0, and
  // data/cost-confidence-calibration.json has zero high-tier rows — the label has
  // no realized track record anywhere. Until the tier earns calibration rows, the
  // dispatch declines to state it (templates skip the parenthetical when null).
  // The P1 confidence-language gate (docs/plans/dispatch-email-upgrade.md §8)
  // makes this structural.
  if (basket && basket.confidence === 'high') basket = { ...basket, confidence: null };

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

  // ---- The edition spine in the PAYLOAD (2026-07-06, monthly pivot) -------
  // The emailed payload used to carry none of this — wow lived only in emit(),
  // so the email could never make an honest since-last-edition claim. Attach:
  //   wow      — the guarded edition-over-edition story (same computeWoW the
  //              post uses; commensurability withholds carry through verbatim).
  //   stories  — the ranked LEAD-STORY set, eligibility = survived the panel's
  //              false-discovery gate (flag.gated). Ranking is deterministic:
  //              |pct| × basket weight (fixed 0.02 panel weight for
  //              non-contributors) × persistence, ties by elevatedWeeks then
  //              key — same data in, same leads out, never editorial whim.
  //   arc      — each mover/story's cycle trajectory (start → peak/trough →
  //              end, all dated) from the committed per-source history, single
  //              source + basis only (never mixes series — the basis-leak rule
  //              applied to shapes). This is what "change over a month" looks
  //              like without inventing a number: every point is a dated read.
  // Monthly resolution: the edition date defaults to the data asOf; its presence
  // (env or monthly emit) flips the arc window to the calendar-month frame.
  const monthlyMode = monthly || !!editionDate;
  const edDate = monthlyMode ? (editionDate || asOf) : null;
  const archive = loadEditions();
  const prev = priorEdition(archive, asOf, edDate);
  // ARC WINDOW: monthly = (editionDate − 31 days), one month of dated reads
  // (for the 2026-07-09 July edition that is 2026-06-08 — the verified June
  // frame). Legacy = since the prior edition's asOf. Documented in the header.
  const sinceDate = monthlyMode ? isoMinusDays(edDate, 31)
    : (prev ? prev.asOf : isoMinusDays(asOf, 31));
  const arcFor = (key) => cycleArc(ci, key, sinceDate, asOf);
  for (const i of risers) i.arc = arcFor(i.key);
  for (const i of fallers) i.arc = arcFor(i.key);
  if (monthlyMode) {
    // The full board renders every shippable item expandable — each needs its
    // month arc and the honest "elevated in N of the last M" denominator.
    // Additive, monthly-mode only (the legacy payload stays byte-stable).
    for (const i of items) {
      i.arc = arcFor(i.key);
      const f = ((ci.ingredients || {})[i.key] || {}).flag || {};
      i.nHistory = typeof f.nHistory === 'number' ? f.nHistory : null;
    }
  }
  const wow = computeWoW({ reprice, watch, basket, basketWeightsVersion }, prev);
  const contribWeight = {};
  for (const c of contributors) contribWeight[c.key] = c.weight;
  const wowDelta = {};
  for (const m of (wow.ingredient || [])) wowDelta[m.key] = m.deltaPts;
  const stories = items
    .filter((i) => i.gated === true)
    .map((i) => {
      const weight = contribWeight[i.key] || 0.02;
      const persistence = 1 + Math.min(typeof i.elevatedWeeks === 'number' ? i.elevatedWeeks : 0, 8) / 8;
      return { ...i, weight, score: Math.abs(i.pct) * weight * persistence,
               arc: arcFor(i.key),
               deltaPts: typeof wowDelta[i.key] === 'number' ? wowDelta[i.key] : null };
    })
    .sort((a, b) => (b.score - a.score)
      || ((b.elevatedWeeks || 0) - (a.elevatedWeeks || 0))
      || (a.key < b.key ? -1 : 1))
    .slice(0, 4);

  return { asOf, count: items.length, up, down, flat, reprice, watch, risers, fallers, drivers, basket, contributors, heaviest, topPush, topEase, pressure, pressureAsOf, items, basketWeightsVersion, methodologyVersion, wow, stories, sinceDate, ...(monthlyMode ? { editionDate: edDate } : {}) };
}

// The single-series cycle trajectory for one ingredient: dated reads since the
// prior edition, from the committed history array. Sources are never mixed —
// the arc is computed inside the dominant (most reads, ties to the one with
// the latest read) source+basis series in the window, and names that series.
// Returns null when the window holds fewer than 2 reads of any single series.
// The dominant single source+basis series inside the window — the shared series
// pick behind both the arc summary (cycleArc) and the monthly spark step-lines,
// extracted so the two can never disagree on which series a figure draws.
function dominantSeries(ci, key, sinceDate, asOf) {
  const point = (((ci.ingredients || {})[key] || {}).points || [])[0] || {};
  const hist = point.history;
  if (!Array.isArray(hist)) return null;
  const win = hist.filter((h) => h && h.date && h.date > sinceDate && h.date <= asOf && typeof h.valueCents === 'number');
  if (win.length < 2) return null;
  const groups = {};
  for (const h of win) {
    const k = `${h.source || '?'}|${h.basis || '?'}`;
    (groups[k] = groups[k] || []).push(h);
  }
  const series = Object.values(groups).sort((a, b) => (b.length - a.length)
    || (b[b.length - 1].date < a[a.length - 1].date ? -1 : 1))[0];
  if (series.length < 2) return null;
  series.sort((a, b) => (a.date < b.date ? -1 : 1));
  return series;
}

function cycleArc(ci, key, sinceDate, asOf) {
  const series = dominantSeries(ci, key, sinceDate, asOf);
  if (!series) return null;
  const start = series[0], end = series[series.length - 1];
  let peak = series[0], trough = series[0];
  for (const h of series) { if (h.valueCents > peak.valueCents) peak = h; if (h.valueCents < trough.valueCents) trough = h; }
  return {
    source: series[0].source || null, basis: series[0].basis || null, reads: series.length,
    start: { date: start.date, cents: start.valueCents },
    end: { date: end.date, cents: end.valueCents },
    peak: { date: peak.date, cents: peak.valueCents },
    trough: { date: trough.date, cents: trough.valueCents },
  };
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
    // Monthly editions record BOTH dates (additive; 2026-07-09 naming pivot):
    // editionDate keys the edition/slug, asOf stays the data read date.
    ...(ins.editionDate ? { editionDate: ins.editionDate } : {}),
    publishedAt: publishedAt || `${ins.editionDate || ins.asOf}T13:00:00-04:00`,
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
  // Entries key on editionDate when they carry one (monthly), else on asOf
  // (the legacy weekly family). ADDITIVE: a monthly edition built on the same
  // data day as an already-archived weekly never replaces the weekly's entry —
  // prior entries are never mutated; an edition only ever re-upserts itself.
  const keyOf = (e) => e.editionDate || e.asOf;
  archive.editions = (archive.editions || []).filter((e) => keyOf(e) !== keyOf(entry));
  archive.editions.push(entry);
  archive.editions.sort((a, b) => (a.asOf < b.asOf ? -1 : a.asOf > b.asOf ? 1
    : (keyOf(a) < keyOf(b) ? -1 : keyOf(a) > keyOf(b) ? 1 : 0)));
  writeFileSync(path.join(repoRoot, EDITIONS_FILE), JSON.stringify(archive, null, 2) + '\n');
  return entry;
}

// The newest archived edition strictly BEFORE this asOf — the honest prior
// reading. `editionDate` (when re-running a monthly edition) excludes the
// edition's own earlier spine entry, so a re-run on fresher data never
// "compares" against the stale copy of itself it is about to replace.
function priorEdition(archive, asOf, editionDate = null) {
  const before = (archive.editions || []).filter((e) => e.asOf < asOf
    && (!editionDate || e.editionDate !== editionDate));
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
function writePerWeekData(ins, { editionUrl = null, preserveExisting = false } = {}) {
  const dir = path.join(repoRoot, 'cost-index');
  mkdirSync(dir, { recursive: true });
  // FROZEN means frozen: the monthly emit never rewrites a snapshot an earlier
  // edition already published for the same asOf (the July 2026 first edition
  // renders on the same data day as the final weekly — that weekly's snapshot,
  // and its edition pointer, stay untouched).
  const jsonPath = path.join(dir, `week-${ins.asOf}.json`);
  if (preserveExisting && existsSync(jsonPath)) return;
  const edition = editionFromInsight(ins);
  const json = {
    _doc: 'Frozen per-read snapshot of the Muntin Restaurant Cost Index dispatch. Public wholesale levels, never delivered prices. Measured levels only — never a forecast.',
    license: 'https://creativecommons.org/publicdomain/zero/1.0/',
    methodology: 'https://muntin.digital/cost-index/methodology/',
    edition: editionUrl || ('https://muntin.digital/blog/cost-index-week-' + ins.asOf + '/'),
    ...edition,
  };
  writeFileSync(jsonPath, JSON.stringify(json, null, 2) + '\n');

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

// Move 8 (cohesion) — the flagged movers this edition names each get a link to
// their OWN standing reference page, so a reader who sees "eggs flashed re-price"
// can descend straight to the eggs page and its sources. Name only: no invented
// relationship, no number, just the navigational link the item already earns by
// being flagged. never-404 — a key is linked only when /cost-index/<key>/ exists
// on disk (the same existsSync guard the seed builder and the live tools use).
// De-duped by key and capped so the "Go deeper" line stays a pointer, not a
// directory; the hub link always follows as the catch-all.
function flaggedRefLinks(ins) {
  const seen = new Set();
  const out = [];
  for (const i of [...(ins.reprice || []), ...(ins.watch || [])]) {
    if (!i.key || seen.has(i.key)) continue;
    if (!existsSync(path.join(repoRoot, 'cost-index', i.key, 'index.html'))) continue;
    seen.add(i.key);
    out.push(`<a href="/cost-index/${esc(i.key)}/">${esc(i.name || i.key)}</a>`);
    if (out.length >= 8) break;
  }
  return out;
}

// "Go deeper" — the tiered-depth descent. Keeps the top read short by LINKING the heavier
// layers (per-ingredient pages, the machine feed, the archive) instead of inlining them.
// The companion-tools line also satisfies check-content-guardrails.mjs's ≥2 /tools/<slug>/
// links floor — without it an emitted edition's only tool link is the sticky bar's.
function goDeeperBlock(ins) {
  const refLinks = flaggedRefLinks(ins);
  const perIngredient = refLinks.length
    ? `every flagged item has its own live page with the full reading and its sources &mdash; ${refLinks.join(', ')}, or browse <a href="/cost-index/">the Cost Index hub</a>.`
    : `every flagged item has its own live page with the full reading and its sources, e.g. <a href="/cost-index/">the Cost Index hub</a>.`;
  return `      <h2 id="go-deeper">Go deeper</h2>
      <p>This dispatch is the surface read. The layers underneath it are addressable, so an analyst &mdash; or an answer engine &mdash; can descend without the top read bloating:</p>
      <ul>
        <li><strong>Per-ingredient pages</strong> &mdash; ${perIngredient}</li>
        <li><strong>This edition as data</strong> &mdash; <a href="/cost-index/week-${esc(ins.asOf)}.json">week-${esc(ins.asOf)}.json</a> and <a href="/cost-index/week-${esc(ins.asOf)}.csv">.csv</a>: the frozen per-ingredient snapshot behind this page.</li>
        <li><strong>The full series &amp; feed</strong> &mdash; <a href="/cost-index/feed.json">feed.json</a> (machine catalog) and the <a href="/cost-index/weekly/">edition archive</a> (every week).</li>
        <li><strong>The companion tools</strong> &mdash; <a href="/tools/cost-pulse/">Cost Pulse</a> for today's tracked levels, and the <a href="/tools/plate-cost/">plate cost calculator</a> for what a level does to one dish.</li>
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

// ============================================================================
// THE MONTHLY EDITION — section builders assembled by assembleEdition() in the
// ten-section spine order (docs/plans/monthly-dispatch-site-edition.md §3):
//   1 masthead + cold-open answer · 2 honesty · 3 the month in one figure ·
//   4 lead stories (quiet-lead on a quiet month) · 5 the full board ·
//   6 what stayed quiet · 7 looking ahead (§6 licensed blocks) · 8 from the
//   floor · 9 the record · 10 methodology & provenance.
// Every builder consumes only the computed payload + committed --check-gated
// JSON files. Donor-chrome slicing is unchanged from the weekly emit.
// ============================================================================

const shortDate = (iso) => iso.slice(5);
const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};
const ingLink = (key, name) => `<a href="/cost-index/${key}/">${esc(name)}</a>`;

// Ingredient → category map. Single source of truth is the hub's ING_META in
// build-cost-index-pages.mjs — parsed, never duplicated, so a new panel member
// lands in the same group on both surfaces. Unknown items group under 'other'.
function loadCategoryMap() {
  const map = {};
  try {
    const src = readFileSync(path.join(repoRoot, 'scripts/build-cost-index-pages.mjs'), 'utf8');
    const re = /'([\w-]+)':\s*\{\s*cat:\s*'([\w-]+)'/g;
    let m;
    while ((m = re.exec(src)) !== null) map[m[1]] = m[2];
  } catch { /* degrade to a single 'other' group */ }
  return map;
}
const CATEGORY_LABELS = { beef: 'Beef', poultry: 'Poultry', pork: 'Pork', seafood: 'Seafood', produce: 'Produce', 'dairy-eggs': 'Dairy & eggs', pantry: 'Pantry', other: 'Other tracked items' };
const CATEGORY_ORDER = ['beef', 'poultry', 'pork', 'seafood', 'produce', 'dairy-eggs', 'pantry', 'other'];

// ---- viz-spark rendering (canon §8) ----------------------------------------
// Inline-SVG step-line of dated reads, time-scaled on x so a missing read is a
// visible gap (the path BREAKS across a hole > gapDays — nothing interpolates).
// The line ends at the last committed read: no projection tail, ever.
function sparkSvg(series, { w = 320, h = 72, pad = 8, gapDays = 5, marks = [], cls = 'viz-spark__line' } = {}) {
  const t0 = Date.parse(series[0].date), t1 = Date.parse(series[series.length - 1].date);
  const span = Math.max(t1 - t0, 1);
  const vals = series.map((p) => p.valueCents);
  const lo = Math.min(...vals), hi = Math.max(...vals);
  const vspan = (hi - lo) || 1;
  const X = (p) => (pad + ((Date.parse(p.date) - t0) / span) * (w - 2 * pad)).toFixed(1);
  const Y = (p) => (pad + (1 - (p.valueCents - lo) / vspan) * (h - 2 * pad)).toFixed(1);
  let d = '';
  for (let i = 0; i < series.length; i++) {
    const p = series[i];
    const brk = i === 0 || (Date.parse(p.date) - Date.parse(series[i - 1].date)) / 86400000 > gapDays;
    d += brk ? `M${X(p)},${Y(p)}` : `H${X(p)}V${Y(p)}`;
  }
  const seen = new Set();
  const dots = marks.filter((m) => {
    const k = `${m.date}:${m.valueCents}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  }).map((m) => `<circle class="viz-spark__dot" cx="${X(m)}" cy="${Y(m)}" r="3"/>`).join('');
  return `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" aria-hidden="true" focusable="false"><path class="${cls}" d="${d}"/>${dots}</svg>`;
}

// One .viz-spark block (title + chart + endpoint/peak/trough annotations).
// fmt formats a value (money for ingredient series, fmtPct for the basket).
function sparkBlock({ title, series, fmt, gapDays = 5, h = 72 }) {
  const start = series[0], end = series[series.length - 1];
  let peak = series[0], trough = series[0];
  for (const p of series) {
    if (p.valueCents > peak.valueCents) peak = p;
    if (p.valueCents < trough.valueCents) trough = p;
  }
  const tone = end.valueCents > start.valueCents ? 'rust' : end.valueCents < start.valueCents ? 'teal' : 'stone';
  const svg = sparkSvg(series, { marks: [start, end, peak, trough], gapDays, h });
  const annos = [
    `<span class="viz-spark__anno">opened <strong>${fmt(start.valueCents)}</strong> ${shortDate(start.date)}</span>`,
    `<span class="viz-spark__anno">closed <strong>${fmt(end.valueCents)}</strong> ${shortDate(end.date)}</span>`,
  ];
  if (peak.date !== start.date && peak.date !== end.date) annos.push(`<span class="viz-spark__anno">peak <strong>${fmt(peak.valueCents)}</strong> ${shortDate(peak.date)}</span>`);
  if (trough.date !== start.date && trough.date !== end.date) annos.push(`<span class="viz-spark__anno">trough <strong>${fmt(trough.valueCents)}</strong> ${shortDate(trough.date)}</span>`);
  return `<div class="viz-spark" data-tone="${tone}">
            <p class="viz-spark__title">${esc(title)}</p>
            <div class="viz-spark__chart">${svg}</div>
            <p class="viz-spark__annos">${annos.join('')}</p>
          </div>`;
}

// The basket's own dated arc: one point per commensurable editions-spine entry
// in the window plus the current read. Values are the basket's % vs baseline —
// every point a dated published read, never an interpolation.
function basketArcSeries(archive, ins) {
  const byDate = new Map();
  for (const e of (archive.editions || [])) {
    if (ins.editionDate && e.editionDate === ins.editionDate) continue; // own prior run
    if (!(e.asOf > ins.sinceDate && e.asOf <= ins.asOf)) continue;
    if (ins.basketWeightsVersion && e.basketWeightsVersion && e.basketWeightsVersion !== ins.basketWeightsVersion) continue; // same ruler only
    const p = e.basket && e.basket.pct;
    if (typeof p === 'number') byDate.set(e.asOf, { date: e.asOf, valueCents: p });
  }
  if (ins.basket && typeof ins.basket.pct === 'number') byDate.set(ins.asOf, { date: ins.asOf, valueCents: ins.basket.pct });
  return [...byDate.values()].sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ---- §3.1 masthead + cold-open answer ---------------------------------------
// The ≤50-word verbatim-liftable answer: month + as-of + basket + top story +
// "wholesale, not delivered". Returned alongside its plain text so the emit
// assert can count words on exactly what ships.
function buildAnswer(ins, monthName) {
  const quiet = ins.stories.length === 0;
  const movers = [...ins.risers, ...ins.fallers].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const top = quiet ? movers[0] : ins.stories[0];
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const n = (ins.basket && ins.basket.nContributing) || ins.count;
  const topLine = quiet
    ? `The loudest raw move is ${top.name} at ${fmtPctPlain(top.pct)}, but nothing cleared the noise gate — the licensed read is hold.`
    : `The lead story is ${top.name}, ${fmtPctPlain(top.pct)} against its baseline, which cleared the noise gate.`;
  const text = `As of ${humanDateOf(ins.asOf)}, the ${n}-staple wholesale basket reads ${basketPlain} against its tracked baseline. ${topLine} These are wholesale levels, not delivered prices.`;
  const html = `      <p class="dispatch-answer">As of ${humanDateOf(ins.asOf)}, the ${n}-staple wholesale basket reads ${basketPlain} against its tracked baseline. ${quiet
    ? `The loudest raw move is ${ingLink(top.key, top.name)} at ${fmtPct(top.pct)}, but nothing cleared the noise gate &mdash; the licensed read is hold.`
    : `The lead story is ${ingLink(top.key, top.name)}, ${fmtPct(top.pct)} against its baseline, which cleared the noise gate.`} These are wholesale levels, not delivered prices.</p>`;
  return { html, text };
}

function sMasthead(ctx) {
  const { ins, monthName, editionDate, answer, archive } = ctx;
  const basketRead = ins.basket && typeof ins.basket.pct === 'number' ? fmtPct(ins.basket.pct) : '&mdash;';
  const quiet = ins.stories.length === 0;
  const verdict = quiet ? 'The panel reads hold.' : `${esc(ins.stories[0].name)} leads the month.`;
  // Quiet aria-hidden basket arc behind the hero numeral.
  const bSeries = basketArcSeries(archive, ins);
  const heroArc = bSeries.length >= 2 ? sparkSvg(bSeries, { w: 240, h: 64, gapDays: Infinity, cls: 'hero-band__arcline' }) : '';
  // Service note — one line naming the cadence pivot, only while this is the
  // FIRST monthly edition in the spine (spine-derived, no apology paragraph).
  const priorMonthly = (archive.editions || []).some((e) => e.editionDate && e.editionDate < editionDate);
  const serviceNote = priorMonthly ? '' : `      <p class="service-note">Service note: the Cost Index moved from a weekly to a first-Tuesday monthly dispatch on 2026-07-06 &mdash; this ${esc(monthName)} edition is the first on the monthly cadence, and the dated weekly editions stay archived.</p>\n`;
  return `    <header id="masthead" style="margin-bottom:28px">
      <p class="eyebrow">The Cost Index &middot; Monthly Dispatch &middot; Edition of ${editionDate} &middot; By <a href="/about/#don-goldstein" style="color:var(--teal)">Don Goldstein</a></p>
      <h1 style="font-family:var(--font-display);font-size:clamp(36px,5.5vw,56px);font-weight:500;line-height:1.05;letter-spacing:-0.5px;margin:0 0 18px">
        The Restaurant Cost Index &mdash; ${esc(monthName)} edition. <span class="serif-italic">${verdict}</span>
      </h1>
      <p class="post-dek" style="font-size:18px;line-height:1.55;color:var(--ink-soft);margin:0">Where wholesale food costs stand, read as of ${ins.asOf} &mdash; a dated read, not a month average. The weighted basket reads ${basketRead} against its baseline; ${quiet ? 'nothing cleared the noise gate this month, and that hold is the story' : `${esc(ins.stories.length === 1 ? '1 story' : ins.stories.length + ' stories')} cleared the noise gate`}. Public wholesale levels, never your delivered price.</p>
${serviceNote}      <div class="hero-band" aria-label="The month at a glance">
        <div class="hero-band__basket">
          <div class="hero-band__numwrap">${heroArc}<p class="hero-band__num">${basketRead}</p></div>
          <p class="hero-band__cap">the weighted basket vs baseline &middot; read as of ${ins.asOf}</p>
        </div>
        <ul class="hero-band__stats">
          <li><strong>${ins.up}</strong> above baseline &middot; <strong>${ins.flat}</strong> flat &middot; <strong>${ins.down}</strong> below</li>
          <li><strong>${ins.stories.length}</strong> ${ins.stories.length === 1 ? 'story' : 'stories'} cleared the noise gate</li>
          <li>month window since <strong>${ins.sinceDate}</strong></li>
        </ul>
      </div>
${answer.html}`;
}

// ---- §3.2 the honesty paragraph (slot 2, always above the first figure) -----
function sHonesty(ctx) {
  const { ins, prevEd } = ctx;
  const wow = ins.wow;
  const fixed = `And every figure is a <strong>public wholesale level, never your delivered price</strong>: this is a read on the <a href="/glossary/cost-index/">cost index</a>, not a line for your <a href="/glossary/food-cost/">food cost</a> sheet. The point is direction and gap, not a number to paste into a cost sheet.`;
  const prevLink = prevEd
    ? `<a href="/blog/${prevEd.editionDate ? `cost-index-${prevEd.editionDate.slice(0, 7)}` : `cost-index-week-${prevEd.asOf}`}/">${esc(prevEd.asOf)}</a>`
    : '';
  let lead;
  if (!wow || wow.state === 'first') {
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em> &mdash; a dated snapshot, not a month average. This is the first edition written into the dispatch's permanent archive, so from the next edition the panel can also show the honest move since the prior one; this month it reports the standing gap.`;
  } else if (wow.state === 'reweighted') {
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em>. The basket weights changed version this edition (${esc(wow.from)} &rarr; ${esc(wow.to)}), so an edition-over-edition basket number would compare two different rulers &mdash; I am not printing one. The standing gap is below.`;
  } else {
    const b = wow.basket || {};
    let bsent;
    if (b.state === 'anchor-unchanged') {
      bsent = `The basket's data anchor has not refreshed since the prior edition (${prevLink}; still anchored ${esc(b.anchor)}), so there is no new basket move to report &mdash; rather than invent one, I say so. The per-ingredient month arcs below are current and dated.`;
    } else if (b.state === 'moved') {
      const dir = b.deltaPts > 0 ? 'widened' : b.deltaPts < 0 ? 'narrowed' : 'held';
      bsent = `Move since the prior edition (${prevLink}): the basket's gap to baseline ${dir} ${fmtPts(Math.abs(b.deltaPts))}, from ${fmtPct(b.from)} to ${fmtPct(b.to)}.`;
    } else {
      bsent = `The per-ingredient reads below are current; an edition-over-edition basket number is withheld this edition because the anchors are not comparable.`;
    }
    lead = `Each ingredient's percentage here is its read against <em>its own tracked baseline window</em> &mdash; a dated snapshot, not a month average. The month arcs below are dated committed reads from a single named source series, windowed from ${esc(ins.sinceDate)}. ${bsent}`;
  }
  return `      <p id="honesty">One honesty paragraph before the numbers, because it changes how you read every one of them. ${lead} ${fixed}</p>`;
}

// ---- §3.3 the month in one figure (the flagship 1+4 viz-spark board) --------
function sArcBoard(ctx) {
  const { ins, ci, archive, monthName } = ctx;
  const quiet = ins.stories.length === 0;
  // Lead stories where they exist; on a quiet month the 4 biggest |pct| movers
  // WITH arcs, labeled movers-not-stories.
  const leads = quiet
    ? [...ins.risers, ...ins.fallers].filter((m) => m.arc).sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 4)
    : ins.stories.slice(0, 4);
  const bSeries = basketArcSeries(archive, ins);
  const blocks = [];
  const narrBits = [];
  if (bSeries.length >= 2) {
    blocks.push(sparkBlock({
      title: `The weighted basket — ${bSeries.length} edition reads, ${bSeries[0].date} → ${bSeries[bSeries.length - 1].date}`,
      series: bSeries, fmt: (v) => fmtPct(v), gapDays: Infinity, h: 96,
    }));
    narrBits.push(`The weighted basket across ${bSeries.length} dated edition reads moved from ${fmtPctPlain(bSeries[0].valueCents)} on ${bSeries[0].date} to ${fmtPctPlain(bSeries[bSeries.length - 1].valueCents)} on ${bSeries[bSeries.length - 1].date}`);
  }
  for (const m of leads) {
    const series = dominantSeries(ci, m.key, ins.sinceDate, ins.asOf);
    if (!series) continue;
    const a = m.arc;
    blocks.push(sparkBlock({
      title: `${m.name} ${fmtPctPlain(m.pct)} — ${a.reads} reads, ${a.start.date} → ${a.end.date} (${a.source || 'single source'}, ${a.basis || 'wholesale'})`,
      series, fmt: money,
    }));
    narrBits.push(`${m.name}, reading ${fmtPctPlain(m.pct)} against its own baseline, opened at ${money(a.start.cents)} on ${a.start.date} and closed at ${money(a.end.cents)} on ${a.end.date}, with its peak at ${money(a.peak.cents)} and trough at ${money(a.trough.cents)}`);
  }
  const label = quiet
    ? `The month's biggest movers &mdash; measured gaps against each item's own window, <strong>movers, not stories</strong>: none cleared the noise gate.`
    : `The month's lead stories &mdash; each cleared the panel's own false-discovery gate.`;
  const alt = `The month in one figure, ${ins.sinceDate} through ${ins.asOf}. Five step-line arcs of dated committed reads; each line ends at its last read, with no projection. Rust arcs closed above their open, teal arcs closed below, and a gap in a line is a gap in the data. ${narrBits.join('. ')}. ${quiet ? 'These are the biggest raw movers of the month, not stories: none of them cleared the noise gate.' : 'These are the stories that cleared the noise gate this month.'} Every figure is a public wholesale read, never a delivered price.`;
  return `      <h2 id="the-month-in-one-figure">The month in one figure</h2>
      <p>${label}</p>
      <figure class="viz-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-sparks viz-sparks--board">
${blocks.map((b) => '          ' + b).join('\n')}
        </div>
        <figcaption>The ${esc(monthName)} arcs, ${ins.sinceDate} &rarr; ${ins.asOf}: dated single-source reads, ending at the last committed read. Rust closed above its open; teal closed below.</figcaption>
      </figure>`;
}

// ---- §3.4 the lead stories (or the quiet lead, per the actionability contract)
function sLeadStories(ctx) {
  const { ins, ci, storiesCatalog } = ctx;
  if (ins.stories.length === 0) {
    const movers = [...ins.risers, ...ins.fallers].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
    const top = movers[0];
    const second = movers[1];
    const dol = dollarPhrase(top);
    return `      <h2 id="the-lead-stories">The lead story is hold</h2>
      <p>Every edition of this dispatch leads with the ingredients that cleared the panel's own false-discovery gate &mdash; the moving-block bootstrap null that separates a real move from what an item's ordinary week-to-week noise produces on its own. This month, across all ${ins.count} panel members, <strong>none did</strong>. That is not a gap in the coverage; that is the read.</p>
      <p>The loudest raw gap on the board is ${ingLink(top.key, top.name)}, reading ${fmtPct(top.pct)} against its own tracked window${dol ? ` &mdash; ${dol}` : ''} &mdash; a gap that item's own history produces by chance, which is exactly what the gate exists to catch.${second ? ` Behind it sits ${ingLink(second.key, second.name)} at ${fmtPct(second.pct)}, same verdict.` : ''} The board below carries each item's dated month arc, so you can see the shape of the wander for yourself.</p>
      <p><strong>The licensed action is hold.</strong> Hold your prices, and know why: prices wandered this month, and none of the wander is distinguishable from ordinary volatility. If a vendor quotes a jump &ldquo;because the market moved,&rdquo; this panel says the market did not clear its own noise &mdash; that is a conversation worth having with the invoice on the table.</p>`;
  }
  // Gated stories: one card each, four fixed beats — the measured move, the
  // dated arc, the sourced mechanism (approved catalog entries only, cite
  // drawer mandatory), the licensed action (exactly one contract verb).
  const cards = ins.stories.map((s) => {
    const verb = s.pct >= 0 ? 'Re-price' : 'Renegotiate';
    const action = s.pct >= 0
      ? `<strong>Re-price</strong> the lines this touches, and open the renegotiate window against the printed range`
      : `<strong>Renegotiate</strong> &mdash; the market eased; if your invoice did not, that is the vendor conversation`;
    const delta = (typeof s.deltaPts === 'number' && ins.wow && ins.wow.prevAsOf)
      ? ` It moved ${fmtPts(s.deltaPts)} since the ${ins.wow.prevAsOf} edition.` : '';
    const dol = dollarPhrase(s);
    const series = dominantSeries(ci, s.key, ins.sinceDate, ins.asOf);
    const a = s.arc;
    const spark = (series && a) ? `        <figure class="viz-figure" data-audio-alt="${escAttr(`The ${s.name} month arc, ${a.start.date} through ${a.end.date}: ${a.reads} dated reads from ${a.source || 'a single source'}, opening at ${money(a.start.cents)}, closing at ${money(a.end.cents)}, peak ${money(a.peak.cents)} on ${a.peak.date}, trough ${money(a.trough.cents)} on ${a.trough.date}. The line ends at the last committed read — no projection. Wholesale reference, not a delivered price.`)}">
          ${sparkBlock({ title: `${s.name} — ${a.reads} reads, ${a.start.date} → ${a.end.date} (${a.source || 'single source'}, ${a.basis || 'wholesale'})`, series, fmt: money })}
          <figcaption>The ${esc(s.name)} dated month arc, ${a.start.date} &rarr; ${a.end.date} &mdash; committed reads only, no projection tail.</figcaption>
        </figure>` : '';
    const st = (storiesCatalog.stories || []).find((e) => e.status === 'approved' && e.ingredient === s.key && e.edition === (ctx.editionDate || '').slice(0, 7));
    const mech = st ? `        <p>${esc(st.mechanism)} <em>(association, not cause)</em></p>
        <details class="cite"><summary>Source</summary><p>${esc(st.sourceName || st.sourceUrl)} &mdash; <a href="${escAttr(st.sourceUrl)}" rel="nofollow">${esc(hostOf(st.sourceUrl))}</a>. Retrieved ${esc(st.retrievedAt)}.</p></details>` : '';
    return `      <article class="story-card" id="story-${s.key}">
        <p class="story-card__chip">${verb}</p>
        <h3>${ingLink(s.key, s.name)} &mdash; ${fmtPct(s.pct)}</h3>
        <p>It reads ${fmtPct(s.pct)} against its own tracked window${dol ? `, ${dol}` : ''}, and it survived the panel's false-discovery gate.${delta}${typeof s.elevatedWeeks === 'number' && s.elevatedWeeks >= 4 && typeof s.nHistory === 'number' ? ` Elevated in ${s.elevatedWeeks} of the last ${s.nHistory} reads.` : ''}</p>
${spark}
${mech}
        <p>${action}. <em>Cleared its own noise gate; wholesale reference, not your delivered price; first print, may revise.</em></p>
      </article>`;
  }).join('\n');
  return `      <h2 id="the-lead-stories">The lead stories</h2>
      <p>Each of these cleared the panel's own false-discovery gate this month &mdash; a measured move its own noise cannot explain, ranked by weight, magnitude, and persistence. Deterministic: same data in, same leads out.</p>
${cards}`;
}

// ---- §3.5 the full board — every shippable item, expandable, category-grouped
// seasMap is the by-key index built in emitMonthly (data/seasonality.json
// ships `ingredients` as an ARRAY of {key, ready, months…} records).
function seasonalPos(seasMap, item, mm) {
  const s = seasMap[item.key];
  if (!s || !s.ready || item.medianCents == null) return null;
  const mo = (s.months || {})[mm];
  if (!mo || !(mo.years >= 2) || typeof mo.p25Cents !== 'number' || typeof mo.p75Cents !== 'number') return null;
  const rel = item.medianCents < mo.p25Cents ? 'Below' : item.medianCents > mo.p75Cents ? 'Above' : 'Within';
  return { rel, lo: mo.p25Cents, hi: mo.p75Cents, years: mo.years };
}

function boardRow(i, ctx) {
  const glyph = i.dir === 'up' ? '&#9650;' : i.dir === 'down' ? '&#9660;' : '&#8594;';
  const med = i.medianCents != null ? `${money(i.medianCents)}${i.unit ? '/' + esc(i.unit) : ''}` : '&mdash;';
  const L = [];
  const lfi = ctx.lf.items && ctx.lf.items[i.key];
  if (lfi && typeof lfi.pos === 'number') {
    L.push(`<p><span class="ci-band" aria-hidden="true"><i style="left:${lfi.pos}%"></i></span>${med} sits at the ${ordinal(lfi.pos)} percentile of its tracked dollar range${i.rangeCents && i.rangeCents[0] !== i.rangeCents[1] ? `; today's cross-market band is ${money(i.rangeCents[0])}&ndash;${money(i.rangeCents[1])}` : ''}.</p>`);
  } else if (i.rangeCents && i.rangeCents[0] !== i.rangeCents[1]) {
    L.push(`<p>Today's cross-market band is ${money(i.rangeCents[0])}&ndash;${money(i.rangeCents[1])}.</p>`);
  }
  if (i.arc) {
    const a = i.arc;
    const pk = (a.peak.date !== a.start.date && a.peak.date !== a.end.date) ? `; peak ${money(a.peak.cents)} (${shortDate(a.peak.date)})` : '';
    const tr = (a.trough.date !== a.start.date && a.trough.date !== a.end.date) ? `; trough ${money(a.trough.cents)} (${shortDate(a.trough.date)})` : '';
    L.push(`<p>Opened ${money(a.start.cents)} on ${a.start.date}; closed ${money(a.end.cents)} on ${a.end.date}${pk}${tr} &mdash; ${a.reads} reads, ${esc(a.source || 'single source')}, ${esc(a.basis || 'wholesale')}.</p>`);
  } else {
    L.push(`<p>No month arc &mdash; fewer than two dated reads from a single source landed in this window.</p>`);
  }
  const el = (typeof i.elevatedWeeks === 'number' && i.elevatedWeeks >= 1 && typeof i.nHistory === 'number')
    ? `Elevated in ${i.elevatedWeeks} of its last ${i.nHistory} reads; ` : '';
  L.push(`<p>${el}${i.gated ? (el ? 'cleared' : 'Cleared') + ' the noise gate this edition.' : (el ? 'did' : 'Did') + ' not clear the noise gate &mdash; a snapshot, not a move.'}</p>`);
  const sp = seasonalPos(ctx.seasByKey, i, ctx.mm);
  if (sp) L.push(`<p>${sp.rel} its typical ${ctx.monthShort} band (${money(sp.lo)}&ndash;${money(sp.hi)}, ${sp.years} years of ${ctx.monthShort} reads).</p>`);
  if (i.pressure && i.pressure.lead) L.push(`<p>Pressure read: ${esc(i.pressure.dir)}, led by ${esc(i.pressure.force)} on a ${esc(i.pressure.lead)} lead &mdash; an association, not a cause.</p>`);
  L.push(`<p><a href="/cost-index/${i.key}/">Full read &rarr;</a></p>`);
  return `<details class="ci-brow" id="board-${i.key}"><summary><span class="ci-brow__glyph" data-dir="${i.dir}">${glyph}</span><a href="/cost-index/${i.key}/">${esc(i.name)}</a><span class="ci-brow__pct" data-dir="${i.dir}">${fmtPct(i.pct)}</span><span class="ci-brow__med">${med}</span></summary><div class="ci-brow__body">${L.join('')}</div></details>`;
}

function sFullBoard(ctx) {
  const { ins } = ctx;
  const byCat = {};
  for (const i of [...ins.items].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct))) {
    const c = ctx.catMap[i.key] || 'other';
    (byCat[c] = byCat[c] || []).push(i);
  }
  const groups = CATEGORY_ORDER.filter((c) => byCat[c] && byCat[c].length).map((c) => {
    const rows = byCat[c];
    const up = rows.filter((r) => r.dir === 'up').length;
    const down = rows.filter((r) => r.dir === 'down').length;
    return `        <details class="ci-cat" open>
          <summary>${CATEGORY_LABELS[c]} &mdash; ${rows.length} item${rows.length > 1 ? 's' : ''} &middot; ${up} above / ${rows.length - up - down} flat / ${down} below</summary>
${rows.map((r) => '          ' + boardRow(r, ctx)).join('\n')}
        </details>`;
  }).join('\n');
  // Compact flags table in the .ci-table idiom, mirroring the frozen CSV's
  // flag rows (bias appears in the CSV only for gate-cleared items).
  const flags = [...ins.reprice, ...ins.watch];
  const flagRows = flags.length
    ? flags.map((f) => `            <tr><td>${ingLink(f.key, f.name)}</td><td class="num">${fmtPct(f.pct)}</td><td>${esc(f.dir)}</td><td>${esc(f.bias || '')}</td><td class="num">${f.medianCents != null ? money(f.medianCents) : '&mdash;'}</td><td class="num">${f.elevatedWeeks == null ? '&mdash;' : f.elevatedWeeks}</td></tr>`).join('\n')
    : `            <tr><td colspan="6">No row cleared the gate this month &mdash; the flag column in the frozen CSV reads empty, and that is the read.</td></tr>`;
  return `      <h2 id="the-full-board">The full board</h2>
      <p>Every shippable ingredient on the panel, grouped the way the hub groups them and sorted loudest-first inside each group. The summary row is the scan &mdash; direction, name, gap, dollar median; open any row for the month detail: the dollar band and percentile, the dated month endpoints, elevation and gate status, the seasonal position where the history is deep enough, and the pressure read where one exists. Each row deep-links (this page&nbsp;+ <code>#board-&lt;ingredient&gt;</code>).</p>
      <div class="ci-board">
${groups}
      </div>
      <p style="margin-top:18px">And the gate-cleared flags as a table, mirroring the frozen CSV:</p>
      <table class="ci-table">
        <thead><tr><th>Ingredient</th><th class="num">vs baseline</th><th>Direction</th><th>Flag</th><th class="num">Median $</th><th class="num">Elevated (of recent reads)</th></tr></thead>
        <tbody>
${flagRows}
        </tbody>
      </table>
      <p>The full 81-row panel stays in the CC0 snapshot &mdash; <a href="/cost-index/week-${esc(ins.asOf)}.csv">week-${esc(ins.asOf)}.csv</a> &mdash; one row per ingredient, machine-stable.</p>`;
}

// ---- §3.6 what stayed quiet — the trust move --------------------------------
function sQuiet(ctx) {
  const { ins } = ctx;
  const storyKeys = new Set(ins.stories.map((s) => s.key));
  const held = ins.items.filter((i) => !i.gated && !storyKeys.has(i.key))
    .sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct)).slice(0, 6);
  const lis = held.map((i) => {
    const dol = dollarPhrase(i);
    const el = (typeof i.elevatedWeeks === 'number' && i.elevatedWeeks >= 2 && typeof i.nHistory === 'number') ? ` It has read elevated in ${i.elevatedWeeks} of its last ${i.nHistory} reads &mdash; watched, not called.` : '';
    return `        <li>${ingLink(i.key, i.name)} reads ${fmtPct(i.pct)} against its own window${dol ? ` &mdash; ${dol}` : ''}. Its tracked history produces gaps this size on its own, so the gate held it.${el}</li>`;
  }).join('\n');
  return `      <h2 id="what-stayed-quiet">What stayed quiet</h2>
      <p>The gate's job is to hold back what an item's own history can explain &mdash; and I print what it held, because the withholding is the product. The loudest raw gaps that did NOT clear the gate this month:</p>
      <ul>
${lis}
      </ul>
      <p>For every one of these the licensed action is the same: hold, and watch the next read. A panel that flags something every month is indistinguishable from a marketing engine; the quiet list is how you can tell this one is not.</p>`;
}

// ---- §3.7 looking ahead — the four licensed forward blocks (ADR-010) --------
function sLookingAhead(ctx) {
  const { ins, seasByKey, lf, outlook, backtest, labels } = ctx;
  const nextMM = String((parseInt((ctx.editionDate || ins.asOf).slice(5, 7), 10) % 12) + 1).padStart(2, '0');
  const nextMonthName = MONTHS_EN[parseInt(nextMM, 10) - 1];
  const nameOf = (k) => (labels[k] && labels[k].en) || k;

  // Block 1 — the pressure digest: direction on a STATED lead, named force,
  // present tense, association-tagged. Items without a stated lead are omitted.
  const pRows = ins.pressure.filter((p) => p.lead).map((p) =>
    `        <li><strong>${ingLink(p.key, p.name)}</strong> &mdash; <strong>${esc(p.dir)}</strong>, led by ${esc(p.force)} on a ${esc(p.lead)} lead <em>(association, not cause)</em>.</li>`).join('\n');
  const block1 = ins.pressure.length ? `      <h3 id="whats-building-whats-easing">What's building, what's easing</h3>
      <p>The pressure layer infers direction from the public lead indicators underneath each staple &mdash; feed grain and placements for proteins, cold-storage stocks for dairy, shipments and drought for produce. Direction on a stated lead, never a price. As of ${esc(ins.pressureAsOf || ins.asOf)}:</p>
      <ul>
${pRows}
      </ul>
      <details class="cite"><summary>Sources for the pressure read</summary><p>Inferred direction only &mdash; composed from public USDA NASS (Cattle-on-Feed, Broiler Hatchery, Cold Storage), USDA AMS movement and shipment reports, EIA diesel, and the U.S. Drought Monitor. No delivered price. See the <a href="/cost-index/methodology/">Cost Index methodology</a>.</p></details>` : '';

  // Block 2 — the seasonal calendar for the COMING month: ready items with ≥2
  // years of that month on file. A pattern statement about measured history.
  const calRows = [];
  for (const i of ins.items) {
    const s = seasByKey[i.key];
    if (!s || !s.ready) continue;
    const nm = (s.months || {})[nextMM], cm = (s.months || {})[(ctx.editionDate || ins.asOf).slice(5, 7)];
    if (!nm || !cm || !(nm.years >= 2)) continue;
    if (typeof nm.medianCents !== 'number' || typeof cm.medianCents !== 'number' || !cm.medianCents) continue;
    const ratio = nm.medianCents / cm.medianCents - 1;
    if (Math.abs(ratio) < 0.03) continue;
    calRows.push({ i, dir: ratio < 0 ? 'an easing' : 'a firmer', ratio, years: nm.years, lo: nm.p25Cents, hi: nm.p75Cents });
  }
  calRows.sort((a, b) => Math.abs(b.ratio) - Math.abs(a.ratio));
  const calLis = calRows.slice(0, 8).map((r) =>
    `        <li>${nextMonthName} is typically ${r.dir} month for ${ingLink(r.i.key, r.i.name)} (${r.years} years of ${nextMonthName} reads: p25&ndash;p75 ${money(r.lo)}&ndash;${money(r.hi)}${r.i.unit ? `/${esc(r.i.unit)}` : ''}).</li>`).join('\n');
  const block2 = `      <h3 id="the-seasonal-calendar">The seasonal calendar: ${nextMonthName}</h3>
      <p>For panel items with at least two years of ${nextMonthName} history on file, here is the measured shape of past ${nextMonthName}s against the current month &mdash; a pattern statement about measured history, not a prediction:</p>
${calLis ? `      <ul>
${calLis}
      </ul>` : `      <p>No panel item with two years of ${nextMonthName} history shows a measured ${nextMonthName} pattern beyond ordinary spread this edition.</p>`}
      <details class="cite"><summary>Source</summary><p>Per-month bands from data/seasonality.json &mdash; rebuilt from the committed read history on every refresh and re-checked in CI. Only <code>ready</code> items with the coming month established across ≥2 years are listed.</p></details>`;

  // Block 3 — lock-or-float postures, carrying the file's own qualifier.
  const c = lf.counts || {};
  const bucketNames = (bucket) => Object.entries(lf.items || {})
    .filter(([, v]) => v.bucket === bucket)
    .map(([k, v]) => ingLink(k, v.name || nameOf(k))).join(', ');
  const block3 = `      <h3 id="lock-or-float">Lock or float</h3>
      <p>The lock-or-float classifier certifies, per item, whether its next-read band has proven tight and covered enough to commit against &mdash; <strong>a risk read, never a direction call</strong> (the classifier's own rule). As of ${esc(lf.asOf || ins.asOf)}, across the ${typeof lf.catalog === 'number' ? lf.catalog : Object.keys(lf.items || {}).length}-item catalog: lock ${c.lock} / cushion ${c.cushion} / float ${c.float} / withhold ${c.withhold}.</p>
      <p><strong>Lock</strong> (band proven tight): ${bucketNames('lock') || '&mdash;'}. <strong>Cushion</strong>: ${bucketNames('cushion') || '&mdash;'}. <strong>Float</strong> (too volatile to commit): ${bucketNames('float') || '&mdash;'}. The ${c.withhold} withheld items stay uncalled &mdash; thin history, flat, or too wide &mdash; rather than guessed; each named item's coverage and its confidence interval ride its full read.</p>
      <details class="cite"><summary>Source</summary><p>data/cost-lockfloat.json &mdash; built deterministically from the committed index + deep history with the certified conformal band; every count and rate derived, never hand-typed; re-checked in CI with <code>--check</code>.</p></details>`;

  // Block 4 — [RATIFIED 2026-07-06, ADR-010 §6.4 extension] the one-print
  // reach, rendered ONLY while the outlook's input read sits inside this
  // edition's month window and the backtest verdict still licenses h=1.
  let block4;
  const h1 = ((backtest.horizonCone || {}).horizons || []).find((h) => h.h === 1) || {};
  const fresh = outlook && outlook.asOf && outlook.asOf >= ins.sinceDate
    && typeof outlook.weightedTilt === 'number' && (outlook.horizonHonest || 0) >= 1;
  if (fresh) {
    const tiltWord = outlook.weightedTilt < 0 ? 'easing' : outlook.weightedTilt > 0 ? 'building' : 'balanced';
    const building = (outlook.movers || []).filter((m) => m.direction === 'building').map((m) => ingLink(m.slug, nameOf(m.slug))).join(', ');
    const easing = (outlook.movers || []).filter((m) => m.direction === 'easing').map((m) => ingLink(m.slug, nameOf(m.slug))).join(', ');
    block4 = `      <h3 id="the-one-print-reach">The one-print reach</h3>
      <p><strong>The backtest's proven edge reaches one print ahead; at that reach the panel's weighted tilt reads ${tiltWord}; beyond it we don't look.</strong> Behind the tilt (input read dated ${esc(outlook.asOf)}): building &mdash; ${building || '&mdash;'}; easing &mdash; ${easing || '&mdash;'}. Direction at one print's reach, proven edges only &mdash; never a price, never a guarantee.</p>
      <details class="cite"><summary>Backtest citation</summary><p>Walk-forward backtest (data/cost-forecast-backtest.json): at h=1 the 80%-nominal band realizes ${typeof h1.bandCoverage === 'number' ? (h1.bandCoverage * 100).toFixed(1) : '?'}% coverage over ${h1.scoredSteps || '?'} scored steps, and direction calls hit ${h1.direction ? (h1.direction.hitRate * 100).toFixed(1) : '?'}% against a ${h1.direction ? (h1.direction.baseline * 100).toFixed(1) : '?'}% majority baseline over ${h1.direction ? h1.direction.scored : '?'} calls &mdash; the reach the verdict certifies (coneHonestThroughH: ${(backtest.verdict || {}).coneHonestThroughH}). Tilt from data/cost-outlook.json (weighted tilt ${outlook.weightedTilt}; ${(outlook.counts || {}).building} building / ${(outlook.counts || {}).easing} easing across ${(outlook.counts || {}).n} movers). ADR-010 §6.4 extension, ratified 2026-07-06.</p></details>`;
  } else {
    const reason = !outlook || !outlook.asOf
      ? 'its input artifact is missing'
      : (outlook.horizonHonest || 0) < 1
        ? `the backtest verdict currently licenses no forward reach (coneHonestThroughH: ${outlook.horizonHonest})`
        : `its input read is dated ${esc(outlook.asOf)}, older than this edition's month window (since ${esc(ins.sinceDate)})`;
    block4 = `      <h3 id="the-one-print-reach">The one-print reach</h3>
      <p>The one-print tilt is withheld this edition: ${reason} &mdash; stated rather than stretched. It returns when the outlook rebuilds on a fresh pressure read.</p>`;
  }

  return `      <h2 id="looking-ahead">Looking ahead &mdash; strictly within the license</h2>
      <p>The index never forecasts. What it can honestly say about the road ahead comes in four licensed shapes: pressure that is measurably building or easing on a stated lead, the measured shape of past ${nextMonthName}s, the certified lock-or-float postures, and the panel's one-print tilt &mdash; each backward- or present-looking, none a prediction of a price.</p>
${block1}
${block2}
${block3}
${block4}`;
}

// ---- §3.8 from the floor (gated editors-note slot; renders clean when empty)
function sFloor(note) {
  if (!note || !note.text) return `      <!-- from-the-floor: no note this edition (the slot ships empty by default) -->`;
  return `      <div id="from-the-floor">
${editorsNoteBlock(note)}
      </div>`;
}

// ---- §3.9 the record — calibration with misses + derived revision stats -----
function sRecord(ctx) {
  const { calib, revs } = ctx;
  const band = calib.band || {};
  const trend = calib.trend || {};
  const tiers = trend.tiers || {};
  const strongest = tiers.high || {};
  const weakest = tiers.low || {};
  const revList = (revs.revisions || []).filter((r) => r.type === 'revision' && typeof r.deltaPct === 'number');
  const nWith = (revs.revisions || []).filter((r) => r.type === 'withdrawal').length;
  const mags = revList.map((r) => Math.abs(r.deltaPct)).sort((a, b) => a - b);
  const q = (p) => (mags.length ? mags[Math.min(mags.length - 1, Math.floor(p * mags.length))] : null);
  const median = q(0.5), p90 = q(0.9);
  const pc = (x, d = 1) => (typeof x === 'number' ? (x * 100).toFixed(d) : '?');
  return `      <h2 id="the-record">The record</h2>
      <p>This dispatch grades itself in public, misses first. The published ${pc(band.nominal, 0)}% bands realize <strong>${pc(band.pooledCoverage)}% pooled coverage</strong> across ${band.items} items and ${band.scoredSteps} scored steps (per-item ${pc(band.minItemCoverage)}&ndash;${pc(band.maxItemCoverage)}%, ${band.underCovering} under-covering) &mdash; short of design, and printed anyway. Direction calls land ${pc(trend.overallHitRate)}% against a ${pc(trend.baseline)}% majority baseline over ${trend.scoredCalls} calls; only the strongest signal tier beats the coin flip (${pc(strongest.hitRate)}% on ${strongest.n} calls), and the weakest runs ${pc(weakest.hitRate)}% &mdash; below the baseline, which is why the arrows on this page never lean on that tier.</p>
      <p>And first prints revise. The public revision ledger holds <strong>${revList.length} revisions and ${nWith} withdrawals</strong>; the median revision moves a published read ${pc(median, 0)}%, and one in ten moves it more than ${pc(p90, 0)}%. Every dollar figure in this edition is a first print unless dated otherwise &mdash; the market's read today, not a settled fact.</p>
      <details class="cite"><summary>Sources for the record</summary><p>data/cost-index-calibration-report.json (band + trend calibration) and data/cost-revisions.json (append-only revision ledger) &mdash; both rebuilt from committed data on every refresh and re-checked in CI with <code>--check</code>; every number in this section re-derives from them at emit time, never hand-typed.</p></details>`;
}

// ---- §3.10 methodology & provenance footer ----------------------------------
function citeBlockMonthly(ins, url, monthName, editionDate) {
  const wv = ins.basketWeightsVersion ? `basket weights v${esc(ins.basketWeightsVersion)}, ` : '';
  const mv = ins.methodologyVersion ? `methodology v${esc(ins.methodologyVersion)}` : 'methodology';
  return `  <aside class="cite-this" data-llm="citation" aria-label="How to cite this edition" style="margin:32px auto;max-width:720px;padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px">
    <p class="cite-this__eyebrow" style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;color:var(--teal);margin:0 0 8px">Cite this edition</p>
    <p class="cite-this__text" style="margin:0 0 10px;font-size:14.5px;line-height:1.55">Muntin Digital. &ldquo;Restaurant Cost Index &mdash; ${esc(monthName)}: where food costs stand.&rdquo; Muntin Restaurant Cost Index, ${wv}${mv}. Edition of ${esc(editionDate)}, read as of ${esc(ins.asOf)}. <a href="${url}">${url}</a>. Data: <a href="https://muntin.digital/cost-index/week-${esc(ins.asOf)}.json">/cost-index/week-${esc(ins.asOf)}.json</a> (CC0).</p>
    <p class="cite-this__repro" style="margin:0;font-size:13.5px;line-height:1.5;color:var(--ink-soft)">Reproducible from public USDA, BLS, and FRED data via the methodology's <a href="/cost-index/methodology/#reproduce">worked example</a>. Public wholesale levels, never your delivered price.</p>
  </aside>`;
}

function sProvenance(ctx) {
  const { ins, url, monthName, editionDate, faq } = ctx;
  const faqHtml = faq.map((f) => `        <details class="faq-item"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('\n');
  return `      <h2 id="methodology-and-provenance">Methodology &amp; provenance</h2>
      <p>This edition is the surface read. The layers underneath it are addressable, so an analyst &mdash; or an answer engine &mdash; can descend without the top read bloating:</p>
      <ul>
        <li><strong>Per-ingredient pages</strong> &mdash; every name on this page links its own live read with full sources, via <a href="/cost-index/">the Cost Index hub</a>.</li>
        <li><strong>This edition as data</strong> &mdash; <a href="/cost-index/week-${esc(ins.asOf)}.json">week-${esc(ins.asOf)}.json</a> and <a href="/cost-index/week-${esc(ins.asOf)}.csv">.csv</a>: the frozen CC0 snapshot behind this page.</li>
        <li><strong>The full series &amp; feed</strong> &mdash; <a href="/cost-index/feed.json">feed.json</a> (machine catalog) and the <a href="/cost-index/weekly/">edition archive</a>.</li>
        <li><strong>The companion tools</strong> &mdash; <a href="/tools/cost-pulse/">Cost Pulse</a> for today's tracked levels, and the <a href="/tools/plate-cost/">plate cost calculator</a> for what a level does to one dish.</li>
        <li><strong>Methodology &amp; confidence</strong> &mdash; the <a href="/cost-index/methodology/">versioned methodology</a>${ins.methodologyVersion ? ` (v${esc(ins.methodologyVersion)})` : ''}, including why nothing here is rated <em>high</em> (that needs two independent dollar sources) and the published band-coverage backtest.</li>
      </ul>
      <h3 id="edition-faq">Quick answers</h3>
${faqHtml}
      <!-- edition-chain:start --><!-- edition-chain:end -->
${citeBlockMonthly(ins, url, monthName, editionDate)}`;
}

// ---- the retitled contribution figure (D10: no summation claim) -------------
function buildPullsMonthly(ins, monthName) {
  const rows = (ins.contributors || []).slice(0, 6);
  if (rows.length < 2) return '';
  const max = Math.max(...rows.map((c) => Math.abs(c.points)), 0.0001);
  const barRows = rows.map((c) => {
    const tone = c.points >= 0 ? 'rust' : 'teal';
    const w = widthOf(c.points, max).toFixed(3);
    const wpct = Math.round(c.weight * 100);
    return `          <div class="viz-bars__row">
            <p class="viz-bars__label">${ingLink(c.key, c.name)} <span style="opacity:.6">(${wpct}% of basket)</span></p>
            <div class="viz-bars__track"><span class="viz-bars__fill" data-tone="${tone}" style="--w:${w}"></span></div>
            <p class="viz-bars__num">${fmtPts(c.points)}</p>
          </div>`;
  }).join('\n');
  const narr = rows.map((c) => `${c.name}, ${Math.round(c.weight * 100)} percent of the basket and reading ${fmtPctPlain(c.pct)} against baseline, pulls ${fmtPtsPlain(c.points)}`).join('; ');
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const alt = `The biggest individual pulls on the basket for the ${monthName} edition, read as of ${ins.asOf}. The weighted basket reads ${basketPlain} against baseline; that headline is a weighted median, so these pulls do not sum to it — they are the loudest individual tugs, each one weight times that staple's own read. Rust bars pull the basket up, teal bars pull it down, scaled so the largest pull fills the track. ${narr}. Public wholesale levels, never a delivered price.`;
  return `      <figure class="viz-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-bars">
          <p class="viz-bars__title">The biggest individual pulls (each staple's weight × its own read; rust pulls the basket up, teal pulls it down) — read as of ${ins.asOf}</p>
${barRows}
          <p class="viz-bars__note">A &ldquo;point&rdquo; is one one-hundredth of the basket percentage. The headline basket number is a <strong>weighted median</strong>, so these pulls do not sum to it &mdash; they are the loudest individual tugs on the read, not an addition.</p>
        </div>
        <figcaption>The biggest individual pulls on the ${esc(monthName)} basket read (as of ${ins.asOf}). Rust pulls up, teal pulls down; the median headline is not their sum.</figcaption>
      </figure>`;
}

function buildRingsMonthly(ins, monthName) {
  const total = ins.count || (ins.up + ins.down + ins.flat);
  const upScore = total > 0 ? Math.round((ins.up / total) * 100) : 0;
  const basket = ins.basket || {};
  const basketPct = typeof basket.pct === 'number' ? basket.pct : null;
  const basketScore = basketPct == null ? 0 : Math.min(100, Math.round((Math.abs(basketPct) / 0.5) * 100));
  const basketBand = basketPct == null ? 'warn' : basketPct > 0 ? 'bad' : 'good';
  const alt = `Two readings of where the panel sits in the ${monthName} edition, read as of ${ins.asOf}. The first ring shows the spread: ${ins.up} of ${total} tracked ingredients read above their own baseline window, ${ins.down} below, and ${ins.flat} flat. The second ring shows the weighted basket${basket.asOf ? `, anchored ${basket.asOf}` : ''}: it reads ${basketPct == null ? 'no value this edition' : fmtPctPlain(basketPct)} against its baseline across ${basket.nContributing || total} contributing ingredients. Both are dated reads versus each baseline window, never a forecast and never a delivered price.`;
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
            <p class="viz-ring__label"><strong>Weighted basket</strong>${basket.nContributing || total} ingredients</p>
          </div>`;
  return `      <figure class="viz-figure" data-audio-alt="${escAttr(alt)}">
        <div class="viz-rings">
${spreadRing}
${basketRing}
        </div>
        <figcaption>Where the panel sits, ${esc(monthName)} edition (read as of ${ins.asOf}): the spread of reads above baseline, and the weighted basket's own reading.</figcaption>
      </figure>`;
}

// ---- the month-scoped FAQ (payload-derived; answers open "As of <date>…") ---
function buildFaq(ins, monthName) {
  const quiet = ins.stories.length === 0;
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const n = (ins.basket && ins.basket.nContributing) || ins.count;
  const risers = ins.risers.map((i) => `${i.name} ${fmtPctPlain(i.pct)}`).join(', ');
  const fallers = ins.fallers.map((i) => `${i.name} ${fmtPctPlain(i.pct)}`).join(', ');
  const movers = [...ins.risers, ...ins.fallers].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const close = 'A wholesale reference, not a delivered price.';
  return [
    {
      q: `Are wholesale food costs up or down in ${monthName}?`,
      a: `As of ${ins.asOf}, the weighted ${n}-staple basket reads ${basketPlain} against its tracked baseline, with ${ins.up} of ${ins.count} panel ingredients above their own baseline windows, ${ins.down} below, and ${ins.flat} flat. ${close}`,
    },
    {
      q: `Which food prices moved the most in the month ending ${humanDateOf(ins.asOf)}?`,
      a: `As of ${ins.asOf}, the widest gaps against each item's own tracked window are — rising: ${risers}; falling: ${fallers}. Each is a dated read versus that ingredient's own baseline, not a month average. ${close}`,
    },
    {
      q: `Did anything clear the Cost Index noise gate in ${monthName}?`,
      a: quiet
        ? `As of ${ins.asOf}, no. The loudest raw gap is ${movers[0].name} at ${fmtPctPlain(movers[0].pct)}, a move that item's own history produces by chance — so the licensed read is hold. ${close}`
        : `As of ${ins.asOf}, yes: ${ins.stories.map((s) => `${s.name} (${fmtPctPlain(s.pct)})`).join(', ')} cleared the panel's false-discovery gate. ${close}`,
    },
    {
      q: `Where can I download the ${monthName} Cost Index data?`,
      a: `As of ${ins.asOf}, the frozen snapshot behind this edition is published CC0 at muntin.digital/cost-index/week-${ins.asOf}.json and week-${ins.asOf}.csv, with the versioned methodology at muntin.digital/cost-index/methodology/. ${close}`,
    },
  ];
}

// ---- emit-time asserts: the article-graphics 8 rules + the edition contracts,
// enforced with the GATE'S OWN parsers so emit and CI can never disagree. -----
function assertMonthlyEdition(html, { answerText, ins }) {
  const errs = [];
  const figs = collectContentFigures(html);
  if (figs.length < 2) errs.push(`only ${figs.length} content figure(s); the floor is 2`);
  const kinds = new Set();
  figs.forEach((f) => detectVizKinds(f.inner).forEach((k) => kinds.add(k)));
  if (kinds.size < 2) errs.push(`only ${kinds.size} distinct viz kind(s): ${[...kinds].join(', ')}`);
  figs.forEach((f, i) => {
    const alt = getDataAudioAlt(f.openAttrs);
    if (alt.length < DATA_AUDIO_ALT_MIN) errs.push(`figure #${i + 1}: data-audio-alt is ${alt.length} chars (< ${DATA_AUDIO_ALT_MIN})`);
    if (!hasFigcaption(f.inner)) errs.push(`figure #${i + 1}: missing <figcaption>`);
    if (!/\d{4}-\d{2}-\d{2}/.test(f.inner)) errs.push(`figure #${i + 1}: no ISO date inside the figure text (cross-edition dedup rule)`);
  });
  const teal = figs.some((f) => /\bdata-tone="teal"/.test(f.inner));
  if (teal && !/\bdata-tone="rust"/.test(html)) errs.push('tone balance: teal figures without any rust in the post');
  const auto = findAutolinkInAttribute(html);
  if (auto.length) errs.push(`autolink marker inside attribute value (${auto.length} hit(s))`);
  const words = answerText.trim().split(/\s+/).filter((w) => /[A-Za-z0-9%$]/.test(w)).length;
  if (words > 50) errs.push(`dispatch-answer runs ${words} words (> 50)`);
  for (const sel of ['class="dispatch-answer"', 'class="tldr__list"']) {
    if (!html.includes(sel)) errs.push(`speakable target missing: ${sel}`);
  }
  const rowCount = (html.match(/id="board-/g) || []).length;
  if (rowCount !== ins.items.length) errs.push(`board rows (${rowCount}) != shippable panel (${ins.items.length})`);
  // Forward-grammar mini-guard on the Looking-ahead section (the dedicated
  // check-cost-index-forward-grammar gate is plan item 5; this keeps the
  // binding ADR-010 boundary enforced at emit until it lands).
  const laStart = html.indexOf('id="looking-ahead"');
  const laEnd = html.indexOf('id="the-record"');
  if (laStart !== -1 && laEnd > laStart) {
    // The honest reframe ("not a prediction", "never forecasts") is licensed
    // vocabulary, and cite drawers name artifacts by filename (e.g.
    // cost-forecast-backtest.json). Strip both, then flag any remaining
    // future-tense/forecast construction in the section's prose.
    const la = html.slice(laStart, laEnd)
      .replace(/<details class="cite">[\s\S]*?<\/details>/g, '')
      .replace(/\b(?:not|never|none)(?:\s+\w+){0,2}\s+(?:a\s+)?(?:prediction|predictions|forecast|forecasts)\b/gi, '')
      .replace(/\bnever\s+forecasts?\b/gi, '');
    const bad = la.match(/\b(will|going to|expect(?:s|ed)?\s+to|predict(?:s|ed|ion|ions)?|forecast(?:s|ed|ing)?)\b/i);
    if (bad) errs.push(`future-tense/forecast construction in Looking ahead: "${bad[0]}"`);
  }
  if (errs.length) {
    console.error(`✗ monthly edition failed ${errs.length} emit-time assert(s):`);
    for (const e of errs) console.error(`  - ${e}`);
    process.exit(1);
  }
  return { figures: figs.length, kinds: [...kinds].sort(), answerWords: words, boardRows: rowCount };
}

function upsertLibraryTagsMonthly(slug, ins, monthName) {
  const f = path.join(repoRoot, 'data/library-tags.json');
  const data = JSON.parse(readFileSync(f, 'utf8'));
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  data.blog_posts = data.blog_posts || {};
  data.blog_posts[slug] = {
    topics: ['operations-margin'],
    title: `Restaurant Cost Index — ${monthName}: where food costs stand`,
    dek: `The monthly read on wholesale ingredient costs, read as of ${ins.asOf}: the basket sits at ${basketPlain} against baseline, ${ins.up} of ${ins.count} ingredients above their tracked window. The month's arcs, the full expandable board, and the licensed forward blocks. Public wholesale levels, never your delivered price.`,
    date: ins.editionDate || ins.asOf,
    read_min: 8,
    hide_from_recents: true,
  };
  writeFileSync(f, JSON.stringify(data, null, 2) + '\n');
}

// Page-scoped styles for the monthly-only components (the shared viz-* families
// live in assets/site-article.css; only edition chrome lives here).
const MONTHLY_CSS = `
.dispatch-answer{font-size:17px;line-height:1.6;padding:16px 20px;border-left:3px solid var(--ink);background:var(--cream-2);border-radius:8px;margin:22px 0 0}
.service-note{font-size:13.5px;color:var(--ink-soft);font-style:italic;margin:0 0 14px}
.hero-band{display:grid;grid-template-columns:auto 1fr;gap:12px 28px;align-items:center;margin:24px 0 0;padding:18px 20px;border:1px solid #D7DAE0;border-radius:12px;background:var(--cream-2)}
.hero-band__numwrap{position:relative;display:inline-block}
.hero-band__numwrap svg{position:absolute;inset:auto 0 0 0;width:100%;height:100%;opacity:.16}
.hero-band__arcline{fill:none;stroke:var(--ink);stroke-width:2}
.hero-band__num{font-family:var(--font-display);font-size:clamp(40px,6vw,60px);font-weight:500;line-height:1;margin:0;font-variant-numeric:tabular-nums;position:relative}
.hero-band__cap{font-size:13px;color:var(--ink-soft);margin:6px 0 0}
.hero-band__stats{list-style:none;margin:0;padding:0;font-size:14.5px;line-height:1.7;font-variant-numeric:tabular-nums}
@media(max-width:560px){.hero-band{grid-template-columns:1fr}}
.ci-board{width:min(960px,100%);margin:18px auto}
.ci-cat{border:1px solid #D7DAE0;border-radius:12px;margin:14px 0;background:var(--cream-2);overflow:hidden}
.ci-cat>summary{cursor:pointer;font-family:var(--font-display);font-size:16px;font-weight:500;padding:12px 16px;list-style:none}
.ci-cat>summary::-webkit-details-marker{display:none}
.ci-brow{border-top:1px solid #D7DAE0;background:var(--cream)}
.ci-brow>summary{display:grid;grid-template-columns:20px minmax(0,1fr) auto auto;gap:10px;align-items:baseline;padding:8px 14px;cursor:pointer;font-size:14px;font-variant-numeric:tabular-nums;list-style:none}
.ci-brow>summary::-webkit-details-marker{display:none}
.ci-brow>summary a{text-decoration:none;color:var(--ink)}
.ci-brow__glyph[data-dir="up"],.ci-brow__pct[data-dir="up"]{color:#B8541A}
.ci-brow__glyph[data-dir="down"],.ci-brow__pct[data-dir="down"]{color:var(--teal)}
.ci-brow__glyph[data-dir="flat"],.ci-brow__pct[data-dir="flat"]{color:#6B6B6B}
.ci-brow__med{color:#6B6B6B;min-width:96px;text-align:right}
.ci-brow__body{padding:2px 16px 12px 44px;font-size:13.5px;color:var(--ink-soft)}
.ci-brow__body p{margin:6px 0}
.ci-band{position:relative;display:inline-block;width:110px;height:6px;border-radius:3px;background:#D7DAE0;vertical-align:middle;margin-right:9px}
.ci-band i{position:absolute;top:-3px;width:2px;height:12px;background:var(--ink);border-radius:1px;margin-left:-1px}
.ci-table{width:100%;border-collapse:collapse;font-size:14px;font-variant-numeric:tabular-nums;margin:10px 0 6px}
.ci-table th,.ci-table td{text-align:left;padding:8px 10px;border-bottom:1px solid #D7DAE0;vertical-align:middle}
.ci-table th{font-size:11.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.ci-table .num{text-align:right}
.story-card{border:1px solid #D7DAE0;border-radius:12px;padding:18px 22px;margin:18px 0;background:var(--cream-2)}
.story-card h3{margin:6px 0 10px;font-family:var(--font-display);font-weight:500}
.story-card__chip{display:inline-block;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--cream);background:var(--ink);border-radius:999px;padding:4px 12px;margin:0}
.faq-item{margin:8px 0;border-bottom:1px solid #D7DAE0;padding-bottom:8px}
.faq-item summary{cursor:pointer;font-weight:600;font-size:15px}
.faq-item p{margin:8px 0 4px;font-size:14.5px;color:var(--ink-soft)}
`;

// assembleEdition — join the ten sections in §3 order. Pure string assembly;
// every section arrives fully built from the payload + gated files.
function assembleEdition(s) {
  return [s.masthead, s.tldr, s.honesty, s.arcBoard, s.leadStories, s.fullBoard,
    s.quiet, s.lookingAhead, s.floor, s.record, s.provenance, s.takeaways]
    .filter(Boolean).join('\n\n');
}

function emitMonthly() {
  const envDate = editionDateEnv();
  const ins = computeInsight({ editionDate: envDate, monthly: true });
  const asOf = ins.asOf;
  const editionDate = ins.editionDate;
  const monthName = monthNameOf(editionDate);
  const slug = `cost-index-${editionDate.slice(0, 7)}`;
  const url = `https://muntin.digital/blog/${slug}/`;
  const today = new Date().toISOString().slice(0, 10);

  // Gated inputs (all committed + --check-gated in CI; every number below
  // traces to one of these or to the payload).
  const ci = rd('data/cost-index.json');
  const archive = loadEditions();
  const prevEd = priorEdition(archive, asOf, editionDate);
  const seas = (() => { try { return rd('data/seasonality.json'); } catch { return { ingredients: {} }; } })();
  const lf = (() => { try { return rd('data/cost-lockfloat.json'); } catch { return { items: {}, counts: {} }; } })();
  const calib = (() => { try { return rd('data/cost-index-calibration-report.json'); } catch { return {}; } })();
  const revs = (() => { try { return rd('data/cost-revisions.json'); } catch { return { revisions: [] }; } })();
  const outlook = (() => { try { return rd('data/cost-outlook.json'); } catch { return null; } })();
  const backtest = (() => { try { return rd('data/cost-forecast-backtest.json'); } catch { return {}; } })();
  const labels = (rd('data/cost-index-labels.json').labels) || {};
  const storiesCatalog = (() => { try { return rd('data/cost-index-stories.json'); } catch { return { stories: [] }; } })();
  let editorsNote = null;
  try {
    const notes = rd('data/cost-index-editors-notes.json').notes || {};
    editorsNote = notes[editionDate] || notes[asOf] || null;
  } catch { /* optional */ }
  if (editorsNote && editorsNote.text) ins.editorsNote = editorsNote.text;

  // data/seasonality.json ships `ingredients` as an ARRAY of {key, …}; index
  // it by key once so the board rows and the seasonal calendar share one map.
  const seasByKey = {};
  const seasList = Array.isArray(seas.ingredients) ? seas.ingredients : Object.values(seas.ingredients || {});
  for (const s of seasList) if (s && s.key) seasByKey[s.key] = s;
  const ctx = {
    ins, ci, archive, prevEd, seasByKey, lf, calib, revs, outlook, backtest, labels,
    storiesCatalog, monthName, editionDate, url,
    catMap: loadCategoryMap(),
    mm: asOf.slice(5, 7),
    monthShort: MONTHS_EN[parseInt(asOf.slice(5, 7), 10) - 1],
  };
  ctx.answer = buildAnswer(ins, monthName);
  ctx.faq = buildFaq(ins, monthName);

  // Donor chrome — byte-identical slicing, same donor as the weekly emit.
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

  const quiet = ins.stories.length === 0;
  const basketPlain = ins.basket && typeof ins.basket.pct === 'number' ? fmtPctPlain(ins.basket.pct) : 'no reading';
  const title = `Restaurant Cost Index — ${monthName}: where food costs stand`;
  const descFull = `${monthName} edition, read as of ${asOf}: the basket reads ${basketPlain} against baseline; ${ins.up} of ${ins.count} ingredients above their own windows. Wholesale, never delivered prices.`;
  const desc = descFull.length <= 155 ? descFull : (descFull.slice(0, 152).replace(/\s+\S*$/, '') + '…');

  // TL;DR + takeaways (the .tldr__list is a speakable target).
  const movers = [...ins.risers, ...ins.fallers].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  const wowTldr = (() => {
    const w = ins.wow;
    if (!w || w.state !== 'available') return null;
    const b = w.basket || {};
    if (b.state === 'moved') { const dir = b.deltaPts > 0 ? 'widened' : b.deltaPts < 0 ? 'narrowed' : 'held'; return `Since the prior edition (${w.prevAsOf}), the basket's gap to baseline ${dir} ${fmtPtsPlain(Math.abs(b.deltaPts))}.`; }
    if (b.state === 'anchor-unchanged') return `The basket's data anchor has not refreshed since the prior edition (${w.prevAsOf}), so no basket move is printed; the per-ingredient month arcs are current.`;
    return null;
  })();
  const tldr = [
    `The Restaurant Cost Index, ${monthName} edition (read as of ${asOf}): the weighted basket reads ${basketPlain} against its baseline.`,
    `${ins.up} of ${ins.count} tracked ingredients read above their own baseline window, ${ins.down} below, ${ins.flat} flat.`,
    quiet
      ? `Nothing cleared the panel's false-discovery gate this month — the licensed read is hold. The loudest raw gap is ${movers[0].name} at ${fmtPctPlain(movers[0].pct)}, which that item's own history can produce.`
      : `${ins.stories.length} stor${ins.stories.length > 1 ? 'ies' : 'y'} cleared the noise gate, led by ${ins.stories[0].name} (${fmtPctPlain(ins.stories[0].pct)}).`,
  ].concat(wowTldr ? [wowTldr] : []);
  const takeaways = [
    `The basket reads ${basketPlain} against its baseline, read as of ${asOf} — public wholesale levels, never your delivered price.`,
    `Each percentage is a read versus that ingredient's own tracked baseline window; the month arcs are dated committed reads, never a projection.`,
    quiet
      ? `Nothing cleared the noise gate: the licensed action is hold — and the quiet list is printed so you can see what the gate held back.`
      : `${ins.stories[0].name} is the story to act on first; every action verb on this page rides only on gate-cleared reads.`,
    `Looking ahead stays inside the license: measured pressure on stated leads, the measured shape of past months, certified lock-or-float postures, and a one-print tilt — never a forecast.`,
  ];
  const tldrBlock = `      <!-- article-tldr:start -->
            <aside class="tldr" data-llm="tldr" aria-label="In short">
              <p class="tldr__eyebrow">In short</p>
              <ul class="tldr__list">
${tldr.map((t) => `        <li>${esc(t)}</li>`).join('\n')}
              </ul>
            </aside>
            <!-- article-tldr:end -->`;
  const takeBlock = `  <!-- article-takeaways:start -->
            <aside class="key-takeaways" data-llm="takeaways" aria-label="Key takeaways">
              <p class="key-takeaways__eyebrow">Key takeaways</p>
              <ul class="key-takeaways__list">
${takeaways.map((t) => `        <li>${esc(t)}</li>`).join('\n')}
              </ul>
            </aside>
            <!-- article-takeaways:end -->`;

  // §3 spine, sections 1–10.
  const sections = assembleEdition({
    masthead: sMasthead(ctx),
    tldr: tldrBlock,
    honesty: sHonesty(ctx),
    arcBoard: `${sArcBoard(ctx)}

      <h2 id="what-s-moving-the-basket">The biggest individual pulls</h2>
      <p>The basket is a weighted blend of ${(ins.basket && ins.basket.nContributing) || ins.count} staples, and its headline is a <strong>weighted median</strong> &mdash; so no list of parts adds up to it. What the parts DO show is who tugged hardest. Two views: the spread and basket rings, then the loudest individual pulls.</p>

${buildRingsMonthly(ins, monthName)}

${buildPullsMonthly(ins, monthName)}`,
    leadStories: sLeadStories(ctx),
    fullBoard: sFullBoard(ctx),
    quiet: sQuiet(ctx),
    lookingAhead: sLookingAhead(ctx),
    floor: sFloor(editorsNote),
    record: sRecord(ctx),
    provenance: sProvenance(ctx),
    takeaways: takeBlock,
  });

  // Month-scoped AEO layer: FAQPage from the payload, Dataset temporalCoverage
  // over the cycle range, speakable narrowed to the liftable targets.
  const monthLower = monthName.toLowerCase();
  const jsonLd = `<script type="application/ld+json">
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
      "datePublished": "${editionDate}T13:00:00-04:00",
      "dateModified": "${today}",
      "author": {
        "@id": "https://muntin.digital/#don-goldstein",
        "@type": "Person",
        "name": "Don Goldstein",
        "url": "https://muntin.digital/about/"
      },
      "publisher": { "@id": "https://muntin.digital/#business" },
      "image": {
        "@type": "ImageObject",
        "url": "https://muntin.digital/brand/og/blog-restaurant-cost.png",
        "width": 1200,
        "height": 630,
        "caption": ${JSON.stringify(title)}
      },
      "mainEntityOfPage": { "@id": "${url}" },
      "keywords": [
        "restaurant cost index ${monthLower}",
        "food cost trends ${monthLower}",
        "wholesale ingredient prices ${monthLower}",
        "restaurant food costs ${monthLower}",
        "restaurant cost index monthly edition"
      ],
      "speakable": {
        "@type": "SpeakableSpecification",
        "cssSelector": ["h1", ".dispatch-answer", ".tldr__list"]
      }
    },
    {
      "@type": "FAQPage",
      "@id": "${url}#faq",
      "mainEntity": ${JSON.stringify(ctx.faq.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })), null, 8).replace(/\n/g, '\n      ')}
    },
    {
      "@type": "Dataset",
      "@id": "${url}#dataset",
      "name": "Muntin Restaurant Cost Index — ${monthName} edition (read as of ${asOf})",
      "description": ${JSON.stringify(`Weighted 16-staple wholesale-cost basket reading (${basketPlain} vs baseline) with per-ingredient month arcs (${ins.sinceDate} through ${asOf}) for the ${monthName} edition. Public wholesale levels, not delivered prices. Measured levels only — never a forecast.`)},
      "url": "${url}",
      "isPartOf": { "@id": "https://muntin.digital/cost-index/#index-dataset" },
      "datePublished": "${editionDate}",
      "dateModified": "${today}",
      "temporalCoverage": "${ins.sinceDate}/${asOf}",
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
        { "@type": "ListItem", "position": 1, "name": "Muntin Digital", "item": "https://muntin.digital/" },
        { "@type": "ListItem", "position": 2, "name": "Articles", "item": "https://muntin.digital/blog/" },
        { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(title)}, "item": "${url}" }
      ]
    }
  ]
}
</script>`;

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
<meta property="article:published_time" content="${editionDate}T13:00:00-04:00" />
<meta property="article:author" content="Don Goldstein" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="icon" type="image/png" sizes="192x192" href="/brand/favicons/android-chrome-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/brand/favicons/apple-touch-icon.png" />
<link rel="manifest" href="/brand/favicons/site.webmanifest" />

${jsonLd}

<style>
.breadcrumb{padding-top:100px}
.callout{padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px;margin:24px 0}
.callout p{margin:0;font-size:15.5px;line-height:1.6;color:var(--ink)}
${MONTHLY_CSS}</style>
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
      <li aria-current="page">Cost Index &middot; ${esc(monthName)} edition</li>
    </ol>
  </nav>

  <article class="container article-body" id="post-body" style="max-width:720px;margin:32px auto 80px;padding:0 var(--pad-x)">
${sections}
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
      <p class="post-end-cta-headline">Get this read in your inbox, once a month.</p>
      <p class="post-end-cta-body">The Cost Index sends one short note a month &mdash; first Tuesday: where the basket stands, what cleared the gate, and the licensed read. Sign up on the hub, then open the live Cost Index to see every tracked ingredient at once. Public wholesale levels, never your delivered price.</p>
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

  const report = assertMonthlyEdition(body, { answerText: ctx.answer.text, ins });

  upsertLibraryTagsMonthly(slug, ins, monthName);
  upsertEdition(archive, ins);
  // The frozen per-read snapshot: written only when absent — a snapshot an
  // earlier edition already published for this asOf is never rewritten.
  writePerWeekData(ins, { editionUrl: url, preserveExisting: true });

  const outDir = path.join(repoRoot, 'blog', slug);
  mkdirSync(outDir, { recursive: true });
  const outFile = path.join(outDir, 'index.html');
  const existed = existsSync(outFile);
  writeFileSync(outFile, body);
  console.log(`${existed ? 'overwrote' : 'wrote'} blog/${slug}/index.html  (monthly edition of ${editionDate}, read as of ${asOf}; basket ${basketPlain}, ${ins.up}/${ins.count} above baseline, ${ins.stories.length} gated stor${ins.stories.length === 1 ? 'y' : 'ies'})`);
  console.log(`emit-asserts: ${report.figures} figures / kinds [${report.kinds.join(', ')}] / answer ${report.answerWords} words / board ${report.boardRows} rows — all green`);
  console.log('Next: node scripts/sync-includes.mjs  +  node scripts/inject-library-cost-index-hero.mjs  +  the build-chain inject/build scripts, then node scripts/check-all.mjs');
  return { slug, url, asOf, editionDate };
}

if (arg('--json') || arg('--dry-run')) {
  // EDITION_DATE presence flips the payload to the monthly arc window (see
  // computeInsight); a bare --json stays byte-stable for the email preview.
  const ins = computeInsight({ editionDate: editionDateEnv() });
  if (arg('--json')) console.log(JSON.stringify(ins, null, 2));
  else console.log(narrate(ins));
  process.exit(0);
}

// MONTHLY is the default emit since the 2026-07-06 cadence pivot; --monthly is
// accepted as the explicit alias. --weekly keeps the legacy dated family.
if (arg('--weekly')) emit();
else emitMonthly();
