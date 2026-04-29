// Phase F.2 (Field Notes) — submission storage, validation, and
// helpers. Sibling to src/lib/workbench.js.
//
// Stores per-user reader-submitted field notes in the AUTH_SESSIONS
// KV namespace alongside save:/watch:/property: keys:
//
//   submission:<sub>:<id>          → JSON {
//     id, kind:'submission',
//     status:'pending'|'approved'|'rejected'|'withdrawn'|'stalled',
//     articleSlug, locale,
//     body,                ← already-escaped plaintext
//     authorDisplayName,   ← already-escaped, 1-40 chars
//     authorEmail,         ← from session, never user-supplied
//     donsResponse?,       ← optional editor reply published with note
//     reviewerNote?,       ← private; never rendered
//     ipHash,              ← SHA256(ip+salt) — abuse triage only
//     createdAt, decidedAt?
//   }
//
//   approved-fieldnote:<articleSlug>:<id>  → JSON public projection
//     ← global queryable index for build-time merge
//
//   decision:<id>                  → JSON {
//     decision, reviewerNote, decidedAt, reviewerEmail
//   }  ← idempotency key + audit trail; persists forever
//
// All write paths route through validateSubmissionBody and
// sanitizePlaintext so the data committed to git is safe to
// substitute into HTML templates with simple escapeHtml.

import { mintSaveItemId, isValidSaveItemIdShape } from './workbench.js';

export const SUBMISSION_KEY_PREFIX         = 'submission:';
export const APPROVED_FIELDNOTE_KEY_PREFIX = 'approved-fieldnote:';
export const DECISION_KEY_PREFIX           = 'decision:';

export const MAX_SUBMISSIONS_PER_USER             = 10;
export const MAX_SUBMISSIONS_PER_USER_PER_ARTICLE = 3;
export const MIN_BODY_WORDS  = 100;
export const MAX_BODY_WORDS  = 400;
export const MAX_DISPLAY_NAME = 40;
export const STALL_AGE_MS    = 60 * 24 * 3600 * 1000;
export const REJECTED_TTL_SEC = 30 * 24 * 3600;

// Closed enum — same shape as the per-status pill rendered in the
// Workshop list. Adding a state requires updating both this set and
// the Workshop chip renderer.
export const SUBMISSION_STATUSES = new Set([
  'pending', 'approved', 'rejected', 'withdrawn', 'stalled',
]);

// Mirror the save-id shape (10-char alphabet) so submission URLs
// look the same as save / property / snapshot URLs.
export const mintSubmissionId = mintSaveItemId;

export function submissionKey(sub, id) {
  return SUBMISSION_KEY_PREFIX + sub + ':' + id;
}

export function approvedFieldnoteKey(articleSlug, id) {
  return APPROVED_FIELDNOTE_KEY_PREFIX + articleSlug + ':' + id;
}

export function decisionKey(id) {
  return DECISION_KEY_PREFIX + id;
}

// Word count = whitespace-separated tokens. We trim first so leading/
// trailing whitespace doesn't inflate the count; collapse repeated
// whitespace via the split's regex.
export function countWords(text) {
  const trimmed = String(text == null ? '' : text).trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

// Reject any body that contains a URL-shaped substring. Catches
// `http://` / `https://`, leading `www.`, common shorteners, and
// bare-domain patterns like `toast.com/pricing`. This kills the
// SEO-spam vector — readers can mention "I tried this with Toast" but
// cannot link to anything.
const URL_RE = /\b(?:https?:\/\/|www\.|t\.co\/|bit\.ly\/|[a-z0-9-]+\.(?:com|net|org|io|co|app|dev|xyz|us|ai|gg|so|me|tv)\b)/i;
export function containsUrl(text) {
  return URL_RE.test(String(text == null ? '' : text));
}

// Strip ALL HTML tags (no allowed tags), decode entities, then
// re-escape `< > & " '`. Collapse runs of whitespace except
// newlines (preserved so paragraphs survive), trim. The output is
// safe to drop into an HTML attribute or text node directly.
export function sanitizePlaintext(text) {
  if (text == null) return '';
  let s = String(text);
  // Drop HTML tags entirely.
  s = s.replace(/<[^>]*>/g, '');
  // Decode common entities so the re-escape is canonical.
  s = s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&#x27;/g, "'");
  // Re-escape.
  s = s.replace(/[&<>"']/g, (c) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;',
  })[c]);
  // Normalize whitespace: collapse spaces/tabs but preserve newlines.
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  return s;
}

export function validateDisplayName(name) {
  if (name == null) return { ok: false, error: 'display-name-empty' };
  const s = String(name).trim();
  if (!s) return { ok: false, error: 'display-name-empty' };
  if (s.length > MAX_DISPLAY_NAME) {
    return { ok: false, error: 'display-name-too-long', max: MAX_DISPLAY_NAME };
  }
  if (/<[^>]*>/.test(s)) return { ok: false, error: 'display-name-html' };
  if (containsUrl(s)) return { ok: false, error: 'display-name-url' };
  return { ok: true, value: sanitizePlaintext(s) };
}

// Full body validation pipeline. Returns
// { ok:true, item:{body, authorDisplayName, articleSlug, locale} }
// or { ok:false, error, ...detail }. Caller passes the
// build-time-derived `allowedSlugs` set (from
// src/lib/article-slugs.generated.js).
export function validateSubmissionBody(input, allowedSlugs) {
  if (!input || typeof input !== 'object') {
    return { ok: false, error: 'body-required' };
  }
  const locale = input.locale === 'es' ? 'es' : (input.locale === 'en' ? 'en' : null);
  if (!locale) return { ok: false, error: 'invalid-locale' };

  const articleSlug = typeof input.articleSlug === 'string' ? input.articleSlug.trim() : '';
  if (!articleSlug || !allowedSlugs.has(articleSlug)) {
    return { ok: false, error: 'unknown-article' };
  }

  const nameCheck = validateDisplayName(input.authorDisplayName);
  if (!nameCheck.ok) return nameCheck;

  const body = sanitizePlaintext(input.body);
  if (containsUrl(body)) return { ok: false, error: 'url-not-allowed' };
  const wc = countWords(body);
  if (wc < MIN_BODY_WORDS || wc > MAX_BODY_WORDS) {
    return {
      ok: false,
      error: 'word-count-out-of-range',
      min: MIN_BODY_WORDS,
      max: MAX_BODY_WORDS,
      actual: wc,
    };
  }

  return {
    ok: true,
    item: {
      articleSlug,
      locale,
      body,
      authorDisplayName: nameCheck.value,
    },
  };
}

export async function listSubmissionsForUser(env, sub) {
  const result = await env.AUTH_SESSIONS.list({ prefix: SUBMISSION_KEY_PREFIX + sub + ':' });
  const items = [];
  for (const k of result.keys) {
    const raw = await env.AUTH_SESSIONS.get(k.name);
    if (!raw) continue;
    try { items.push(JSON.parse(raw)); } catch (_) { /* skip corrupt */ }
  }
  items.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return items;
}

export async function countSubmissionsForArticle(env, sub, articleSlug) {
  const items = await listSubmissionsForUser(env, sub);
  let count = 0;
  for (const it of items) {
    if (it.articleSlug === articleSlug && (it.status === 'pending' || it.status === 'approved')) {
      count++;
    }
  }
  return count;
}

export async function getSubmission(env, sub, id) {
  if (!isValidSaveItemIdShape(id)) return null;
  const raw = await env.AUTH_SESSIONS.get(submissionKey(sub, id));
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

// Iterate every submission across all users. Used by the admin queue
// listing and the cron stale sweep. Each yielded item: { sub, submission }.
export async function* iterateAllSubmissions(env) {
  let cursor = null;
  while (true) {
    const opts = { prefix: SUBMISSION_KEY_PREFIX };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_SESSIONS.list(opts);
    for (const k of page.keys) {
      const raw = await env.AUTH_SESSIONS.get(k.name);
      if (!raw) continue;
      let submission;
      try { submission = JSON.parse(raw); } catch (_) { continue; }
      const parts = k.name.split(':');
      if (parts.length < 3) continue;
      const sub = parts.slice(1, -1).join(':');
      yield { sub, submission };
    }
    if (page.list_complete) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }
}

// Iterate every approved fieldnote (cross-user index). Used by
// /api/admin/submissions/publish-data to merge into the canonical
// data file.
export async function* iterateAllApprovedFieldnotes(env) {
  let cursor = null;
  while (true) {
    const opts = { prefix: APPROVED_FIELDNOTE_KEY_PREFIX };
    if (cursor) opts.cursor = cursor;
    const page = await env.AUTH_SESSIONS.list(opts);
    for (const k of page.keys) {
      const raw = await env.AUTH_SESSIONS.get(k.name);
      if (!raw) continue;
      let row;
      try { row = JSON.parse(raw); } catch (_) { continue; }
      yield row;
    }
    if (page.list_complete) break;
    if (!page.cursor) break;
    cursor = page.cursor;
  }
}

// SHA256(ip+salt) for abuse triage. Salt is the deploy-time
// MAGIC_LINK_BASE_URL (already a stable per-env secret) so logs
// don't carry raw IPs.
export async function ipHash(ip, salt) {
  const text = String(ip || '') + ':' + String(salt || '');
  const buf = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
  return hex.slice(0, 24);
}
