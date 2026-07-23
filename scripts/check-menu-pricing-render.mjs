#!/usr/bin/env node
/**
 * check-menu-pricing-render.mjs — render-contract gate for the menu-pricing ISR island
 * (the CHAIN dossier: cost-index/menu-pricing/index.html + its ES mirror, driven at build
 * time by ISR_ISLAND/ISR_CSS in scripts/lib/cost-research.mjs).
 *
 * The island is authored once and lives in THREE places that must never drift: the committed
 * EN page, the committed ES page, and the escaped engine strings. Because the committed pages
 * run ahead of the in-container engine (ADR-018 "engine-behind-pages"), a hand-edit or an engine
 * regen can silently desynchronise them, or quietly drop a seam's honesty caveat. This gate pins:
 *
 *   1. BYTE-PARITY — the engine's ISR_ISLAND (unescaped) and ISR_CSS appear verbatim in BOTH
 *      committed pages. This single check guarantees engine == EN == ES for the island + its CSS.
 *   2. RENDER CONTRACT (ADR-018 §Consequences) — reliance renders its caveat + year + scope;
 *      catchpair renders paired value bars, year-aligned, and NEVER a share/percentage; every
 *      seam is behind a null guard; the CHAIN rungs seal in SOURCE -> MARKET -> YOUR PLATE order
 *      and degrade by absence.
 *   3. T-KEY PARITY — the ES and EN sentence tables expose the identical key set (no untranslated
 *      or orphaned render string).
 *
 *   node scripts/check-menu-pricing-render.mjs
 *   node scripts/check-menu-pricing-render.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_PAGE = 'cost-index/menu-pricing/index.html';
const ES_PAGE = 'es/cost-index/menu-pricing/index.html';
const ENGINE = 'scripts/lib/cost-research.mjs';

// --- extract a `const NAME = "double-quoted-literal";` and return the unescaped string ---
function extractLiteral(engineSrc, name) {
  const m = engineSrc.match(new RegExp('const ' + name + ' = ("(?:[^"\\\\]|\\\\.)*");'));
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

// --- pull the ES / EN key sets out of `var T = ES ? {…} : {…};` (pure object literals) ---
function tKeySets(island) {
  const tStart = island.indexOf('var T = ES ? {');
  if (tStart < 0) return null;
  const esStart = island.indexOf('{', tStart);
  const sep = island.indexOf('} : {', esStart);
  if (sep < 0) return null;
  const esObj = island.slice(esStart, sep + 1);
  const enStart = sep + '} : '.length;
  const enEnd = island.indexOf('};', enStart);
  if (enEnd < 0) return null;
  const enObj = island.slice(enStart, enEnd + 1);
  const keysOf = (obj) => {
    try { return new Set(Object.keys(new Function('return ' + obj)())); }
    catch { return null; }
  };
  return { es: keysOf(esObj), en: keysOf(enObj) };
}

// --- the render-contract tokens the island MUST contain (positive assertions) ---
const REQUIRED = [
  // reliance seam: guarded, scope-aware, carries its caveat + year + the >100% re-export note
  ['reliance guard', "r.import_reliance_pct!=null"],
  ['reliance scope-aware', "r.import_reliance_scope==='commodity'"],
  ['reliance caveat rendered', 'T.relCaveat'],
  ['reliance year rendered', 'r.import_reliance_year'],
  ['reliance over-100 re-export note', 'r.import_reliance_pct>100'],
  ['reliance re-export label', 'T.relOver'],
  // catchpair seam: guarded, year-aligned, TWO INDEPENDENT STAT TILES (never a shared-axis bar that
  // would imply the supply-share the caveat forbids), caveat + wild-minimal variant + conditional
  // farmed clause (asserted only when the import is actually farmed, never hard-coded on all seafood)
  ['catchpair guard', 'r.us_landings_value_usd!=null'],
  ['catchpair year-aligned', 'r.import_annual_usd[ly]'],
  ['catchpair stat-tile helper', 'function cpStat('],
  ['catchpair stat tiles', 'cp.appendChild(cpStat('],
  ['catchpair caveat', 'T.catchCaveat'],
  ['catchpair wild-minimal variant', 'T.wildMinimal'],
  ['catchpair farmed clause conditional', 'r.import_mostly_farmed?'],
  // other seams all behind null guards
  ['import guard', 'r.us_import_value_usd!=null'],
  ['band guard', 'r.band_pct!=null'],
  ['events guard', 'r.notable_events_n'],
  ['pressure guard', 'r.pressure_dir'],
  ['yield guard', 'r.edible_yield_pct!=null'],
  ['hedge guard', 'r.hedge_swap'],
  // co-occurrence framing (never causal): the co-mover label, its shared-timing caveat, + present-state
  ['co-mover co-occurrence label (EN)', "comove:'Have moved together'"],
  ['co-mover shared-timing caveat', 'T.comoveCaveat'],
  ['present-not-forecast (EN)', "present:'present state, not a forecast'"],
  ['import nominal caveat (EN)', 'nominalNote:'],
  // CHAIN rung frame + degrade-by-absence
  ['rung seal helper', 'function seal(rg, name, sub)'],
  ['rung degrades by absence', 'if (!rg.childNodes.length) return;'],
];

function check({ enPage, esPage, engine }) {
  const errs = [];

  const island = extractLiteral(engine, 'ISR_ISLAND');
  const css = extractLiteral(engine, 'ISR_CSS');
  if (!island) return ['engine: could not extract/parse ISR_ISLAND double-quoted literal'];
  if (!css) errs.push('engine: could not extract/parse ISR_CSS double-quoted literal');

  // 1) byte-parity: engine literal must appear verbatim in both committed pages
  if (!enPage.includes(island)) errs.push('byte-parity: engine ISR_ISLAND not found verbatim in the EN page (engine/page drift)');
  if (!esPage.includes(island)) errs.push('byte-parity: engine ISR_ISLAND not found verbatim in the ES page (engine/page drift)');
  if (css) {
    if (!enPage.includes(css)) errs.push('byte-parity: engine ISR_CSS not found verbatim in the EN page');
    if (!esPage.includes(css)) errs.push('byte-parity: engine ISR_CSS not found verbatim in the ES page');
  }

  // 2) render contract — required tokens present in the island
  for (const [id, tok] of REQUIRED) {
    if (!island.includes(tok)) errs.push(`render contract: missing "${id}" (${tok})`);
  }

  // 2a) catchpair must never compute a share — its block carries no '%' and no 'reliance'
  const cpStart = island.indexOf('if (r.us_landings_value_usd!=null){');
  if (cpStart >= 0) {
    const cpBlock = island.slice(cpStart, island.indexOf('srcRung.appendChild(dt);', cpStart));
    if (cpBlock.includes('%')) errs.push("catchpair honesty: the catchpair block renders a '%' — it must show paired raw values, never a share");
    if (/reliance/.test(cpBlock)) errs.push('catchpair honesty: the catchpair block references reliance — landings vs imports is not a reliance ratio');
  }

  // 2b) CHAIN rung order: SOURCE before MARKET before YOUR PLATE
  const iS = island.indexOf('seal(srcRung, T.rungSource');
  const iM = island.indexOf('seal(mktRung, T.rungMarket');
  const iP = island.indexOf('seal(plateRung, T.rungPlate');
  if (iS < 0 || iM < 0 || iP < 0) errs.push('rung frame: one of the three seal(rung…) calls is missing');
  else if (!(iS < iM && iM < iP)) errs.push('rung frame: rungs do not seal in SOURCE -> MARKET -> YOUR PLATE order');

  // 3) T-key parity between the ES and EN sentence tables
  const ks = tKeySets(island);
  if (!ks || !ks.es || !ks.en) errs.push('T-keys: could not parse the ES/EN sentence tables');
  else {
    const missingInEs = [...ks.en].filter((k) => !ks.es.has(k));
    const missingInEn = [...ks.es].filter((k) => !ks.en.has(k));
    if (missingInEs.length) errs.push('T-key parity: keys in EN but not ES: ' + missingInEs.join(', '));
    if (missingInEn.length) errs.push('T-key parity: keys in ES but not EN: ' + missingInEn.join(', '));
  }

  return errs;
}

function selfTest() {
  // a minimal but contract-complete island (contains every REQUIRED token + both rung order + parity)
  const goodIsland = [
    "(function(){ var ES=false;",
    "var T = ES ? {",
    "  relCaveat:'x', relOver:'o', catchCaveat:'x', wildMinimal:'x', farmedClause:'f', comove:'y', comoveCaveat:'c', present:'z', nominalNote:'n', rungSource:'o', rungMarket:'m', rungPlate:'p'",
    "} : {",
    "  relCaveat:'x', relOver:'Over 100%', catchCaveat:'x', wildMinimal:'x', farmedClause:'farmed', comove:'Have moved together', comoveCaveat:'Shared timing, not cause', present:'present state, not a forecast', nominalNote:'US import value', rungSource:'Source', rungMarket:'Market', rungPlate:'Your plate'",
    "};",
    "function seal(rg, name, sub){ if (!rg.childNodes.length) return; }",
    "function cpStat(tone, val, label, yr){ return el(); }",
    "if (r.us_import_value_usd!=null){}",
    "if (r.import_reliance_pct!=null){ var s=(r.import_reliance_scope==='commodity'); T.relCaveat; r.import_reliance_year; if (r.import_reliance_pct>100) T.relOver; }",
    "if (r.us_landings_value_usd!=null){ var impSame=r.import_annual_usd[ly]; cp.appendChild(cpStat('teal', v, l, y)); T.catchCaveat; T.wildMinimal; var cav=(r.import_mostly_farmed?T.farmedClause:''); }",
    "srcRung.appendChild(dt);",
    "if (r.band_pct!=null){} if (r.notable_events_n){ T.comoveCaveat; } if (r.pressure_dir){} if (r.edible_yield_pct!=null){} if (r.hedge_swap){}",
    "seal(srcRung, T.rungSource, T.rungSourceSub); seal(mktRung, T.rungMarket, T.rungMarketSub); seal(plateRung, T.rungPlate, T.rungPlateSub);",
    "})();",
  ].join('\n');
  const goodCss = '<style>.isr-rung{}</style>';
  const engineOf = (isl, css) => `const ISR_CSS = ${JSON.stringify(css)};\nconst ISR_ISLAND = ${JSON.stringify(isl)};\n`;
  const pageOf = (isl, css) => `<html><style>${css}</style><script>${isl}</script></html>`;

  const good = { enPage: pageOf(goodIsland, goodCss), esPage: pageOf(goodIsland, goodCss), engine: engineOf(goodIsland, goodCss) };
  const clean = check(good);
  if (clean.length) { console.error('SELF-TEST FAIL — clean triple produced errors:', clean); process.exit(1); }

  const cases = [
    ['byte-parity', { ...good, esPage: '<html>no island here</html>' }, 'byte-parity'],
    ['missing reliance caveat', { enPage: good.enPage, esPage: good.esPage, engine: engineOf(goodIsland.replace('T.relCaveat;', ''), goodCss) }, 'reliance caveat'],
    ['catchpair renders a %', { enPage: good.enPage, esPage: good.esPage, engine: engineOf(goodIsland.replace('T.catchCaveat;', "'99%'; T.catchCaveat;"), goodCss) }, "renders a '%'"],
    ['rung order scrambled', (() => { const bad = goodIsland.replace(
        'seal(srcRung, T.rungSource, T.rungSourceSub); seal(mktRung, T.rungMarket, T.rungMarketSub); seal(plateRung, T.rungPlate, T.rungPlateSub);',
        'seal(plateRung, T.rungPlate, T.rungPlateSub); seal(mktRung, T.rungMarket, T.rungMarketSub); seal(srcRung, T.rungSource, T.rungSourceSub);');
      return { enPage: pageOf(bad, goodCss), esPage: pageOf(bad, goodCss), engine: engineOf(bad, goodCss) }; })(), 'SOURCE -> MARKET'],
    ['T-key parity broken', (() => { const bad = goodIsland.replace("rungPlate:'p'", "rungPlate:'p', orphan:'q'");
      return { enPage: pageOf(bad, goodCss), esPage: pageOf(bad, goodCss), engine: engineOf(bad, goodCss) }; })(), 'T-key parity'],
  ];
  const missed = [];
  for (const [name, triple, want] of cases) {
    const got = check(triple);
    if (!got.some((e) => e.includes(want))) missed.push(`${name} (wanted "${want}", got: ${JSON.stringify(got)})`);
  }
  if (missed.length) { console.error('SELF-TEST FAIL — missed:', missed); process.exit(1); }
  console.log('✓ self-test: clean triple passes; caught all', cases.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();

let enPage, esPage, engine;
try {
  enPage = fs.readFileSync(path.join(repo, EN_PAGE), 'utf8');
  esPage = fs.readFileSync(path.join(repo, ES_PAGE), 'utf8');
  engine = fs.readFileSync(path.join(repo, ENGINE), 'utf8');
} catch (e) { console.error(`check-menu-pricing-render: cannot read a source file: ${e.message}`); process.exit(1); }

const errors = check({ enPage, esPage, engine });
if (errors.length) {
  console.error(`✗ Menu-pricing render-contract gate — ${errors.length} violation(s):`);
  for (const e of errors) console.error('  - ' + e);
  process.exit(1);
}
console.log('✓ Menu-pricing render-contract gate — engine ISR_ISLAND/ISR_CSS byte-identical in EN+ES pages; reliance/catchpair caveats + year-alignment intact, catchpair never a share, rungs seal SOURCE→MARKET→YOUR PLATE with EN/ES T-key parity.');
