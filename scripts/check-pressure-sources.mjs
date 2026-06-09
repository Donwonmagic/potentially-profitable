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
  usdm: ['areas', 'categories'], nws: ['events']
};
const fails = [], warns = [];

for (const [id, spec] of Object.entries(specs)) {
  if (!spec.type || !REQUIRED[spec.type]) { fails.push(`${id}: unknown/missing type`); continue; }
  for (const k of REQUIRED[spec.type]) if (spec[k] == null) fails.push(`${id}: type ${spec.type} needs '${k}'`);
  if (spec.verified === false) warns.push(id);
}

// Every manifest indicator must have a spec.
const ids = new Set();
for (const panel of Object.values(rules.items || {})) (panel.indicators || []).forEach((i) => ids.add(i.id));
for (const id of ids) if (!specs[id]) fails.push(`manifest indicator '${id}' has no fetch spec`);

if (fails.length) { console.error('✗ pressure sources:'); fails.forEach((f) => console.error('  ' + f)); process.exit(1); }
const verified = Object.keys(specs).length - warns.length;
console.log(`pressure sources: shape OK — ${verified}/${Object.keys(specs).length} specs verified.`);
if (warns.length) console.log(`  go-live checklist (verify then flip verified:true): ${warns.join(', ')}`);
