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
  // Accept either field name. Formspree's convention is `_gotcha`;
  // the magic-link sign-in form (and other in-house forms) uses the
  // shorter `hp`. Either name is treated identically.
  const val = (typeof body._gotcha === 'string') ? body._gotcha
            : (typeof body.hp      === 'string') ? body.hp
            : null;
  if (val === null) return false;
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

// ============================================================
// Spam-defense layer (added when the site moved off Formspree).
// Each helper is independent and silent on rejection — every
// caller is expected to translate a `false` (or `spam: true`) into
// the same 200 OK { status: 'sent' } response the honeypot already
// returns, so probing bots can't tell which signal tripped them.
// ============================================================

/**
 * Verify the request originated from a Muntin-owned page. We trust
 * `Origin` first because some browsers strip Referer for privacy;
 * fall back to `Referer` so a legitimate same-origin POST that lost
 * its Origin header (e.g. older Safari + form action submit) still
 * passes. Allowlist:
 *   - https://muntin.digital + https://www.muntin.digital
 *   - any *.muntin.digital subdomain (preview branches)
 *   - any *-muntin-digital.don-28d.workers.dev (Cloudflare preview URL)
 *   - http(s)://localhost:* and 127.0.0.1:* for local `wrangler` dev
 *
 * Direct cURL POSTs and form-action scrapers usually have neither
 * header populated; they fail this check before the body is parsed.
 */
const ORIGIN_ALLOW_LITERALS = new Set([
  'https://muntin.digital',
  'https://www.muntin.digital',
]);
const ORIGIN_ALLOW_PATTERNS = [
  /^https:\/\/[A-Za-z0-9-]+\.muntin\.digital$/,
  /^https:\/\/[A-Za-z0-9-]+-muntin-digital\.don-28d\.workers\.dev$/,
  /^https?:\/\/localhost(?::\d+)?$/,
  /^https?:\/\/127\.0\.0\.1(?::\d+)?$/,
];
function originMatches(value) {
  if (!value) return false;
  // Referer is a full URL — pull just the origin component.
  let probe = value;
  try { probe = new URL(value).origin; }
  catch (_) { /* value already looked like an origin (no path); leave as-is */ }
  if (ORIGIN_ALLOW_LITERALS.has(probe)) return true;
  return ORIGIN_ALLOW_PATTERNS.some(function(re){ return re.test(probe); });
}
export function isOriginAllowed(request) {
  if (!request || !request.headers) return false;
  const origin = request.headers.get('origin') || '';
  if (origin && originMatches(origin)) return true;
  const referer = request.headers.get('referer') || '';
  if (referer && originMatches(referer)) return true;
  return false;
}

/**
 * Cloudflare populates `request.cf.threatScore` (0–100) on the
 * Workers free plan based on the source IP's reputation across the
 * Cloudflare network. ≥ 30 is the documented "suspicious" threshold;
 * we use that as the reject line. Returns false on any plan or
 * runtime that doesn't expose the field, so this is a one-way
 * filter — never a false-positive against legit traffic just
 * because the field is missing.
 */
export function isHighThreatIP(request) {
  try {
    const score = request && request.cf && request.cf.threatScore;
    if (typeof score !== 'number') return false;
    return score >= 30;
  } catch (_) { return false; }
}

/**
 * Submit-timing trap. Pages that load assets/site.js stamp a hidden
 * `_ts` input with `Date.now()` at DOMContentLoaded; the worker
 * checks the elapsed window on submit. Real users take at least a
 * few seconds to fill a form; bots that POST raw HTML without
 * running JS won't have the field at all. Returns true when the
 * timestamp is present, parseable, and the gap is between
 * MIN_TS_AGE_MS and MAX_TS_AGE_MS.
 *
 * Min 1500ms catches the dumbest auto-submit bots without flagging
 * a fast typist. Max 30 minutes lets the audit-tool flow (which
 * spends ~30s+ on a Lighthouse run before the user even sees the
 * email-the-PDF form) pass cleanly.
 */
const MIN_TS_AGE_MS = 1500;
const MAX_TS_AGE_MS = 30 * 60 * 1000;
export function isTimestampSane(body) {
  if (!body) return false;
  // Accept either field name. Legacy intake forms stamp `_ts`; the
  // magic-link sign-in form (and other in-house forms) stamp the
  // shorter `ts`. Either name is treated identically.
  const rawValue = (body._ts != null) ? body._ts
                 : (body.ts  != null) ? body.ts
                 : '';
  const raw = parseInt(String(rawValue || ''), 10);
  if (!raw || Number.isNaN(raw)) return false;
  const elapsed = Date.now() - raw;
  if (elapsed < MIN_TS_AGE_MS) return false;
  if (elapsed > MAX_TS_AGE_MS) return false;
  return true;
}

/**
 * Content-heuristic spam classifier. Concatenates the free-text
 * fields a real submission could carry, caps the blob at 5KB so a
 * malicious payload can't burn CPU here, then runs a small set of
 * cheap regex tests. Returns { spam, reasons } so the worker can
 * both reject and emit a single audit-log line naming the signals
 * that triggered. Each reason is a short tag — easy to grep in
 * `wrangler tail` and stable across releases.
 *
 * Reasons:
 *   links:N      — 3+ explicit URLs / "www." mentions
 *   caps         — 30+ consecutive uppercase Latin chars (shouting)
 *   non-target-script — Cyrillic/CJK/Hangul detected, locale en/es
 *   keyword      — known SEO/casino/forex/escort/loan-spam phrase
 *   repeat       — 15+ consecutive identical chars (e.g. "aaaaaaaa…")
 *
 * Locale 'es' allows Spanish accented chars and Latin script; we
 * don't treat those as suspicious because the Spanish surface is
 * a real user audience.
 */
const SPAM_KEYWORD_RE = new RegExp(
  '\\b(' + [
    'seo services', 'seo expert', 'seo agency', 'rank higher',
    'guaranteed traffic', 'guaranteed ranking', 'increase your ranking',
    'submit your website', 'submit your site', 'add your link',
    'backlinks?', 'link building', 'pbn',
    'cheap viagra', 'cialis online', 'casino', 'gambling',
    'escort', 'onlyfans',
    'forex', 'crypto investment', 'investment opportunity',
    'loan offer', 'pre-approved loan', 'nigerian prince',
    'bitcoin doubler', 'recovery agent', 'wallet recovery',
  ].join('|') + ')\\b',
  'i'
);
const NON_TARGET_SCRIPT_RE = /[Ѐ-ӿ一-鿿぀-ゟ゠-ヿ가-힯]/;
export function classifySpam(body) {
  const reasons = [];
  if (!body) return { spam: false, reasons: reasons };
  const fields = [
    body.name, body.business, body.website, body.goals,
    body.message, body.summary, body.user_corrections,
    body.restaurant, body.referral, body.services,
  ].filter(function(v){ return typeof v === 'string'; });
  const blob = fields.join(' ').slice(0, 5000);
  if (!blob.trim()) return { spam: false, reasons: reasons };

  const links = (blob.match(/https?:\/\/|www\./gi) || []).length;
  if (links >= 3) reasons.push('links:' + links);
  if (/[A-Z]{30,}/.test(blob)) reasons.push('caps');

  const locale = String((body.locale || 'en')).toLowerCase();
  if ((locale === 'en' || locale === 'es') && NON_TARGET_SCRIPT_RE.test(blob)) {
    reasons.push('non-target-script');
  }
  if (SPAM_KEYWORD_RE.test(blob)) reasons.push('keyword');
  if (/(.)\1{14,}/.test(blob)) reasons.push('repeat');

  return { spam: reasons.length > 0, reasons: reasons };
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

// Sprint ES3: server-side error message localization. Each assertion
// returns a key — the caller maps it to a language-appropriate string
// via pickLang() below. Keeping the keys stable makes the worker
// logs consistent across locales and gives the client a machine-
// readable error type if it wants to render its own copy.
const SSRF_ERR_STRINGS = {
  'missing':        { en: 'Missing URL', es: 'Falta la URL' },
  'too-long':       { en: 'URL exceeds 2048-character limit', es: 'La URL supera el límite de 2048 caracteres' },
  'invalid':        { en: 'Invalid URL', es: 'URL inválida' },
  'non-http':       { en: 'Only http(s) URLs are supported', es: 'Solo se admiten URLs http(s)' },
  'credentials':    { en: 'URL must not contain credentials', es: 'La URL no puede contener credenciales' },
  'loopback-host':  { en: 'Loopback hosts are not allowed', es: 'No se permiten hosts de loopback' },
  'invalid-ipv4':   { en: 'Invalid IPv4 literal', es: 'Literal IPv4 inválido' },
  'private-ipv4':   { en: 'Private or reserved IP range is not allowed', es: 'No se permite un rango IP privado o reservado' },
  'loopback-ipv6':  { en: 'IPv6 loopback is not allowed', es: 'No se permite loopback IPv6' },
  'private-ipv6':   { en: 'Private IPv6 range is not allowed', es: 'No se permite rango IPv6 privado' },
  'mapped-loopback':{ en: 'IPv4-mapped loopback is not allowed', es: 'No se permite loopback IPv4 mapeado' }
};
export function pickLang(request) {
  if (!request) return 'en';
  try {
    const url = new URL(request.url);
    const qp = (url.searchParams.get('lang') || '').toLowerCase();
    if (qp === 'es') return 'es';
    if (qp === 'en') return 'en';
  } catch (_) { /* ignore */ }
  const hdr = (request.headers && request.headers.get('accept-language')) || '';
  if (/\bes\b/i.test(hdr.split(',')[0] || '')) return 'es';
  return 'en';
}
function ssrfError(key, lang) {
  const lookup = SSRF_ERR_STRINGS[key];
  if (!lookup) return 'Invalid URL';
  return (lang === 'es' && lookup.es) || lookup.en;
}

export function assertSafeHttpUrl(raw, lang) {
  if (typeof raw !== 'string' || !raw.trim()) {
    return { ok: false, status: 400, error: ssrfError('missing', lang) };
  }
  if (raw.length > 2048) {
    return { ok: false, status: 400, error: ssrfError('too-long', lang) };
  }
  let u;
  try { u = new URL(raw.trim()); }
  catch (_) { return { ok: false, status: 400, error: ssrfError('invalid', lang) }; }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    return { ok: false, status: 400, error: ssrfError('non-http', lang) };
  }
  if (u.username || u.password) {
    return { ok: false, status: 400, error: ssrfError('credentials', lang) };
  }
  const host = u.hostname.toLowerCase();
  if (SSRF_DENY_HOSTS.has(host)) {
    return { ok: false, status: 400, error: ssrfError('loopback-host', lang) };
  }
  // IPv4 literal checks (dotted quad).
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const o = v4.slice(1).map((x) => Number(x));
    if (o.some((n) => n < 0 || n > 255)) {
      return { ok: false, status: 400, error: ssrfError('invalid-ipv4', lang) };
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
      return { ok: false, status: 400, error: ssrfError('private-ipv4', lang) };
    }
  }
  // IPv6 literal: block loopback (::1), link-local (fe80::/10),
  // unique-local (fc00::/7), and IPv4-mapped loopback (::ffff:127…).
  if (host.startsWith('[') && host.endsWith(']')) {
    const inner = host.slice(1, -1);
    if (inner === '::1' || inner === '0:0:0:0:0:0:0:1') {
      return { ok: false, status: 400, error: ssrfError('loopback-ipv6', lang) };
    }
    if (/^fe[89ab][0-9a-f]:/i.test(inner) || /^f[cd][0-9a-f]{2}:/i.test(inner)) {
      return { ok: false, status: 400, error: ssrfError('private-ipv6', lang) };
    }
    if (/^::ffff:127\./i.test(inner)) {
      return { ok: false, status: 400, error: ssrfError('mapped-loopback', lang) };
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
