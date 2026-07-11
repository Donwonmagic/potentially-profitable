#!/usr/bin/env node
/**
 * check-cost-research.mjs — the HONESTY gate for the /cost-index/research/ surface.
 *
 * The research pages are original computed analysis over the open datasets. Their prose
 * lives in data/cost-research-content.json (EN+ES per page); the numbers are rendered from
 * the deterministic engine in scripts/lib/cost-research.mjs. This gate fails the build if a
 * research page:
 *   1. speaks a FORECAST (this is descriptive history, never a prediction);
 *   2. asserts CAUSATION between an event and a price move (co-occurrence only);
 *   3. frames the wholesale reference as a delivered/retail price;
 *   4. cites a NUMBER that is not grounded in the computed analysis (zero inventions);
 *   5. ships a meta description outside 60–155 chars, or a speakable answer with no number.
 *
 * Vocabulary (banned words) is covered site-wide by check-banned-words.mjs, so it is not
 * re-checked here. Run:
 *   node scripts/check-cost-research.mjs
 *   node scripts/check-cost-research.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { researchInputs } from './lib/cost-research.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = 'data/cost-research-content.json';

const FORECAST_RE = [
  /\bforecast(s|ed|ing)?\b/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwe\s+(expect|predict|forecast)\b/i,
  /\bgoing\s+to\s+(rise|fall|climb|drop)\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease|likely|continue|keep|stay|hold)\b/i,
  /\bnext\s+(year|month|season|quarter|week)\b/i, /\blikely\s+to\s+(rise|fall|climb|drop)\b/i, /\bpredict(s|ed|ion)?\b/i,
];
// Causation asserted between an event/driver and a PRICE move (the one thing this surface must
// never do). Scoped so ordinary prose ("trim costs money") doesn't trip it.
const CAUSAL_RE = [
  /\bcaused?\s+(the\s+)?(price|prices|spike|jump|move|surge|increase|climb)\b/i,
  /\bbecause\s+of\s+(the\s+)?(outbreak|freeze|drought|storm|war|ban|shortage)\b/i,
  /\bdrove\s+(the\s+)?prices?\b/i, /\bprices?\s+(rose|jumped|spiked|climbed|fell)\s+because\b/i,
  /\bthe\s+cause\s+of\s+(the\s+)?(price|move|spike)\b/i,
];
// Wholesale reference spoken as the delivered/retail price the operator pays.
const PRICE_RE = [
  /\bthe\s+price\s+you\s+pay\b/i, /\byour\s+(delivered|invoice)\s+price\s+is\b/i,
  /\bwholesale\s+price\s+you\s+pay\b/i, /\bretail\s+price\b/i,
];
// A forecast/price phrase is honest when it is DISCLAIMED ("not a forecast", "never the price you
// pay", "descriptive, not a prediction"). Skip a match whose ~34 preceding chars carry a negation.
const NEG_RE = /\b(not|never|no|n't|rather than|instead of|isn't|aren't|isn’t|descriptive|reference,)\b[^.]{0,34}$/i;
function hit(res, text) {
  const t = String(text || '');
  for (const re of res) {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    let m;
    while ((m = g.exec(t)) !== null) {
      const before = t.slice(Math.max(0, m.index - 34), m.index);
      if (NEG_RE.test(before)) continue; // disclaimed → honest
      return m[0];
    }
  }
  return null;
}

// Recursively collect every human-readable string from a spec object.
function strings(v, out = []) {
  if (v == null) return out;
  if (typeof v === 'string') { out.push(v); return out; }
  if (Array.isArray(v)) { for (const x of v) strings(x, out); return out; }
  if (typeof v === 'object') { for (const k of Object.keys(v)) { if (k === 'slug' || k === 'accent' || k === 'figureKey') continue; strings(v[k], out); } return out; }
  return out;
}

// The grounded set = every number in the computed analysis, in BOTH raw and DISPLAY form (the
// prose cites percentages and ×-multipliers, e.g. 88% and 2.16×, while the engine stores 0.88 and
// 2.162…). A research number is honest iff it is real Muntin data or a structural constant.
function displayForms(A) {
  const set = new Set();
  const add = (v) => { if (v == null || Number.isNaN(v)) return; set.add(String(v)); };
  const scan = (v) => { if (typeof v === 'number') { add(v); add(Math.round(v)); } else if (Array.isArray(v)) v.forEach(scan); else if (v && typeof v === 'object') Object.values(v).forEach(scan); };
  scan(A); // raw numbers (72, 0.88, 4243, cents…) and their rounds
  // display transforms the render + prose use:
  for (const c of A.trimTaxCats || []) { add(Math.round(c.tax * 100) / 100); add(Math.round(c.meanYield * 100)); add(c.n); }
  for (const w of A.worstYields || []) { add(Math.round(w.yield * 100)); add(Math.round(w.tax * 100) / 100); }
  for (const x of (A.volatility?.lock || []).concat(A.volatility?.float || [])) { add(Math.round(x.halfWidthPct * 100 * 10) / 10); }
  for (const cl of A.clusters || []) { add(cl.size); if (cl.tight) add(cl.tight.k); }
  add(A.duration?.medianMonths); add(A.duration?.p75Months);
  // structural constants in framing (percentile ranks, window sizes, multipliers, the "86" idiom):
  for (const s of ['1', '2', '3', '4', '5', '6', '7', '8', '10', '12', '24', '25', '26', '50', '75', '86', '100', '2026']) set.add(s);
  return set;
}

// Numbers a page may speak. Strip thousands-commas first ("4,243" is one number, not "4" + "243"),
// then pull each numeric core.
function pageNumberTokens(text) {
  const t = String(text).replace(/(\d),(\d)/g, '$1$2');
  const toks = [];
  const re = /(\d+(?:\.\d+)?)/g; let m;
  while ((m = re.exec(t)) !== null) toks.push(m[1]);
  return toks;
}

function run() {
  const problems = [];
  const abs = path.join(repo, CONTENT);
  if (!fs.existsSync(abs)) { console.log('✓ cost-research honesty gate — no content yet (data/cost-research-content.json absent), nothing to check.'); return []; }
  let content;
  try { content = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { return [`${CONTENT} is not valid JSON: ${e.message}`]; }
  if (!content || !Array.isArray(content.pages)) return [`${CONTENT} missing pages[]`];

  const A = researchInputs(repo);
  const grounded = displayForms(A);

  for (const page of content.pages) {
    const slug = page.slug || '(unnamed)';
    for (const loc of ['en', 'es']) {
      const spec = page[loc];
      if (!spec) { problems.push(`${slug}[${loc}]: missing spec`); continue; }
      // meta description length
      const md = String(spec.metaDesc || '');
      if (md.length < 60 || md.length > 155) problems.push(`${slug}[${loc}]: metaDesc ${md.length} chars (must be 60–155)`);
      // honesty scans over ALL prose
      const texts = strings(spec);
      for (const t of texts) {
        const f = hit(FORECAST_RE, t); if (f) problems.push(`${slug}[${loc}]: FORECAST "${f}" — descriptive only. In: "${t.slice(0, 80)}"`);
        const c = hit(CAUSAL_RE, t); if (c) problems.push(`${slug}[${loc}]: CAUSATION "${c}" — co-occurrence only. In: "${t.slice(0, 80)}"`);
        const p = hit(PRICE_RE, t); if (p) problems.push(`${slug}[${loc}]: WHOLESALE-AS-PRICE "${p}". In: "${t.slice(0, 80)}"`);
        // ungrounded numbers (skip the ES/EN prose "years" like 2007–2026 date ranges? those are structural)
        for (const tok of pageNumberTokens(t)) {
          if (grounded.has(tok) || grounded.has(String(Math.round(Number(tok))))) continue;
          // allow a year in 2001–2026 (documented-event era) and any integer already grounded
          const n = Number(tok);
          if (Number.isInteger(n) && n >= 2001 && n <= 2026) continue;
          problems.push(`${slug}[${loc}]: UNGROUNDED number "${tok}" not in the computed analysis. In: "${t.slice(0, 80)}"`);
        }
      }
    }
  }
  return problems;
}

function selfTest() {
  const A = researchInputs(repo);
  const grounded = displayForms(A);
  const checks = [
    ['live analysis has 432 (event count)', grounded.has('432')],
    ['live analysis has 94 (pct)', grounded.has('94')],
    ['display form: citrus 2.16 grounded', grounded.has('2.16')],
    ['display form: mushroom 88% grounded', grounded.has('88')],
    ['forecast caught', hit(FORECAST_RE, 'prices will rise next quarter') !== null],
    ['descriptive duration clean', hit(FORECAST_RE, 'the median move has lasted 77 days') === null],
    ['DISCLAIMED forecast is honest', hit(FORECAST_RE, 'it describes the edible share and never predicts where a price is headed') === null],
    ['DISCLAIMED "not a forecast" honest', hit(FORECAST_RE, 'it is descriptive, not a forecast') === null],
    ['causation caught', hit(CAUSAL_RE, 'the freeze caused the price to spike') !== null],
    ['co-occurrence clean', hit(CAUSAL_RE, 'the two moved together in the same window') === null],
    ['wholesale-as-price caught', hit(PRICE_RE, 'this is the price you pay at delivery') !== null],
    ['DISCLAIMED "not the price you pay" honest', hit(PRICE_RE, 'a half-width band, not the price you pay') === null],
    ['DISCLAIMED "never a retail price" honest', hit(PRICE_RE, 'a reference, never a delivered or retail price') === null],
    ['reference framing clean', hit(PRICE_RE, 'a wholesale reference against its own normal') === null],
    ['strings() walks nested spec', strings({ a: 'x', s: [{ h2: 'y', paragraphs: ['z'] }] }).sort().join(',') === 'x,y,z'],
    ['comma-thousands is one token', pageNumberTokens('the longest ran 4,243 days').join(',') === '4243'],
    ['number tokens extracted', pageNumberTokens('citrus runs 2.16x on 46% yield').join(',') === '2.16,46'],
    ['86-the-dish idiom grounded', grounded.has('86')],
  ];
  const failed = checks.filter((c) => !c[1]);
  failed.forEach((c) => console.error('  ✗ ' + c[0]));
  console.log(`cost-research honesty self-test: ${checks.length - failed.length}/${checks.length} passed.`);
  process.exit(failed.length ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
const problems = run();
if (problems.length) {
  problems.forEach((m) => console.error('✗ ' + m));
  console.error(`✗ cost-research honesty gate: ${problems.length} problem(s).`);
  process.exit(1);
}
const c = fs.existsSync(path.join(repo, CONTENT)) ? JSON.parse(fs.readFileSync(path.join(repo, CONTENT), 'utf8')) : { pages: [] };
console.log(`✓ cost-research honesty gate — ${c.pages.length} research page(s), every number grounded; no forecast, causation, or wholesale-as-price.`);
