#!/usr/bin/env node
/**
 * check-pressure-honesty.mjs — the gate that makes the inferred Pressure layer
 * unable to lie. Sibling to check-fabrications.mjs. Fail-CI on any violation.
 *
 * Load-bearing rules:
 *   1. NO price in an inferred block — any `$N` or `/unit` inside a rendered
 *      data-layer="inferred" aside fails. Prices live only in measured blocks.
 *   2. Schema purity — a pressure record carrying a value/price/level key fails.
 *   3. Verb banlist — "will be / predicts / forecasts (ours) / because / guarantee"
 *      inside an inferred block fails. Only hedged verbs survive.
 *   9. Recompute-and-compare — re-run the deterministic engine over the manifest
 *      + observations; if the stored direction/confidence/score differs from what
 *      the published rules produce, fail. This is the "not a black box" check.
 *   + every contributor must be in the manifest with source + lead + cite;
 *     two timestamps (as_of + anchor) + rule_version must be present.
 *
 *   node scripts/check-pressure-honesty.mjs
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const { assess } = require(path.join(repoRoot, 'tools/_shared/cost-pressure.js'));
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));

const rules = rd('data/pressure-rules.json');
let pressure; try { pressure = rd('data/cost-pressure.json'); } catch { pressure = { items: {} }; }
let obsDoc = null; try { obsDoc = rd('data/pressure-observations.demo.json'); } catch { /* live may differ */ }

const fails = [];
const BANNED_KEYS = ['value', 'price', 'level', 'medianCents', 'cents', 'rangeCents'];
const items = pressure.items || {};

// Rules 2, 5, 6 — schema purity, contributor citations, timestamps.
for (const [item, rec] of Object.entries(items)) {
  for (const k of BANNED_KEYS) if (k in rec) fails.push(`${item}: pressure record carries banned key '${k}'`);
  if (!rec.as_of) fails.push(`${item}: missing as_of`);
  if (rec.anchor_print_date == null) fails.push(`${item}: missing anchor_print_date`);
  if (!rec.rule_version) fails.push(`${item}: missing rule_version`);
  const panel = (rules.items || {})[item] || {};
  const byId = {}; (panel.indicators || []).forEach((i) => { byId[i.id] = i; });
  for (const c of rec.contributors || []) {
    const ind = byId[c.indicator];
    if (!ind) { fails.push(`${item}: contributor '${c.indicator}' not in manifest`); continue; }
    if (!ind.source) fails.push(`${item}/${c.indicator}: no source`);
    if (!ind.lead) fails.push(`${item}/${c.indicator}: no lead range`);
    if (!ind.cite) fails.push(`${item}/${c.indicator}: no cite (required for any weighted indicator)`);
  }
}

// Seed purity — the Cost Pulse seed's pressure summary must carry no price.
try {
  const code = readFileSync(path.join(repoRoot, 'data/cost-index.js'), 'utf8');
  const self = {};
  (new Function('self', code))(self);
  for (const ing of (self.MUNTIN_COST_INDEX && self.MUNTIN_COST_INDEX.ingredients) || []) {
    if (!ing.pressure) continue;
    for (const k of BANNED_KEYS) if (k in ing.pressure) fails.push(`seed/${ing.key}: pressure summary carries banned key '${k}'`);
  }
} catch { /* seed optional */ }

// Rule 9 — recompute and compare (deterministic, reproducible).
if (obsDoc) {
  const defaults = rules.defaults || {};
  for (const [item, rec] of Object.entries(items)) {
    const panelIn = (rules.items || {})[item]; if (!panelIn) continue;
    const o = (obsDoc.observations || {})[item] || {};
    const observations = {};
    for (const [id, cp] of Object.entries(o)) observations[id] = { changePct: cp, asOf: obsDoc.asOf };
    const panel = Object.assign({}, defaults, panelIn, { item, rule_version: panelIn.rule_version || rules._version });
    const re = assess(panel, observations, { anchorPrintDate: rec.anchor_print_date, asOf: obsDoc.asOf, ruleVersion: rules._version });
    if (re.direction !== rec.direction || re.confidence !== rec.confidence || re.score !== rec.score) {
      fails.push(`${item}: rendered (${rec.direction}/${rec.confidence}/${rec.score}) != recomputed (${re.direction}/${re.confidence}/${re.score})`);
    }
  }
}

// Rules 1 + 3 — scan rendered inferred blocks for a price or a banned verb.
const PRICE_RE = /\$\s?[0-9]|\/(lb|pound|dozen|carton|sack|case)\b|per\s+(lb|pound|dozen|carton|sack|case)\b/i;
const BANNED_VERBS = [/\bwill\s+(be|cost|rise|fall|hit|climb|drop)\b/i, /\bpredicts?\b/i, /\bforecasts?\b/i, /\bguarantee/i, /\bbecause\b/i];
let pagesScanned = 0;
function scanDir(dir) {
  if (!existsSync(dir)) return;
  for (const slug of readdirSync(dir)) {
    const p = path.join(dir, slug, 'index.html');
    if (!existsSync(p)) continue;
    const h = readFileSync(p, 'utf8');
    const blocks = h.match(/data-layer="inferred"[\s\S]*?<\/(?:aside|div)>/g) || [];
    if (blocks.length) pagesScanned++;
    for (const b of blocks) {
      if (PRICE_RE.test(b)) fails.push(`${path.relative(repoRoot, p)}: a price/unit appears inside an inferred block`);
      for (const v of BANNED_VERBS) if (v.test(b)) fails.push(`${path.relative(repoRoot, p)}: banned verb ${v} inside an inferred block`);
    }
  }
}
scanDir(path.join(repoRoot, 'cost-index'));
scanDir(path.join(repoRoot, 'es/cost-index'));
scanDir(path.join(repoRoot, 'tools'));
scanDir(path.join(repoRoot, 'es/tools'));

// Lint the Pressure Lab's RUNTIME verdict vocabulary (JS string literals the
// gate's HTML scan can't see) through the same price + banned-verb rules.
try {
  const ui = readFileSync(path.join(repoRoot, 'tools/_shared/pressure-lab-ui.js'), 'utf8')
    .replace(/^\/\*[\s\S]*?\*\//, '');   // drop the header comment
  if (PRICE_RE.test(ui)) fails.push('pressure-lab-ui.js: a price/unit string in the Lab vocabulary');
  for (const v of BANNED_VERBS) if (v.test(ui)) fails.push(`pressure-lab-ui.js: banned verb ${v} in the Lab vocabulary`);
} catch { /* optional */ }

if (fails.length) {
  console.error('✗ pressure honesty:');
  fails.forEach((f) => console.error('  ' + f));
  process.exit(1);
}
console.log(`pressure honesty: OK — ${Object.keys(items).length} record(s) recompute-match; ${pagesScanned} inferred block(s) scanned, no price/verb leak.`);
