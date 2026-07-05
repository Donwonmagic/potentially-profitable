#!/usr/bin/env node
/**
 * check-lockfloat-copy.mjs — the forbidden-claim lint for the lock-or-float surface.
 *
 * The 2026-07 statistical-rigor audit certified that Cost Pulse may say HOW FAR a
 * price's next print tends to move (a risk/planning read), but NEVER which way, and
 * never an opportunity/overpayment claim. This gate scans the lock-or-float copy
 * source — the renderer (tools/_shared/cost-lockfloat-ui.js), the classifier
 * (tools/_shared/cost-lockfloat.js), and the tool pages' Lock-Sheet region — for the
 * banned assertions, with a NAMED red-if-reintroduced case per forbidden claim, so
 * an A/B copy tweak can never quietly reintroduce a direction/opportunity/overpayment
 * read in either spoken language. Blocklist, not a fuzzy regex: it targets unambiguous
 * assertions, so the honest disclaimers ("we never tell you which way…") pass.
 *
 *   node scripts/check-lockfloat-copy.mjs            # gate
 *   node scripts/check-lockfloat-copy.mjs --self-test
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Files whose lock-or-float copy this gate governs.
const FILES = [
  'tools/_shared/cost-lockfloat-ui.js',
  'tools/_shared/cost-lockfloat.js',
];
// On the tool pages, only the Lock-Sheet region is ours (the level-detail machinery
// below has its own governance), so we scan the hero + the seed/renderer wiring copy.
const PAGE_FILES = ['tools/cost-pulse/index.html', 'es/tools/cost-pulse/index.html'];

// Each entry: [namedCase, /pattern/]. If the pattern is found, the build fails —
// that forbidden claim was reintroduced. EN + ES assertions.
const FORBIDDEN = [
  ['direction-buy-now',        /\bbuy\s+now\b|\bcompra\s+ahora\b/i],
  ['direction-buy-the-dip',    /\bbuy\s+the\s+dip\b/i],
  ['opportunity-lock-a-low',   /\block\s+in\s+a\s+low\b|\bnear\s+a\s+(3-?year\s+)?low\s+so\s+buy\b|\bfija\s+(en\s+)?un\s+m[ií]nimo\b/i],
  ['direction-will-move',      /\b(prices?\s+)?will\s+(rise|fall|drop|climb|increase|decrease)\b|\blos?\s+precios?\s+(van\s+a|subir[aá]n|bajar[aá]n)\b/i],
  ['direction-more-likely',    /\bmore\s+likely\s+to\s+(rise|fall|climb|drop)\b|\bm[aá]s\s+probable\s+que\s+(suba|baje)\b/i],
  ['regime-stepped-up',        /\bstepped\s+up\b|\bmarket\s+stepped\b|\bel\s+mercado\s+subi[oó]\s+de\s+nivel\b/i],
  ['verb-reprice',             /\bre-?price\b|\breajusta(r|\s+el\s+precio)\b|\bconsidera\s+ajustar\s+el\s+precio\b/i],
  ['verb-renegotiate',         /\brenegotiat/i],
  ['overpayment',              /\byou\s+should\s+pay\b|\boverpay/i],
  ['vendor-above-market',      /\babove\s+market\b|\barriba\s+del\s+mercado\b/i],
  ['leadlag-x-leads-y',        /\bmoves?\s+before\b|\btended\s+to\s+move\s+before\b|\bse\s+mueve\s+antes\s+que\b/i],
  ['opportunity-cheap',        /\bgood\s+buy\b|\bit'?s\s+cheap\b|\bbuena\s+compra\b/i],
];

// Strip comments so the modules' own docstrings — which legitimately DISCUSS the
// forbidden claims to document the discipline — are not scanned; only real
// user-facing copy (string literals, prose) is checked.
function stripComments(txt) {
  return txt
    .replace(/\/\*[\s\S]*?\*\//g, ' ')                 // /* block */
    .replace(/^[ \t]*\/\/.*$/gm, ' ')                  // // full-line
    .replace(/<!--[\s\S]*?-->/g, ' ');                 // <!-- html -->
}
function scan(files) {
  const hits = [];
  for (const rel of files) {
    let txt = '';
    try { txt = stripComments(readFileSync(path.join(repo, rel), 'utf8')); } catch { continue; }
    for (const [name, re] of FORBIDDEN) {
      const m = txt.match(re);
      if (m) hits.push({ file: rel, case: name, match: m[0] });
    }
  }
  return hits;
}
// The tool pages: scope to the Lock-Sheet region so the retired-decoder machinery
// below (its own governance) is not scanned.
function scanPages() {
  const hits = [];
  for (const rel of PAGE_FILES) {
    let txt = '';
    try { txt = readFileSync(path.join(repo, rel), 'utf8'); } catch { continue; }
    // hero (H1..lede) + the lock-sheet mount comment/wiring
    const heroStart = txt.indexOf('<h1>');
    const heroEnd = txt.indexOf('id="cpMarketCard"');
    const region = (heroStart >= 0 && heroEnd > heroStart) ? stripComments(txt.slice(heroStart, heroEnd)) : '';
    for (const [name, re] of FORBIDDEN) {
      const m = region.match(re);
      if (m) hits.push({ file: rel + ' (hero)', case: name, match: m[0] });
    }
  }
  return hits;
}

if (process.argv.includes('--self-test')) {
  // A crafted forbidden string must be caught by its named case.
  const samples = [
    ['direction-buy-now', 'lock it now — buy now before it turns'],
    ['verb-reprice', 'you should re-price the dish'],
    ['overpayment', 'you should pay less than this'],
    ['direction-will-move', 'prices will rise next week'],
  ];
  let ok = true;
  for (const [expected, text] of samples) {
    const hit = FORBIDDEN.find(([, re]) => re.test(text));
    if (!hit || hit[0] !== expected) { console.error(`  ✗ "${text}" should trip ${expected}, got ${hit ? hit[0] : 'none'}`); ok = false; }
  }
  // The honest disclaimer must NOT trip anything.
  const honest = "We never tell you which way a price is headed. Lock = steady enough to commit; float = too volatile. Steady, not necessarily a level you want to marry.";
  const falsePos = FORBIDDEN.find(([, re]) => re.test(honest));
  if (falsePos) { console.error(`  ✗ honest copy false-positives on ${falsePos[0]}`); ok = false; }
  console.log(`lockfloat-copy self-test: ${ok ? 'passed' : 'FAILED'}.`);
  process.exit(ok ? 0 : 1);
}

const hits = scan(FILES).concat(scanPages());
if (hits.length) {
  hits.forEach((h) => console.error(`  ✗ [${h.case}] forbidden claim in ${h.file}: "${h.match}"`));
  console.error(`✗ lock-or-float copy reintroduced ${hits.length} forbidden claim(s) — the surface may say HOW FAR, never which way / buy / overpay.`);
  process.exit(1);
}
console.log('✓ lock-or-float copy clean — no direction, opportunity-timing, or overpayment claim.');
