#!/usr/bin/env node
/**
 * build-cost-index-picker.mjs — emit the Vendor Benchmark INGREDIENT-PICKER
 * manifest (data/cost-index-picker.js) from the browser seed (data/cost-index.js)
 * joined with the shared category taxonomy (scripts/lib/cost-index-categories.mjs).
 *
 * Why a separate, tiny manifest: the Vendor Benchmark tool loads the full ~1MB
 * compute seed LAZILY (idle-time), but a coming ingredient dropdown needs a
 * first-paint list of what the tool can actually benchmark — the label, the unit,
 * the category to group by, and whether the reference carries a firm dollar level.
 * This manifest is that honest source-of-truth data layer: ~5-8KB, eager, no compute.
 *
 * No invention happens here. Every field is copied or derived from the seed:
 *   - key / label_en / label_es / unit_en / unit_es : copied verbatim from the seed.
 *   - group : the ingredient's category, from the shared taxonomy (the SAME map
 *     the page generator uses — see scripts/lib/cost-index-categories.mjs).
 *   - dollarRef : recomputed from the seed via the EXACT rule in
 *     tools/_shared/cost-index-lookup.js reference() — true only when the matched
 *     ingredient carries a medium+ confidence dollar level on a non-index basis.
 *
 * Deterministic: stable order (category order, then label_en), no build clock,
 * no Math.random — the artifact is a pure function of the seed + the taxonomy.
 *
 *   node scripts/build-cost-index-picker.mjs            # write
 *   node scripts/build-cost-index-picker.mjs --dry-run  # report only
 */
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { CATEGORIES, CATEGORY_ORDER, categoryOf } from './lib/cost-index-categories.mjs';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const DRY = process.argv.includes('--dry-run');
const SEED_IN = path.join(repoRoot, 'data/cost-index.js');
const OUT = path.join(repoRoot, 'data/cost-index-picker.js');

// THE DOLLAR-REFERENCE RULE — kept byte-for-byte in step with
// tools/_shared/cost-index-lookup.js reference(): a $ level is publishable only
// on a real dollar basis (basis !== 'index') AND a firm (high|medium) confidence.
function dollarRefOf(it) {
  const a = it.assessment || {};
  const lvl = a.level || null;
  const conf = a.confidence || null;
  const firm = conf === 'high' || conf === 'medium';
  return !!(lvl && typeof lvl.medianCents === 'number' && lvl.basis !== 'index' && firm);
}

function main() {
  const seed = require(SEED_IN);
  const ingredients = Array.isArray(seed.ingredients) ? seed.ingredients : [];
  if (!ingredients.length) {
    console.error('build-cost-index-picker: seed has no ingredients — refusing to write an empty manifest.');
    process.exit(1);
  }

  const rows = [];
  for (const it of ingredients) {
    const group = categoryOf(it.key);
    if (!group || !CATEGORIES[group]) {
      console.error(`build-cost-index-picker: no taxonomy category for seed ingredient '${it.key}' — add it to scripts/lib/cost-index-categories.mjs.`);
      process.exit(1);
    }
    rows.push({
      key: it.key,
      label_en: it.label_en,
      label_es: it.label_es,
      unit_en: it.unit_en || 'unit',
      unit_es: it.unit_es || 'unidad',
      group,
      dollarRef: dollarRefOf(it),
    });
  }

  // Stable order: category order (as the hub groups them), then label_en A→Z.
  const catRank = new Map(CATEGORY_ORDER.map((c, i) => [c, i]));
  rows.sort((a, b) => {
    const ra = catRank.has(a.group) ? catRank.get(a.group) : CATEGORY_ORDER.length;
    const rb = catRank.has(b.group) ? catRank.get(b.group) : CATEGORY_ORDER.length;
    if (ra !== rb) return ra - rb;
    return a.label_en.localeCompare(b.label_en, 'en');
  });

  const dollarRefCount = rows.filter((r) => r.dollarRef).length;

  // The picker's group headers (beef / poultry / … / dairy-eggs) come from the
  // SAME shared taxonomy the Cost Index category pages use — display order via
  // CATEGORY_ORDER, restricted to groups that actually have ≥1 pickable item,
  // labels copied verbatim from CATEGORIES so the tool's headers stay 1:1 with
  // the public category pages. No hand-typed labels in the browser JS.
  const presentGroups = new Set(rows.map((r) => r.group));
  const groups = CATEGORY_ORDER.filter((k) => presentGroups.has(k)).map((k) => ({
    key: k,
    label_en: CATEGORIES[k].en,
    label_es: CATEGORIES[k].es,
  }));

  const banner = `/**
 * Cost Index — Vendor Benchmark ingredient-picker manifest. GENERATED — do not edit by hand.
 *
 * Written by scripts/build-cost-index-picker.mjs from data/cost-index.js (the browser
 * seed) joined with scripts/lib/cost-index-categories.mjs (the shared category taxonomy).
 * Sets window.MUNTIN_CI_PICKER to an object:
 *   { _doc, count, dollarRefCount,
 *     groups: [{ key, label_en, label_es }]   // display order, populated groups only
 *     items:  [{ key, label_en, label_es, unit_en, unit_es, group, dollarRef }] }
 * \`group\` is the ingredient's Cost Index category; group LABELS come from the shared
 * taxonomy (1:1 with the category pages); \`dollarRef\` is true only when the reference
 * carries a firm dollar level (see tools/_shared/cost-index-lookup.js). Loaded eagerly
 * (first paint) so the ingredient picker can render before the ~1MB compute seed lazy-loads.
 * Guarded by scripts/check-cost-index-picker.mjs (length/keys/labels/group/dollarRef/groups).
 */
`;
  const _doc = `Vendor Benchmark ingredient picker: the honest list of what the tool can benchmark, derived from the browser seed + the shared category taxonomy. ${rows.length} ingredient(s); ${dollarRefCount} carry a firm dollar reference.`;
  // Compact, one-object-per-line: small enough for an eager first-paint load,
  // still a clean line-per-ingredient diff when the seed changes.
  const itemsJs = '[\n' + rows.map((r) => '    ' + JSON.stringify(r)).join(',\n') + '\n  ]';
  const groupsJs = '[\n' + groups.map((g) => '    ' + JSON.stringify(g)).join(',\n') + '\n  ]';
  const body = `(function (root) {
  'use strict';
  var DATA = {
  "_doc": ${JSON.stringify(_doc)},
  "count": ${rows.length},
  "dollarRefCount": ${dollarRefCount},
  "groups": ${groupsJs},
  "items": ${itemsJs}
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = DATA;
  if (typeof self !== 'undefined') self.MUNTIN_CI_PICKER = DATA;
  if (root) root.MUNTIN_CI_PICKER = DATA;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
`;
  if (!DRY) writeFileSync(OUT, banner + body);
  console.log(`build-cost-index-picker: ${DRY ? 'would write' : 'wrote'} data/cost-index-picker.js (${rows.length} ingredient(s), ${dollarRefCount} with a firm dollar reference, ${groups.length} group(s)).${DRY ? ' (dry-run)' : ''}`);
}

main();
