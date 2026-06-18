#!/usr/bin/env node
/**
 * build-cost-confidence-shadow.mjs — Landing A of the calibrated confidence score.
 *
 * Computes the continuous confidence SCORE (tools/_shared/cost-confidence-score.js) for every
 * ingredient and reports, per item, the CURRENT published label vs the PROPOSED calibrated
 * label — plus the realized reliability of the proposed tiers and the decisive binary-split
 * evidence (do high-score items verify more often than low-score ones?). It changes NO
 * published label: it is the shadow diff a human reviews before any live re-label (Landing B).
 *
 * Composes the existing modules (typeCount, stalenessOf, conformalNext, reliabilityCurve,
 * calibrationCeiling) — changes none of them, so it's parity-safe and safe to auto-merge.
 * Pure & deterministic (no `now`); --self-test + --check, mirroring the calibration report.
 *
 *   node scripts/build-cost-confidence-shadow.mjs            # write the shadow report
 *   node scripts/build-cost-confidence-shadow.mjs --check    # CI: fail if stale
 *   node scripts/build-cost-confidence-shadow.mjs --self-test
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const Score = require(path.join(repo, "tools/_shared/cost-confidence-score.js"));
const { conformalNext } = require(path.join(repo, "tools/_shared/cost-conformal.js"));
const { reliabilityCurve } = require(path.join(repo, "tools/_shared/cost-reliability.js"));
const { stalenessOf } = require(path.join(repo, "tools/_shared/cost-staleness.js"));
const Cal = require(path.join(repo, "scripts/check-cost-index-calibration.mjs"));

const OUT = path.join(repo, "data/cost-confidence-shadow.json");
const PUBLIC_OUT = path.join(repo, "cost-index/confidence-shadow.json");
const ALPHA = 0.2, WINDOW = 52, MIN_STEPS = 12;
const r3 = (x) => Math.round(x * 1000) / 1000;

function rd(p) { try { return JSON.parse(readFileSync(path.join(repo, p), "utf8")); } catch { return null; } }
function seriesFor(key, deep, ci) {
  const d = deep && deep.ingredients && deep.ingredients[key];
  if (Array.isArray(d) && d.length >= 14) return d.map((p) => p.valueCents).filter((x) => typeof x === "number");
  const v = ci && ci.ingredients && ci.ingredients[key];
  const h = (v && v.history) || (v && v.points && v.points[0] && v.points[0].history) || [];
  return h.map((p) => p.valueCents).filter((x) => typeof x === "number");
}

function build() {
  const ci = rd("data/cost-index.json"), deep = rd("data/cost-index-history.json");
  const keys = ci && ci.ingredients ? Object.keys(ci.ingredients).sort() : [];

  // Per-ingredient score + realized trend stats.
  const rows = [];
  for (const key of keys) {
    const e = ci.ingredients[key];
    const point = e && Array.isArray(e.points) && e.points[0];
    if (!point || !point.confidence) continue;
    const history = Array.isArray(e.history) ? e.history : [];
    const series = seriesFor(key, deep, ci);
    const cov = conformalNext(series, { alpha: ALPHA, window: WINDOW, calibrate: true });
    const rel = reliabilityCurve(series);
    const st = stalenessOf(point, {});
    const sc = Score.scoreOf({
      indepTypes: Cal.typeCount(point, "level"),
      agreement: point.trend && typeof point.trend.agreement === "number" ? point.trend.agreement : 0,
      freshnessRatio: st ? st.ratio : null,
      ownCoverage: cov && cov.coverage != null ? cov.coverage : 0,
    });
    const ceilingRank = Cal.calibrationCeiling(point, history);
    rows.push({
      key,
      currentLabel: point.confidence,
      S: sc.S,
      parts: sc.parts,
      ceiling: Cal.NAME[ceilingRank],
      ceilingRank,
      // realized trend stats (for cut derivation + binary split); null when too short
      n: rel ? rel.n : 0,
      hits: rel ? rel.hits : 0,
      up: rel ? rel.up : 0,
      down: rel ? rel.down : 0,
    });
  }

  // Derive cuts from the backtestable items, then propose a calibrated label per item.
  const samples = rows.filter((r) => r.n >= 1).map((r) => ({ S: r.S, hits: r.hits, n: r.n }));
  const derived = Score.deriveCuts(samples, { minItems: 4, tol: 0.07 });
  const ingredients = rows.map((r) => {
    const proposed = Score.calibratedConfidence(r.S, derived.cuts, r.ceilingRank);
    return {
      key: r.key, currentLabel: r.currentLabel, proposedLabel: proposed,
      changed: proposed !== r.currentLabel, S: r.S, parts: r.parts, ceiling: r.ceiling,
    };
  });

  // Decisive evidence: split backtestable items at the median score; do high-S items verify more?
  const scoreable = rows.filter((r) => r.n >= 1).sort((a, b) => a.S - b.S);
  const Ss = scoreable.map((r) => r.S);
  const medianS = Ss.length ? Score.quantile(Ss.slice().sort((a, b) => a - b), 0.5) : null;
  function pool(items) {
    let n = 0, hits = 0, up = 0, down = 0;
    items.forEach((r) => { n += r.n; hits += r.hits; up += r.up; down += r.down; });
    return { items: items.length, calls: n, hitRate: n >= MIN_STEPS ? r3(hits / n) : null, baseline: up + down ? r3(Math.max(up, down) / (up + down)) : null };
  }
  const lower = pool(scoreable.filter((r) => r.S < medianS));
  const upper = pool(scoreable.filter((r) => r.S >= medianS));
  const separates = lower.hitRate != null && upper.hitRate != null ? upper.hitRate - lower.hitRate : null;

  const occupied = derived.tiers.filter((t) => t.items > 0);
  const topTier = occupied.length ? occupied[occupied.length - 1] : null;
  const pooledBaseline = pool(scoreable).baseline;

  return {
    _doc: "SHADOW report for the calibrated confidence score (Landing A) — changes NO published label. Per ingredient: current vs proposed label, the continuous score S and its parts. Plus the realized reliability of the derived tiers and a median-split test (do higher-score items verify more often?). The proposed label uses DERIVED cuts (which collapse to fewer tiers when the data can't support four) and is hard-capped by the calibration ceiling. Built by scripts/build-cost-confidence-shadow.mjs; reads the shared modules, changes none; deterministic; CI re-checks with --check. Review the binary split + tier monotonicity before any live re-label (Landing B).",
    _version: 1,
    weights: Score.DEFAULT_WEIGHTS,
    derivedCuts: derived.cuts,
    proposedTiers: derived.tiers,
    monotone: derived.monotone,
    binarySplit: { medianScore: medianS == null ? null : r3(medianS), lower, upper, separation: separates == null ? null : r3(separates) },
    verdict: {
      scoreSeparatesSkill: separates == null ? null : separates > 0.03,
      readyForLandingB:
        derived.monotone === true && occupied.length >= 2 &&
        topTier != null && topTier.hitRate != null && pooledBaseline != null && topTier.hitRate >= pooledBaseline &&
        separates != null && separates > 0.03,
      note: "readyForLandingB=false means keep current labels live and revisit when more vendored history accrues; the shadow report itself is the deliverable.",
    },
    changedCount: ingredients.filter((i) => i.changed).length,
    ingredients,
  };
}

function main() {
  const report = build();
  const json = JSON.stringify(report, null, 2) + "\n";

  if (process.argv.includes("--self-test")) {
    const checks = [
      ["every S in [0,1]", report.ingredients.every((i) => i.S >= 0 && i.S <= 1)],
      ["proposed labels are valid names", report.ingredients.every((i) => Score.NAME.includes(i.proposedLabel))],
      ["proposed never exceeds ceiling", report.ingredients.every((i) => Score.NAME.indexOf(i.proposedLabel) <= Score.NAME.indexOf(i.ceiling))],
      ["binary split present", report.binarySplit && "lower" in report.binarySplit && "upper" in report.binarySplit],
      ["derived tiers monotone (or honestly false)", typeof report.monotone === "boolean"],
      ["changedCount reconciles", report.changedCount === report.ingredients.filter((i) => i.changed).length],
      ["deterministic (rebuild equal)", JSON.stringify(build()) === JSON.stringify(report)],
    ];
    const failed = checks.filter((c) => !c[1]);
    failed.forEach((c) => console.error("  ✗ " + c[0]));
    console.log(`cost-confidence-shadow self-test: ${checks.length - failed.length}/${checks.length} passed.`);
    process.exit(failed.length ? 1 : 0);
  }

  if (process.argv.includes("--check")) {
    let cur = "", pub = "";
    try { cur = readFileSync(OUT, "utf8"); } catch {}
    try { pub = readFileSync(PUBLIC_OUT, "utf8"); } catch {}
    if (cur !== json || pub !== json) { console.error("✗ confidence shadow report is stale — run: node scripts/build-cost-confidence-shadow.mjs"); process.exit(1); }
    console.log("✓ confidence shadow report in sync (data/ + public copy).");
    return;
  }

  writeFileSync(OUT, json);
  writeFileSync(PUBLIC_OUT, json);
  const b = report.binarySplit, v = report.verdict;
  console.log(`Wrote confidence shadow — ${report.changedCount} label(s) would change; cuts ${JSON.stringify(report.derivedCuts)} (monotone ${report.monotone}).`);
  console.log(`  median-split: lower ${b.lower.hitRate} vs upper ${b.upper.hitRate} (sep ${b.separation}) → separatesSkill=${v.scoreSeparatesSkill}, readyForLandingB=${v.readyForLandingB}`);
}

main();
