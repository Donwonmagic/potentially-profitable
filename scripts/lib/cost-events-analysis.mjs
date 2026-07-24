/**
 * cost-events-analysis.mjs — the single, honest computation over the detected
 * price-events dataset, reused by every surface (the events explorer, the
 * per-event detail pages, the CC0 open-data downloads, and the "what moves
 * together" research page). One source of truth so no two surfaces can drift.
 *
 * Source: data/cost-index-events.json — biggest SUSTAINED moves off each
 * ingredient's own ±26-wk local normal, with a `cohort[]` of other slugs that
 * moved THE SAME WAY in the same ~6-week window (per the file's _doc).
 *
 * Honesty: everything here is arithmetic over a public-domain wholesale series.
 * Co-movement is CO-OCCURRENCE, never cause; the measure is DIRECTED and BOUNDED
 * ("in K of X's own N moves, Y co-moved") — never a global undirected pair count,
 * which would over-imply a relationship.
 */
import fs from 'node:fs';
import path from 'node:path';

export function loadEventsData(repoRoot) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-events.json'), 'utf8'));
}

/** Every detected event, tagged with its ingredient slug, newest-first-agnostic. */
export function flatEvents(data) {
  const out = [];
  for (const slug of Object.keys(data.items)) {
    for (const e of (data.items[slug].events || [])) out.push({ slug, ...e });
  }
  return out;
}

/**
 * Directed, bounded co-movement. For anchor X with N notable moves, K(Y) = the
 * count of X's OWN events in which Y appeared in the cohort. neighbors sorted by
 * K desc (tie: slug asc). Returns { [slug]: { n, neighbors: [[slug, k], …] } }.
 */
export function coMovement(data) {
  const anchors = {};
  for (const slug of Object.keys(data.items)) {
    const it = data.items[slug];
    const events = it.events || [];
    const n = it.eventCount || events.length;
    if (!n) continue;
    const counts = {};
    for (const e of events) {
      for (const y of (e.cohort || [])) {
        if (y === slug) continue;
        counts[y] = (counts[y] || 0) + 1;
      }
    }
    const neighbors = Object.keys(counts)
      .map((y) => [y, counts[y]])
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    anchors[slug] = { n, neighbors };
  }
  return anchors;
}

/** The "N% of shocks had company" headline stat — pure arithmetic, fact-gate clean. */
export function companyStat(data) {
  let total = 0, alone = 0, up = 0, down = 0;
  for (const slug of Object.keys(data.items)) {
    for (const e of (data.items[slug].events || [])) {
      total++;
      if (!e.cohort || !e.cohort.length) alone++;
      if (e.direction === 'up') up++; else down++;
    }
  }
  return { total, alone, withCompany: total - alone, up, down,
    pct: total ? Math.round((total - alone) / total * 100) : 0 };
}

/**
 * Permutation-null base rate for the "N% of shocks had company" headline (ADR-019).
 * The 94% headline reads as signal, but with 432 moves across 80 ingredients over ~24
 * years, ANY move is likely to have some other same-direction move within ±6 weeks just
 * by density. This computes the honest null: hold the multiset of (date, direction) moves
 * FIXED, shuffle which ingredient each belongs to (a seeded, deterministic permutation
 * that preserves each ingredient's move count), and recompute the "shared a same-direction
 * week with a DIFFERENT ingredient" fraction each shuffle. If the null ≈ the observed, the
 * headline is the norm, not the signal — the signal is WHICH ingredient co-moved, and why.
 *
 * This is the RIGHT null: it compares like population to like, using only the notable-move
 * set the corpus actually stores. It is NOT an all-week pairwise rate (that series does not
 * exist in the corpus and would be the wrong comparison). Co-occurrence, never cause.
 * Deterministic (seeded) so the rendered number is stable across builds.
 */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    let t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
export function coMovementBaseRate(data, opts = {}) {
  const seed = opts.seed == null ? 1234567 : opts.seed;
  const iters = opts.iters == null ? 500 : opts.iters;
  const cohortWeeks = (data.params && data.params.cohortWeeks) || 6;
  const COHORT_MS = cohortWeeks * 7 * 864e5;
  const moves = [];
  for (const slug of Object.keys(data.items)) for (const e of (data.items[slug].events || [])) {
    const t = Date.parse(e.date);
    if (Number.isFinite(t)) moves.push({ slug, t, dir: e.direction });
  }
  moves.sort((a, b) => a.t - b.t);
  const n = moves.length;
  // Neighbor indices within ±cohort window, SAME direction — fixed, independent of labels.
  const neighbors = new Array(n);
  for (let i = 0; i < n; i++) {
    const nb = [];
    for (let j = i - 1; j >= 0 && moves[i].t - moves[j].t <= COHORT_MS; j--) if (moves[j].dir === moves[i].dir) nb.push(j);
    for (let j = i + 1; j < n && moves[j].t - moves[i].t <= COHORT_MS; j++) if (moves[j].dir === moves[i].dir) nb.push(j);
    neighbors[i] = nb;
  }
  const withCompanyFrac = (labels) => {
    let w = 0;
    for (let i = 0; i < n; i++) { const nb = neighbors[i]; for (let k = 0; k < nb.length; k++) { if (labels[nb[k]] !== labels[i]) { w++; break; } } }
    return n ? w / n : 0;
  };
  const observed = withCompanyFrac(moves.map((m) => m.slug));
  const rng = mulberry32(seed);
  const perm = moves.map((m) => m.slug);
  let sum = 0, min = 1, max = 0;
  for (let it = 0; it < iters; it++) {
    for (let i = n - 1; i > 0; i--) { const k = Math.floor(rng() * (i + 1)); const tmp = perm[i]; perm[i] = perm[k]; perm[k] = tmp; }
    const f = withCompanyFrac(perm);
    sum += f; if (f < min) min = f; if (f > max) max = f;
  }
  return { total: n, observedPct: Math.round(observed * 100), basePct: Math.round(sum / iters * 100),
    baseLoPct: Math.round(min * 100), baseHiPct: Math.round(max * 100), iters };
}

/**
 * Recovery-time summary for the "how long do shocks last?" research page:
 * per ingredient (and overall) the median/quartile durationDays of its big
 * moves. Descriptive history — NEVER a forecast.
 */
export function durationSummary(data) {
  const all = flatEvents(data).map((e) => e.durationDays).filter((d) => d > 0).sort((a, b) => a - b);
  const q = (arr, p) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(p * (arr.length - 1)))] : 0);
  return { n: all.length, medianDays: q(all, 0.5), p25: q(all, 0.25), p75: q(all, 0.75), maxDays: all.length ? all[all.length - 1] : 0 };
}

/**
 * A magnitude is a seasonal pack/unit artifact suspicion when it dwarfs any
 * plausible price move (mirrors the yields SEA_ARTIFACT_CAP convention). The
 * true number is still shown; this only flags "read with care".
 */
export const SEA_ARTIFACT_CAP = 175;
export function isLikelyArtifact(pctFromNormal) {
  return Math.abs(pctFromNormal) > 1000; // an order beyond any real sustained wholesale move
}
