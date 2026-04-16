// ============================================================
// Validation + honeypot helpers
// ============================================================
//
// Shared validation utilities used by every form handler. Kept in
// its own file so the rules live in one place — if we ever want
// to tighten the email regex or add a new validator, one edit
// propagates to all three endpoints.

// Matches the vast majority of real-world email addresses without
// being so strict that it rejects legitimate ones. Trade-off: we
// accept some things that aren't technically valid per RFC 5322
// (like addresses with + tags, which are fine), and we reject some
// technically-valid addresses (like "quoted strings@example.com",
// which nobody actually uses). This is the same regex shape used
// in the existing site.js form validator so the two stay consistent.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Check if a string looks like a valid email address.
 */
export function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.length > 254) return false; // RFC 5321 local + domain max
  return EMAIL_RE.test(trimmed);
}

/**
 * Honeypot check. Formspree's convention — carried into the new
 * handlers — is a hidden field named `_gotcha` that real users never
 * fill in but bots happily do. If it's non-empty, the submission is
 * silently dropped. We return `true` from isSpamHoneypot() when the
 * submission should be REJECTED.
 *
 * Non-empty is the signal, not "present". A bot that submits
 * `_gotcha=""` is still a legitimate submission (the form sent the
 * field with an empty value, which is the normal state).
 */
export function isSpamHoneypot(body) {
  if (!body) return false;
  const val = body._gotcha;
  if (typeof val !== 'string') return false;
  return val.trim().length > 0;
}

/**
 * Assert that the given body has non-empty string values for every
 * required field name. Returns { ok: true } on success, or
 * { ok: false, error, field } on first failure.
 *
 * Example:
 *   requireFields(body, ['name', 'email', 'goals'])
 *   -> { ok: false, error: 'Missing required field: email', field: 'email' }
 */
export function requireFields(body, fieldNames) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Request body is empty or not parseable', field: null };
  }
  for (const name of fieldNames) {
    const v = body[name];
    if (typeof v !== 'string' || v.trim().length === 0) {
      return { ok: false, error: 'Missing required field: ' + name, field: name };
    }
  }
  return { ok: true };
}

/**
 * Length guard. Protects the downstream email provider (and Don's
 * inbox) from pathologically long inputs. Returns { ok: false, ... }
 * if any tracked field exceeds the limit.
 *
 * Defaults match what a human actually writes in a contact form.
 * Callers can pass custom limits per endpoint.
 */
export function enforceMaxLengths(body, limits) {
  if (!body || typeof body !== 'object') return { ok: true };
  const defaults = {
    name: 120,
    email: 254,
    business: 180,
    website: 500,
    goals: 4000,
    budget: 60,
    referral: 200,
    restaurant: 180,
    subtype: 40,
    services: 400,
    audited_url: 500,
    overall_score: 10,
    restaurant_readiness: 10,
    shareable_link: 800,
    summary: 400,
    failing_checks: 2000,
    unverified_checks: 2000,
    user_corrections: 400,
  };
  const merged = Object.assign({}, defaults, limits || {});
  for (const key of Object.keys(merged)) {
    const val = body[key];
    if (typeof val !== 'string') continue;
    if (val.length > merged[key]) {
      return {
        ok: false,
        error: 'Field "' + key + '" is longer than the ' + merged[key] + '-character limit',
        field: key,
      };
    }
  }
  return { ok: true };
}

/**
 * Normalize a URL-ish string for display. Strips protocol + trailing
 * slash so "https://yourrestaurant.com/" becomes "yourrestaurant.com".
 * Used in email subjects and bodies to keep lines short and readable.
 * Falls back to the raw input if nothing matches.
 */
export function prettyUrl(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().replace(/^https?:\/\//i, '').replace(/\/$/, '');
}

/**
 * Escape a string for safe insertion into an HTML email body.
 * Same character set as the standard HTML escape: & < > " '
 */
export function escapeHtml(raw) {
  if (raw == null) return '';
  return String(raw)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
