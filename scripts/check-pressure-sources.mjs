#!/usr/bin/env node
/**
 * check-pressure-sources.mjs — validate data/pressure-source-specs.json shape +
 * alignment with the manifest, and report go-live readiness (verified count).
 * FAIL on a shape error or a manifest indicator with no spec; WARN (don't fail)
 * on verified:false — that's the expected pre-go-live state.
 *
 *   node scripts/check-pressure-sources.mjs
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rd = (p) => JSON.parse(readFileSync(path.join(repoRoot, p), 'utf8'));
const rules = rd('data/pressure-rules.json');
const specs = (rd('data/pressure-source-specs.json').specs) || {};

const REQUIRED = {
  eia: ['series'], nass: ['query'], ams: ['report', 'field'],
  'ams-move': ['commodity', 'emits'],
  usdm: ['areas', 'categories'], nws: ['events']
};
const fails = [], warns = [];

// `_`-prefixed keys are doc notes, not specs.
const specEntries = Object.entries(specs).filter(([id]) => !id.startsWith('_'));
// An ams-move spec satisfies its EMITTED indicator ids, not its own spec id.
const emitted = new Set();

for (const [id, spec] of specEntries) {
  if (!spec.type || !REQUIRED[spec.type]) { fails.push(`${id}: unknown/missing type`); continue; }
  for (const k of REQUIRED[spec.type]) if (spec[k] == null) fails.push(`${id}: type ${spec.type} needs '${k}'`);
  if (spec.type === 'ams-move') Object.values(spec.emits || {}).forEach((e) => emitted.add(e));
  if (spec.verified === false) warns.push(id);
}

// Every manifest indicator must have a spec — either a directly-named spec or an
// emitted id from an ams-move spec.
const ids = new Set();
for (const panel of Object.values(rules.items || {})) (panel.indicators || []).forEach((i) => ids.add(i.id));
for (const id of ids) if (!specs[id] && !emitted.has(id)) fails.push(`manifest indicator '${id}' has no fetch spec`);

if (fails.length) { console.error('✗ pressure sources:'); fails.forEach((f) => console.error('  ' + f)); process.exit(1); }
const verified = specEntries.length - warns.length;
console.log(`pressure sources: shape OK — ${verified}/${specEntries.length} specs verified.`);

// Go-live worksheet: each unverified spec with its discovery endpoint + the exact
// thing to confirm, grouped by source type, so verification is one screen of work.
const DISCOVERY = {
  nass: 'https://quickstats.nass.usda.gov (param browser) — confirm short_desc, then flip verified:true',
  ams:  'https://mymarketnews.ams.usda.gov/mymarketnews-api — confirm report slug + numeric field',
  'ams-move': 'MARS movement reports — run --probe; confirm cities-hit, weeks, and sane volume/imports/pace emits',
  eia:  'https://www.eia.gov/opendata/ — confirm the series id resolves',
  usdm: 'https://droughtmonitor.unl.edu/DmData/DataDownload.aspx — keyless; confirm area FIPS',
  nws:  'https://api.weather.gov/alerts/active — keyless; confirm event name string'
};
if (warns.length) {
  console.log(`  go-live checklist — ${warns.length} spec(s) to verify, then flip verified:true:`);
  const byType = {};
  warns.forEach((id) => { const t = specs[id].type; (byType[t] = byType[t] || []).push(id); });
  for (const t of Object.keys(byType).sort()) {
    console.log(`    [${t}]  ${DISCOVERY[t] || ''}`);
    byType[t].forEach((id) => console.log(`      • ${id} — ${specs[id]._verify || '(confirm identifier)'}`));
  }
} else {
  console.log('  all specs verified — ready for --live.');
}
