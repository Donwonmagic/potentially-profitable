#!/usr/bin/env node
/**
 * Inject the Muntin Restaurant Basket composition into /cost-index/basket/.
 *
 * Projects data/cost-basket-weights.json (the FROZEN, versioned basket
 * weights — stable input, NOT a churning derived artifact) into the
 * sentinel-bounded region
 *   <!-- basket:weights:start --> … <!-- basket:weights:end -->
 * on cost-index/basket/index.html (EN) and es/cost-index/basket/index.html
 * (ES), as a weighted ingredient list sorted by weight. Each ingredient
 * links to its live Cost Index page when that page exists on disk (no 404s
 * for dormant ingredients). Weights are rendered verbatim from the data
 * (raw declared relative weights); the page labels them illustrative +
 * frozen. Deterministic, so the --check idempotency gate is stable and
 * independent of the daily price regeneration.
 *
 *   node scripts/inject-cost-index-basket-weights.mjs          # write
 *   node scripts/inject-cost-index-basket-weights.mjs --check  # exit 1 if drift
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const checkMode = process.argv.includes('--check');
const data = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-basket-weights.json'), 'utf8'));

// slug -> [EN name, EN group, ES name, ES group]
const META = {
  'chicken-breast': ['Chicken breast', 'Protein', 'Pechuga de pollo', 'Proteína'],
  'whole-chicken': ['Whole chicken', 'Protein', 'Pollo entero', 'Proteína'],
  'ribeye': ['Ribeye', 'Protein', 'Ribeye', 'Proteína'],
  'beef-tenderloin': ['Beef tenderloin', 'Protein', 'Lomo de res', 'Proteína'],
  'pork-loin': ['Pork loin', 'Protein', 'Lomo de cerdo', 'Proteína'],
  'pork-shoulder': ['Pork shoulder', 'Protein', 'Paleta de cerdo', 'Proteína'],
  'salmon-fillet': ['Salmon fillet', 'Seafood', 'Filete de salmón', 'Mariscos'],
  'shrimp': ['Shrimp', 'Seafood', 'Camarón', 'Mariscos'],
  'vegetable-oil': ['Vegetable oil', 'Fat', 'Aceite vegetal', 'Grasa'],
  'butter': ['Butter', 'Dairy', 'Mantequilla', 'Lácteo'],
  'cheddar-cheese': ['Cheddar cheese', 'Dairy', 'Queso cheddar', 'Lácteo'],
  'eggs': ['Eggs', 'Eggs', 'Huevos', 'Huevos'],
  'romaine-lettuce': ['Romaine lettuce', 'Produce', 'Lechuga romana', 'Verdura'],
  'tomato': ['Tomato', 'Produce', 'Tomate', 'Verdura'],
  'onion': ['Onion', 'Produce', 'Cebolla', 'Verdura'],
  'russet-potato': ['Russet potato', 'Produce', 'Papa russet', 'Verdura'],
};

const sorted = Object.entries(data.weights).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const RE = /<!-- basket:weights:start -->[\s\S]*?<!-- basket:weights:end -->/;

function region(locale) {
  const es = locale === 'es';
  const base = es ? '/es/cost-index/' : '/cost-index/';
  const hdr = es ? 'Peso relativo' : 'Relative weight';
  const rows = sorted.map(([slug, w]) => {
    const m = META[slug] || [slug, '', slug, ''];
    const name = es ? m[2] : m[0];
    const group = es ? m[3] : m[1];
    const has = fs.existsSync(path.join(repoRoot, 'cost-index', slug, 'index.html'));
    const label = has
      ? `<a href="${base}${slug}/" style="color:var(--teal);border-bottom:1px dashed currentColor;text-decoration:none">${name}</a>`
      : name;
    return `        <li style="display:flex;justify-content:space-between;align-items:baseline;gap:12px;padding:7px 0;border-bottom:1px solid var(--line)">
          <span>${label} <span style="color:var(--stone);font-size:13px">&middot; ${group}</span></span>
          <span style="font-variant-numeric:tabular-nums;color:var(--ink-soft);font-size:14px">${w}</span>
        </li>`;
  }).join('\n');
  return `<!-- basket:weights:start -->
      <p style="font-size:12.5px;letter-spacing:0.04em;text-transform:uppercase;color:var(--stone);margin:0 0 6px;display:flex;justify-content:space-between"><span>${es ? 'Ingrediente' : 'Ingredient'}</span><span>${hdr}</span></p>
      <ul style="list-style:none;padding:0;margin:0">
${rows}
      </ul>
      <!-- basket:weights:end -->`;
}

const targets = [
  ['cost-index/basket/index.html', 'en'],
  ['es/cost-index/basket/index.html', 'es'],
];
const stale = [];
for (const [rel, loc] of targets) {
  const file = path.join(repoRoot, rel);
  const src = fs.readFileSync(file, 'utf8');
  if (!RE.test(src)) { console.error(`basket weights: sentinel not found in ${rel}`); process.exit(1); }
  const next = src.replace(RE, region(loc));
  if (next !== src) { if (checkMode) stale.push(rel); else fs.writeFileSync(file, next); }
}
if (checkMode) {
  if (stale.length) { console.error(`basket weights out of sync (${stale.join(', ')}) — run: node scripts/inject-cost-index-basket-weights.mjs`); process.exit(1); }
  console.log(`basket weights: in sync (${sorted.length} ingredients, v${data._version}).`);
} else {
  console.log(`basket weights: wrote ${sorted.length} ingredients to ${targets.length} page(s) (v${data._version}).`);
}
