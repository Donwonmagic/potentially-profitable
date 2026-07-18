#!/usr/bin/env node
/**
 * check-ingredient-state-record.mjs — the HONESTY + INTEGRITY gate for the Ingredient State Record
 * (cost-index/ingredient-state-record.json), the fused multi-source per-ingredient corpus that the
 * /cost-index/menu-pricing/ explorer reads at runtime.
 *
 * It fails the build if the record breaches an invariant that would let a dishonest or malformed
 * value reach a reader. Descriptive of the tracked record — never a forecast; wholesale is a
 * reference never a delivered price; import is value never volume; farm price is farm-gate;
 * co-occurrence is never cause; reliance is a value-share proxy; null degrades by absence.
 *
 *   node scripts/check-ingredient-state-record.mjs
 *   node scripts/check-ingredient-state-record.mjs --self-test
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const FILE = 'cost-index/ingredient-state-record.json';

// Forecast / causation language must never appear in a record string (import_note etc.). The record
// is descriptive of the tracked past; co-occurrence is never cause.
const BANNED = [
  /\bforecast/i, /\bprojected\b/i, /\bexpected?\s+to\b/i, /\bwill\s+(rise|fall|climb|drop|increase|decrease)\b/i,
  /\bpredict/i, /\bcaused?\s+by\b/i, /\bbecause\s+of\b/i, /\bdriv(es|en)\s+by\b/i, /\bdue\s+to\b/i,
  /\bdelivered\s+price\b/i, /\bretail\s+price\b/i,
];

function check(record) {
  const errs = [];
  const E = (slug, msg) => errs.push(`${slug}: ${msg}`);
  const recs = record.ingredients;
  if (!Array.isArray(recs)) return ['record has no ingredients[] array'];

  // envelope counts must match reality
  const nImport = recs.filter((r) => r.us_import_value_usd != null).length;
  const nPressure = recs.filter((r) => r.pressure_dir != null).length;
  if (record.count !== recs.length) errs.push(`envelope.count ${record.count} != ${recs.length} records`);
  if (record.withImport != null && record.withImport !== nImport) errs.push(`envelope.withImport ${record.withImport} != ${nImport}`);
  if (record.withPressure != null && record.withPressure !== nPressure) errs.push(`envelope.withPressure ${record.withPressure} != ${nPressure}`);

  const slugs = new Set();
  for (const r of recs) {
    const s = r.slug || '(no slug)';
    if (!r.slug) errs.push('a record has no slug');
    if (slugs.has(r.slug)) E(s, 'duplicate slug');
    slugs.add(r.slug);
    if (!r.name) E(s, 'no name');

    // bounded numeric fields
    if (r.cheapest_month != null && !(r.cheapest_month >= 1 && r.cheapest_month <= 12)) E(s, `cheapest_month ${r.cheapest_month} out of 1..12`);
    if (r.band_pct != null && r.band_pct < 0) E(s, `band_pct ${r.band_pct} < 0`);
    if (r.import_source_hhi != null && !(r.import_source_hhi >= 0 && r.import_source_hhi <= 1)) E(s, `import_source_hhi ${r.import_source_hhi} out of 0..1`);
    if (r.import_reliance_pct != null && !(r.import_reliance_pct >= 0 && r.import_reliance_pct <= 100)) E(s, `import_reliance_pct ${r.import_reliance_pct} out of 0..100`);
    if (Array.isArray(r.import_peak_months)) {
      if (r.import_peak_months.length !== 3) E(s, `import_peak_months length ${r.import_peak_months.length} != 3`);
      for (const m of r.import_peak_months) if (!(m >= 1 && m <= 12)) E(s, `import peak month ${m} out of 1..12`);
    }
    if (Array.isArray(r.import_seasonal_index) && r.import_seasonal_index.length !== 12) E(s, `import_seasonal_index length ${r.import_seasonal_index.length} != 12`);
    for (const t of r.import_top_sources || []) if (t.share_pct != null && !(t.share_pct >= 0 && t.share_pct <= 100)) E(s, `import source share ${t.share_pct} out of 0..100`);
    for (const c of r.comovers || []) if (!/^\d+\/\d+$/.test(String(c.shared_of_n || ''))) E(s, `comover shared_of_n "${c.shared_of_n}" not k/n`);

    // reliance requires BOTH sources present (it is a cross-source read; never fabricated)
    if (r.import_reliance_pct != null && (r.us_import_value_usd == null || r.us_production_usd == null)) E(s, 'import_reliance_pct present without both import + production value');
    // farm price implies its unit (a bare number is meaningless)
    if (r.farm_price != null && !r.farm_price_unit) E(s, 'farm_price present without farm_price_unit');

    // specialty (import-defined) ingredients carry NO wholesale layer — band/posture/seasonality absent
    if (r.specialty) {
      for (const f of ['posture', 'band_pct', 'cheapest_month', 'save_pct', 'hedge_swap', 'notable_events_n']) {
        if (r[f] != null) E(s, `specialty ingredient must not carry ${f} (no wholesale reference)`);
      }
    }

    // banned language in any string field
    for (const [k, v] of Object.entries(r)) {
      if (typeof v !== 'string') continue;
      for (const re of BANNED) if (re.test(v)) E(s, `banned language in ${k}: /${re.source}/`);
    }
  }
  return errs;
}

function selfTest() {
  const bad = { count: 1, withImport: 5, ingredients: [
    { slug: 'x', name: 'X', cheapest_month: 13, import_source_hhi: 2, import_reliance_pct: 120,
      import_peak_months: [1, 2], us_import_value_usd: null, import_note: 'prices will rise due to drought',
      specialty: true, band_pct: 5 },
  ] };
  const errs = check(bad);
  const want = ['cheapest_month', 'import_source_hhi', 'import_reliance_pct', 'import_peak_months length', 'banned language', 'must not carry band_pct', 'withImport'];
  const miss = want.filter((w) => !errs.some((e) => e.includes(w)));
  if (miss.length) { console.error('SELF-TEST FAIL — missed:', miss, '\ngot:', errs); process.exit(1); }
  console.log('✓ self-test: caught all', want.length, 'seeded violations'); process.exit(0);
}

if (process.argv.includes('--self-test')) selfTest();
let data; try { data = JSON.parse(fs.readFileSync(path.join(repo, FILE), 'utf8')); }
catch (e) { console.error(`check-ingredient-state-record: cannot read ${FILE}: ${e.message}`); process.exit(1); }
const errors = check(data);
if (errors.length) {
  console.error(`✗ Ingredient State Record honesty gate — ${errors.length} violation(s):`);
  for (const e of errors.slice(0, 50)) console.error('  - ' + e);
  process.exit(1);
}
console.log(`✓ Ingredient State Record honesty gate — ${data.ingredients.length} records, every field bounded + honest; no forecast/causation, specialty carry no wholesale layer, reliance only cross-source.`);
