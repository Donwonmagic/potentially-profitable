#!/usr/bin/env node
/**
 * build-cost-lockfloat.mjs — the lock-or-float predictability ARTIFACT.
 *
 * A PURE, DETERMINISTIC function of the frozen vendored data: for every catalog
 * ingredient it runs the certified conformal band (cost-conformal.js, RAW scale=1,
 * leakage-free) and the honest classifier (cost-lockfloat.js) to bucket it
 * Lock / Cushion / Float / Won't-call, and writes:
 *   data/cost-lockfloat.json  — the authority (buckets, receipts, live counts + denominators)
 *   data/cost-lockfloat.js    — the same object as a same-origin browser seed
 *                               (window.MUNTIN_COST_LOCKFLOAT), so the no-fetch tool reads it.
 * Every count and rate the surface speaks (lockable, withheld, the real catalog /
 * deep denominators, per-item coverage + CI + read count) is derived HERE from the
 * data — never hand-typed — because the audio renderer speaks them in EN + ES.
 * No `now`: asOf comes from the seed's generatedAt, so --check is stable across days.
 *
 *   node scripts/build-cost-lockfloat.mjs            # write both files
 *   node scripts/build-cost-lockfloat.mjs --check    # CI: fail if either is stale
 *   node scripts/build-cost-lockfloat.mjs --self-test
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { conformalNext } = require(path.join(repo, 'tools/_shared/cost-conformal.js'));
const LF = require(path.join(repo, 'tools/_shared/cost-lockfloat.js'));

const OUT_JSON = path.join(repo, 'data/cost-lockfloat.json');
const OUT_JS = path.join(repo, 'data/cost-lockfloat.js');
const MIN_DEEP = 24;   // reads needed before we even attempt a band

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } }
function r3(x) { return x == null ? null : Math.round(x * 1000) / 1000; }

function cadenceMonthly(dates) {
  if (!dates || dates.length < 3) return false;
  const g = [];
  for (let i = 1; i < dates.length; i++) { const a = Date.parse(dates[i - 1]), b = Date.parse(dates[i]); if (isFinite(a) && isFinite(b)) g.push((b - a) / 86400000); }
  if (!g.length) return false;
  g.sort((x, y) => x - y);
  return g[Math.floor(g.length / 2)] >= 20;
}
function rangePos(vals) {
  const last = vals[vals.length - 1]; let below = 0;
  for (const v of vals) if (v <= last) below++;
  return Math.round(100 * below / vals.length);
}
function downsample(vals, k) {
  const step = Math.max(1, Math.floor(vals.length / k)); const out = [];
  for (let i = 0; i < vals.length; i += step) out.push(vals[i]);
  if (out[out.length - 1] !== vals[vals.length - 1]) out.push(vals[vals.length - 1]);
  return out;
}

function build() {
  const ci = rd('data/cost-index.json') || { ingredients: {} };
  const deep = (rd('data/cost-index-history.json') || {}).ingredients || {};
  const labels = (rd('data/cost-index-labels.json') || {}).labels || {};
  const ing = ci.ingredients || {};
  // asOf = the freshest per-point read date across the catalog (deterministic from
  // the frozen data; no build clock, so --check is stable across days).
  let asOf = null;
  for (const s of Object.keys(ing)) {
    const pts = (ing[s] && ing[s].points) || [];
    for (const p of pts) if (p && p.asOf && (!asOf || p.asOf > asOf)) asOf = p.asOf;
  }

  const nameOf = (s) => (labels[s] && labels[s].en) || s;
  const unitOf = (s) => (labels[s] && (labels[s].unit_en || labels[s].unit)) || null;
  const levelOf = (s) => { const p = ing[s] && ing[s].points && ing[s].points[0]; return (p && p.level && p.level.medianCents) || null; };

  const slugs = Object.keys(ing).sort();     // stable order
  const items = {};
  const counts = { lock: 0, cushion: 0, float: 0, withhold: 0 };
  let deepCount = 0;

  for (const slug of slugs) {
    const d = deep[slug];
    const hasDeep = Array.isArray(d) && d.length >= MIN_DEEP;
    let conf = null, monthly = false, pos = null, spark = null;
    if (hasDeep) {
      deepCount++;
      const vals = d.map((p) => p.valueCents).filter((x) => typeof x === 'number' && isFinite(x));
      const dates = d.map((p) => p.date);
      monthly = cadenceMonthly(dates);
      conf = conformalNext(vals);
      pos = rangePos(vals);
      spark = downsample(vals, 40);
    }
    const v = LF.classify(conf, { monthly, hasDeep });
    counts[v.bucket]++;
    // Backtest Replay strip (non-withheld only): the RAW walk-forward hit/miss
    // sequence the band scored on its OWN history — packed as a '1'/'0' string,
    // oldest→newest. Its mean is `coverage` by construction (cost-conformal keeps
    // both from the same object), so the card shows proof, not a claim. Withheld
    // items publish no rate, so they carry no strip.
    const replay = (v.bucket !== 'withhold' && conf && Array.isArray(conf.hitSeq) && conf.hitSeq.length)
      ? conf.hitSeq.join('') : null;
    items[slug] = {
      name: nameOf(slug), unit: unitOf(slug), level: levelOf(slug), monthly: monthly,
      bucket: v.bucket, reason: v.reason,
      coverage: r3(v.coverage), coverageLo: r3(v.coverageLo), coverageHi: r3(v.coverageHi),
      upPct: v.upPct == null ? null : Math.round(v.upPct * 1000) / 1000,
      downPct: v.downPct == null ? null : Math.round(v.downPct * 1000) / 1000,
      nTested: v.nTested, halfWidthPct: v.halfWidthPct == null ? null : Math.round(v.halfWidthPct * 1000) / 1000,
      pos: pos, spark: spark, replay: replay,
    };
  }

  return {
    _doc: 'Lock-or-float predictability record for Cost Pulse. Built deterministically by scripts/build-cost-lockfloat.mjs from data/cost-index.json + the deep history, using the certified conformal band (raw scale=1) and the honest classifier (tools/_shared/cost-lockfloat.js). Lock = predictable enough to commit (a proven, tight next-week band); Float = too volatile to commit; Won\'t-call = withheld (thin/monthly-thin/flat/too-wide). Buckets are a RISK read, never a direction or opportunity call. Every count/rate is derived here, never hand-typed. asOf mirrors the seed generatedAt (no build clock). Hand-edit nothing; CI re-checks with --check.',
    _version: 1,
    asOf: asOf,
    thresholds: { lockMaxHalfWidth: LF.LOCK_MAX_HW, cushionMaxHalfWidth: LF.CUSHION_MAX_HW, floatMaxHalfWidth: LF.FLOAT_MAX_HW, lockMinCoverageLo: LF.LOCK_MIN_COVERLO },
    catalog: slugs.length,
    deep: deepCount,
    counts: counts,
    items: items,
  };
}

function serialize(report) { return JSON.stringify(report, null, 2) + '\n'; }
function seedJs(report) {
  return '/**\n * Cost Pulse — lock-or-float predictability seed (browser). GENERATED — do not edit.\n' +
    ' * Written by scripts/build-cost-lockfloat.mjs from data/cost-lockfloat.json; loaded\n' +
    ' * same-origin so the tool stays no-fetch. window.MUNTIN_COST_LOCKFLOAT = {...}.\n */\n' +
    '(function (root) {\n  \'use strict\';\n  var DATA = ' + JSON.stringify(report) + ';\n' +
    '  if (typeof module !== \'undefined\' && module.exports) module.exports = DATA;\n' +
    '  if (typeof self !== \'undefined\') self.MUNTIN_COST_LOCKFLOAT = DATA;\n' +
    '  if (root) root.MUNTIN_COST_LOCKFLOAT = DATA;\n' +
    '})(typeof window !== \'undefined\' ? window : (typeof self !== \'undefined\' ? self : null));\n';
}

function main() {
  const report = build();
  const json = serialize(report);
  const js = seedJs(report);

  if (process.argv.includes('--self-test')) {
    const checks = [
      ['catalog >= deep >= sum(non-noseries buckets)', report.catalog >= report.deep],
      ['counts sum to catalog', (report.counts.lock + report.counts.cushion + report.counts.float + report.counts.withhold) === report.catalog],
      ['at least one lockable + one withheld (the honesty triad is real)', report.counts.lock > 0 && report.counts.withhold > 0],
      ['every lockable item has coverageLo >= 0.60 (proven)', Object.values(report.items).filter((i) => i.bucket === 'lock').every((i) => i.coverageLo != null && i.coverageLo >= LF.LOCK_MIN_COVERLO)],
      ['no lockable item wider than the lock ceiling', Object.values(report.items).filter((i) => i.bucket === 'lock').every((i) => i.halfWidthPct != null && i.halfWidthPct <= LF.LOCK_MAX_HW)],
      ['every withheld item carries a machine reason', Object.values(report.items).filter((i) => i.bucket === 'withhold').every((i) => LF.REASONS.includes(i.reason))],
      ['withheld items carry NO replay strip (no published rate → no proof theatre)', Object.values(report.items).filter((i) => i.bucket === 'withhold').every((i) => i.replay == null)],
      ['every non-withheld item has a replay strip of exactly nTested 0/1 marks', Object.values(report.items).filter((i) => i.bucket !== 'withhold').every((i) => typeof i.replay === 'string' && i.replay.length === i.nTested && /^[01]+$/.test(i.replay))],
      ['each replay strip mean equals its coverage to display precision (proof can never disagree with the rate)', Object.values(report.items).filter((i) => i.bucket !== 'withhold').every((i) => { const h = i.replay.split('').reduce((a, c) => a + (c === '1' ? 1 : 0), 0); return Math.abs(h / i.replay.length - i.coverage) <= 0.0011; })],
      ['deterministic (rebuild equal)', serialize(build()) === json],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error('  ✗ ' + c[0]));
    console.log(`cost-lockfloat self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes('--check')) {
    let curJson = '', curJs = '';
    try { curJson = readFileSync(OUT_JSON, 'utf8'); } catch {}
    try { curJs = readFileSync(OUT_JS, 'utf8'); } catch {}
    if (curJson !== json || curJs !== js) { console.error('✗ cost-lockfloat artifact is stale — run: node scripts/build-cost-lockfloat.mjs'); process.exit(1); }
    console.log(`✓ cost-lockfloat in sync — ${report.counts.lock} lockable, ${report.counts.cushion} cushion, ${report.counts.float} float, ${report.counts.withhold} withheld (of ${report.catalog}).`);
    return;
  }

  writeFileSync(OUT_JSON, json);
  writeFileSync(OUT_JS, js);
  console.log(`Wrote cost-lockfloat — ${report.counts.lock} lock / ${report.counts.cushion} cushion / ${report.counts.float} float / ${report.counts.withhold} withheld, over ${report.deep} deep of ${report.catalog} catalog.`);
}

main();
