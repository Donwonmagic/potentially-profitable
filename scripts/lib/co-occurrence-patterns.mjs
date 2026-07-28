/**
 * co-occurrence-patterns.mjs — the shared honesty regexes for the co-occurrence surfaces.
 *
 * Extracted from check-cost-index-events.mjs so the events gate AND the open-lane gate
 * (check-open-lane-honesty.mjs) enforce the SAME forecast/causation vocabulary. Both are
 * fail-CI: a documented event is only ever surfaced as co-occurrence beside a price window,
 * never as a cause, and no surface speaks a forecast.
 */

// Prediction phrasing that must never appear in a documented-event account or a render.
export const FORECAST_RE = [
  /\bforecast(s|ed|ing)?\b/i, /\bprojected\b/i, /\bexpected?\s+to\b/i,
  /\bwe\s+(expect|predict|forecast)\b/i, /\bgoing\s+to\s+(rise|fall|climb|drop)\b/i,
  /\bwill\s+(rise|fall|climb|drop|increase|decrease|likely|continue|keep)\b/i,
  /\bnext\s+(year|month|season|quarter)\b/i, /\blikely\s+to\s+(rise|fall|climb|drop)\b/i,
];
export function forecastHit(text) { const t = String(text || ''); for (const re of FORECAST_RE) { const m = t.match(re); if (m) return m[0]; } return null; }

// Causation asserted between a documented event and a PRICE move — the one thing the
// co-occurrence surface must never do. Scoped tight so ordinary event prose ("the virus
// caused illness") doesn't trip it: only event→price causal links are flagged.
export const CAUSAL_RE = [
  /\bcaused\s+(the\s+)?(price|prices|spike|jump|move|surge|increase)\b/i,
  /\bbecause\s+(of\s+)?(the\s+)?(price|prices)\b/i,
  /\bdrove\s+(the\s+)?prices?\b/i,
  /\bprices?\s+(rose|jumped|spiked|climbed|fell)\s+because\b/i,
  /\bthe\s+cause\s+of\s+(the\s+)?(price|move|spike)\b/i,
];
export function causalHit(text) { const t = String(text || ''); for (const re of CAUSAL_RE) { const m = t.match(re); if (m) return m[0]; } return null; }
