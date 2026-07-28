#!/usr/bin/env node
/**
 * check-open-lane-honesty.mjs — the registry-driven HONESTY gate for the corpus /open explorers
 * (spec-corpus-explorers.md §1.6). The bespoke explorer pages are scanned by neither
 * check-cost-index-events.mjs (walks cost-index/, keys on ci-events*) nor check-seasonality-fusion.mjs
 * (keys on sea-*), so this gate covers them — sharing the forecast/causation vocabulary via
 * scripts/lib/co-occurrence-patterns.mjs so all co-occurrence surfaces enforce the same rules.
 *
 * For each registered surface it asserts, in the page's AFFIRMATIVE voice (exempt zones stripped —
 * <head>, <script>, data-audio-alt, title=, .honest, <details class="cite">, [data-quoted-source]):
 *   - no causal / forecast / cross-lane hit;
 *   - the lane's required caveat literals are present;
 *   - the lane's banned tokens are absent;
 *   - recalls: NO price token anywhere (structural), every context block wears the co-occurrence tag,
 *     no cost-index/<slug>/ link shares a table row with a Class-I cell, and the dual CC0+CC-BY chips;
 *   - labor/demand: no pressure_* token anywhere, a single CC0 chip, and (demand) the provisional
 *     advance-estimate marker present.
 *
 *   node scripts/check-open-lane-honesty.mjs
 *   node scripts/check-open-lane-honesty.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { forecastHit, causalHit } from './lib/co-occurrence-patterns.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Supply/volume misuse + cross-lane causation — banned in the fenced lanes' affirmative voice.
const CROSS_LANE_RE = [
  /\b(wages?|labor|payroll|employment)\s+(drove|pushed|lifted|forced|caused)\b/i,
  /\bdemand\s+(drove|pushed|lifted|forced|caused|drives|pushes)\b/i,
  /\b(correlat|coefficient|r-squared|lead|lag)\w*\s+(with|to|of)\s+(the\s+)?(food\s+index|price|cost)\b/i,
];
function crossLaneHit(t) { const s = String(t || ''); for (const re of CROSS_LANE_RE) { const m = s.match(re); if (m) return m[0]; } return null; }

// Strip the exempt zones so the affirmative scan sees only headings, chips, labels, table headers,
// figcaptions and intro copy — never the caveat drawers, narration, or scripts that legitimately
// carry cause/forecast words in a NEGATED or quoted form.
function affirmative(html) {
  let s = String(html || '');
  s = s.replace(/<head[\s\S]*?<\/head>/gi, ' ');
  s = s.replace(/<script[\s\S]*?<\/script>/gi, ' ');
  s = s.replace(/<details\b[^>]*class="[^"]*\bcite\b[^"]*"[\s\S]*?<\/details>/gi, ' ');
  s = s.replace(/data-audio-alt="[^"]*"/gi, ' ');
  s = s.replace(/\btitle="[^"]*"/gi, ' ');
  s = s.replace(/<[^>]*\bdata-quoted-source\b[^>]*>[\s\S]*?<\/[a-z0-9]+>/gi, ' ');
  // .honest spans/blocks carry the italic caveats — exempt their text
  s = s.replace(/<(span|p|figcaption)[^>]*class="[^"]*\bhonest\b[^"]*"[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  // Honest NEGATIONS ("never a forecast", "not a cause", "never joined to a price") legitimately
  // speak the banned word to disclaim it — strip a short negator→keyword window so they don't trip.
  s = s.replace(/\b(never|not|no|nor|nothing)\b[^.<]{0,44}?\b(forecast\w*|caused?|cause of|drove|predict\w*|project\w*)\b/gi, ' ');
  return s;
}

// The registry — one row per open surface. Future wave-3..6 sources append a row here.
const REGISTRY = [
  {
    path: 'open/recalls/index.html', lane: 'recalls',
    requiredLiterals: [
      'never joined to a price', 'never a cause',
      'whole-word text match on the product, not a supply or price link',
      'documented recall events, never a price or volume', 'FDA-regulated foods only',
    ],
    chips: { 'CC0 raw': true, 'CC-BY derived': true }, noPrice: true, coOccurrenceTag: true, noSlugLinkBesideClassI: true,
  },
  {
    path: 'open/labor/index.html', lane: 'labor',
    requiredLiterals: [
      'a county industry average, never a per-plate labor cost',
      'never blended into the food index, the pressure math, or the Vendor Benchmark', 'never a forecast',
    ],
    chips: { 'CC0': true }, noPressure: true, singleCc0: true,
  },
  {
    path: 'open/demand/index.html', lane: 'demand',
    requiredLiterals: [
      'observed sales, never a forecast', 'provisional advance estimate',
      'never blended into the food index, the pressure math, or the Vendor Benchmark',
    ],
    chips: { 'CC0': true }, noPressure: true, singleCc0: true,
  },
];

// The bespoke /open explorer pages ship with the canonical nav + footer
// (sync-includes) and dark-mode/css-cache-bust injected in the deploy build,
// AROUND the generator-owned body. Scope the honesty scan to that body
// (<header class="mast"> … </main>) so an injected footer/script "$", nav
// token, or cross-lane word can't trip the checks. The license chips and the
// required caveat literals all live inside this body (the mast lede + the main
// content). Falls back to the whole string when the anchors are absent
// (self-test fixtures).
function contentRegion(s) {
  const a = s.indexOf('<header class="mast">');
  if (a < 0) return s; // self-test fixtures have no page chrome
  // End at the injected site footer: sync-includes emits a bare <footer> near
  // </body> (its "$" would false-trip the no-price check), while the in-content
  // provenance footer is <footer class="prov"> and stays inside the region. The
  // generator's client-render <script> blocks (which carry the co-occurrence
  // caveat literal) live between </main> and that footer, so they must be kept.
  const mainEnd = s.indexOf('</main>', a);
  const from = mainEnd >= 0 ? mainEnd : a;
  let b = s.indexOf('<footer>', from);
  if (b < 0) b = s.indexOf('</body>', from);
  if (b < 0) b = s.length;
  return s.slice(a, b);
}
function checkSurface(rawHtml, reg) {
  const html = contentRegion(rawHtml);
  const problems = [];
  const aff = affirmative(html);
  // shared co-occurrence vocabulary
  const cz = causalHit(aff); if (cz) problems.push(`${reg.lane}: affirmative voice asserts causation — "${cz}"`);
  const fz = forecastHit(aff); if (fz) problems.push(`${reg.lane}: affirmative voice speaks a forecast — "${fz}"`);
  const xz = crossLaneHit(aff); if (xz) problems.push(`${reg.lane}: affirmative voice makes a cross-lane / correlation claim — "${xz}"`);
  // required caveat literals (checked against the RAW html — a literal may legitimately live in a caveat zone)
  for (const lit of reg.requiredLiterals) if (!html.includes(lit)) problems.push(`${reg.lane}: missing required literal "${lit}"`);
  // license chips
  for (const chip of Object.keys(reg.chips)) if (!new RegExp(`class="lic"[^>]*>${chip.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}<`).test(html)) problems.push(`${reg.lane}: missing "${chip}" license chip`);
  if (reg.singleCc0 && /CC-BY/.test(html)) problems.push(`${reg.lane}: a CC-BY chip appears on a single-CC0 lane`);
  // recalls: structural no-price
  if (reg.noPrice && /\$/.test(html)) problems.push(`${reg.lane}: a "$" price token appears on the no-price recall page`);
  // recalls: every rendered context block wears the co-occurrence tag (the render literal is present)
  if (reg.coOccurrenceTag && !/Documented around this time[\s\S]{0,120}co-occurrence, never a cause/.test(html)) problems.push(`${reg.lane}: context-block co-occurrence tag missing`);
  // recalls: no cost-index/<slug>/ link shares a table row with a Class-I cell
  if (reg.noSlugLinkBesideClassI) {
    const rows = html.match(/<tr>[\s\S]*?<\/tr>/g) || [];
    for (const r of rows) if (/href="\/cost-index\/[a-z]/i.test(r) && /class[_-]?i/i.test(r)) { problems.push(`${reg.lane}: a cost-index price link shares a table row with a Class-I cell`); break; }
  }
  // labor/demand: no pressure token anywhere
  if (reg.noPressure && /pressure_dir|pressure_conf|pressure_dir_es/.test(html)) problems.push(`${reg.lane}: a pressure_* token leaked onto the fenced page`);
  return problems;
}

function selfTest() {
  let pass = 0, fail = 0;
  const ok = (n, c) => { if (c) pass++; else { fail++; console.error('  ✗', n); } };
  // a clean recalls fixture
  const goodRecalls = `<head><title>x</title></head><body>
    <span class="lic" data-lic="cc0">CC0 raw</span><span class="lic" data-lic="cc-by">CC-BY derived</span>
    <p>never joined to a price, never a cause. whole-word text match on the product, not a supply or price link. documented recall events, never a price or volume. FDA-regulated foods only.</p>
    <div class="rc-ctx"><p class="rc-ctx-when"><b>Documented around this time</b> — co-occurrence, never a cause.</p></div>
    <table><tr><td>onion</td><td>28</td></tr></table></body>`;
  ok('clean recalls fixture passes', checkSurface(goodRecalls, REGISTRY[0]).length === 0);
  ok('recalls with a $ token fails', checkSurface(goodRecalls.replace('28', '$28'), REGISTRY[0]).some((p) => /price token/.test(p)));
  ok('recalls with a slug link beside a Class-I cell fails', checkSurface(goodRecalls.replace('<td>onion</td><td>28</td>', '<td><a href="/cost-index/onion/">onion</a></td><td class="class_i">28</td>'), REGISTRY[0]).some((p) => /shares a table row/.test(p)));
  ok('recalls missing a literal fails', checkSurface(goodRecalls.replace('FDA-regulated foods only', 'x'), REGISTRY[0]).some((p) => /missing required literal/.test(p)));
  // affirmative causal claim is caught, but the same words in a .honest/cite zone are exempt
  ok('affirmative causation is caught', checkSurface(goodRecalls + '<p>the outbreak caused the price to spike</p>', REGISTRY[0]).some((p) => /causation/.test(p)));
  ok('causation inside a .honest zone is exempt', checkSurface(goodRecalls + '<span class="honest">never says the outbreak caused the price to spike</span>', REGISTRY[0]).length === 0);
  // a clean labor fixture
  const goodLabor = `<head></head><body><span class="lic" data-lic="cc0">CC0</span>
    <p>a county industry average, never a per-plate labor cost, and never blended into the food index, the pressure math, or the Vendor Benchmark. never a forecast.</p></body>`;
  ok('clean labor fixture passes', checkSurface(goodLabor, REGISTRY[1]).length === 0);
  ok('labor with a pressure token fails', checkSurface(goodLabor + '<span>pressure_dir</span>', REGISTRY[1]).some((p) => /pressure_/.test(p)));
  ok('labor with a CC-BY chip fails (single-CC0 lane)', checkSurface(goodLabor + '<span class="lic">CC-BY derived</span>', REGISTRY[1]).some((p) => /CC-BY chip/.test(p)));
  ok('labor cross-lane "wages drove" is caught', checkSurface(goodLabor + '<p>wages drove menu prices</p>', REGISTRY[1]).some((p) => /cross-lane/.test(p)));
  // a clean demand fixture
  const goodDemand = `<head></head><body><span class="lic" data-lic="cc0">CC0</span>
    <p>observed sales, never a forecast. provisional advance estimate. never blended into the food index, the pressure math, or the Vendor Benchmark.</p></body>`;
  ok('clean demand fixture passes', checkSurface(goodDemand, REGISTRY[2]).length === 0);
  ok('demand missing the provisional literal fails', checkSurface(goodDemand.replace('provisional advance estimate', 'latest'), REGISTRY[2]).some((p) => /provisional advance estimate/.test(p)));
  // live surfaces
  let liveClean = true;
  for (const reg of REGISTRY) {
    const p = path.join(repo, reg.path);
    if (!fs.existsSync(p)) continue;
    const probs = checkSurface(fs.readFileSync(p, 'utf8'), reg);
    if (probs.length) { liveClean = false; probs.forEach((x) => console.error('  · LIVE', x)); }
  }
  ok('all live surfaces pass', liveClean);
  console.log(`check-open-lane-honesty self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

if (process.argv.includes('--self-test')) selfTest();
let problems = [];
for (const reg of REGISTRY) {
  const p = path.join(repo, reg.path);
  if (!fs.existsSync(p)) { problems.push(`${reg.lane}: ${reg.path} not found`); continue; }
  problems = problems.concat(checkSurface(fs.readFileSync(p, 'utf8'), reg));
}
if (problems.length) { console.error('✗ open-lane honesty gate FAILED:\n  ' + problems.join('\n  ')); process.exit(1); }
console.log(`✓ open-lane honesty gate — ${REGISTRY.length} explorer surface(s): co-occurrence framing intact, fences held, licenses matched.`);
process.exit(0);
