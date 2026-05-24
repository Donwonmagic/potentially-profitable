// Open the Doors bootcamp — progress + config data layer.
//
// Signed-in operators get cross-device sync of two small per-user
// records that live in env.AUTH_SESSIONS alongside the rest of the
// workbench surface:
//
//   course:<sub>         — progress: track + completed[] + timestamps
//   course-config:<sub>  — normalized generator config the L14 download
//                          would assemble (a snapshot of the operator's
//                          MuntinContext at the moment they synced)
//
// Anonymous operators get the same UX from localStorage; the client
// layer reconciles client-wins-on-sign-in so the freshly-signed-in tab
// never clobbers what the operator just typed.
//
// Design choices that matter at the data-layer level:
//
//   - Progress merge semantics: POST /api/course/progress never
//     replaces completed[] wholesale; it merges. Re-marking the same
//     lesson twice keeps only the latest entry (by `at`). The reset
//     endpoint is the only way to clear completed[].
//
//   - Config replace semantics: POST /api/course/config replaces the
//     whole record (the client always sends the full normalized
//     snapshot). That keeps the round-trip simple — no per-field
//     PATCH ceremony for a record under 16 KB.
//
//   - Hard size caps. Progress is bounded by completed[].length ≤ 50
//     (the course has 16 lessons; 50 is 3x buffer for re-takes).
//     Config is bounded by serialized JSON ≤ 16 KB (the L14 generator
//     ships ~3 KB of templated content per operator; 16 KB is the
//     ceiling Cloudflare KV's value-size sweet spot starts to drop
//     off, and operators with novel-length customer paragraphs still
//     fit).
//
//   - Validators reject anything off the allowlist. Track ∈
//     {shared, fresh, rebuild}. Lesson slugs match the
//     lowercase-dashed pattern the data/course-lessons.json IDs use.
//     Anything else gets dropped at the boundary — never reaches KV.
//
// No fetches; no module-level await; tree-shakable. Pairs with
// scripts/check-l14-generator-output.mjs which tests the templates
// the L14 generator (also pure) renders from the same config shape.

const PROGRESS_KEY_PREFIX = 'course:';
const CONFIG_KEY_PREFIX   = 'course-config:';

const TRACK_VALUES = new Set(['shared', 'fresh', 'rebuild']);
const LESSON_SLUG_RE = /^[a-z0-9-]{1,50}$/;
const COMPLETED_MAX = 50;
const CONFIG_MAX_BYTES = 16 * 1024;
const SCHEMA_VERSION = 1;

function emptyProgress() {
  return {
    track: null,
    completed: [],
    startedAt: null,
    updatedAt: null,
    v: SCHEMA_VERSION
  };
}

export async function readProgress(env, sub) {
  if (!env || !env.AUTH_SESSIONS || !sub) return emptyProgress();
  const raw = await env.AUTH_SESSIONS.get(PROGRESS_KEY_PREFIX + sub);
  if (!raw) return emptyProgress();
  try {
    const parsed = JSON.parse(raw);
    return normalizeProgress(parsed);
  } catch (_) {
    return emptyProgress();
  }
}

// Defensive normalization on read. Drops anything off the schema,
// caps the completed[] length, dedupes by lesson (keeping the latest
// timestamp). Mirrors what mergeProgress writes so a hand-edited or
// older-schema record reads as a clean current-schema record.
function normalizeProgress(input) {
  const safe = emptyProgress();
  if (!input || typeof input !== 'object') return safe;

  if (typeof input.track === 'string' && TRACK_VALUES.has(input.track)) {
    safe.track = input.track;
  }

  const arr = Array.isArray(input.completed) ? input.completed : [];
  const byLesson = new Map();
  for (const entry of arr) {
    if (!entry || typeof entry !== 'object') continue;
    const lesson = typeof entry.lesson === 'string' ? entry.lesson.trim().toLowerCase() : '';
    if (!LESSON_SLUG_RE.test(lesson)) continue;
    const at = Number.isFinite(entry.at) ? Math.floor(entry.at) : null;
    const existing = byLesson.get(lesson);
    if (!existing || (at && (!existing.at || at > existing.at))) {
      byLesson.set(lesson, { lesson, at });
    }
  }
  safe.completed = [...byLesson.values()]
    .sort((a, b) => (a.at || 0) - (b.at || 0))
    .slice(-COMPLETED_MAX);

  if (Number.isFinite(input.startedAt)) safe.startedAt = Math.floor(input.startedAt);
  if (Number.isFinite(input.updatedAt)) safe.updatedAt = Math.floor(input.updatedAt);

  return safe;
}

/**
 * Apply a partial update. Merge semantics:
 *   - track: replaced only when patch.track is a valid value.
 *   - completed: each {lesson, at} entry in patch.completed is
 *     UPSERTed; existing entries for the same lesson stay unless
 *     the patch's `at` is later.
 *   - startedAt: set once (first non-null write wins).
 *   - updatedAt: always bumped to now-or-patch-time.
 *
 * Returns { ok: true, progress } or { ok: false, error }.
 */
export async function mergeProgress(env, sub, patch) {
  if (!env || !env.AUTH_SESSIONS || !sub) {
    return { ok: false, error: 'service-unavailable' };
  }
  if (!patch || typeof patch !== 'object') {
    return { ok: false, error: 'invalid-body' };
  }

  const current = await readProgress(env, sub);
  const now = Date.now();
  const next = {
    track: current.track,
    completed: current.completed.slice(),
    startedAt: current.startedAt,
    updatedAt: now,
    v: SCHEMA_VERSION
  };

  if (typeof patch.track === 'string' && TRACK_VALUES.has(patch.track)) {
    next.track = patch.track;
  }

  if (Array.isArray(patch.completed)) {
    const byLesson = new Map(next.completed.map((e) => [e.lesson, e]));
    for (const entry of patch.completed) {
      if (!entry || typeof entry !== 'object') continue;
      const lesson = typeof entry.lesson === 'string' ? entry.lesson.trim().toLowerCase() : '';
      if (!LESSON_SLUG_RE.test(lesson)) continue;
      const at = Number.isFinite(entry.at) ? Math.floor(entry.at) : now;
      const existing = byLesson.get(lesson);
      if (!existing || at > (existing.at || 0)) {
        byLesson.set(lesson, { lesson, at });
      }
    }
    next.completed = [...byLesson.values()]
      .sort((a, b) => (a.at || 0) - (b.at || 0))
      .slice(-COMPLETED_MAX);
  }

  if (!next.startedAt) {
    if (Number.isFinite(patch.startedAt)) next.startedAt = Math.floor(patch.startedAt);
    else next.startedAt = now;
  }

  try {
    await env.AUTH_SESSIONS.put(PROGRESS_KEY_PREFIX + sub, JSON.stringify(next));
  } catch (_) {
    return { ok: false, error: 'storage-failed' };
  }
  return { ok: true, progress: next };
}

export async function resetProgress(env, sub) {
  if (!env || !env.AUTH_SESSIONS || !sub) {
    return { ok: false, error: 'service-unavailable' };
  }
  try {
    await env.AUTH_SESSIONS.delete(PROGRESS_KEY_PREFIX + sub);
    await env.AUTH_SESSIONS.delete(CONFIG_KEY_PREFIX + sub);
  } catch (_) {
    return { ok: false, error: 'storage-failed' };
  }
  return { ok: true };
}

// --- Config: full-replace semantics ---------------------------------
//
// The client posts a full normalized snapshot of the operator's
// MuntinContext at sync time. The server stores it verbatim after a
// size check + a strip of unknown top-level keys. The L14 generator
// reads this server-side snapshot when the operator returns on a new
// device and the local MuntinContext is empty.

const CONFIG_ALLOWED_KEYS = new Set([
  'restaurantProfile',  // { name, cuisine, address, phone, ... }
  'palette',            // [hex, hex, hex]
  'voice',              // { formality, era, warmth } as 0..100 integers
  'fontPair',           // { id, heading, body } from font-pair-picker
  'onePromise',
  'customerParagraph',
  'customerCard',       // { name, age, role, traits[] } from persona-card-builder
  'dishes',             // [{ name, price }]
  'hours',              // { monday: {...}, ..., sunday: {...} }
  'localKeywords',
  'reviewResponseTemplate',
  'rhythmCadence',
  'deployTarget'
]);

function normalizeConfig(input) {
  if (!input || typeof input !== 'object') return null;
  const out = { v: SCHEMA_VERSION };
  for (const key of Object.keys(input)) {
    if (!CONFIG_ALLOWED_KEYS.has(key)) continue;
    out[key] = input[key];
  }
  return out;
}

export async function readConfig(env, sub) {
  if (!env || !env.AUTH_SESSIONS || !sub) return null;
  const raw = await env.AUTH_SESSIONS.get(CONFIG_KEY_PREFIX + sub);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return normalizeConfig(parsed);
  } catch (_) {
    return null;
  }
}

export async function writeConfig(env, sub, config) {
  if (!env || !env.AUTH_SESSIONS || !sub) {
    return { ok: false, error: 'service-unavailable' };
  }
  const normalized = normalizeConfig(config);
  if (!normalized) {
    return { ok: false, error: 'invalid-body' };
  }
  const serialized = JSON.stringify(normalized);
  if (serialized.length > CONFIG_MAX_BYTES) {
    return { ok: false, error: 'too-large', max: CONFIG_MAX_BYTES, size: serialized.length };
  }
  try {
    await env.AUTH_SESSIONS.put(CONFIG_KEY_PREFIX + sub, serialized);
  } catch (_) {
    return { ok: false, error: 'storage-failed' };
  }
  return { ok: true, config: normalized };
}

// Exported for tests/scripts that want to inspect the constants
// rather than re-derive them.
export const CONSTANTS = Object.freeze({
  PROGRESS_KEY_PREFIX,
  CONFIG_KEY_PREFIX,
  TRACK_VALUES: [...TRACK_VALUES],
  LESSON_SLUG_RE,
  COMPLETED_MAX,
  CONFIG_MAX_BYTES,
  SCHEMA_VERSION
});
