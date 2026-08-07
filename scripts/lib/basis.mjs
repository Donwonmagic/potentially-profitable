/**
 * basis.mjs — the single source of truth for what a BASIS is and which SOURCES
 * can back a dollar figure. Imported by both the renderer
 * (scripts/build-cost-index-pages.mjs) and the gate
 * (scripts/check-cost-index-basis-leak.mjs) so the two cannot drift.
 *
 * WHY THIS FILE EXISTS (2026-08-07). check-cost-index-basis-leak.mjs passed
 * green for weeks while cost-index/feed.json published:
 *
 *     ground-beef  reference.priceUsd = 393.06  source = "bls"  basis = "wholesale"
 *
 * against cost-index/index.json's $5.51/lb for the same slug — 71x apart. The
 * $393.06 is the BLS ground-beef INDEX value, and data/cost-index.json labels it
 * correctly at the observation it lives on:
 *
 *     ingredients["ground-beef"].points[1].history[4]
 *       = { date: "2026-06-01", valueCents: 39306, source: "bls", basis: "index" }
 *
 * The basis was never missing. It was DISCARDED at render: mergedSeries() in
 * build-cost-index-pages.mjs carries each observation's own basis, but
 * seriesJson() drops it and stamps the whole file with points[0].level.basis
 * ("wholesale"). The old gate then cross-referenced at the INGREDIENT level —
 * "does this slug have a dollar-basis newest level in the source?" — and
 * ground-beef does (a real usda-lmr $5.51 wholesale level at points[0]). So a
 * true statement about the INGREDIENT waved through a false statement about the
 * OBSERVATION.
 *
 * THE RULE THIS FILE ENCODES: a basis is a property of an OBSERVATION, not of a
 * series, a file header, or an ingredient. Every rendered dollar figure resolves
 * to exactly one observation, and that observation's own basis decides whether a
 * dollar sign is honest.
 */

/** Bases that denote an actual price in money-per-unit. */
export const DOLLAR_BASES = Object.freeze(['delivered', 'wholesale', 'retail']);

/**
 * Bases that denote a unitless or non-price quantity. An index point, a
 * farm-gate receipt, a customs unit value: each is a NUMBER, none is a PRICE a
 * reader can pay. Rendering any of them behind a `$` is the leak.
 */
export const NON_DOLLAR_BASES = Object.freeze(['index', 'farm-gate', 'customs', 'ex-vessel-index']);

export const isDollarBasis = (b) => DOLLAR_BASES.indexOf(b) >= 0;

/**
 * SOURCE -> whether that source can ever back a dollar LEVEL.
 *
 * Grounded in data/cost-index-sources.json's own `_doc`, which states the
 * mapping verbatim: "ams=wholesale level, noaa=wholesale (ex-vessel) level,
 * fred=level or index per its 'basis', bls=index (trend-only)".
 *
 * `false` here is a hard claim: no observation from this source may render as a
 * dollar under any label. `null` means basis-bearing — the observation's own
 * basis field decides, because the source publishes both kinds.
 */
export const SOURCE_CAN_BACK_DOLLARS = Object.freeze({
  'bls': false,            // index series only, per cost-index-sources.json _doc
  'fred': null,            // per-series `basis`; FRED publishes both levels and indices
  'noaa': null,            // ex-vessel levels AND import unit-values (index)
  'usda-lmr': true,
  'usda-ams': true,
  'usda-ams-national': true,
  'usda-ams-atlanta': true,
  'usda-ams-baltimore': true,
  'usda-ams-boston': true,
  'usda-ams-chicago': true,
  'usda-ams-los-angeles': true,
  'eia': true,             // diesel $/gal is a real level
});

/**
 * Verdict for one observation's source key.
 *   'forbidden' — this source can never back a $ (bls).
 *   'basis-bearing' — trust the observation's own basis field.
 *   'ok' — this source publishes dollar levels.
 *   'unknown' — a source key not in the registry. Fail-closed: an unregistered
 *               source is treated as basis-bearing and, absent a basis, refused.
 */
export function sourceVerdict(source) {
  if (source == null || source === '') return 'unattributed';
  if (!(source in SOURCE_CAN_BACK_DOLLARS)) return 'unknown';
  const v = SOURCE_CAN_BACK_DOLLARS[source];
  if (v === false) return 'forbidden';
  if (v === null) return 'basis-bearing';
  return 'ok';
}

/**
 * THE RENDER PREDICATE. The one function the builder calls before printing an
 * observation into a `price_usd` column or a `priceUsd` field, and the one the
 * gate calls to judge what was printed. Symmetric by construction.
 *
 * @param {{basis?:string|null, source?:string|null, reconstructed?:boolean}} obs
 * @param {string|null} seriesBasis  the series' declared basis, used ONLY when
 *        the observation carries none (a reconstructed backfill point inherits).
 * @returns {{ ok:boolean, why:string }}
 */
export function mayRenderAsDollars(obs, seriesBasis = null) {
  const src = obs && obs.source;
  const sv = sourceVerdict(src);
  if (sv === 'forbidden') {
    return { ok: false, why: `source="${src}" publishes an index, never a price level (cost-index-sources.json _doc: "bls=index (trend-only)")` };
  }
  const own = obs && obs.basis != null ? obs.basis : null;
  const eff = own != null ? own : seriesBasis;
  if (eff == null) {
    // No basis anywhere. A reconstructed backfill point with no source and no
    // basis inherits nothing, so refuse rather than assume dollars.
    return { ok: false, why: 'no basis on the observation and none on the series — refusing to assume a dollar basis' };
  }
  if (!isDollarBasis(eff)) {
    return { ok: false, why: `observation basis="${eff}" is not a dollar basis${own == null ? ' (inherited from the series)' : ''}` };
  }
  if (sv === 'unknown') {
    return { ok: false, why: `source="${src}" is not in SOURCE_CAN_BACK_DOLLARS — fail-closed until registered` };
  }
  return { ok: true, why: '' };
}

/**
 * MAGNITUDE COHERENCE — the source-independent rail.
 *
 * The ground-beef leak was legible without reading a single basis field: one
 * series carried 3.86 and 393.06 in the same `price_usd` column, same unit
 * ("lb"), same declared basis. No commodity moves 100x inside its own series.
 * This rail exists so a leak survives the loss of its provenance: if a future
 * fetch writes an index value with `source: null` and no basis, the numbers
 * still give it away.
 *
 * FACTOR is deliberately loose (20x). Real commodity ranges inside one series
 * are well under 10x even across a multi-year backfill; an index-vs-price
 * confusion is 50-100x. The gap between those two regimes is the whole margin,
 * and a loose threshold buys zero false positives.
 */
export const MAGNITUDE_FACTOR = 20;

export function median(values) {
  const v = values.filter((x) => typeof x === 'number' && isFinite(x) && x > 0).slice().sort((a, b) => a - b);
  if (!v.length) return null;
  return v.length % 2 ? v[(v.length - 1) / 2] : (v[v.length / 2 - 1] + v[v.length / 2]) / 2;
}

/**
 * @param {number[]} values a series' rendered dollar figures
 * @returns {{ median:number, outliers:number[] }} values >= FACTOR x median or <= median / FACTOR
 */
export function magnitudeOutliers(values) {
  const m = median(values);
  if (!m) return { median: null, outliers: [] };
  const v = values.filter((x) => typeof x === 'number' && isFinite(x) && x > 0);
  if (v.length < 3) return { median: null, outliers: [] };
  return { median: m, outliers: v.filter((x) => x >= m * MAGNITUDE_FACTOR || x <= m / MAGNITUDE_FACTOR) };
}

/**
 * REGIME BREAK — rail 3, corrected 2026-08-07.
 *
 * The first cut of this rail pooled every observation in a series and flagged
 * anything 20x from the pooled median. That produced five findings, and only ONE
 * was a basis leak: watermelon, eggplant, short-rib and serrano-pepper all
 * flagged because their 2001-2020 RECONSTRUCTED backfill disperses far more
 * widely than their live capture. Two populations were pooled, so the statistic
 * described neither. Per the repo rule — fix the cause, do not tolerate the
 * noise — the rail now compares the two populations to EACH OTHER.
 *
 * That is also the sharper test for the actual leak. Ground-beef's reconstructed
 * points sit at $3.86-$4.19/lb; its live points at $368-$393. A 94x step at the
 * seam between backfill and live capture is not a market event, it is a unit or
 * basis change smuggled in by a fetch — precisely the ground-beef signature, and
 * it fires even if every provenance field were blank.
 *
 * @returns {{break:boolean, liveMedian:number|null, reconMedian:number|null, factor:number|null}}
 */
export function regimeBreak(liveValues, reconValues) {
  const lm = median(liveValues), rm = median(reconValues);
  if (!lm || !rm || liveValues.length < 2 || reconValues.length < 2) {
    return { break: false, liveMedian: lm, reconMedian: rm, factor: null };
  }
  const factor = lm > rm ? lm / rm : rm / lm;
  return { break: factor >= MAGNITUDE_FACTOR, liveMedian: lm, reconMedian: rm, factor: +factor.toFixed(1) };
}
