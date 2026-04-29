// ============================================================
// Phase 4 (Workshop) — Watch re-check dispatch.
// ============================================================
//
// Per-kind functions that re-run the underlying check against the
// saved payload's URL/query and return a fresh score. Called by the
// cron-driven scheduled() handler in src/worker.js.
//
// FIRST-PASS SCAFFOLD: every recheck function currently returns the
// score baked into the saved payload (i.e. it doesn't actually call
// the upstream API yet). That keeps the cron tick safe to run for
// observation without burning PSI / Places quota or sending surprise
// emails — the diff vs. lastScore will always be 0, so no email
// fires. When ops is ready to flip cron on for real, each TODO below
// gets replaced with the real upstream call. The scheduled() handler,
// the threshold logic, and the diff email all stay unchanged.
//
// Each recheck returns:
//   { ok: true,  score: <number 0..100 | null> }   — re-checked successfully
//   { ok: false, error: '<short tag>' }           — recheck failed; cron logs + skips
//
// A null score is legitimate (e.g. a Schema check with no foundTypes
// returns 0; a check that times out returns null with ok:true to
// distinguish "checked, no signal" from "couldn't check").

const KIND_LABELS = {
  audit:        { en: 'Restaurant audit',   es: 'Auditoría de restaurante' },
  seo:          { en: 'SEO check',          es: 'Revisión SEO' },
  gbp:          { en: 'GBP check',          es: 'Revisión de GBP' },
  mobile:       { en: 'Mobile check',       es: 'Revisión móvil' },
  schema:       { en: 'Schema check',       es: 'Revisión de schema' },
  speed:        { en: 'Speed test',         es: 'Prueba de velocidad' },
};

export function kindLabel(kind, locale) {
  const entry = KIND_LABELS[kind];
  if (!entry) return kind;
  const lang = (locale === 'es') ? 'es' : 'en';
  return entry[lang];
}

// Re-derive the score from the saved payload using the same shapes
// extractScoreFromPayload uses in src/lib/workbench.js. Imported by
// each recheck below as the "first-pass" return value.
function scoreFromSavedPayload(kind, payload) {
  if (!payload || typeof payload !== 'object') return null;
  switch (kind) {
    case 'audit':
      return numericOrNull(payload.score) || numericOrNull(payload.overall);
    case 'seo':
      return numericOrNull(payload.titleScore != null && payload.descScore != null
        ? Math.round((payload.titleScore + payload.descScore) / 2)
        : null);
    case 'speed':
      return numericOrNull(payload.score);
    case 'gbp':
      return numericOrNull(payload.chosen && payload.chosen.scaledScore);
    case 'mobile':
      return numericOrNull(payload.passCount != null && payload.failCount != null
        ? Math.round((payload.passCount / (payload.passCount + payload.failCount + (payload.unknownCount || 0))) * 100)
        : null);
    case 'schema':
      return numericOrNull((payload.foundTypes && payload.foundTypes.length) ? 100 : 0);
    default:
      return null;
  }
}

function numericOrNull(v) {
  return (typeof v === 'number' && isFinite(v)) ? v : null;
}

// ============================================================
// Per-kind recheck scaffolds. Each one is a no-op that returns the
// saved payload's score. Replace the TODO blocks with the real
// upstream calls when cron is flipped on.

export async function recheckAudit(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): re-run the restaurant-audit pipeline against
  // payload.auditedUrl (or payload.url). Pulls together PSI, Places,
  // schema, mobile, and crawl results into a single 0..100 score
  // identical to /tools/audits/restaurant's output. Likely the right
  // shape is a self-fetch to an internal `/api/audit-rerun` endpoint
  // (does not exist yet) so this function stays kind-agnostic about
  // upstream details.
  return { ok: true, score: scoreFromSavedPayload('audit', payload) };
}

export async function recheckSeo(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): fetch payload.url, parse <title> and
  // <meta name="description">, score via the same logic the
  // /tools/seo-grader/ tool uses. /api/seo-check is the existing
  // endpoint that does the title/desc fetch + grade.
  return { ok: true, score: scoreFromSavedPayload('seo', payload) };
}

export async function recheckGbp(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): re-resolve payload.chosen.placeId via Google
  // Places (env.GOOGLE_PLACES_KEY) and rescore. Uses the same
  // grader the /tools/gbp-grader/ tool uses; existing endpoints
  // /api/gbp-lookup and /api/gbp-details handle the fetch side.
  return { ok: true, score: scoreFromSavedPayload('gbp', payload) };
}

export async function recheckMobile(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): re-run mobile-check against payload.url. The
  // existing /api/mobile-check endpoint is the right call; sum the
  // pass/fail counts to derive the 0..100 score.
  return { ok: true, score: scoreFromSavedPayload('mobile', payload) };
}

export async function recheckSchema(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): fetch payload.url and run JSON-LD discovery
  // via /api/schema-check. Score is binary (100 if any structured
  // data found, 0 if not) — drift here usually means the operator
  // changed CMS or stripped tags, which is the most actionable
  // signal of all six watchable kinds.
  return { ok: true, score: scoreFromSavedPayload('schema', payload) };
}

export async function recheckSpeed(env, savedItem) {
  const payload = savedItem && savedItem.payload;
  // TODO(cron-flip): hit /api/psi (Google PageSpeed Insights) for
  // payload.url with the same mobile strategy the speed-test tool
  // uses. Rate-limit / quota considerations: a daily watch on a
  // single URL is one PSI call per day, well under quota; fan-out
  // happens at scale (many users × many watches) and is bounded by
  // the cron's batch-of-5 concurrency.
  return { ok: true, score: scoreFromSavedPayload('speed', payload) };
}

// Closed dispatch map. The scheduled() handler reads this to find
// the right recheck per watch row's kind. A kind not in this map
// gets skipped without an error (defensive — if ALLOWED_KINDS picks
// up a new watchable kind before this map is updated, the cron just
// no-ops on it instead of throwing).
export const RECHECK_BY_KIND = Object.freeze({
  audit:  recheckAudit,
  seo:    recheckSeo,
  gbp:    recheckGbp,
  mobile: recheckMobile,
  schema: recheckSchema,
  speed:  recheckSpeed,
});

// ============================================================
// Threshold logic — when does a re-check trigger an email?
// ============================================================
//
// Two conditions, evaluated against the OLD score (last cron tick
// or baseline) and the NEW score (this tick):
//
//   1. State change. For score-banded kinds (audit, seo, speed),
//      crossing a band edge (good ↔ warn ↔ bad) is always notify.
//   2. Magnitude. For all kinds, a delta of ≥3 points crosses the
//      "noise vs. signal" line. Three points is enough that an
//      operator opening their inbox sees a number worth opening.
//
// schema is special: any change between 0 and 100 counts (it's
// binary — went from "has structured data" to "doesn't" or back).
// mobile is similar: any change in the pass-ratio rounds to a
// notify since each row is meaningful.
//
// gbp is "any change to the scaled score" — Google reweights
// frequently in subtle ways, but we surface what we see.

const SCORE_DELTA_THRESHOLD = 3;

function band(score) {
  if (typeof score !== 'number' || !isFinite(score)) return 'unknown';
  if (score >= 80) return 'good';
  if (score >= 50) return 'warn';
  return 'bad';
}

export function shouldNotify(oldScore, newScore, kind) {
  // Both sides must be a real number to compute a delta. If either
  // is null/missing, treat it as "no signal" and skip — the next
  // tick can pick up the diff once both ends have a number.
  if (typeof oldScore !== 'number' || typeof newScore !== 'number') return false;
  if (!isFinite(oldScore) || !isFinite(newScore)) return false;
  if (oldScore === newScore) return false;

  // Per-kind sensitivity.
  switch (kind) {
    case 'schema':
    case 'mobile':
    case 'gbp':
      // Any change is signal.
      return true;
    case 'audit':
    case 'seo':
    case 'speed':
      // Magnitude OR band crossing.
      const delta = Math.abs(newScore - oldScore);
      if (delta >= SCORE_DELTA_THRESHOLD) return true;
      return band(oldScore) !== band(newScore);
    default:
      return false;
  }
}
