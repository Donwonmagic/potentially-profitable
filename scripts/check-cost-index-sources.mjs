#!/usr/bin/env node
/**
 * Validates data/cost-index-sources.json (the price-source mapping) and
 * data/cost-index-bounds.json (the quality-gate bands):
 *   - SHAPE (fail-CI): every ingredient maps to ≥1 source; each source
 *     object carries its native id field (ams.reportId, bls.seriesId,
 *     fred.seriesId, noaa.species); ams.reducer is a known value.
 *   - ALIGNMENT (warn): every mapped ingredientKey + bounds key has a
 *     matching /library/ingredient-yields/<slug>/ page.
 *   - READINESS (warn): entries still verified:false are flagged — they
 *     must be resolved against each API's discovery endpoint and flipped
 *     to verified:true before the live fetch ships behind the fact-gate.
 *
 * Structural errors exit 1; alignment/readiness are warnings (exit 0),
 * because unverified placeholders are the expected pre-launch state.
 *
 *   node scripts/check-cost-index-sources.mjs [--check]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');

const ID_FIELD = { ams: 'reportId', lmr: 'reportId', bls: 'seriesId', fred: 'seriesId', noaa: 'commodity' };
const REDUCERS = new Set(['mostlyMid', 'wtdAvg', 'valuePerPound', 'single']);

const errors = [];
const warns = [];

function readJson(rel) {
  const p = path.join(repoRoot, rel);
  if (!fs.existsSync(p)) { errors.push(`${rel} is missing.`); return null; }
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); }
  catch (e) { errors.push(`${rel} is not valid JSON: ${e.message}`); return null; }
}
function pageExists(slug) {
  return fs.existsSync(path.join(repoRoot, 'library', 'ingredient-yields', slug, 'index.html'));
}

const sources = readJson('data/cost-index-sources.json');
const bounds = readJson('data/cost-index-bounds.json');

if (sources) {
  const ing = sources.ingredients;
  if (!ing || typeof ing !== 'object') {
    errors.push('cost-index-sources.json: missing "ingredients" object.');
  } else {
    let total = 0, unverified = 0;
    for (const [key, entry] of Object.entries(ing)) {
      total++;
      const srcKeys = Object.keys(entry).filter((k) => ID_FIELD[k]);
      if (!srcKeys.length) {
        errors.push(`${key}: maps to no known source (need at least one of ams/bls/fred/noaa).`);
      }
      for (const sk of srcKeys) {
        const idField = ID_FIELD[sk];
        // ams may be a single mapping OR an array of terminal markets.
        const specs = Array.isArray(entry[sk]) ? entry[sk] : [entry[sk]];
        if (Array.isArray(entry[sk]) && entry[sk].length === 0) errors.push(`${key}.${sk}: empty array.`);
        specs.forEach((obj, i) => {
          const where = Array.isArray(entry[sk]) ? `${key}.${sk}[${i}]` : `${key}.${sk}`;
          if (!obj || typeof obj !== 'object' || typeof obj[idField] !== 'string' || obj[idField] === '') {
            errors.push(`${where}: missing "${idField}".`);
          }
          if ((sk === 'ams' || sk === 'lmr') && obj && obj.reducer && !REDUCERS.has(obj.reducer)) {
            errors.push(`${where}.reducer "${obj.reducer}" is not one of ${[...REDUCERS].join(', ')}.`);
          }
        });
      }
      if (entry.verified !== true) unverified++;
      if (!pageExists(key)) warns.push(`${key}: no /library/ingredient-yields/${key}/ page (mapping/page drift).`);
    }
    if (unverified) warns.push(`${unverified}/${total} ingredient mappings are verified:false — resolve their source IDs before the live fetch ships.`);
  }

  // Drivers (feed-grain / energy explanatory inputs) — trend-only, no bounds/pages.
  const drivers = sources.drivers;
  if (drivers && typeof drivers === 'object') {
    for (const [key, entry] of Object.entries(drivers)) {
      if (key.startsWith('_') || !entry || typeof entry !== 'object') continue;
      const srcKeys = Object.keys(entry).filter((k) => ID_FIELD[k]);
      if (!srcKeys.length) { errors.push(`driver ${key}: maps to no known source (need bls/fred/ams/lmr).`); continue; }
      for (const sk of srcKeys) {
        const obj = entry[sk];
        if (!obj || typeof obj[ID_FIELD[sk]] !== 'string' || obj[ID_FIELD[sk]] === '') errors.push(`driver ${key}.${sk}: missing "${ID_FIELD[sk]}".`);
      }
    }
  }
}

if (bounds) {
  const b = bounds.bounds;
  if (!b || typeof b !== 'object') {
    errors.push('cost-index-bounds.json: missing "bounds" object.');
  } else {
    for (const [key, band] of Object.entries(b)) {
      if (typeof band.minCents !== 'number' || typeof band.maxCents !== 'number' || band.minCents >= band.maxCents) {
        errors.push(`${key}: bounds need numeric minCents < maxCents.`);
      }
      if (!pageExists(key)) warns.push(`bounds ${key}: no matching ingredient page.`);
    }
  }
}

for (const w of warns) console.log(`  ⚠ ${w}`);
if (errors.length) {
  console.error(`Cost-index sources: ${errors.length} structural error(s):`);
  for (const e of errors) console.error(`  ✗ ${e}`);
  process.exit(1);
}
console.log(`Cost-index sources: shape valid (${warns.length} readiness/alignment warning(s)).`);
