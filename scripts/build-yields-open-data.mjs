#!/usr/bin/env node
/**
 * build-yields-open-data.mjs — publish the ingredient-yields open dataset.
 *
 * Source of truth: data/ingredient-yields.json (the manifest, gated by
 * check-ingredient-yields.mjs). This reshapes it into the two committed,
 * downloadable open-data artifacts the /open/ hub + the yields explorer link:
 *
 *   cost-index/yields.json  — canonical JSON (CC-BY 4.0), stable field names
 *   cost-index/yields.csv   — the same rows as a spreadsheet-friendly CSV
 *
 * Before this script the JSON copy had NO in-repo generator (it was reshaped
 * out of band) and no --check diff, so the manifest and the published copy
 * could silently drift. --check now regenerates from the manifest and fails
 * on any drift; --self-test pins the reshape + CSV escaping.
 *
 *   node scripts/build-yields-open-data.mjs            # write both artifacts
 *   node scripts/build-yields-open-data.mjs --check    # fail if either drifted
 *   node scripts/build-yields-open-data.mjs --self-test
 *
 * Facts (yield percentages) are public reference data; the compilation is CC-BY.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const DOC = 'Edible-portion yield reference for common restaurant ingredients: the usable share of purchased weight after standard trim and waste. Compiled from standard industry reference yield tables. Facts (yield percentages) are public reference data; the compilation is CC-BY. Join on slug to the Cost Index. Not a price.';
const LICENSE = 'https://creativecommons.org/licenses/by/4.0/';

// Reshape one manifest row into the published, stable-field-name shape.
function toPublished(row) {
  return {
    slug: row.slug,
    name_en: row.en,
    name_es: row.es,
    edible_yield: row.yield,
    unit_en: row.unit_en,
    unit_es: row.unit_es,
    category: row.cat,
  };
}

function buildJson(manifest) {
  return {
    _doc: DOC,
    license: LICENSE,
    count: manifest.length,
    ingredients: manifest.map(toPublished),
  };
}

// RFC-4180-ish CSV: quote a field only when it contains a comma, quote, or
// newline, and double any embedded quotes. Keeps unquoted the common case so
// the file stays diff-friendly and human-readable.
function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function buildCsv(manifest) {
  const cols = ['slug', 'name_en', 'name_es', 'edible_yield', 'unit_en', 'unit_es', 'category'];
  const header = cols.join(',');
  const rows = manifest.map(toPublished).map((r) => cols.map((c) => csvCell(r[c])).join(','));
  return header + '\n' + rows.join('\n') + '\n';
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/ingredient-yields.json'), 'utf8'));
}

function selfTest() {
  let pass = 0, fail = 0;
  const eq = (name, got, want) => {
    if (JSON.stringify(got) === JSON.stringify(want)) { pass++; }
    else { fail++; console.error(`  ✗ ${name}\n     got:  ${JSON.stringify(got)}\n     want: ${JSON.stringify(want)}`); }
  };
  // reshape maps the manifest fields to the published names + drops the rest
  eq('reshape fields', toPublished({ slug: 'x', en: 'X', es: 'Ex', yield: 0.5, cat: 'root', unit_en: 'lb', unit_es: 'libra', apCents: 999, yield_key: 'k' }),
    { slug: 'x', name_en: 'X', name_es: 'Ex', edible_yield: 0.5, unit_en: 'lb', unit_es: 'libra', category: 'root' });
  eq('reshape drops apCents/yield_key', Object.keys(toPublished({ slug: 'x', en: 'X', es: 'E', yield: 1, cat: 'c', unit_en: 'u', unit_es: 'u', apCents: 1, yield_key: 'k', yield_source: 's' })).sort(),
    ['category', 'edible_yield', 'name_en', 'name_es', 'slug', 'unit_en', 'unit_es']);
  // CSV escaping
  eq('csv plain', csvCell('Romaine lettuce'), 'Romaine lettuce');
  eq('csv comma quoted', csvCell('Onion, red'), '"Onion, red"');
  eq('csv quote doubled', csvCell('6" fillet'), '"6"" fillet"');
  eq('csv quote+comma', csvCell('a,"b'), '"a,""b"');
  // JSON top-level shape
  const j = buildJson([{ slug: 's', en: 'S', es: 'Es', yield: 0.9, cat: 'root', unit_en: 'lb', unit_es: 'libra', apCents: 1, yield_key: 'k' }]);
  eq('json keys', Object.keys(j), ['_doc', 'license', 'count', 'ingredients']);
  eq('json count matches', j.count, j.ingredients.length);
  eq('json license CC-BY', j.license, LICENSE);
  // CSV header + row count (header + N rows + trailing newline → N+2 parts on split)
  const csv = buildCsv([{ slug: 's', en: 'S', es: 'E', yield: 0.9, cat: 'c', unit_en: 'u', unit_es: 'u' }, { slug: 't', en: 'T', es: 'E', yield: 0.8, cat: 'c', unit_en: 'u', unit_es: 'u' }]);
  eq('csv header', csv.split('\n')[0], 'slug,name_en,name_es,edible_yield,unit_en,unit_es,category');
  eq('csv row count', csv.trim().split('\n').length, 3);
  // Live manifest round-trips to the same count
  const man = loadManifest();
  eq('live manifest count == published count', buildJson(man).count, man.length);
  console.log(`build-yields-open-data self-test: ${pass}/${pass + fail} passed.`);
  process.exit(fail ? 1 : 0);
}

const args = new Set(process.argv.slice(2));
if (args.has('--self-test')) selfTest();

const manifest = loadManifest();
const jsonOut = JSON.stringify(buildJson(manifest), null, 2) + '\n';
const csvOut = buildCsv(manifest);
const artifacts = [
  { rel: 'cost-index/yields.json', content: jsonOut },
  { rel: 'cost-index/yields.csv', content: csvOut },
];

if (args.has('--check')) {
  let drift = 0;
  for (const a of artifacts) {
    const p = path.join(repoRoot, a.rel);
    const cur = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
    if (cur !== a.content) { drift++; console.error(`✗ ${a.rel} is stale — run: node scripts/build-yields-open-data.mjs`); }
  }
  if (drift) process.exit(1);
  console.log(`✓ yields open data in sync (${manifest.length} ingredient(s), 2 artifact(s)).`);
  process.exit(0);
}

for (const a of artifacts) {
  fs.writeFileSync(path.join(repoRoot, a.rel), a.content);
}
console.log(`Wrote cost-index/yields.{json,csv} — ${manifest.length} ingredient(s).`);
