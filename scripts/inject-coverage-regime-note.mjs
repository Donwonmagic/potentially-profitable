#!/usr/bin/env node
/**
 * inject-coverage-regime-note.mjs — qualify the published band-coverage claim with the
 * regime split it currently hides.
 *
 * THE PROBLEM. Every ingredient page whose band earns a rate publishes, from
 * build-cost-index-pages.mjs `verifiedNote()`:
 *
 *     Verified: our 80% range caught the next weekly print about 77% of the time
 *               (74–79%, 1305 reads) · current for its source's cadence.
 *
 * That is a lifetime average over the walk-forward backtest. It is true, and it is
 * misleading in the one case an operator leans on it: coverage is materially WORSE while a
 * price is already moving. Measured across the 67 ingredients that publish a rate
 * (2026-07-28):
 *
 *     outside a detected price episode   69,992 steps   coverage 77.74%
 *     inside  a detected price episode    4,216 steps   coverage 60.74%
 *
 * The miss rate is ~1.8x higher inside an episode. Publishing the average alone is the
 * "true on average, misleading in the case that matters" failure this repo's fact gate
 * exists to stop.
 *
 * WHY THIS RECOMPUTES RATHER THAN READING data/cost-lockfloat.json. The lockfloat file
 * carries a `replay` hit-string, and it is tempting to reuse. It is a DIFFERENT BAND:
 * build-cost-lockfloat.mjs calls conformalNext(vals) with the default window of 26, while
 * the page's published sentence calls conformalNext(series, { alpha: 0.20, window: 52 }).
 * Qualifying the window-52 claim with a window-26 measurement would be a category error —
 * a number about one instrument printed underneath another one's sentence. So this script
 * re-runs the SAME call the page engine runs, over the SAME series selection
 * (`bandSeries`: the deep backfill when it has >= 20 points, else the vendored history),
 * and applies the SAME publish gate (coverage != null, not degenerate, >= 0.75).
 * The internal check that this alignment holds: the recomputed overall rate (76.8%) lands
 * on the ~77% the pages themselves print.
 *
 * DATING THE STEPS. conformalNext's backtest scores t = minResid+1 .. v.length-1 with no
 * gaps, so hitSeq[k] is the outcome for series index k + (vals.length - hitSeq.length).
 * The offset is derived per slug, never assumed. Each step is dated by that row's OWN date
 * from the history — not by weekly arithmetic off a span, because `seriesCadence()` exists
 * precisely because part of the panel (beef) is MONTHLY and would be mis-dated by 7-day
 * steps.
 *
 * SCOPE. The panel is exactly the slugs whose rendered page carries the coverage clause,
 * so the note describes precisely the population of claims it qualifies — no gap between
 * "ingredients measured" and "pages carrying the sentence" for a reader to trip on.
 *
 * HONESTY. Descriptive of the tracked backtest only. Not a forecast, not a direction call,
 * and explicitly NOT a claim about the ingredient whose page it sits on — per-ingredient
 * episode counts are far too small to carry a regime rate, so the note is labelled an
 * across-the-panel figure in both locales.
 *
 *   node scripts/inject-coverage-regime-note.mjs           # rewrite in place
 *   node scripts/inject-coverage-regime-note.mjs --check   # exit 1 if out of sync
 *   node scripts/inject-coverage-regime-note.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const CHECK = process.argv.includes('--check');

const START = '<!-- coverage-regime:start -->';
const END = '<!-- /coverage-regime:end -->';
const ANCHOR_RE = /<p class="ci-read__verified">[\s\S]*?<\/p>/;

// The page prints a coverage clause only when the band genuinely holds; when it does not,
// the same <p> carries the staleness read ALONE. Attaching a coverage figure there would
// put a rate on a page that deliberately publishes none — worse than the problem this
// script fixes. So the anchor requires the clause itself, per locale.
const CLAIM_EN = /80% range caught/;
const CLAIM_ES = /rango del 80% captur/;

const rd = (p) => JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8'));
const ms = (iso) => Date.parse(String(iso) + 'T00:00:00Z');

// ── the measurement ──────────────────────────────────────────────────────────

/** Mirror of build-cost-index-pages.mjs `bandSeries()`, keeping dates alongside values. */
export function seriesFor(slug, deep, ingredients) {
  const d = deep[slug];
  const entry = ingredients[slug];
  const rows = (Array.isArray(d) && d.length >= 20)
    ? d
    : ((entry && Array.isArray(entry.history)) ? entry.history : []);
  const vals = [], dates = [];
  for (const p of rows) {
    if (p && typeof p.valueCents === 'number' && isFinite(p.valueCents)) { vals.push(p.valueCents); dates.push(p.date); }
  }
  return { vals, dates };
}

/**
 * Split one slug's scored steps into inside/outside a detected episode.
 * Returns null when the slug publishes no rate or has no episode detection to split by.
 */
export function slugSplit(conf, dates, eventItem) {
  if (!conf || conf.coverage == null || conf.degenerate || conf.coverage < 0.75) return null;
  const seq = conf.hitSeq;
  if (!Array.isArray(seq) || !seq.length) return null;
  if (!eventItem) return null;                       // detection never ran; do not default to "outside"
  const off = dates.length - seq.length;
  if (off < 0) return null;
  const wins = (eventItem.events || []).map((x) => {
    const s = ms(x.date);
    return [s, s + (Number(x.durationDays) || 0) * 86400000];
  });
  let inN = 0, inHit = 0, outN = 0, outHit = 0;
  for (let k = 0; k < seq.length; k++) {
    const t = ms(dates[k + off]);
    const inside = wins.some(([a, b]) => t >= a && t <= b);
    if (inside) { inN++; inHit += seq[k] ? 1 : 0; } else { outN++; outHit += seq[k] ? 1 : 0; }
  }
  return { off, inN, inHit, outN, outHit };
}

export function aggregate(perSlug, slugs) {
  let inN = 0, inHit = 0, outN = 0, outHit = 0, n = 0;
  const offsets = new Set();
  for (const s of slugs) {
    const r = perSlug[s];
    if (!r) continue;
    n++; offsets.add(r.off);
    inN += r.inN; inHit += r.inHit; outN += r.outN; outHit += r.outHit;
  }
  const total = inN + outN;
  return {
    n, offsets: [...offsets].sort((a, b) => a - b),
    inN, outN, total,
    inCoverage: inN ? inHit / inN : null,
    outCoverage: outN ? outHit / outN : null,
    overall: total ? (inHit + outHit) / total : null,
  };
}

const pct1 = (x) => (x * 100).toFixed(1);
/** Miss-rate ratio inside vs outside — how much worse the band is when it matters. */
const missRatio = (m) => (1 - m.inCoverage) / (1 - m.outCoverage);

/**
 * The refuse-to-publish guards, as data so they can be tested rather than trusted.
 * Each is a condition under which the note's SENTENCE would stop being true; the run
 * path exits non-zero rather than printing a claim it can no longer support.
 */
export function guardFailures(m, missing) {
  const out = [];
  if (missing && missing.length) {
    out.push(`${missing.length} page(s) publish a coverage rate this script cannot reproduce (${missing.slice(0, 5).join(', ')}). The published sentence and this qualifier would describe different measurements — re-derive before publishing.`);
  }
  if (!m.total || m.inCoverage == null || m.outCoverage == null) {
    out.push('no scored steps in one or both regimes — refusing to publish an empty claim.');
    return out;                                   // the comparison below is meaningless without both
  }
  if (!(m.inCoverage < m.outCoverage)) {
    out.push(`coverage is no longer worse inside episodes (in ${pct1(m.inCoverage)}% vs out ${pct1(m.outCoverage)}%). The note's sentence would be false — rewrite it rather than publishing it.`);
  }
  return out;
}

export function regimeNote(m, es) {
  const inside = pct1(m.inCoverage), outside = pct1(m.outCoverage);
  const steps = m.total.toLocaleString('en-US');
  const ratio = missRatio(m).toFixed(1);
  const body = es
    ? `Esa tasa es un promedio de todo el historial y no es uniforme en el tiempo. En los ${m.n} ingredientes que publican una tasa (${steps} lecturas evaluadas): <b>${outside}%</b> fuera de un episodio de precio detectado y <b>${inside}%</b> durante uno — una tasa de fallo cerca de ${ratio}× mayor justo cuando un precio ya se está moviendo. Cifra del panel completo, no de este ingrediente; descriptiva del registro seguido, nunca un pronóstico.`
    : `That rate is a lifetime average, and it is not uniform over time. Across the ${m.n} ingredients that publish a rate (${steps} scored reads): <b>${outside}%</b> outside a detected price episode and <b>${inside}%</b> during one — a miss rate about ${ratio}× higher exactly when a price is already moving. A whole-panel figure, not this ingredient's own; descriptive of the tracked record, never a forecast.`;
  return `${START}<p class="ci-read__regime">${body}</p>${END}`;
}

/**
 * Remove any existing note, consuming whitespace on BOTH sides and inserting none. The
 * caller re-adds exactly one separator, so strip+insert is a fixed point: an earlier draft
 * that re-inserted here produced a second separator on every re-run and drifted forever.
 */
export function stripNote(html) {
  const i = html.indexOf(START);
  if (i < 0) return { html, removed: false };
  const j = html.indexOf(END, i);
  if (j < 0) return { html, removed: false };
  let from = i, to = j + END.length;
  while (from > 0 && /\s/.test(html[from - 1])) from--;
  while (to < html.length && /\s/.test(html[to])) to++;
  return { html: html.slice(0, from) + html.slice(to), removed: true };
}

/**
 * Strip, then re-add ONLY when the page carries the coverage clause. A page that stops
 * publishing a rate therefore loses the note automatically rather than keeping a stale one.
 * A page that never had one is returned byte-identical, so --check stays quiet on the
 * staleness-only pages.
 */
export function injectNote(html, m, es) {
  const { html: out, removed } = stripNote(html);
  const mm = ANCHOR_RE.exec(out);
  if (!mm) return removed ? out : html;
  const at = mm.index + mm[0].length;
  // Consume the whitespace ALREADY after the anchor before writing our own separator.
  // Without this the first insert lands next to the engine's existing "\n    " and the
  // second run (which strips whitespace on both sides) collapses it — so run 1 and run 2
  // differ and the injector is not a fixed point on its first application.
  let tail = at;
  while (tail < out.length && /\s/.test(out[tail])) tail++;
  if (!(es ? CLAIM_ES : CLAIM_EN).test(mm[0])) {
    return removed ? out.slice(0, at) + '\n    ' + out.slice(tail) : html;
  }
  return out.slice(0, at) + '\n    ' + regimeNote(m, es) + '\n    ' + out.slice(tail);
}

// ── self-test ────────────────────────────────────────────────────────────────
if (process.argv.includes('--self-test')) {
  let fail = 0, ran = 0;
  const t = (n, c) => { ran++; if (!c) { console.error('  ✗', n); fail++; } };

  // seriesFor mirrors bandSeries: deep wins at >= 20 points, else the vendored history.
  const deep20 = Array.from({ length: 20 }, (_, i) => ({ date: `2020-01-${String(i + 1).padStart(2, '0')}`, valueCents: 100 + i }));
  t('prefers the deep backfill at >= 20 points', seriesFor('x', { x: deep20 }, { x: { history: [{ date: '1999-01-01', valueCents: 1 }] } }).vals.length === 20);
  t('falls back to vendored history below 20', seriesFor('x', { x: deep20.slice(0, 19) }, { x: { history: [{ date: '1999-01-01', valueCents: 1 }] } }).vals[0] === 1);
  t('drops non-numeric rows but keeps dates aligned', (() => {
    const s = seriesFor('x', {}, { x: { history: [{ date: 'a', valueCents: 1 }, { date: 'b', valueCents: null }, { date: 'c', valueCents: 3 }] } });
    return s.vals.length === 2 && s.dates.length === 2 && s.dates[1] === 'c';
  })());

  // slugSplit: 12 dated steps, an episode covering exactly two of them, deliberately
  // asymmetric (inside 1/2, outside 9/10) so a fixture cannot pass with the partition
  // inverted or ignored.
  const dates = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2020, 0, 1 + 7 * i)).toISOString().slice(0, 10));
  const conf = { coverage: 0.83, degenerate: false, hitSeq: [1, 1, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1] };
  const ev = { events: [{ date: dates[3], durationDays: 7 }] };
  const sp = slugSplit(conf, dates, ev);
  t('scores every step exactly once', sp.inN + sp.outN === 12);
  t('offset derived, not assumed', sp.off === 0);
  t('inside window scored alone', sp.inN === 2 && sp.inHit === 1);
  t('outside window scored alone', sp.outN === 10 && sp.outHit === 9);

  // dating uses each row's OWN date, so a monthly series is not mis-stepped by 7 days
  const mdates = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2020, i, 1)).toISOString().slice(0, 10));
  const msp = slugSplit(conf, mdates, { events: [{ date: '2020-04-01', durationDays: 20 }] });
  t('monthly series dates by its own rows', msp.inN === 1 && msp.outN === 11);

  // the publish gate mirrors the engine's
  t('withholds when coverage below the 0.75 gate', slugSplit({ coverage: 0.6, hitSeq: [1] }, dates, ev) === null);
  t('withholds a degenerate band', slugSplit({ coverage: 0.9, degenerate: true, hitSeq: [1] }, dates, ev) === null);
  t('withholds when detection never ran', slugSplit(conf, dates, null) === null);

  // warmup offset: hitSeq shorter than the series shifts the dating
  const warm = slugSplit({ coverage: 0.9, hitSeq: [1, 1, 1] }, dates, { events: [] });
  t('derives a non-zero warmup offset', warm.off === 9 && warm.outN === 3);

  const agg = aggregate({ a: sp, b: msp }, ['a', 'b', 'missing']);
  t('aggregate counts only present slugs', agg.n === 2);
  t('aggregate sums both regimes', agg.total === 24);
  t('aggregate overall matches the pooled hits', Math.abs(agg.overall - (sp.inHit + sp.outHit + msp.inHit + msp.outHit) / 24) < 1e-12);

  const real = { n: 67, offsets: [9], inN: 4348, outN: 71454, total: 75802, inCoverage: 0.6099, outCoverage: 0.7781, overall: 0.7684 };

  // The refuse-to-publish guards. A guard nobody tests is an assumption, not a gate.
  t('guards pass on a healthy measurement', guardFailures(real, []).length === 0);
  t('guard: an unreproducible published rate blocks', /different measurements/.test(guardFailures(real, ['okra'])[0] || ''));
  t('guard: no scored steps blocks', /empty claim/.test(guardFailures({ ...real, total: 0, inCoverage: null, outCoverage: null }, [])[0] || ''));
  t('guard: the sentence is blocked once it stops being true', /no longer worse inside/.test(guardFailures({ ...real, inCoverage: 0.9 }, [])[0] || ''));
  t('guard: equal coverage also blocks (strict, not >=)', guardFailures({ ...real, inCoverage: real.outCoverage }, []).length === 1);
  t('guard: an empty measurement does not also emit the meaningless comparison', guardFailures({ total: 0, inCoverage: null, outCoverage: null }, []).length === 1);
  const withClaim = '<aside><p class="ci-read__verified"><strong>Verified:</strong> our 80% range caught the next weekly print about 77% of the time.</p><p class="ci-read__data">d</p></aside>';
  const noClaim = '<aside><p class="ci-read__verified"><strong>Verified:</strong> current for its source’s cadence.</p><p class="ci-read__data">d</p></aside>';

  const once = injectNote(withClaim, real, false);
  t('lands right after the Verified line', once.indexOf(START) > once.indexOf('ci-read__verified'));
  t('before the data line', once.indexOf(END) < once.indexOf('ci-read__data'));
  t('states both regime rates', once.includes('77.8%') && once.includes('61.0%'));
  t('states the scored-read count', once.includes('75,802'));
  t('states the miss-rate ratio', once.includes('1.8×'));
  t('flags it as a panel figure, not per-ingredient', /whole-panel figure, not this ingredient/.test(once));
  t('carries the not-a-forecast caveat', /never a forecast/.test(once));
  t('no direction or prediction language', !/\bwill\b|expect(ed)? to|forecast(s|ed)\b/i.test(once));

  // the load-bearing scope rule: never put a rate on a page that publishes none
  t('staleness-only page is left alone', injectNote(noClaim, real, false) === noClaim);
  t('staleness-only page gets no note', !injectNote(noClaim, real, false).includes(START));
  // and a page that STOPS publishing a rate loses a previously-injected note
  const stale = noClaim.replace('</p>', '</p>\n    ' + regimeNote(real, false));
  t('stale note removed when the claim disappears', !injectNote(stale, real, false).includes(START));

  const twice = injectNote(once, real, false);
  t('idempotent (byte-identical on re-run)', twice === once);
  t('exactly one note after re-run', (twice.match(/coverage-regime:start/g) || []).length === 1);

  // REGRESSION: real engine output indents the next element, so there is already
  // whitespace after the anchor. An insert that does not consume it converges only on the
  // SECOND run — passing --check while every first application dirties the tree.
  const indented = withClaim.replace('</p><p class="ci-read__data">', '</p>\n    <p class="ci-read__data">');
  const i1 = injectNote(indented, real, false);
  t('fixed point on the FIRST run against indented markup', injectNote(i1, real, false) === i1);
  t('no doubled separator after the note', !/-->\s*\n\s*\n/.test(i1));
  t('page without the read card is untouched', injectNote('<div>x</div>', real, false) === '<div>x</div>');

  const esPage = '<aside><p class="ci-read__verified"><strong>Verificado:</strong> nuestro rango del 80% capturó la próxima lectura semanal cerca del 77% de las veces.</p></aside>';
  const esOut = injectNote(esPage, real, true);
  t('ES prose', esOut.includes('no es uniforme en el tiempo'));
  t('ES caveat', esOut.includes('nunca un pronóstico'));
  t('ES locale does not match the EN claim probe', injectNote(esPage, real, false) === esPage);
  t('EN locale does not match the ES claim probe', injectNote(withClaim, real, true) === withClaim);

  if (fail) { console.error(`inject-coverage-regime-note self-test: ${fail} of ${ran} failed.`); process.exit(1); }
  console.log(`inject-coverage-regime-note self-test: ${ran}/${ran} passed (series mirror, dating, publish gate, scope, idempotency, honesty, ES).`);
  process.exit(0);
}

// ── run ──────────────────────────────────────────────────────────────────────
const { conformalNext } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));
const DEEP = rd('data/cost-index-history.json').ingredients || {};
const ING = rd('data/cost-index.json').ingredients || {};
const EV = rd('data/cost-index-events.json').items || {};

// Pass 1 — which pages actually carry the clause? That set IS the panel.
const pages = [];
for (const [dir, es] of [['cost-index', false], ['es/cost-index', true]]) {
  const base = path.join(repo, dir);
  if (!fs.existsSync(base)) continue;
  for (const slug of fs.readdirSync(base)) {
    const abs = path.join(base, slug, 'index.html');
    if (!fs.existsSync(abs)) continue;
    const html = fs.readFileSync(abs, 'utf8');
    const mm = ANCHOR_RE.exec(html);
    if (!mm) continue;
    pages.push({ abs, rel: `${dir}/${slug}`, slug, es, html, claims: (es ? CLAIM_ES : CLAIM_EN).test(mm[0]) });
  }
}
const panel = [...new Set(pages.filter((p) => p.claims).map((p) => p.slug))].sort();

// Pass 2 — recompute the SAME band the page publishes, per panel slug.
const perSlug = {};
for (const slug of panel) {
  const { vals, dates } = seriesFor(slug, DEEP, ING);
  const r = slugSplit(conformalNext(vals, { alpha: 0.20, window: 52 }), dates, EV[slug]);
  if (r) perSlug[slug] = r;
}
const m = aggregate(perSlug, panel);

const problems = guardFailures(m, panel.filter((s) => !perSlug[s]));
if (problems.length) {
  for (const p of problems) console.error(`✗ coverage-regime: ${p}`);
  process.exit(1);
}

let changed = 0, carried = 0;
for (const p of pages) {
  const after = injectNote(p.html, m, p.es);
  if (p.claims) carried++;
  if (after !== p.html) { changed++; if (!CHECK) fs.writeFileSync(p.abs, after); }
}

const summary = `${carried} page(s), ${m.n} ingredient(s), ${m.total.toLocaleString('en-US')} scored reads — ${pct1(m.outCoverage)}% outside vs ${pct1(m.inCoverage)}% inside an episode (${missRatio(m).toFixed(1)}× miss rate), overall ${pct1(m.overall)}%`;
if (CHECK) {
  if (changed) { console.error(`✗ coverage-regime: ${changed} page(s) out of sync — run: node scripts/inject-coverage-regime-note.mjs`); process.exit(1); }
  console.log(`✓ coverage-regime: ${summary}.`);
} else {
  console.log(`coverage-regime: ${changed} file(s) changed across ${summary}.`);
}
