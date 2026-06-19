#!/usr/bin/env node
/**
 * build-cost-index-audit.mjs — a critical data-quality audit of the Cost Index
 * deep history. Surfacing report for upstream triage (does NOT fail CI on
 * findings — these are pipeline data issues, not code drift; the --check gate
 * only keeps the report in lockstep with the data, like the anomaly log).
 *
 * Born from the plate-cost-drift work, which tripped over real data defects:
 * `vegetable-oil` carries a ~$350/"lb" level (a non-lb basis mislabeled), and
 * several related cuts are byte-identical placeholder clones of one series
 * (ribeye = beef-tenderloin = short-rib). This turns those ad-hoc findings into
 * a principled, deterministic scan.
 *
 * Three checks:
 *   1. clones            — ingredients whose full valueCents sequence is
 *                          identical to another's (placeholder seeding).
 *   2. implausibleLevels — lb-labeled ingredients whose latest level falls
 *                          outside an expert-grounded per-lb band.
 *   3. referenceDeviations — ingredients with a hard USDA/CME wholesale
 *                          reference whose index level deviates beyond 2x / 0.5x.
 *
 * Plausibility bands and references are grounded in USDA AMS boxed-beef / pork
 * and CME soybean-oil wholesale levels (data/sourced-claims.json
 * #usda_wholesale_protein_oil_refs_2026). They are coarse and directional — the
 * point is to catch egregious scale/seeding defects, not to second-guess a
 * legitimate price.
 *
 *   node scripts/build-cost-index-audit.mjs            # write data/cost-index-audit.json
 *   node scripts/build-cost-index-audit.mjs --check    # CI: exit 1 if stale
 *   node scripts/build-cost-index-audit.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repo = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(repo, 'data', 'cost-index-audit.json');
const rd = (p) => { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };
const round = (n, d) => { const f = Math.pow(10, d); return Math.round(n * f) / f; };

// Expert-grounded per-lb plausibility band. No real per-lb wholesale food in
// this catalog sits below $0.30 or above $60 (grass-fed whole tenderloin tops
// out ~$44; soybean oil ~$0.48). Source: #usda_wholesale_protein_oil_refs_2026.
const LB_BAND = [0.30, 60];

// Hard wholesale references for spot-checking the index level (USD/lb).
// Deviation = index / reference; flagged outside [0.5, 2.0].
const REFERENCES = {
  'ribeye':         { usd: 10.71, note: 'USDA boxed ribeye, 2026-03-16' },
  'ground-beef':    { usd: 4.16,  note: 'USDA boxed ground beef 81/85% lean avg, 2026-03-16' },
  'chicken-breast': { usd: 1.55,  note: 'USDA wholesale B/S breast midpoint, 2025–26' },
  'vegetable-oil':  { usd: 0.48,  note: 'CME soybean oil, 2026-06-12' }
};
const DEV_LO = 0.5, DEV_HI = 2.0;

function unitOf(labels, k) {
  const e = labels[k];
  return (e && (e.unit_en || e.unit)) || null;
}

function build() {
  const hist = rd('data/cost-index-history.json');
  const labelsRaw = rd('data/cost-index-labels.json');
  if (!hist || !hist.ingredients || !labelsRaw) {
    return { _doc: 'inputs missing', _version: 1, error: 'missing-inputs' };
  }
  const H = hist.ingredients;
  const labels = labelsRaw.labels || labelsRaw;
  const slugs = Object.keys(H).sort();

  // ---- 1. clone clusters (identical full value sequence) ----
  const bySig = {};
  for (const k of slugs) {
    const sig = H[k].map((p) => p.valueCents).join(',');
    (bySig[sig] = bySig[sig] || []).push(k);
  }
  const clones = Object.keys(bySig)
    .filter((sig) => bySig[sig].length > 1)
    .map((sig) => {
      const members = bySig[sig].slice().sort();
      return {
        members,
        lastCents: H[members[0]].slice(-1)[0].valueCents,
        points: H[members[0]].length,
        note: 'identical full series — likely placeholder seeding; treat all but one as non-independent'
      };
    })
    .sort((a, b) => a.members[0].localeCompare(b.members[0]));

  // ---- 2. implausible lb-labeled levels ----
  const implausibleLevels = [];
  for (const k of slugs) {
    if (unitOf(labels, k) !== 'lb') continue;
    const usd = H[k].slice(-1)[0].valueCents / 100;
    if (usd < LB_BAND[0] || usd > LB_BAND[1]) {
      implausibleLevels.push({
        slug: k, unit: 'lb', lastUsd: round(usd, 2), band: LB_BAND,
        note: 'latest level outside the plausible per-lb band — likely a non-lb basis mislabeled'
      });
    }
  }

  // ---- 3. reference deviations ----
  const referenceDeviations = [];
  for (const k of Object.keys(REFERENCES).sort()) {
    if (!H[k]) continue;
    const idx = H[k].slice(-1)[0].valueCents / 100;
    const ref = REFERENCES[k];
    const ratio = idx / ref.usd;
    if (ratio < DEV_LO || ratio > DEV_HI) {
      referenceDeviations.push({
        slug: k, indexUsd: round(idx, 2), referenceUsd: ref.usd,
        ratio: round(ratio, 2), reference: ref.note,
        note: ratio > DEV_HI ? 'index level far ABOVE wholesale reference' : 'index level far BELOW wholesale reference'
      });
    }
  }

  const clonedIngredients = clones.reduce((n, c) => n + c.members.length, 0);
  return {
    _doc: 'Critical data-quality audit of the Cost Index deep history (data/cost-index-history.json). Surfaces (1) clone clusters — ingredients with byte-identical series, i.e. placeholder seeding; (2) implausible per-lb levels vs an expert-grounded band; (3) index levels deviating >2x/<0.5x from a hard USDA/CME wholesale reference. Plausibility band + references grounded in data/sourced-claims.json #usda_wholesale_protein_oil_refs_2026 (directional wholesale, not delivered). Surfacing report for UPSTREAM triage — does not fail CI on findings; --check only keeps it in lockstep with the data. Deterministic; derived from the data, not wall-clock. Built by scripts/build-cost-index-audit.mjs.',
    _version: 1,
    source: { history: 'data/cost-index-history.json', labels: 'data/cost-index-labels.json' },
    grounding: 'data/sourced-claims.json#usda_wholesale_protein_oil_refs_2026',
    asOf: hist.generatedAt || null,
    lbBand: LB_BAND,
    summary: {
      ingredientsScanned: slugs.length,
      cloneClusters: clones.length,
      clonedIngredients,
      implausibleLevels: implausibleLevels.length,
      referenceDeviations: referenceDeviations.length
    },
    clones,
    implausibleLevels,
    referenceDeviations
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + '\n';

  if (process.argv.includes('--self-test')) {
    const s = report.summary || {};
    const checks = [
      ['inputs present', !report.error],
      ['clone clusters have >=2 members', report.clones.every((c) => c.members.length >= 2)],
      ['implausible levels are outside band', report.implausibleLevels.every((x) => x.lastUsd < report.lbBand[0] || x.lastUsd > report.lbBand[1])],
      ['deviations are outside tolerance', report.referenceDeviations.every((x) => x.ratio < 0.5 || x.ratio > 2.0)],
      ['summary counts match arrays', s.cloneClusters === report.clones.length && s.implausibleLevels === report.implausibleLevels.length && s.referenceDeviations === report.referenceDeviations.length],
      ['deterministic (rebuild equal)', JSON.stringify(build()) === JSON.stringify(report)]
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-index-audit self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let cur = '';
    try { cur = readFileSync(OUT, 'utf8'); } catch {}
    if (cur !== json) { console.error('✗ cost-index audit is stale — run: node scripts/build-cost-index-audit.mjs'); process.exit(1); }
    console.log('✓ cost-index audit in sync with the data.');
    return;
  }

  writeFileSync(OUT, json);
  const s = report.summary;
  console.log(`cost-index-audit: ${s.cloneClusters} clone cluster(s) (${s.clonedIngredients} ingredients), ${s.implausibleLevels} implausible level(s), ${s.referenceDeviations} reference deviation(s) across ${s.ingredientsScanned} ingredient(s).`);
}

main();
