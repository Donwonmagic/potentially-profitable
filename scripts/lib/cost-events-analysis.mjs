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
