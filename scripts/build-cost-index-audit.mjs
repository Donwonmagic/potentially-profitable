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

// Documented baselines (dated, with the fix) — the gate fails only on NEW defects
// beyond these, like the repo's HISTORICAL_WAIVERS idiom. Prune an entry once the
// upstream pipeline fixes it (the gate warns when a baseline entry is gone).
// LIVE-FACING (hard fail): the current published level is wrong/cloned. None today.
const KNOWN_UNEXPLAINED_CLONES = {};
const KNOWN_IMPLAUSIBLE_LEVELS = {
  'vegetable-oil': '2026-06-19 — PPI index value carried as a cents level (~$350/"lb"); registry basis=index. Fix: publish vegetable-oil directional-only (no $-level).'
};
// ARCHIVE clones (deep history byte-identical across keys) are now a HARD FAIL,
// not a warning (statistical-rigor audit, 2026-07, CRIT-1): even when the live
// level is distinct, the cloned deep series feeds a WRONG 3-year trajectory,
// percentile, regime, spike and next-move band to every cut but the original
// (short-rib was told "near a 3-year low / easing" purely as a borrowed-series
// artifact). The uniqueness gate: no two ingredient keys may ship an identical
// deep series. The 2026-06-19 beef trio (ribeye ≡ beef-tenderloin ≡ short-rib)
// was resolved by WITHHOLDING the borrowed deep series for beef-tenderloin &
// short-rib (removed from data/cost-index-history.json) until each is vendored
// its own. Baseline is empty; any reintroduced clone fails CI.
const KNOWN_ARCHIVE_STALE_CLONES = {};

function unitOf(labels, k) {
  const e = labels[k];
  return (e && (e.unit_en || e.unit)) || null;
}

function build() {
  const hist = rd('data/cost-index-history.json');
  const labelsRaw = rd('data/cost-index-labels.json');
  const prox = rd('data/cost-index-proxies.json'); // registry-derived level provenance
  if (!hist || !hist.ingredients || !labelsRaw) {
    return { _doc: 'inputs missing', _version: 1, error: 'missing-inputs' };
  }
  const H = hist.ingredients;
  const labels = labelsRaw.labels || labelsRaw;
  const slugs = Object.keys(H).sort();
  const pIng = (prox && prox.ingredients) || {};

  // The CURRENT published level (data/cost-index.json) — used to tell a clone that
  // only the deep ARCHIVE is stale (live level is distinct & fine) from one where
  // the live level is ALSO cloned (truly broken). Latest history point per item.
  const live = (rd('data/cost-index.json') || {}).ingredients || {};
  function liveLatest(slug) {
    const r = live[slug]; if (!r) return null;
    const h = r.history || r.points; if (!Array.isArray(h) || !h.length) return null;
    const p = h[h.length - 1];
    return p.valueCents != null ? p.valueCents : (p.priceUsd != null ? Math.round(p.priceUsd * 100) : null);
  }
  // Are the members' current published levels distinct (i.e. live is NOT cloned)?
  function liveDistinct(members) {
    const vals = members.map(liveLatest).filter((v) => v != null);
    return vals.length === members.length && new Set(vals).size === members.length;
  }

  // Reconcile a structural clone (byte-identical history) against the registry's
  // LEVEL provenance AND the current published level: documented proxy (same
  // source), index-basis (no $-level), history-archive-stale (distinct sources,
  // archive cloned but LIVE level distinct → re-vendor the archive only), or a
  // true unexplained-bug (live level also cloned).
  function classifyClone(members) {
    const info = members.map((m) => pIng[m]).filter(Boolean);
    if (!info.length) return 'unclassified';
    if (info.every((i) => i.levelBasis === 'index')) return 'index-no-level';
    const keys = new Set(info.map((i) => i.sourceKey));
    if (keys.size === 1 && !keys.has(null)) return 'documented-proxy';
    if (info.some((i) => i.levelBasis === 'wholesale') && keys.size > 1) {
      return liveDistinct(members) ? 'history-archive-stale' : 'unexplained-bug';
    }
    return 'mixed';
  }

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
      const classification = classifyClone(members);
      const NOTE = {
        'documented-proxy': 'identical series, and the registry draws all members from one source — an expected proxy; collapse to one for independence.',
        'index-no-level': 'identical series, but these are index-basis (directional) — no $-level should be published anyway.',
        'history-archive-stale': 'the deep ARCHIVE is a clone of another series, but the CURRENT published level is distinct and fine — only the deep history needs re-vendoring (affects backtest/drift/seasonality; plate-cost-drift already collapses it). Not live-facing.',
        'unexplained-bug': 'identical series AND the current published level is also cloned — the registry maps these to DISTINCT sources, so this is a real live-facing data bug to fix upstream.',
        'mixed': 'identical series across mixed provenance — review.',
        'unclassified': 'identical series; no registry provenance found.'
      };
      return {
        members,
        classification,
        lastCents: H[members[0]].slice(-1)[0].valueCents,
        liveLevels: members.reduce((m, s) => { m[s] = liveLatest(s); return m; }, {}),
        points: H[members[0]].length,
        note: NOTE[classification]
      };
    })
    .sort((a, b) => a.members[0].localeCompare(b.members[0]));

  // ---- 2. implausible lb-labeled levels ----
  const implausibleLevels = [];
  for (const k of slugs) {
    if (unitOf(labels, k) !== 'lb') continue;
    const usd = H[k].slice(-1)[0].valueCents / 100;
    if (usd < LB_BAND[0] || usd > LB_BAND[1]) {
      const lb = pIng[k] && pIng[k].levelBasis;
      implausibleLevels.push({
        slug: k, unit: 'lb', lastUsd: round(usd, 2), band: LB_BAND,
        registryLevelBasis: lb || null,
        note: lb === 'index'
          ? 'latest level outside the plausible per-lb band AND the registry source is index/directional — no dollar level should be published (a PPI index value carried as a cents level).'
          : 'latest level outside the plausible per-lb band — likely a non-lb basis mislabeled.'
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
  const clonesByClass = clones.reduce((m, c) => { m[c.classification] = (m[c.classification] || 0) + 1; return m; }, {});
  return {
    _doc: 'Critical data-quality audit of the Cost Index deep history (data/cost-index-history.json), reconciled against registry LEVEL provenance (data/cost-index-proxies.json) AND the current published level (data/cost-index.json). Clone clusters (byte-identical archive series) are CLASSIFIED as documented-proxy (same registry source — expected), index-no-level (directional), history-archive-stale (distinct sources, archive cloned but the LIVE level is distinct & fine → re-vendor the archive only; not live-facing), or unexplained-bug (live level ALSO cloned — a real live-facing bug). Also: implausible per-lb levels vs an expert-grounded band, and index levels deviating >2x/<0.5x from a USDA/CME reference. Bands/refs grounded in data/sourced-claims.json #usda_wholesale_protein_oil_refs_2026. Surfacing report for UPSTREAM triage; --check keeps it in lockstep. Deterministic. Built by scripts/build-cost-index-audit.mjs.',
    _version: 1,
    source: { history: 'data/cost-index-history.json', labels: 'data/cost-index-labels.json', proxies: 'data/cost-index-proxies.json', live: 'data/cost-index.json' },
    grounding: 'data/sourced-claims.json#usda_wholesale_protein_oil_refs_2026',
    asOf: hist.generatedAt || null,
    lbBand: LB_BAND,
    summary: {
      ingredientsScanned: slugs.length,
      cloneClusters: clones.length,
      clonedIngredients,
      clonesByClass,
      unexplainedBugs: clonesByClass['unexplained-bug'] || 0,
      archiveStale: clonesByClass['history-archive-stale'] || 0,
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

  if (process.argv.includes('--gate')) {
    if (report.error) { console.error('✗ cost-index quality gate: inputs missing'); process.exit(1); }
    const cloneKey = (c) => c.members.join('|');
    const bugs = report.clones.filter((c) => c.classification === 'unexplained-bug');
    const stale = report.clones.filter((c) => c.classification === 'history-archive-stale');
    const newBugs = bugs.filter((c) => !KNOWN_UNEXPLAINED_CLONES[cloneKey(c)]);
    const newImpl = report.implausibleLevels.filter((x) => !KNOWN_IMPLAUSIBLE_LEVELS[x.slug]);
    const newStale = stale.filter((c) => !KNOWN_ARCHIVE_STALE_CLONES[cloneKey(c)]);

    // Warn on baseline entries that no longer appear (fixed upstream — prune them).
    const presentBugs = new Set(bugs.map(cloneKey));
    const presentImpl = new Set(report.implausibleLevels.map((x) => x.slug));
    const presentStale = new Set(stale.map(cloneKey));
    Object.keys(KNOWN_UNEXPLAINED_CLONES).filter((k) => !presentBugs.has(k))
      .forEach((k) => console.log('  ⚠ baseline clone resolved — prune KNOWN_UNEXPLAINED_CLONES: ' + k));
    Object.keys(KNOWN_ARCHIVE_STALE_CLONES).filter((k) => !presentStale.has(k))
      .forEach((k) => console.log('  ⚠ baseline archive-stale resolved — prune KNOWN_ARCHIVE_STALE_CLONES: ' + k));
    Object.keys(KNOWN_IMPLAUSIBLE_LEVELS).filter((k) => !presentImpl.has(k))
      .forEach((k) => console.log('  ⚠ baseline level resolved — prune KNOWN_IMPLAUSIBLE_LEVELS: ' + k));

    // Uniqueness gate (CRIT-1): a cloned deep series is a hard fail regardless of
    // whether the live level is distinct — the archive drives forward claims.
    if (newBugs.length || newImpl.length || newStale.length) {
      newBugs.forEach((c) => console.error('  ✗ NEW live-facing clone (current level also cloned): [' + c.members.join(', ') + ']'));
      newStale.forEach((c) => console.error('  ✗ NEW cloned deep series (identical archive across keys — withhold or re-vendor): [' + c.members.join(', ') + ']'));
      newImpl.forEach((x) => console.error('  ✗ NEW implausible per-lb level: ' + x.slug + ' $' + x.lastUsd));
      console.error('✗ cost-index quality gate: FAIL — data defect(s) beyond the documented baseline.');
      process.exit(1);
    }
    console.log(`✓ cost-index quality gate: OK — ${presentBugs.size} live-facing clone bug(s), ${presentStale.size} archive-stale, ${presentImpl.size} known implausible level(s).`);
    return;
  }

  if (process.argv.includes('--self-test')) {
    const s = report.summary || {};
    const checks = [
      ['inputs present', !report.error],
      ['clone clusters have >=2 members', report.clones.every((c) => c.members.length >= 2)],
      ['every clone is classified', report.clones.every((c) => typeof c.classification === 'string' && c.classification.length > 0)],
      ['archive-stale clones have distinct live levels', report.clones.filter((c) => c.classification === 'history-archive-stale').every((c) => { const v = c.members.map((m) => c.liveLevels[m]).filter((x) => x != null); return v.length === c.members.length && new Set(v).size === c.members.length; })],
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
  console.log(`cost-index-audit: ${s.cloneClusters} clone cluster(s) [${s.unexplainedBugs} unexplained bug(s)], ${s.implausibleLevels} implausible level(s), ${s.referenceDeviations} reference deviation(s) across ${s.ingredientsScanned} ingredient(s).`);
}

main();
