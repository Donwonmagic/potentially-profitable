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
    // Phase J4: new fields that the deep-gate form (and the
    // emails it triggers) carry alongside the existing payload.
    interest: 60,            // form-routing hint, e.g. 'restaurant-audit-report'
    passing_checks: 2000,    // optional: list of checks that passed, for the printable permalink
    deep_findings: 6000,     // optional: serialized priority results for the printable permalink
    // Phase L4: PDF attachment payload (Sprint L3c client posts
    // a base64-encoded jsPDF build of the current audit + its
    // suggested filename). Cap at 10M chars (~7.5MB PDF) which
    // gives Resend's 40MB email limit plenty of headroom while
    // preventing a pathological payload from tying up the Worker.
    pdf_b64: 10_000_000,
    pdf_filename: 160,
    source: 200,
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
 * Sprint E1: SSRF guard for user-supplied URLs that the Worker will
 * fetch server-side (seo-check, schema-check, page-crawl). Returns
 * { ok: true, url: URL } when safe, or { ok: false, status, error }
 * when the URL should be refused.
 *
 * Rules:
 *   - Must be parseable as a URL
 *   - Must be http(s) — blocks javascript:, data:, file:, ftp:, gopher:
 *   - Must not be longer than 2048 characters
 *   - Must not include userinfo (user:pass@…) — harmless to us, but a
 *     common SSRF-bypass vector and confusing in logs
 *   - Hostname must not be an IP literal in a private/loopback/link-
 *     local range, nor a bare "localhost" alias
 *
 * This is a best-effort allowlist. Cloudflare Workers already refuse
 * to fetch 127.0.0.1 at the runtime level, but the explicit check
 * gives us a clean 400 + log line instead of a generic fetch failure
 * and covers the IPv6 and hostname-alias cases the runtime doesn't.
 */
const SSRF_DENY_HOSTS = new Set([
  'localhost', 'localhost.localdomain',
  'ip6-localhost', 'ip6-loopback',
]);
export function assertSafeHttpUrl(raw) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, status: 400, error: 'Missing URL' };
  }
  if (raw.length > 2048) {
    return { ok: false, status: 400, error: 'URL exceeds 2048-character limit' };
  }
  let u;
  try { u = new URL(raw.trim()); }
  catch (_) { return { ok: false, status: 400, error: 'Invalid URL' }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, status: 400, error: 'Only http(s) URLs are supported' };
  }
  if (u.username || u.password) {
    return { ok: false, status: 400, error: 'URL must not contain credentials' };
  }
  const host = u.hostname.toLowerCase();
  if (SSRF_DENY_HOSTS.has(host)) {
    return { ok: false, status: 400, error: 'Loopback hosts are not allowed' };
  }
  // IPv4 literal checks (dotted quad).
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const o = v4.slice(1).map((x) => Number(x));
    if (o.some((n) => n < 0 || n > 255)) {
      return { ok: false, status: 400, error: 'Invalid IPv4 literal' };
    }
    const [a, b] = o;
    // Loopback 127/8, link-local 169.254/16, RFC1918 10/8, 192.168/16,
    // 172.16/12, CGNAT 100.64/10, multicast 224/4, reserved 0/8.
    if (a === 0 || a === 10 || a === 127 || a === 127
        || (a === 100 && b >= 64 && b <= 127)
        || (a === 169 && b === 254)
        || (a === 172 && b >= 16 && b <= 31)
        || (a === 192 && b === 168)
        || a >= 224) {
      return { ok: false, status: 400, error: 'Private or reserved IP range is not allowed' };
    }
  }
  // IPv6 literal: block loopback (::1), link-local (fe80::/10),
  // unique-local (fc00::/7), and IPv4-mapped loopback (::ffff:127…).
  if (host.startsWith('[') && host.endsWith(']')) {
    const inner = host.slice(1, -1);
    if (inner === '::1' || inner === '0:0:0:0:0:0:0:1') {
      return { ok: false, status: 400, error: 'IPv6 loopback is not allowed' };
    }
    if (/^fe[89ab][0-9a-f]:/i.test(inner) || /^f[cd][0-9a-f]{2}:/i.test(inner)) {
      return { ok: false, status: 400, error: 'Private IPv6 range is not allowed' };
    }
    if (/^::ffff:127\./i.test(inner)) {
      return { ok: false, status: 400, error: 'IPv4-mapped loopback is not allowed' };
    }
  }
  return { ok: true, url: u };
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
