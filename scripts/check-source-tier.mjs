#!/usr/bin/env node
/**
 * check-source-tier.mjs — the coverage-honesty gate.
 *
 * Every ingredient in data/cost-index-sources.json resolves to exactly one
 * COVERAGE TIER, derived (never hand-stored, so it can't drift from the
 * verified flag):
 *
 *   measured  verified:true AND a level-bearing source (ams / lmr / noaa) —
 *             a real published wholesale price LEVEL ships.
 *   derived   verified:true but TREND-ONLY (no ams/lmr/noaa; only bls/fred/eia)
 *             — an honest directional estimate, no measured level.
 *   absent    verified:false — nothing ships; we owe the reader a reason.
 *
 * The gate enforces the honesty contract:
 *   1. Every `derived` and `absent` ingredient carries a non-empty `coverage`
 *      reason string (the "why" we render in place of a price).
 *   2. A `measured` ingredient is internally consistent (verified + a level src).
 *   3. verified:true ingredients name at least one source.
 *
 * `ingredientTier()` is exported so scripts/build-cost-index.mjs labels cards
 * with the SAME rule the gate enforces — build and gate cannot drift.
 *
 *   node scripts/check-source-tier.mjs --check    # CI gate
 *   node scripts/check-source-tier.mjs            # same, with the tier table
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const hasLevelSource = (e) => !!(e && (e.ams || e.lmr || e.noaa));
const hasTrendSource = (e) => !!(e && (e.bls || e.fred || e.eia));

/** Derive the coverage tier for one ingredient entry. Single source of truth. */
export function ingredientTier(entry) {
  if (!entry || entry.verified !== true) return 'absent';
  if (hasLevelSource(entry)) return 'measured';
  if (hasTrendSource(entry)) return 'derived';
  return 'absent';
}

function run() {
  let doc;
  try {
    doc = JSON.parse(readFileSync(path.join(repoRoot, 'data/cost-index-sources.json'), 'utf8'));
  } catch (e) {
    console.error('✗ source-tier: cannot read data/cost-index-sources.json — ' + e.message);
    process.exit(1);
  }
  const S = doc.ingredients || {};
  const errors = [];
  const tally = { measured: 0, derived: 0, absent: 0 };

  for (const [slug, entry] of Object.entries(S)) {
    const tier = ingredientTier(entry);
    tally[tier]++;
    const coverage = typeof entry.coverage === 'string' ? entry.coverage.trim() : '';

    // 1. derived + absent must explain themselves.
    if ((tier === 'derived' || tier === 'absent') && !coverage) {
      errors.push(`${slug}: tier "${tier}" requires a non-empty "coverage" reason (the why we show instead of a price).`);
    }
    // 2/3. internal consistency.
    if (entry.verified === true && !hasLevelSource(entry) && !hasTrendSource(entry)) {
      errors.push(`${slug}: verified:true but names no source (ams/lmr/noaa/bls/fred/eia).`);
    }
    if (tier === 'measured' && entry.verified !== true) {
      errors.push(`${slug}: tier "measured" but verified is not true.`);
    }
  }

  const total = Object.keys(S).length;
  if (errors.length) {
    console.error(`✗ source-tier: ${errors.length} issue(s) across ${total} ingredient(s):`);
    errors.forEach((e) => console.error('  - ' + e));
    console.error('  Fix: add a "coverage" reason to any derived/absent ingredient in data/cost-index-sources.json.');
    process.exit(1);
  }

  console.log(
    `source-tier: OK — ${total} ingredient(s): ` +
    `${tally.measured} measured · ${tally.derived} derived · ${tally.absent} absent. ` +
    `Every derived/absent card carries a coverage reason.`
  );
}

// Only run as a CLI when executed directly — not when build-cost-index.mjs
// imports ingredientTier().
if (import.meta.url === pathToFileURL(process.argv[1] || '').href) run();
