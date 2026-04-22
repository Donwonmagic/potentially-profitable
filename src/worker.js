// ============================================================
// muntin.digital — Cloudflare Worker entry point
// ============================================================
//
// This Worker serves the static site (via env.ASSETS) AND handles
// a small set of /api/* routes for form submissions. The Workers
// Static Assets platform lets a single Worker do both:
//
//   1. Request comes in
//   2. This fetch handler runs first
//   3. If the path is /api/*, we route it to a form handler
//   4. Otherwise, we pass the request through to env.ASSETS.fetch()
//      which serves the corresponding file from /dist
//
// Before Sprint 7 the site had no Worker script at all — wrangler
// just uploaded the static assets. Sprint 7 added this script so we
// can replace the three Formspree endpoints (new-project intake,
// restaurant-website-checklist PDF request, and audit-report-email)
// with self-hosted form handlers that cost zero and give us
// automated responses without the Formspree subscription.
//
// Sprint 7 progression:
//
//   7a  — Scaffold + routing. /api/* returns stub 501 responses.
//   7b  — Email library + templates (pure library, not wired).
//   7c (THIS SPRINT) — Handlers wired. Each endpoint validates the
//        body, checks the honeypot, builds notification + auto-
//        responder emails from templates.js, and sends both via
//        sendEmail() in parallel. Partial failures are surfaced:
//        notification failure = 500 back to user (their message
//        didn't get through); notification ok but auto-responder
//        failure = 200 to user + console.error for us.
//   7d  — Deployment guide + HTML form cutover (Formspree retirement)
//
// Handlers are STILL not called by the production forms — those
// still post to Formspree. Sprint 7d cuts them over. Until then
// /api/* is only reachable by curl or a manual test.

import { sendEmail } from './lib/email.js';
import {
  isValidEmail,
  isSpamHoneypot,
  requireFields,
  enforceMaxLengths,
  assertSafeHttpUrl,
  pickLang,
} from './lib/validation.js';
import { withAuditCache } from './lib/audit-cache.js';
import { createRateLimiter, clientIpFromRequest } from './lib/rate-limit.js';
import { RateLimiter, checkDurableRateLimit } from './lib/rate-limiter-do.js';
import { saveSnapshot, getSnapshot, getSnapshotOg, isValidTokenShape } from './lib/audit-snapshots.js';

// Durable Object classes must be re-exported from the Worker entry
// module so the runtime can instantiate them when the binding fires.
// Leaving this export in place when the binding is still commented in
// wrangler.jsonc is harmless — the class is defined but never
// instantiated.
export { RateLimiter };

// Compute the X-Audit-Cache header value from a withAuditCache result.
// Three states: 'hit' (fresh, within TTL), 'stale-fallback' (upstream
// errored, served a cached value between TTL and 2× TTL), 'miss'
// (fresh upstream fetch). Owners can see which they got via devtools
// and the UI can surface stale-fallback as a disclosure.
function auditCacheHeader(cached) {
  if (!cached) return 'miss';
  if (cached.staleFallback) return 'stale-fallback';
  return cached.cacheHit ? 'hit' : 'miss';
}

// Per-isolate rate limiter. 30 requests per IP per 60 s — generous
// enough that a real owner re-auditing after every fix never hits it,
// tight enough to blunt the common "one IP, many URLs" burst attack
// that would otherwise exhaust PSI / Places / Resend / LLM quotas.
// See src/lib/rate-limit.js for the full scope discussion.
const API_RATE_LIMITER = createRateLimiter({ windowMs: 60_000, max: 30 });

// Form / email endpoints have a tighter budget because each POST
// triggers up to two Resend emails (free tier: 100/day).
const FORM_RATE_LIMITER = createRateLimiter({ windowMs: 3600_000, max: 10 });

const FORM_RATE_LIMIT_PATHS = new Set([
  '/api/intake',
  '/api/checklist',
  '/api/audit-report',
  '/api/schedule-reaudit'
]);
// D1: /api/audit-snapshot intentionally stays on the lighter
// api-tier (30/min/IP) — a legit shared link might be opened by
// half a dozen collaborators from one office NAT, and legitimate
// POSTs only fire when an owner clicks "share" (once per session).
import {
  intakeNotification,
  intakeAutoResponder,
  checklistNotification,
  checklistAutoResponder,
  auditReportNotification,
  auditReportAutoResponder,
  auditDeepReportNotification,
  auditDeepReportAutoResponder,
  reauditReminder,
} from './lib/templates.js';


// ------------------------------------------------------------
// API route table
// ------------------------------------------------------------

const API_ROUTES = {
  '/api/intake':        handleIntake,
  '/api/checklist':     handleChecklist,
  '/api/audit-report':  handleAuditReport,
  '/api/audit-snapshot': handleAuditSnapshot,
  '/api/og-snapshot':    handleOgSnapshot,
  '/api/ping':          handlePing,
  '/api/gbp-lookup':    handleGbpLookup,
  '/api/seo-check':     handleSeoCheck,
  '/api/schema-check':  handleSchemaCheck,
  '/api/page-crawl':    handlePageCrawl,
  '/api/psi':           handlePsi,
  '/api/did-you-mean':  handleDidYouMean,
  '/api/observatory':   handleObservatory,
  '/api/wayback-first-seen': handleWaybackFirstSeen,
  '/api/crux-history':  handleCruxHistory,
  '/api/gbp-details':   handleGbpDetails,
  '/api/brand-dossier': handleBrandDossier,
  '/api/dns-email-health': handleDnsEmailHealth,
  '/api/schedule-reaudit': handleScheduleReaudit,
};


// ------------------------------------------------------------
// Worker entry point
// ------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Sprint D3: embeddable SVG audit badge. Handled outside the
    // /api/* routing because it serves an SVG (not JSON) and is
    // meant to be dropped into an <img src=...> on a restaurant's
    // own website.
    if (pathname === '/badge/restaurant') {
      return handleBadgeRestaurant(request, env, ctx);
    }
    if (pathname === '/api/badge-snapshot') {
      return handleBadgeSnapshot(request, env, ctx);
    }

    // API routes — check the exact-match table first.
    if (pathname.startsWith('/api/')) {
      const handler = API_ROUTES[pathname];
      if (!handler) {
        return jsonResponse(
          { ok: false, error: 'Unknown API endpoint', path: pathname },
          404
        );
      }
      // /api/brand-dossier accepts POST only (it carries the signal
      // payload in the body). Not in the GET-allowlist below, so it
      // falls through to the default POST-only branch.
      //
      // D1: /api/audit-snapshot accepts BOTH — POST creates a new
      // snapshot, GET (?token=XXX) reads one. Branches via a third
      // arm so neither of the existing method-checks below rejects
      // a legitimate call.
      if (pathname === '/api/audit-snapshot') {
        if (request.method !== 'GET' && request.method !== 'POST') {
          return jsonResponse({ ok: false, error: 'Method not allowed — audit-snapshot accepts GET or POST' }, 405);
        }
      } else if (pathname === '/api/og-snapshot' || pathname === '/api/ping' || pathname === '/api/gbp-lookup' || pathname === '/api/seo-check' || pathname === '/api/schema-check' || pathname === '/api/page-crawl' || pathname === '/api/psi' || pathname === '/api/did-you-mean' || pathname === '/api/observatory' || pathname === '/api/wayback-first-seen' || pathname === '/api/crux-history' || pathname === '/api/gbp-details' || pathname === '/api/dns-email-health') {
        if (request.method !== 'GET') {
          return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
        }
      } else {
        if (request.method !== 'POST') {
          return jsonResponse(
            { ok: false, error: 'Method not allowed — form endpoints accept POST only' },
            405
          );
        }
      }
      // Sprint U2: every API request gets an X-Request-Id. If the
      // caller supplied one we honor it (makes client-side retry
      // correlation trivial); otherwise we mint a new one.
      const reqId = request.headers.get('x-request-id') || crypto.randomUUID();
      const started = Date.now();

      // Per-IP throttle. /api/ping bypasses so ops can health-check
      // without burning the caller's own budget. Form endpoints use a
      // tighter per-hour budget because each hits Resend's free tier.
      //
      // Two-tier enforcement:
      //   1. Durable-Object sliding window (global across isolates)
      //      when env.RATE_LIMITER is bound. Authoritative.
      //   2. In-isolate sliding window as the fallback when the DO
      //      binding is absent (local dev, pre-deploy, or after a DO
      //      outage). Less precise but zero extra latency.
      // checkDurableRateLimit never throws — a DO outage is logged
      // and the request is treated as allowed by that layer so a
      // real user is never blocked because of an infrastructure
      // blip. The in-isolate fallback still caps bursts within one
      // isolate in that degraded mode.
      if (pathname !== '/api/ping') {
        const ip = clientIpFromRequest(request);
        const isForm = FORM_RATE_LIMIT_PATHS.has(pathname);
        const tier = isForm
          ? { name: 'form', windowMs: 3600_000, max: 10 }
          : { name: 'api',  windowMs: 60_000,   max: 30 };

        let deny = null;
        if (env.RATE_LIMITER) {
          deny = await checkDurableRateLimit(env, tier.name + ':' + ip, tier.windowMs, tier.max);
        } else {
          const localLimiter = isForm ? FORM_RATE_LIMITER : API_RATE_LIMITER;
          deny = localLimiter.check(ip);
        }

        if (deny) {
          console.log(JSON.stringify({
            event: 'api.rate_limited',
            path: pathname,
            method: request.method,
            retryAfter: deny.retryAfterSeconds,
            tier: tier.name,
            reqId: reqId
          }));
          const throttled = jsonResponse({ ok: false, error: 'rate-limited', retryAfterSeconds: deny.retryAfterSeconds }, 429);
          throttled.headers.set('Retry-After', String(deny.retryAfterSeconds));
          throttled.headers.set('X-Request-Id', reqId);
          return throttled;
        }
      }

      try {
        const response = await handler(request, env, ctx);
        // Sprint U1: structured access log, one JSON line per request,
        // so Cloudflare's observability panel can slice by event /
        // status / path / duration without regex parsing.
        console.log(JSON.stringify({
          event: 'api.response',
          path: pathname,
          method: request.method,
          status: response.status,
          ms: Date.now() - started,
          reqId: reqId
        }));
        // Clone headers on the way out so we can stamp the request id
        // without mutating the handler's response (Response headers
        // are immutable after construction).
        const out = new Response(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: new Headers(response.headers)
        });
        out.headers.set('X-Request-Id', reqId);
        return out;
      } catch (err) {
        console.log(JSON.stringify({
          event: 'api.error',
          path: pathname,
          method: request.method,
          ms: Date.now() - started,
          reqId: reqId,
          error: err && err.message ? err.message : String(err)
        }));
        console.error('[api]', pathname, err && err.stack ? err.stack : err);
        const fallback = jsonResponse(
          { ok: false, error: 'Internal error — please try again in a moment', reqId: reqId },
          500
        );
        fallback.headers.set('X-Request-Id', reqId);
        return fallback;
      }
    }

    // Not an API route. Before falling through to static assets,
    // sniff for a Spanish-speaking first-time visitor at the site
    // root and attach an advisory header so the page can show an
    // opt-in "Ver en español" banner client-side. We deliberately
    // do NOT redirect — redirects on "/" are hostile to crawlers,
    // curl, and cache keys. Deep links to /es/* are always served
    // verbatim from the static assets below.
    //
    // The hint fires only when:
    //   - the request is GET
    //   - the path is exactly "/" (root)
    //   - the visitor has no md_locale preference cookie yet
    //   - Accept-Language leads with a Spanish tag
    //
    // This is a pure passive signal. Omitting it has zero
    // functional impact on the site.
    if (request.method === 'GET' && pathname === '/') {
      const cookies = request.headers.get('cookie') || '';
      const hasPref = /(?:^|;\s*)md_locale=/.test(cookies);
      if (!hasPref) {
        const accept = (request.headers.get('accept-language') || '').toLowerCase();
        // Match "es" or "es-XX" as the leading language tag. We avoid
        // a broad /es/ regex to keep "fr-CA,es;q=0.1" from tripping
        // the hint — only visitors whose browser asks for Spanish
        // first (or right after English) get the banner.
        const leadsWithSpanish = /^\s*es\b/.test(accept)
          || /^\s*en[^,]*,\s*es\b/.test(accept);
        if (leadsWithSpanish) {
          const res = await env.ASSETS.fetch(request);
          const h = new Headers(res.headers);
          h.set('x-locale-hint', 'es');
          // Any downstream cache keyed on Accept-Language should know
          // that this response's payload is identical but headers vary.
          const existingVary = h.get('vary');
          h.set('vary', existingVary ? `${existingVary}, Accept-Language` : 'Accept-Language');
          return new Response(res.body, {
            status: res.status,
            statusText: res.statusText,
            headers: h,
          });
        }
      }
    }

    // D7b: social-crawler meta injection for shared audit permalinks.
    // When the request is for the audit tool page AND carries a valid
    // ?s=<token> query param, pull the snapshot metadata from KV and
    // rewrite og:*/twitter:* meta tags on the static response so Slack,
    // LinkedIn, X, Facebook, etc. render the per-snapshot score card
    // instead of the generic site OG. The rewrite is streaming via
    // HTMLRewriter — zero overhead when ?s= isn't present.
    const snapshotPaths = ['/tools/audits/restaurant/', '/tools/audits/restaurant/index.html',
                           '/es/tools/audits/restaurant/', '/es/tools/audits/restaurant/index.html'];
    if (request.method === 'GET' && snapshotPaths.includes(pathname)) {
      const snapToken = url.searchParams.get('s');
      if (snapToken && isValidTokenShape(snapToken) && env.AUDIT_SNAPSHOTS) {
        const snap = await getSnapshot(env, snapToken);
        if (snap.ok && snap.snapshot) {
          const base = await env.ASSETS.fetch(request);
          return rewriteAuditPageForSnapshot(base, snap.snapshot, snapToken, url);
        }
      }
    }

    // Fall through to the static-asset server.
    return env.ASSETS.fetch(request);
  },
};

// D7b: rewrite og:*/twitter:* meta tags on the audit tool page so
// shared permalinks get a rich per-snapshot social card. Uses
// HTMLRewriter, which Cloudflare offers as a zero-parse streaming
// transformer — each matched element handler runs as the bytes flow
// through, no DOM construction.
//
// String computation extracted to buildSnapshotMetaOverrides() so the
// logic can be unit-tested without needing an HTMLRewriter instance.
export function buildSnapshotMetaOverrides(snapshot, token, reqUrl) {
  const score = (typeof snapshot.score === 'number') ? Math.round(snapshot.score) : null;
  const host = (function() {
    try { return new URL(snapshot.auditedUrl).host.replace(/^www\./i, ''); }
    catch (_) { return String(snapshot.auditedUrl || '').slice(0, 80); }
  })();
  const isEs = snapshot.language === 'es';
  const titleLabel = isEs ? 'Puntuación de auditoría' : 'Audit score';
  const ogTitle = (score !== null)
    ? `${titleLabel}: ${score}/100 — ${host}`
    : `${isEs ? 'Auditoría compartida' : 'Shared audit'} — ${host}`;
  // Description: verdict if present, otherwise a generic one.
  const rawVerdict = (snapshot.verdict || '').replace(/\s+/g, ' ').trim();
  const ogDescription = rawVerdict
    ? (rawVerdict.length > 200 ? rawVerdict.slice(0, 199) + '…' : rawVerdict)
    : (isEs
        ? `Auditoría del sitio web del restaurante compartida desde muntin.digital.`
        : `A restaurant website audit snapshot shared from muntin.digital.`);
  // og:image: always the snapshot OG endpoint. When no custom OG
  // was saved, /api/og-snapshot redirects to the static brand card.
  const origin = reqUrl.origin;
  const ogImage = `${origin}/api/og-snapshot?token=${encodeURIComponent(token)}`;
  // og:url: honor the locale path the request came in on.
  const canonicalUrl = `${origin}${reqUrl.pathname}?s=${encodeURIComponent(token)}`;
  return { ogTitle, ogDescription, ogImage, canonicalUrl };
}

function rewriteAuditPageForSnapshot(response, snapshot, token, reqUrl) {
  const { ogTitle, ogDescription, ogImage, canonicalUrl } = buildSnapshotMetaOverrides(snapshot, token, reqUrl);

  const rw = new HTMLRewriter()
    .on('meta[property="og:title"]',       { element(el) { el.setAttribute('content', ogTitle); } })
    .on('meta[name="twitter:title"]',      { element(el) { el.setAttribute('content', ogTitle); } })
    .on('meta[property="og:description"]', { element(el) { el.setAttribute('content', ogDescription); } })
    .on('meta[name="twitter:description"]',{ element(el) { el.setAttribute('content', ogDescription); } })
    .on('meta[property="og:image"]',       { element(el) { el.setAttribute('content', ogImage); } })
    .on('meta[name="twitter:image"]',      { element(el) { el.setAttribute('content', ogImage); } })
    .on('meta[property="og:url"]',         { element(el) { el.setAttribute('content', canonicalUrl); } });
  // Clone so we can strip the content-length header that won't be
  // accurate once the rewriter streams its output.
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  // Social crawlers sometimes aggressively cache OG lookups.
  // Short cache is fine because snapshots are immutable once written.
  const existingCc = headers.get('cache-control');
  if (!existingCc || existingCc.indexOf('no-store') === -1) {
    headers.set('cache-control', 'public, max-age=300, s-maxage=900');
  }
  return rw.transform(new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  }));
}


// ============================================================
// Sprint 7c: real form handlers
// ============================================================
//
// All three handlers follow the same pipeline:
//
//   1. Parse body (supports urlencoded, multipart, and JSON)
//   2. Check the honeypot — silently drop spam submissions with a
//      fake-success 200 so bots get no signal
//   3. Validate: required fields, email format, length guards
//   4. Build notification (to Don) + auto-responder (to the user)
//      from the templates module
//   5. Send both in parallel via Promise.allSettled so one failing
//      doesn't block the other
//   6. Decide outcome:
//        - Notification failed → 500 to user. The message didn't
//          reach Don so we have to tell them. They can email him
//          directly as a fallback
//        - Notification ok, auto-responder failed → 200 to user.
//          Their message went through; they just won't see a
//          confirmation email. We console.error for observability
//          so we can fix the issue later
//        - Both ok → 200 to user
//
// The consistent shape returned to the client is:
//   { ok: true,  status: "sent"  | "sent-without-confirmation" }
//   { ok: false, error: "..." }


async function handleIntake(request, env, ctx) {
  const body = await parseFormBody(request);

  // Silently accept spam so bots get no signal
  if (isSpamHoneypot(body)) {
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  // Locale comes from a hidden <input name="locale"> on the form.
  // The Spanish /es/ pages stamp "es"; English pages omit the field
  // and default to "en". Used here to surface validation errors in
  // the same language the user is reading. Anything else is treated
  // as English for safety.
  const locale = (String(body.locale || '').trim().toLowerCase() === 'es') ? 'es' : 'en';
  const err = (en, es) => (locale === 'es' ? es : en);

  // Required fields: name, email, services, goals. Business,
  // website, budget, and referral are optional per the form HTML.
  const required = requireFields(body, ['name', 'email', 'services', 'goals']);
  if (!required.ok) {
    // The validation helpers embed the missing field name in English;
    // we localize the wrapper ("Missing required field") and keep the
    // field name untouched so the developer can trace form-field
    // mismatches without a Spanish dictionary.
    const fieldName = required.error.replace(/^Missing required field:\s*/i, '');
    const message = err(required.error, 'Falta un campo obligatorio: ' + fieldName);
    return jsonResponse({ ok: false, error: message }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: err('Please enter a valid email address', 'Ingresa un correo electrónico válido') }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    // enforceMaxLengths embeds a field name + limit. Preserve the
    // structural details, just localize the framing.
    const m = lengths.error.match(/^Field '(.+?)' is longer than the (\d+)-character limit$/);
    const message = (locale === 'es' && m)
      ? 'El campo «' + m[1] + '» supera el límite de ' + m[2] + ' caracteres.'
      : lengths.error;
    return jsonResponse({ ok: false, error: message }, 400);
  }

  const notificationTmpl = intakeNotification(body);
  const autoReplyTmpl    = intakeAutoResponder(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    endpoint:     'intake',
  });
}


async function handleChecklist(request, env, ctx) {
  const body = await parseFormBody(request);

  if (isSpamHoneypot(body)) {
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const required = requireFields(body, ['email']);
  if (!required.ok) {
    return jsonResponse({ ok: false, error: required.error }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: 'Please enter a valid email address' }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    return jsonResponse({ ok: false, error: lengths.error }, 400);
  }

  const notificationTmpl = checklistNotification(body);
  const autoReplyTmpl    = checklistAutoResponder(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    endpoint:     'checklist',
  });
}


async function handleAuditReport(request, env, ctx) {
  const body = await parseFormBody(request);

  if (isSpamHoneypot(body)) {
    return jsonResponse({ ok: true, status: 'sent' }, 200);
  }

  const required = requireFields(body, ['email']);
  if (!required.ok) {
    return jsonResponse({ ok: false, error: required.error }, 400);
  }
  if (!isValidEmail(body.email)) {
    return jsonResponse({ ok: false, error: 'Please enter a valid email address' }, 400);
  }
  const lengths = enforceMaxLengths(body);
  if (!lengths.ok) {
    return jsonResponse({ ok: false, error: lengths.error }, 400);
  }

  // Phase L4: dispatch on body.interest. Phase J retired its
  // deep-report email gate (Sprint L1); the two live interest
  // values are now:
  //   restaurant-audit-report       — top + bottom PDF CTAs
  //                                   (Sprint L2/L3); the audit
  //                                   PDF rides along in body.pdf_b64
  //   restaurant-audit-deep-report  — retained route for any
  //                                   legacy cached-page submits.
  //                                   Same templates + same PDF
  //                                   handling as the main flow.
  const interestStr = String(body.interest || '').trim();
  const useDeepTmpl = interestStr === 'restaurant-audit-report' ||
                      interestStr === 'restaurant-audit-deep-report';
  const notificationTmpl = useDeepTmpl
    ? auditDeepReportNotification(body)
    : auditReportNotification(body);
  const autoReplyTmpl = useDeepTmpl
    ? auditDeepReportAutoResponder(body)
    : auditReportAutoResponder(body);

  // Phase L4: if the client built a PDF of their audit, forward it
  // as a Resend attachment on BOTH the notification and the auto-
  // responder so Don sees the same deliverable the user received.
  const attachments = buildPdfAttachments(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    attachments:  attachments,
    endpoint:     useDeepTmpl ? 'audit-deep-report' : 'audit-report',
  });
}

// Pull pdf_b64 + pdf_filename off the form body and return the
// Resend-ready attachment array. Returns an empty array when no
// valid PDF is on the body — callers just pass the result through
// to sendEmail's opts.attachments without further checks.
function buildPdfAttachments(body) {
  const b64  = typeof body.pdf_b64      === 'string' ? body.pdf_b64.trim()      : '';
  const name = typeof body.pdf_filename === 'string' ? body.pdf_filename.trim() : '';
  if (!b64) return [];
  // A PDF starts with 'JVBERi0' in base64 ('%PDF-' decoded). If the
  // prefix doesn't match we assume the client sent junk and silently
  // drop the attachment — the email still goes through.
  if (b64.indexOf('JVBERi0') !== 0 && b64.indexOf('JVBER') !== 0) return [];
  const safeName = /^[-_.A-Za-z0-9]+$/.test(name) && /\.pdf$/i.test(name)
    ? name
    : 'muntin-audit.pdf';
  return [{ filename: safeName, content: b64 }];
}


// ------------------------------------------------------------
// Shared send-pair helper
// ------------------------------------------------------------
//
// Handles the common "send notification to Don + send auto-responder
// to user" flow. Every handler calls this with its already-built
// templates. All error surfacing, outcome classification, and
// response shaping lives here so the handlers above stay focused
// on validation and template assembly.

async function sendPair({ env, userEmail, notification, autoReply, endpoint, attachments }) {
  if (!env.RESEND_API_KEY) {
    // Misconfiguration — the Worker was deployed without the
    // RESEND_API_KEY secret being set. This should never happen
    // in production (the deploy guide tells you to set it first)
    // but surface it clearly so the fix is obvious.
    console.error('[api]', endpoint, 'RESEND_API_KEY secret is not configured');
    return jsonResponse(
      { ok: false, error: "We're having a configuration issue on our end. Please email don@muntin.digital directly and I'll take care of you." },
      500
    );
  }

  const fromEmail   = env.FROM_EMAIL   || 'Muntin Digital <don@muntin.digital>';
  const notifyEmail = env.NOTIFY_EMAIL || 'don@muntin.digital';

  // Fire both in parallel. Promise.allSettled so one failing doesn't
  // short-circuit the other.
  const [notifyResult, autoResult] = await Promise.allSettled([
    sendEmail(
      {
        to:      notifyEmail,
        from:    fromEmail,
        // Reply-To set to the user's email so Don can just hit Reply
        // in his inbox to respond directly. This is the single most
        // important piece of ergonomics on the notification email.
        replyTo: userEmail,
        subject: notification.subject,
        html:    notification.html,
        text:    notification.text,
        attachments: attachments,
      },
      env.RESEND_API_KEY
    ),
    sendEmail(
      {
        to:      userEmail,
        from:    fromEmail,
        // Reply-To the real inbox so if the user hits Reply to the
        // auto-responder, their message lands with Don, not nowhere.
        replyTo: notifyEmail,
        subject: autoReply.subject,
        html:    autoReply.html,
        text:    autoReply.text,
        attachments: attachments,
      },
      env.RESEND_API_KEY
    ),
  ]);

  const notifySent = notifyResult.status === 'fulfilled' && notifyResult.value && notifyResult.value.ok;
  const autoSent   = autoResult.status === 'fulfilled' && autoResult.value && autoResult.value.ok;

  if (!notifySent) {
    // Notification failed — the submission didn't reach Don. We
    // HAVE to tell the user. They can email him directly as a
    // fallback path (mentioned in the error copy).
    const reason = notifyResult.status === 'fulfilled'
      ? (notifyResult.value && notifyResult.value.error)
      : (notifyResult.reason && notifyResult.reason.message);
    console.error('[api]', endpoint, 'notification failed:', reason);
    return jsonResponse(
      {
        ok: false,
        error: "We couldn't deliver your message just now. Please email don@muntin.digital directly — I'll get it from there.",
      },
      500
    );
  }

  if (!autoSent) {
    // Notification went through but the auto-responder failed.
    // The user's message still reached Don — we don't want to
    // scare them with an error here. Log it so we can investigate
    // (maybe the user's address bounced, maybe Resend flagged it
    // as a dupe of the notification) and return success.
    const reason = autoResult.status === 'fulfilled'
      ? (autoResult.value && autoResult.value.error)
      : (autoResult.reason && autoResult.reason.message);
    console.error('[api]', endpoint, 'auto-responder failed:', reason);
    return jsonResponse(
      { ok: true, status: 'sent-without-confirmation' },
      200
    );
  }

  // Both succeeded — the happy path
  return jsonResponse({ ok: true, status: 'sent' }, 200);
}


// ------------------------------------------------------------
// Diagnostic: /api/ping
// ------------------------------------------------------------

async function handlePing(request, env, ctx) {
  return jsonResponse(
    {
      ok: true,
      service: 'muntin-digital forms api',
      sprint: '7c',
      timestamp: new Date().toISOString(),
      routes: Object.keys(API_ROUTES),
      // Configuration readiness without leaking the actual key.
      // A false value here means the corresponding feature will
      // fall back to its unconfigured branch (PSI direct-call
      // fallback, Places lookup disabled, email send disabled,
      // …) so ops can verify secrets are plumbed without actually
      // exercising the upstreams.
      configured: {
        resend:  Boolean(env.RESEND_API_KEY),
        from:    Boolean(env.FROM_EMAIL),
        notify:  Boolean(env.NOTIFY_EMAIL),
        psi:     Boolean(env.PSI_API_KEY),
        places:  Boolean(env.GOOGLE_PLACES_KEY),
        // Sprint T3: binding-present flag so ops can verify the KV
        // cache + future AI Gateway bindings are wired without
        // exercising them.
        auditCache: Boolean(env.AUDIT_CACHE),
        aiGateway:  Boolean(env.AI),
      },
    },
    200
  );
}


// ------------------------------------------------------------
// GBP Lookup — proxies Google Places API, keeping the key
// server-side. Client sends GET /api/gbp-lookup?q=business+name
// and receives a JSON payload with rating, review count, types,
// hours, photos count, and address.
// ------------------------------------------------------------

async function handleGbpLookup(request, env, ctx) {
  const apiKey = env.GOOGLE_PLACES_KEY;
  if (!apiKey) {
    return jsonResponse({ ok: false, error: 'Google Places API key not configured' }, 503);
  }

  const url = new URL(request.url);
  const query = (url.searchParams.get('q') || '').trim();
  if (!query) {
    return jsonResponse({ ok: false, error: 'Missing ?q= parameter — pass your business name + city' }, 400);
  }

  try {
    // Step 1: Text Search to find the place
    const searchRes = await fetch(
      'https://places.googleapis.com/v1/places:searchText',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
          // Sprint M1.1: expanded field mask. The previous mask fetched
          // only enough to answer "is this the right business?" The new
          // mask asks Places for every signal the audit can use to
          // eliminate its Yes/No unverified-check dance:
          //   * priceLevel           → drives schema.priceRange fuse
          //   * businessStatus       → confidence signal (open / closed)
          //   * dineIn/takeout/delivery → resolves conversions unverified
          //   * serves*              → resolves dietary, corroborates subtype
          //   * reservable           → resolves reservations unverified
          //   * primaryTypeDisplayName → corroborates subtype detector
          //   * editorialSummary     → feeds brand copy + detector hints
          //   * nationalPhoneNumber  → resolves phone unverified
          //   * currentOpeningHours.weekdayDescriptions → human hours text
          //   * location             → resolves map unverified (lat/lng)
          // Every added field is SKU-compatible with the existing call
          // (standard SKUs only, no Pro-only fields), so cost per
          // lookup is unchanged.
          'X-Goog-FieldMask': [
            'places.id',
            'places.displayName',
            'places.formattedAddress',
            'places.rating',
            'places.userRatingCount',
            'places.types',
            'places.regularOpeningHours',
            'places.currentOpeningHours.weekdayDescriptions',
            'places.photos',
            'places.websiteUri',
            'places.googleMapsUri',
            'places.priceLevel',
            'places.businessStatus',
            'places.dineIn',
            'places.takeout',
            'places.delivery',
            'places.reservable',
            'places.servesBreakfast',
            'places.servesLunch',
            'places.servesDinner',
            'places.servesBrunch',
            'places.servesVegetarianFood',
            'places.servesBeer',
            'places.servesWine',
            'places.servesCocktails',
            'places.servesCoffee',
            'places.servesDessert',
            'places.primaryTypeDisplayName',
            'places.editorialSummary',
            'places.nationalPhoneNumber',
            'places.location'
          ].join(',')
        },
        // Sprint G1: request the top 5 candidates so the client can
        // disambiguate on common names like "Joe's Pizza" where
        // Places' first match may not be the business the owner
        // actually runs. maxResultCount=5 is Places' recommended
        // upper bound for text search; beyond that the tail is noise.
        body: JSON.stringify({ textQuery: query, maxResultCount: 5 })
      }
    );

    if (!searchRes.ok) {
      const errBody = await searchRes.text();
      console.error('[gbp-lookup] Places API error:', searchRes.status, errBody);
      return jsonResponse({ ok: false, error: 'Google Places API returned an error' }, 502);
    }

    const searchData = await searchRes.json();
    const places = searchData.places || [];
    if (!places.length) {
      return jsonResponse({ ok: false, error: 'No business found for that search. Try adding your city name.' }, 404);
    }

    function buildCandidate(p) {
      // Sprint M1.1: pass every newly-requested field through to the
      // client. Null/undefined-safe because Places omits fields Google
      // can't verify (e.g. a restaurant with no confirmed takeout
      // returns no `takeout` key rather than `false`). Detectors in
      // restaurant-checks.js treat `null` as "unknown" and `true/false`
      // as confident.
      const weekdayHours = p.currentOpeningHours && p.currentOpeningHours.weekdayDescriptions
        ? p.currentOpeningHours.weekdayDescriptions : null;
      return {
        placeId:    p.id || null,
        name:       p.displayName ? p.displayName.text : null,
        address:    p.formattedAddress || null,
        rating:     p.rating || null,
        reviewCount: p.userRatingCount || 0,
        types:      (p.types || []).slice(0, 5),
        photoCount: p.photos ? p.photos.length : 0,
        hasHours:   !!(p.regularOpeningHours && p.regularOpeningHours.periods && p.regularOpeningHours.periods.length),
        website:    p.websiteUri || null,
        mapsUrl:    p.googleMapsUri || null,
        // New in M1.1 — these are the signals every detector fuse
        // (M1.5–M1.14) reads from to eliminate unverified statuses.
        priceLevel:              typeof p.priceLevel === 'string' ? p.priceLevel : null,
        businessStatus:          p.businessStatus || null,
        dineIn:                  typeof p.dineIn   === 'boolean' ? p.dineIn   : null,
        takeout:                 typeof p.takeout  === 'boolean' ? p.takeout  : null,
        delivery:                typeof p.delivery === 'boolean' ? p.delivery : null,
        reservable:              typeof p.reservable === 'boolean' ? p.reservable : null,
        servesBreakfast:         typeof p.servesBreakfast        === 'boolean' ? p.servesBreakfast        : null,
        servesLunch:             typeof p.servesLunch            === 'boolean' ? p.servesLunch            : null,
        servesDinner:            typeof p.servesDinner           === 'boolean' ? p.servesDinner           : null,
        servesBrunch:            typeof p.servesBrunch           === 'boolean' ? p.servesBrunch           : null,
        servesVegetarianFood:    typeof p.servesVegetarianFood   === 'boolean' ? p.servesVegetarianFood   : null,
        servesBeer:              typeof p.servesBeer             === 'boolean' ? p.servesBeer             : null,
        servesWine:              typeof p.servesWine             === 'boolean' ? p.servesWine             : null,
        servesCocktails:         typeof p.servesCocktails        === 'boolean' ? p.servesCocktails        : null,
        servesCoffee:            typeof p.servesCoffee           === 'boolean' ? p.servesCoffee           : null,
        servesDessert:           typeof p.servesDessert          === 'boolean' ? p.servesDessert          : null,
        primaryTypeDisplayName:  p.primaryTypeDisplayName && p.primaryTypeDisplayName.text
                                   ? p.primaryTypeDisplayName.text : null,
        editorialSummary:        p.editorialSummary && p.editorialSummary.text
                                   ? p.editorialSummary.text : null,
        nationalPhoneNumber:     p.nationalPhoneNumber || null,
        weekdayHoursText:        weekdayHours,
        location:                p.location && typeof p.location.latitude === 'number' && typeof p.location.longitude === 'number'
                                   ? { lat: p.location.latitude, lng: p.location.longitude }
                                   : null
      };
    }

    const candidates = places.map(buildCandidate);
    const top = candidates[0];

    // Preserve the historical top-level shape for backwards-compat
    // with any caller that wasn't expecting the `candidates` array,
    // while adding the full top-5 under `candidates` for the new
    // disambiguation UI (G3, future sprint).
    const result = Object.assign({ ok: true }, top, {
      candidates: candidates
    });

    return jsonResponse(result, 200);
  } catch (err) {
    console.error('[gbp-lookup] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to reach Google Places API' }, 502);
  }
}


// ------------------------------------------------------------
// SEO Check — fetches a page server-side and extracts the
// <title> and <meta name="description"> content that Lighthouse
// doesn't reliably expose in its audit details.
// ------------------------------------------------------------

async function handleSeoCheck(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // Sprint E2: SSRF guard — refuse non-http(s), private IP ranges,
  // localhost aliases, URLs with embedded credentials, and URLs
  // longer than 2048 chars.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(gate.url.toString(), {
      headers: { 'User-Agent': 'MuntinDigital-SEO-Check/1.0' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return jsonResponse({ ok: false, error: 'Could not fetch the page (HTTP ' + res.status + ')' }, 502);
    }

    // Cap at 1.5 MB. Title + meta description live in <head>; we only
    // need the first chunk of the document. A pathological upstream
    // can't force the Worker to buffer a multi-MB body.
    const read = await readTextCapped(res, 1_500_000);
    const html = read.text;

    // Extract <title>
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : null;

    // Extract <meta name="description" content="...">
    const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*>/i)
      || html.match(/<meta[^>]*content\s*=\s*["']([\s\S]*?)["'][^>]*name\s*=\s*["']description["'][^>]*>/i);
    const description = descMatch ? descMatch[1].replace(/\s+/g, ' ').trim() : null;

    return jsonResponse({ ok: true, title, description }, 200);
  } catch (err) {
    console.error('[seo-check] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to fetch the page' }, 502);
  }
}


// ------------------------------------------------------------
// Schema Check — fetches a page server-side and extracts all
// JSON-LD @type values from <script type="application/ld+json">
// blocks. Fallback for when Lighthouse's structured-data audit
// doesn't return data.
// ------------------------------------------------------------

async function handleSchemaCheck(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  // Sprint E3: SSRF guard — same ruleset as E2.
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  try {
    const res = await fetch(gate.url.toString(), {
      headers: { 'User-Agent': 'MuntinDigital-Schema-Check/1.0' },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      const m = lang === 'es'
        ? 'No se pudo cargar la página (HTTP ' + res.status + ')'
        : 'Could not fetch the page (HTTP ' + res.status + ')';
      return jsonResponse({ ok: false, error: m }, 502);
    }

    // Cap at 1.5 MB. JSON-LD blocks are always inline in <head> or
    // early <body>; streaming with a hard cap prevents a 10 MB asset
    // dump from exhausting Worker memory before truncation can run.
    const schemaRead = await readTextCapped(res, 1_500_000);
    const html = schemaRead.text;
    const parsed = extractJsonLd(html);
    const validation = validateRestaurantSchema(parsed.objects, lang);

    return jsonResponse({
      ok: true,
      types: parsed.types,
      blockCount: parsed.blockCount,
      parseErrorCount: parsed.parseErrorCount,
      objects: parsed.objects,
      validation: validation
    }, 200);
  } catch (err) {
    console.error('[schema-check] exception:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to fetch the page' }, 502);
  }
}

// Schema types we treat as "Restaurant-like" for validation.
// Matches the breadth we want the audit to recognize — a bakery
// with @type: Bakery should still be validated against the
// Restaurant checklist (hours, address, phone) because the audit
// cares about local-business signal regardless of subtype.
const RESTAURANT_LIKE_SCHEMA_TYPES = {
  'Restaurant':           true,
  'FastFoodRestaurant':   true,
  'FoodEstablishment':    true,
  'CafeOrCoffeeShop':     true,
  'Cafe':                 true,
  'Bakery':               true,
  'BarOrPub':             true,
  'Brewery':              true,
  'Winery':               true,
  'Distillery':           true,
  'IceCreamShop':         true,
  'LocalBusiness':        true,
  'FoodService':          true
};

// Return true if an object's @type (string or array) includes any
// Restaurant-like schema type.
function isRestaurantLikeSchema(obj) {
  if (!obj) return false;
  const t = obj['@type'];
  if (typeof t === 'string') return !!RESTAURANT_LIKE_SCHEMA_TYPES[t];
  if (Array.isArray(t)) {
    for (let i = 0; i < t.length; i++) {
      if (typeof t[i] === 'string' && RESTAURANT_LIKE_SCHEMA_TYPES[t[i]]) return true;
    }
  }
  return false;
}

// ------------------------------------------------------------
// Restaurant schema validation — Phase F
// ------------------------------------------------------------
// Walks the parsed JSON-LD objects and reports on the fields the
// restaurant audit cares about. Each sprint in Phase F adds a new
// field-level check to the returned validation object:
//
//   F2: openingHours      — presence + 7-day completeness
//   F3: priceRange, servesCuisine (planned)
//   F4: acceptsReservations, hasMenu (planned)
//   F5: hours mismatch vs Places (planned; consumer-side)
//   F6: NAP consistency  (planned; consumer-side)
// Sprint ES3: localized reason strings for the H1-H4 validators.
// Each validator sets .reasonKey; finalizeSchemaReasons() maps it to
// EN or ES text based on the request locale. Keys stay stable for
// client-side rendering + parity checks.
const SCHEMA_REASONS = {
  'hours.missing':        { en: 'No openingHours or openingHoursSpecification on the Restaurant schema.',
                            es: 'No hay openingHours ni openingHoursSpecification en el schema del restaurante.' },
  'hours.partial':        { en: 'Only {dayCount} of 7 days covered — Google shows the rich-hours panel only when every day is present.',
                            es: 'Solo {dayCount} de 7 días cubiertos — Google muestra el panel de horarios enriquecidos solo cuando están todos los días.' },
  'hours.badTimes':       { en: '{timeFieldsBad} time values are not in HH:MM format — Google may silently drop the hours panel.',
                            es: '{timeFieldsBad} valores de hora no están en formato HH:MM — Google puede omitir silenciosamente el panel de horarios.' },
  'hours.parseErrors':    { en: '{parseErrors} day name could not be parsed — use Mo/Tu/We/Th/Fr/Sa/Su or full English names.',
                            es: 'No se pudo interpretar {parseErrors} nombre de día — usa Mo/Tu/We/Th/Fr/Sa/Su o nombres en inglés completos.' },
  'price.missing':        { en: 'No priceRange on the Restaurant schema. Google uses this to filter by price level.',
                            es: 'No hay priceRange en el schema del restaurante. Google lo usa para filtrar por nivel de precio.' },
  'price.badShape':       { en: 'priceRange "{value}" does not match a recognized shape (e.g. "$$", "$15-30", or "$25").',
                            es: 'priceRange "{value}" no coincide con un formato reconocido (p. ej. "$$", "$15-30" o "$25").' },
  'address.missing':      { en: 'No address on the Restaurant schema.',
                            es: 'No hay address en el schema del restaurante.' },
  'address.string':       { en: 'Address is a bare string; Google prefers a structured PostalAddress with streetAddress, addressLocality, addressRegion, and postalCode.',
                            es: 'La dirección es solo una cadena; Google prefiere un PostalAddress estructurado con streetAddress, addressLocality, addressRegion y postalCode.' },
  'address.missingFields':{ en: 'Address is missing: {fields}. Add these fields to qualify for local-search rich results.',
                            es: 'A la dirección le falta: {fields}. Agrega estos campos para calificar para resultados enriquecidos de búsqueda local.' },
  // Sprint M1.2: reasons for the three validators that previously
  // returned presence-only booleans. These feed the client's schema
  // gaps list and let ES renders show grammatical Spanish.
  'cuisine.missing':      { en: 'No servesCuisine on the Restaurant schema. Google uses this to match queries like "Mexican near me".',
                            es: 'No hay servesCuisine en el schema del restaurante. Google lo usa para emparejar búsquedas como "mexicano cerca de mí".' },
  'cuisine.tooGeneric':   { en: 'servesCuisine is only "{value}" — pair it with one or two specific cuisines (e.g. "Italian, Neapolitan Pizza") for better local-search match.',
                            es: 'servesCuisine solo dice "{value}" — acompáñalo con una o dos cocinas específicas (p. ej. "Italiana, Pizza Napolitana") para mejorar la coincidencia en búsquedas locales.' },
  'reservations.missing': { en: 'No acceptsReservations on the Restaurant schema. Even declaring `false` helps Google route reservation-intent queries away from you when you want walk-ins only.',
                            es: 'No hay acceptsReservations en el schema del restaurante. Incluso declarar `false` ayuda a Google a desviar búsquedas con intención de reserva cuando solo tomas walk-ins.' },
  'reservations.malformed':{ en: 'acceptsReservations is "{value}" — Google expects `true`, `false`, or a Reservation sub-object, not free-form text.',
                            es: 'acceptsReservations es "{value}" — Google espera `true`, `false` o un sub-objeto Reservation, no texto libre.' },
  'menu.missing':         { en: 'No hasMenu on the Restaurant schema. Adding a menu URL (or Menu sub-object) unlocks Google\'s menu rich-result card.',
                            es: 'No hay hasMenu en el schema del restaurante. Agregar una URL de menú (o un sub-objeto Menu) desbloquea la tarjeta enriquecida de menú en Google.' },
  'menu.badUrl':          { en: 'hasMenu is declared but the URL isn\'t http(s) — Google will silently drop the menu panel.',
                            es: 'hasMenu está declarado pero la URL no es http(s) — Google omitirá silenciosamente el panel del menú.' }
};
function formatReason(reasonKey, vars, lang) {
  if (!reasonKey) return null;
  const entry = SCHEMA_REASONS[reasonKey];
  if (!entry) return reasonKey;
  const tmpl = (lang === 'es' && entry.es) || entry.en;
  if (!vars) return tmpl;
  return tmpl.replace(/\{(\w+)\}/g, function(_m, k){
    return vars[k] != null ? String(vars[k]) : '';
  });
}

function validateRestaurantSchema(objects, lang) {
  const restaurantObjects = (objects || []).filter(isRestaurantLikeSchema);
  const L = lang || 'en';
  const hours = validateOpeningHours(restaurantObjects);
  if (hours.reasonKey) hours.reason = formatReason(hours.reasonKey, hours.reasonVars, L);
  const price = validatePriceRange(restaurantObjects);
  if (price.reasonKey) price.reason = formatReason(price.reasonKey, price.reasonVars, L);
  const address = validateAddress(restaurantObjects);
  if (address.reasonKey) address.reason = formatReason(address.reasonKey, address.reasonVars, L);
  // Sprint M1.2: finish the three validators that used to return
  // presence-only booleans — cuisine, reservations, and menu — and
  // resolve their localized reason strings on the way out.
  const cuisine = validateServesCuisine(restaurantObjects);
  if (cuisine.reasonKey) cuisine.reason = formatReason(cuisine.reasonKey, cuisine.reasonVars, L);
  const reservations = validateAcceptsReservations(restaurantObjects);
  if (reservations.reasonKey) reservations.reason = formatReason(reservations.reasonKey, reservations.reasonVars, L);
  const menu = validateHasMenu(restaurantObjects);
  if (menu.reasonKey) menu.reason = formatReason(menu.reasonKey, menu.reasonVars, L);
  return {
    restaurantObjectCount: restaurantObjects.length,
    openingHours:        hours,
    priceRange:          price,
    servesCuisine:       cuisine,
    acceptsReservations: reservations,
    hasMenu:             menu,
    address:             address
  };
}

// Sprint H3: address validation. Looks at the .address field on
// each restaurant-like object. Address can be a string (discouraged
// but legal), or a PostalAddress object with named sub-fields. We
// report { present, valid, reason, missingFields } so the renderer
// can surface "you have an address but postalCode is missing" —
// exactly the kind of gap that prevents Rich Results eligibility.
function validateAddress(restaurantObjects) {
  let present = false;
  const wanted = ['streetAddress', 'addressLocality', 'addressRegion', 'postalCode'];
  const found = Object.create(null);
  let rawAddress = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const addr = restaurantObjects[i].address;
    if (!addr) continue;
    present = true;
    if (typeof addr === 'string') {
      rawAddress = addr;
      continue; // string form — can't audit sub-fields, just presence
    }
    if (typeof addr === 'object') {
      rawAddress = rawAddress || addr;
      wanted.forEach(function(k){
        if (typeof addr[k] === 'string' && addr[k].trim()) found[k] = true;
      });
    }
  }
  const missingFields = wanted.filter(function(k){ return !found[k]; });
  const valid = present && missingFields.length === 0;
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'address.missing';
  else if (typeof rawAddress === 'string') reasonKey = 'address.string';
  else if (missingFields.length) {
    reasonKey = 'address.missingFields';
    reasonVars = { fields: missingFields.join(', ') };
  }
  return {
    present: present, valid: valid,
    reasonKey: reasonKey, reasonVars: reasonVars, reason: null,
    missingFields: missingFields
  };
}

// F4: acceptsReservations validation. schema.org permits either a
// boolean or a Reservation type object; we accept both. Missing is
// meaningful on fine-dining / casual-dining sites but irrelevant
// for ghost-kitchen / food-truck — the subtype-weight map in
// subtypes.js already encodes that, so here we just report the
// raw signal.
function validateAcceptsReservations(restaurantObjects) {
  let present = false;
  let value = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].acceptsReservations;
    if (raw === undefined || raw === null) continue;
    present = true;
    value = raw;
    break;
  }
  // Normalize: true/false/'True'/'https://schema.org/True' all
  // collapse to boolean so the audit can just check `accepts`.
  let accepts = null;
  if (typeof value === 'boolean') accepts = value;
  else if (typeof value === 'string') {
    const v = value.toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (v === 'true')  accepts = true;
    if (v === 'false') accepts = false;
  } else if (value && typeof value === 'object') {
    // A Reservation sub-object counts as "yes, we accept"
    accepts = true;
  }
  // Sprint M1.2: match the {present, valid, reasonKey, reasonVars,
  // reason, value} shape the other validators return. `valid` means
  // "Google can understand it" — not "this restaurant accepts
  // reservations." A strictly-false declaration is still valid.
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'reservations.missing';
  else if (accepts === null) {
    reasonKey = 'reservations.malformed';
    reasonVars = { value: typeof value === 'string' ? value : JSON.stringify(value) };
  }
  return {
    present: present,
    valid: present && accepts !== null,
    reasonKey: reasonKey,
    reasonVars: reasonVars,
    reason: null,
    accepts: accepts,
    value: value
  };
}

// F4: hasMenu validation. Accepts either a URL string or a
// { '@type': 'Menu', url: '…' } object. Validates that at least
// one URL parses as an HTTP(S) URL — we don't fetch it here
// (that's the crawl endpoint's job), but an unparseable URL
// is a schema error worth flagging.
function validateHasMenu(restaurantObjects) {
  let present = false;
  let urlValid = false;
  const urls = [];
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].hasMenu;
    if (raw === undefined || raw === null) continue;
    present = true;
    pushMenu(raw);
  }
  function pushMenu(val) {
    if (!val) return;
    if (typeof val === 'string') {
      urls.push(val);
      if (isValidHttpUrl(val)) urlValid = true;
      return;
    }
    if (Array.isArray(val)) { val.forEach(pushMenu); return; }
    if (typeof val === 'object') {
      // Menu sub-object — pull its `url` field (or hasPart arrays,
      // but we keep the shape small for now).
      if (typeof val.url === 'string') pushMenu(val.url);
    }
  }
  // Sprint M1.2: adopt the unified {present, valid, reasonKey,
  // reasonVars, reason, value} shape. `valid` means hasMenu is
  // present AND at least one URL is http(s)-parseable. `urls` kept
  // for backwards compatibility with any consumer that already
  // expected it on the response.
  let reasonKey = null;
  if (!present) reasonKey = 'menu.missing';
  else if (!urlValid) reasonKey = 'menu.badUrl';
  return {
    present: present,
    valid: present && urlValid,
    reasonKey: reasonKey,
    reasonVars: null,
    reason: null,
    urls: urls,
    urlValid: urlValid
  };
}

function isValidHttpUrl(s) {
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch (e) { return false; }
}

// ------------------------------------------------------------
// Schema-vs-Places hours cross-check — Phase F5
// ------------------------------------------------------------
// Compares what the site publishes in JSON-LD vs what Google Places
// has on file for the same business. Stale schema is a real-world
// problem: a restaurant updates its hours on Google Business Profile
// but not in its website's schema markup, and the Rich Results
// snippet then serves Sunday-closed to customers who could have
// walked in.
//
// Inputs:
//   schemaOpeningHours - validation.openingHours from
//                        validateRestaurantSchema (F2). Uses the
//                        raw restaurantObjects to rebuild per-day
//                        coverage if needed.
//   placesRegularHours - the Places v1 regularOpeningHours shape:
//                        { periods: [{ open: {day,...}, close: {day,...} }], ... }
//                        day is 0-6 with SUN=0 per Google's convention.
//
// Output:
//   {
//     checkable:     boolean,        // both sources present
//     schemaDays:    string[],       // ['Mo','Tu','We',...] from schema
//     placesDays:    string[],       // ditto from Places
//     agreed:        string[],       // days both agree are OPEN
//     onlyInSchema:  string[],       // days schema says open, Places silent
//     onlyInPlaces:  string[],       // days Places says open, schema silent
//     match:         boolean         // no disagreement
//   }
function compareSchemaVsPlacesHours(restaurantObjects, placesRegularHours) {
  const schemaDays = schemaDaysFromObjects(restaurantObjects);
  const placesDays = placesDaysFromRegularHours(placesRegularHours);

  const checkable = schemaDays.length > 0 && placesDays.length > 0;
  const onlyInSchema = schemaDays.filter(function(d){ return placesDays.indexOf(d) < 0; });
  const onlyInPlaces = placesDays.filter(function(d){ return schemaDays.indexOf(d) < 0; });
  const agreed       = schemaDays.filter(function(d){ return placesDays.indexOf(d) >= 0; });

  return {
    checkable:    checkable,
    schemaDays:   schemaDays,
    placesDays:   placesDays,
    agreed:       agreed,
    onlyInSchema: onlyInSchema,
    onlyInPlaces: onlyInPlaces,
    match:        checkable && onlyInSchema.length === 0 && onlyInPlaces.length === 0
  };
}

// Extract the set of 'Mo'/'Tu'/.../'Su' codes that schema covers.
// Mirrors the day-name parsing in validateOpeningHours but returns
// the set directly instead of the {present,dayCount,complete,…} summary.
function schemaDaysFromObjects(restaurantObjects) {
  const DAY_NAMES = {
    'monday':'Mo','mo':'Mo','mon':'Mo',
    'tuesday':'Tu','tu':'Tu','tue':'Tu','tues':'Tu',
    'wednesday':'We','we':'We','wed':'We',
    'thursday':'Th','th':'Th','thu':'Th','thur':'Th','thurs':'Th',
    'friday':'Fr','fr':'Fr','fri':'Fr',
    'saturday':'Sa','sa':'Sa','sat':'Sa',
    'sunday':'Su','su':'Su','sun':'Su'
  };
  const covered = Object.create(null);
  function addDay(raw) {
    if (!raw) return;
    const s = String(raw).toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (DAY_NAMES[s]) { covered[DAY_NAMES[s]] = true; return; }
    const tail = s.split('/').pop();
    if (DAY_NAMES[tail]) { covered[DAY_NAMES[tail]] = true; }
  }
  (restaurantObjects || []).forEach(function(obj){
    const spec = obj.openingHoursSpecification;
    if (Array.isArray(spec)) spec.forEach(function(e){
      if (!e) return;
      const d = e.dayOfWeek;
      if (Array.isArray(d)) d.forEach(addDay);
      else addDay(d);
    });
    else if (spec && typeof spec === 'object') {
      const d = spec.dayOfWeek;
      if (Array.isArray(d)) d.forEach(addDay);
      else addDay(d);
    }
    const legacy = obj.openingHours;
    if (typeof legacy === 'string' || Array.isArray(legacy)) {
      const strs = Array.isArray(legacy) ? legacy : [legacy];
      const rangeRe = /\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g;
      const order = ['Mo','Tu','We','Th','Fr','Sa','Su'];
      strs.forEach(function(s){
        let m;
        while ((m = rangeRe.exec(s)) !== null) {
          const start = order.indexOf(m[1]);
          const end   = m[2] ? order.indexOf(m[2]) : start;
          if (start < 0 || end < 0) continue;
          let i = start;
          while (true) {
            covered[order[i]] = true;
            if (i === end) break;
            i = (i + 1) % 7;
          }
        }
      });
    }
  });
  return Object.keys(covered);
}

// Map Places v1 regularOpeningHours.periods to day codes. Google
// convention: periods[].open.day is 0-6 with SUNDAY = 0. We also
// honor the legacy Places v0 shape where period.open.day is 0-6
// via the same offset, and periods that carry a string day like
// 'MONDAY'.
// ------------------------------------------------------------
// NAP (name/address/phone) consistency — Phase F6
// ------------------------------------------------------------
// Compares what the site's JSON-LD publishes against what Places
// has on file. NAP drift (different street address on the website
// than on Google Business Profile, a phone number that changed on
// one but not the other) is a classic local-SEO problem — Google
// trusts Places first, and the drift actively hurts rankings
// until it's resolved.
//
// Inputs:
//   restaurantObjects - the filtered list from
//                       validateRestaurantSchema. Uses .name,
//                       .address.{streetAddress,addressLocality,
//                       addressRegion,postalCode}, .telephone.
//   placesData        - the Places v1 shape our /api/gbp-lookup
//                       already returns: { displayName:{text},
//                       formattedAddress, nationalPhoneNumber,
//                       internationalPhoneNumber }.
//
// Output: per-field { checkable, match, schemaValue, placesValue }.
function compareSchemaVsPlacesNap(restaurantObjects, placesData) {
  const schemaName    = firstStringField(restaurantObjects, 'name');
  const schemaAddr    = firstAddressField(restaurantObjects);
  const schemaPhone   = firstStringField(restaurantObjects, 'telephone');

  const placesName    = placesData && placesData.displayName && placesData.displayName.text
                        ? String(placesData.displayName.text) : null;
  const placesAddr    = placesData && placesData.formattedAddress
                        ? String(placesData.formattedAddress) : null;
  const placesPhone   = (placesData && (placesData.nationalPhoneNumber || placesData.internationalPhoneNumber)) || null;

  return {
    name:    compareNames(schemaName, placesName),
    address: compareAddresses(schemaAddr, placesAddr),
    phone:   comparePhones(schemaPhone, placesPhone)
  };
}

function firstStringField(objects, key) {
  for (let i = 0; i < (objects || []).length; i++) {
    const v = objects[i][key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return null;
}

function firstAddressField(objects) {
  for (let i = 0; i < (objects || []).length; i++) {
    const a = objects[i].address;
    if (a && typeof a === 'object') return a;
  }
  return null;
}

// Normalize: lowercase, strip punctuation + whitespace, drop common
// suffixes ('restaurant', 'bar & grill') so 'Joe's Pizza' and
// 'Joes Pizza Restaurant' match. Loose by design — NAP checks
// should forgive typographic drift, not demand byte-equality.
function normalizeName(s) {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .replace(/(restaurant|bistro|cafe|bar|pizzeria|bakery|kitchen)$/g, '');
}

function compareNames(schemaName, placesName) {
  const checkable = !!(schemaName && placesName);
  const a = normalizeName(schemaName);
  const b = normalizeName(placesName);
  let match = false;
  if (checkable) {
    // Either fully matches or one contains the other (handles
    // "Joe's Pizza" vs "Joe's Pizza & Pasta").
    match = a === b || a.includes(b) || b.includes(a);
  }
  return { checkable: checkable, match: match, schemaValue: schemaName, placesValue: placesName };
}

// Flatten a schema.org PostalAddress into a single string for
// substring matching. Preserves digits (street numbers, ZIP)
// because those are the highest-signal fields.
function flattenSchemaAddress(addr) {
  if (!addr || typeof addr !== 'object') return '';
  const parts = [
    addr.streetAddress,
    addr.addressLocality,
    addr.addressRegion,
    addr.postalCode,
    addr.addressCountry
  ];
  return parts.filter(function(p){ return typeof p === 'string'; }).join(' ');
}

function normalizeAddress(s) {
  if (!s) return '';
  return String(s).toLowerCase()
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bsuite\b/g, 'ste')
    .replace(/\bapartment\b/g, 'apt')
    .replace(/\bnorth\b/g, 'n')
    .replace(/\bsouth\b/g, 's')
    .replace(/\beast\b/g, 'e')
    .replace(/\bwest\b/g, 'w')
    .replace(/\b(usa|united states|united states of america)\b/g, '')
    .replace(/[^a-z0-9]+/g, '');
}

function compareAddresses(schemaAddr, placesFormattedAddr) {
  const flat = flattenSchemaAddress(schemaAddr);
  const checkable = !!(flat && placesFormattedAddr);
  const a = normalizeAddress(flat);
  const b = normalizeAddress(placesFormattedAddr);
  let match = false;
  if (checkable) {
    // Substring match handles a schema that omits country or
    // suite numbers present in Places' formatted string.
    match = a === b || a.includes(b) || b.includes(a);
  }
  return {
    checkable:   checkable,
    match:       match,
    schemaValue: flat || null,
    placesValue: placesFormattedAddr
  };
}

function normalizePhone(s) {
  if (!s) return '';
  // Keep only digits; drop leading '1' if present for US-style
  // numbers so '+1 (212) 555-1212' matches '(212) 555-1212'.
  let digits = String(s).replace(/\D+/g, '');
  if (digits.length === 11 && digits[0] === '1') digits = digits.slice(1);
  return digits;
}

function comparePhones(schemaPhone, placesPhone) {
  const a = normalizePhone(schemaPhone);
  const b = normalizePhone(placesPhone);
  const checkable = !!(a && b);
  let match = false;
  if (checkable) match = a === b;
  return { checkable: checkable, match: match, schemaValue: schemaPhone, placesValue: placesPhone };
}

function placesDaysFromRegularHours(regularOpeningHours) {
  const INDEX_TO_CODE = ['Su','Mo','Tu','We','Th','Fr','Sa'];
  const STR_TO_CODE = {
    'sunday':'Su','monday':'Mo','tuesday':'Tu','wednesday':'We',
    'thursday':'Th','friday':'Fr','saturday':'Sa'
  };
  const covered = Object.create(null);
  const periods = regularOpeningHours && regularOpeningHours.periods;
  if (!Array.isArray(periods)) return [];
  periods.forEach(function(p){
    const open = p && p.open;
    if (!open) return;
    if (typeof open.day === 'number' && open.day >= 0 && open.day <= 6) {
      covered[INDEX_TO_CODE[open.day]] = true;
      return;
    }
    if (typeof open.day === 'string') {
      const code = STR_TO_CODE[open.day.toLowerCase()];
      if (code) covered[code] = true;
    }
  });
  return Object.keys(covered);
}

// F3: priceRange validation. Schema.org priceRange is free-form but
// Google's Rich Results docs strongly prefer the $-symbol form
// ('$', '$$', '$$$', '$$$$'). We accept numeric-range strings too
// ('15-30', '$15 to $30') since they still describe the signal
// well; the validation just flags 'present + looks reasonable'
// vs 'present but junk' vs 'missing'.
function validatePriceRange(restaurantObjects) {
  let present = false;
  let wellFormed = false;
  let value = null;
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].priceRange;
    if (typeof raw !== 'string' || !raw.trim()) continue;
    present = true;
    value = value || raw.trim();
    // Dollar-sign shorthand (1-4 $'s, possibly with hyphen between)
    if (/^\${1,4}(?:\s*-\s*\${1,4})?$/.test(raw.trim())) wellFormed = true;
    // Numeric range like '$15-30' or '15-30' or '$15 to $30'
    else if (/\$?\d+\s*(?:-|to|–)\s*\$?\d+/i.test(raw)) wellFormed = true;
    // Single number fallback ('$25') — legal but loses the range signal
    else if (/^\$?\d+(?:\.\d{1,2})?$/.test(raw.trim())) wellFormed = true;
  }
  // Sprint H2/H4: single-sentence reason + valid flag so this field
  // can be rendered alongside openingHours/address in a consistent
  // shape. "Present but mal-formed" is a real-world failure mode we
  // want to surface distinctly from "missing entirely".
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'price.missing';
  else if (!wellFormed) { reasonKey = 'price.badShape'; reasonVars = { value: value || '' }; }
  return {
    present: present,
    wellFormed: wellFormed,
    value: value,
    valid: present && wellFormed,
    reasonKey: reasonKey, reasonVars: reasonVars, reason: null
  };
}

// F3: servesCuisine validation. Accepts a single string or an
// array of strings. Reports count (how many cuisines declared) and
// a flat list (lowercased, deduped) so downstream callers can
// cross-reference against menu-text keywords without extra parsing.
function validateServesCuisine(restaurantObjects) {
  const seen = Object.create(null);
  const cuisines = [];
  for (let i = 0; i < restaurantObjects.length; i++) {
    const raw = restaurantObjects[i].servesCuisine;
    if (typeof raw === 'string') {
      const v = raw.trim().toLowerCase();
      if (v && !seen[v]) { seen[v] = true; cuisines.push(v); }
    } else if (Array.isArray(raw)) {
      raw.forEach(function(x){
        if (typeof x !== 'string') return;
        const v = x.trim().toLowerCase();
        if (v && !seen[v]) { seen[v] = true; cuisines.push(v); }
      });
    }
  }
  // Sprint M1.2: unified shape + a "tooGeneric" flag for the
  // single-value "restaurant"/"food" pattern that doesn't buy any
  // local-search match. Single specific cuisine (e.g. "Italian") is
  // valid; single generic term with no specifier is weakly valid.
  const GENERIC = { 'restaurant': 1, 'food': 1, 'dining': 1, 'cuisine': 1 };
  const present = cuisines.length > 0;
  const tooGeneric = cuisines.length === 1 && !!GENERIC[cuisines[0]];
  let reasonKey = null;
  let reasonVars = null;
  if (!present) reasonKey = 'cuisine.missing';
  else if (tooGeneric) { reasonKey = 'cuisine.tooGeneric'; reasonVars = { value: cuisines[0] }; }
  return {
    present: present,
    valid: present && !tooGeneric,
    reasonKey: reasonKey,
    reasonVars: reasonVars,
    reason: null,
    count: cuisines.length,
    values: cuisines
  };
}

// F2: openingHoursSpecification validation. Recognizes both the
// structured form (array of OpeningHoursSpecification entries with
// dayOfWeek/opens/closes) and the legacy `openingHours: "Mo-Fr
// 08:00-17:00"` string form some generators still emit.
//
// dayCount counts distinct weekdays covered. 7 means the site
// publishes hours for every day of the week (including explicit
// "closed" days as opens=null + closes=null or a "Closed" marker).
// The audit flags <7 as an actionable gap because Google's Rich
// Results for restaurants wants every day listed.
function validateOpeningHours(restaurantObjects) {
  const DAY_NAMES = {
    'monday':    'Mo', 'mo': 'Mo', 'mon': 'Mo',
    'tuesday':   'Tu', 'tu': 'Tu', 'tue': 'Tu', 'tues': 'Tu',
    'wednesday': 'We', 'we': 'We', 'wed': 'We',
    'thursday':  'Th', 'th': 'Th', 'thu': 'Th', 'thur': 'Th', 'thurs': 'Th',
    'friday':    'Fr', 'fr': 'Fr', 'fri': 'Fr',
    'saturday':  'Sa', 'sa': 'Sa', 'sat': 'Sa',
    'sunday':    'Su', 'su': 'Su', 'sun': 'Su'
  };
  const covered = Object.create(null);
  let found = false;
  let parseErrors = 0;
  // Sprint H1: track time-format validity. schema.org's
  // openingHoursSpecification.opens / .closes expect ISO-8601 time
  // ("HH:MM" or "HH:MM:SS"). Sites that feed "9am" or "opens at
  // 9" pass presence but fail strict validation, which is exactly
  // why Google occasionally refuses to render rich-hours panels.
  let timeFieldsSeen = 0;
  let timeFieldsBad = 0;
  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/;
  function checkTime(val) {
    if (val === undefined || val === null || val === '') return;
    timeFieldsSeen++;
    if (typeof val !== 'string' || !TIME_RE.test(val.trim())) timeFieldsBad++;
  }

  function addDay(raw) {
    if (!raw) return;
    const s = String(raw).toLowerCase().replace(/^https?:\/\/schema\.org\//, '').trim();
    if (DAY_NAMES[s]) { covered[DAY_NAMES[s]] = true; return; }
    // URI form from schema.org e.g. "https://schema.org/Monday"
    const tail = s.split('/').pop();
    if (DAY_NAMES[tail]) { covered[DAY_NAMES[tail]] = true; return; }
    parseErrors++;
  }

  restaurantObjects.forEach(function(obj){
    // Structured form: openingHoursSpecification = [{ dayOfWeek, opens, closes }]
    const spec = obj.openingHoursSpecification;
    if (Array.isArray(spec)) {
      found = true;
      spec.forEach(function(entry){
        if (!entry) return;
        const dow = entry.dayOfWeek;
        if (Array.isArray(dow)) dow.forEach(addDay);
        else addDay(dow);
        checkTime(entry.opens);
        checkTime(entry.closes);
      });
    } else if (spec && typeof spec === 'object') {
      found = true;
      const dow = spec.dayOfWeek;
      if (Array.isArray(dow)) dow.forEach(addDay);
      else addDay(dow);
      checkTime(spec.opens);
      checkTime(spec.closes);
    }

    // Legacy string form: openingHours: "Mo-Fr 08:00-17:00 Sa 09:00-13:00"
    const legacy = obj.openingHours;
    if (typeof legacy === 'string' || Array.isArray(legacy)) {
      found = true;
      const strs = Array.isArray(legacy) ? legacy : [legacy];
      const rangeRe = /\b(Mo|Tu|We|Th|Fr|Sa|Su)(?:\s*-\s*(Mo|Tu|We|Th|Fr|Sa|Su))?\b/g;
      const order = ['Mo','Tu','We','Th','Fr','Sa','Su'];
      strs.forEach(function(s){
        let m;
        while ((m = rangeRe.exec(s)) !== null) {
          const start = order.indexOf(m[1]);
          const end   = m[2] ? order.indexOf(m[2]) : start;
          if (start < 0 || end < 0) { parseErrors++; continue; }
          // Wrap through Sunday if start > end (rare but legal).
          let i = start;
          while (true) {
            covered[order[i]] = true;
            if (i === end) break;
            i = (i + 1) % 7;
          }
        }
        // H1: validate embedded time ranges like "08:00-17:00".
        const timeRanges = s.match(/\d{1,2}:\d{2}(?::\d{2})?/g) || [];
        timeRanges.forEach(checkTime);
      });
    }
  });

  const dayCount = Object.keys(covered).length;
  const timesValid = timeFieldsSeen > 0 && timeFieldsBad === 0;
  // Sprint H4: add a single-sentence `reason` for renderers that want
  // to show the owner WHY the audit flagged this field rather than
  // just "unverified". Null when everything looks fine.
  let reasonKey = null;
  let reasonVars = null;
  if (!found) reasonKey = 'hours.missing';
  else if (dayCount < 7) { reasonKey = 'hours.partial'; reasonVars = { dayCount: dayCount }; }
  else if (timeFieldsSeen > 0 && timeFieldsBad > 0) { reasonKey = 'hours.badTimes'; reasonVars = { timeFieldsBad: timeFieldsBad }; }
  else if (parseErrors > 0) { reasonKey = 'hours.parseErrors'; reasonVars = { parseErrors: parseErrors }; }
  return {
    present:     found,
    dayCount:    dayCount,
    complete:    dayCount === 7,
    parseErrors: parseErrors,
    timesValid:  timesValid,
    timeFieldsSeen: timeFieldsSeen,
    timeFieldsBad:  timeFieldsBad,
    valid:       found && dayCount === 7 && (timeFieldsSeen === 0 || timesValid) && parseErrors === 0,
    reasonKey:   reasonKey, reasonVars: reasonVars, reason: null
  };
}

// ------------------------------------------------------------
// JSON-LD extraction — Phase F
// ------------------------------------------------------------
// Extracts every <script type="application/ld+json"> block and
// parses each one properly with JSON.parse. Phase F1 replaces the
// regex-based @type scraper with structured parsing so later
// sprints can validate field-level content (openingHours,
// priceRange, servesCuisine, acceptsReservations, hasMenu,
// address/telephone for NAP consistency).
//
// Shape returned:
//   {
//     types:            string[],       // unique @type values seen
//     blockCount:       number,         // total <script> blocks found
//     parseErrorCount:  number,         // JSON.parse failures
//     objects: [                        // flattened list of every
//       {                               // schema object, including
//         "@type":  string|string[],    // entries from @graph arrays
//         ...                           // all other schema fields
//       }
//     ]
//   }
//
// Regex fallback: if JSON.parse fails on a block (very common with
// Squarespace/Wix-generated sites that double-encode entities), we
// still scrape @type values from the raw text so legacy callers
// that only read `types` keep working. New callers should prefer
// `objects` for field-level work.
function extractJsonLd(html) {
  const blockRe = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const blocks = [];
  let m;
  while ((m = blockRe.exec(html)) !== null) blocks.push(m[1]);

  const objects = [];
  let parseErrorCount = 0;
  for (let i = 0; i < blocks.length; i++) {
    const raw = blocks[i].trim();
    if (!raw) continue;
    try {
      const val = JSON.parse(raw);
      // JSON-LD can be a single object, an array of objects, or
      // an object with @graph (and sometimes nested arrays). Flatten
      // aggressively so later validators have a simple list to walk.
      flattenJsonLd(val, objects);
    } catch (e) {
      parseErrorCount++;
      // Fall back to the old regex scrape for just @type values so
      // parse errors don't silently delete known types from the
      // response — the type list stays useful even when strict
      // parsing can't fully read the block.
      const fallback = scrapeTypesFromString(raw);
      fallback.forEach(function(t){ objects.push({ '@type': t, _parseError: true }); });
    }
  }

  // Collect unique @type values across all objects.
  const seen = Object.create(null);
  const types = [];
  for (let k = 0; k < objects.length; k++) {
    const t = objects[k] && objects[k]['@type'];
    if (Array.isArray(t)) {
      t.forEach(function(s){ if (typeof s === 'string' && !seen[s]) { seen[s] = true; types.push(s); } });
    } else if (typeof t === 'string' && !seen[t]) {
      seen[t] = true; types.push(t);
    }
  }
  return { types: types, blockCount: blocks.length, parseErrorCount: parseErrorCount, objects: objects };
}

// Walk a parsed JSON-LD value (object, array, or object with
// @graph) and push every schema object into `out`. Nested
// schemas like { address: { @type: PostalAddress, ... } } are
// intentionally NOT flattened — they stay attached to their parent
// so validators can see the relationship (a Restaurant's address,
// not a free-floating PostalAddress).
function flattenJsonLd(val, out) {
  if (!val) return;
  if (Array.isArray(val)) {
    val.forEach(function(v){ flattenJsonLd(v, out); });
    return;
  }
  if (typeof val !== 'object') return;
  if (Array.isArray(val['@graph'])) {
    val['@graph'].forEach(function(v){ flattenJsonLd(v, out); });
    // Drop the @graph wrapper itself but keep any sibling fields
    // (rare but legal: a top-level context-only object with @graph).
    const wrapper = {};
    Object.keys(val).forEach(function(k){ if (k !== '@graph') wrapper[k] = val[k]; });
    if (Object.keys(wrapper).length) out.push(wrapper);
    return;
  }
  out.push(val);
}

// Regex fallback for unparseable blocks. Returns every @type
// string seen in the raw text, single or array form.
function scrapeTypesFromString(text) {
  const out = [];
  const seen = Object.create(null);
  const typeRe = /"@type"\s*:\s*"([A-Za-z]+)"/g;
  let m;
  while ((m = typeRe.exec(text)) !== null) {
    if (!seen[m[1]]) { seen[m[1]] = true; out.push(m[1]); }
  }
  const arrayRe = /"@type"\s*:\s*\[([^\]]+)\]/g;
  while ((m = arrayRe.exec(text)) !== null) {
    const inner = m[1].match(/"([A-Za-z]+)"/g);
    if (inner) inner.forEach(function(t){
      t = t.replace(/"/g, '');
      if (!seen[t]) { seen[t] = true; out.push(t); }
    });
  }
  return out;
}


// ------------------------------------------------------------
// Multi-page crawl — Phase E
// ------------------------------------------------------------
// Fetches the target homepage plus up to 5 key internal pages so the
// restaurant audit can evaluate menu-format / conversions / schema /
// NAP-consistency against the page that's ACTUALLY responsible for
// each check, not just the homepage.
//
//   GET /api/page-crawl?url=https://example.com/
//     → 200 {
//         ok: true,
//         homepage: { url, status, html },
//         candidates: [{ slot, url }, …],   // what we tried
//         pages: [{ slot, url, status, html, error? }, …], // what we got
//         capHit: boolean                   // true = 15s global timer fired
//       }
//     → 400 missing/bad url
//     → 502 homepage fetch failed / non-2xx / upstream timeout
//
// Budget: 8s homepage + up to 5 × 6s follow-ups (all parallel), with
// a 15s global cap. HTML bodies are truncated at PAGE_CRAWL_MAX_HTML
// bytes per page so a pathological CMS page cannot blow the Worker
// response budget — the client-side checks only need the first
// chunk of any realistic restaurant page (nav, menu, schema).
const PAGE_CRAWL_MAX_HTML         = 500_000;  // ~500 KB per page
// Sprint M1.3: bump to 8 so the three newly-added slots (wholesale,
// gift, careers) can land alongside the existing five without
// squeezing the original coverage.
const PAGE_CRAWL_MAX_CANDIDATES   = 8;
const PAGE_CRAWL_PER_URL_TIMEOUT  = 6000;
const PAGE_CRAWL_GLOBAL_CAP       = 15000;
const PAGE_CRAWL_HOMEPAGE_TIMEOUT = 8000;

async function handlePageCrawl(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // Sprint E4: SSRF guard on the entry URL so a crafted input can't
  // coax the Worker into fetching an internal host.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }

  const homepage = await fetchPageForCrawl(gate.url.toString(), PAGE_CRAWL_HOMEPAGE_TIMEOUT);
  if (!homepage.ok) {
    return jsonResponse({ ok: false, error: homepage.error || 'Fetch failed' }, 502);
  }

  // Sprint E2: rank up to PAGE_CRAWL_MAX_CANDIDATES internal-link
  // candidates from the homepage HTML.
  // Sprint E4: each extracted candidate is ALSO re-checked through
  // assertSafeHttpUrl. A restaurant site that links to a private IP
  // or a non-http(s) URL in its own HTML would otherwise be followed.
  const candidates = extractInternalLinkCandidates(homepage.html, homepage.url)
    .filter(function(c){ return assertSafeHttpUrl(c.url).ok; })
    .slice(0, PAGE_CRAWL_MAX_CANDIDATES);

  // Sprint E3: fetch the candidates in parallel, per-URL timeout,
  // with a global cap. Promise.allSettled so one slow/broken page
  // cannot starve the whole batch, wrapped in Promise.race against
  // a timer so the WHOLE operation cannot exceed the cap even if
  // AbortController support drifts across Workers runtimes.
  const fetches = candidates.map(function(c){
    return fetchPageForCrawl(c.url, PAGE_CRAWL_PER_URL_TIMEOUT)
      .then(function(r){ return { slot: c.slot, url: c.url, result: r }; });
  });
  const globalCap = new Promise(function(resolve){
    setTimeout(function(){ resolve(null); }, PAGE_CRAWL_GLOBAL_CAP);
  });
  const settled = await Promise.race([
    Promise.allSettled(fetches),
    globalCap.then(function(){ return null; })
  ]);
  const pages = [];
  if (Array.isArray(settled)) {
    for (let i = 0; i < settled.length; i++) {
      const entry = settled[i];
      if (entry.status === 'fulfilled' && entry.value) {
        const v = entry.value;
        if (v.result && v.result.ok) {
          const trimmed = truncateHtml(v.result.html, PAGE_CRAWL_MAX_HTML);
          // Sprint M1.3: extract title + h1 per page so the detector
          // fuses (M1.9 menu, M1.10 catering/wholesale) can confirm a
          // slot page matches its intent without scanning the full
          // HTML twice.
          const meta = extractTitleAndH1(trimmed);
          pages.push({
            slot: v.slot,
            url: v.url,
            status: v.result.status,
            html: trimmed,
            title: meta.title,
            h1: meta.h1
          });
        } else {
          pages.push({
            slot: v.slot,
            url: v.url,
            status: (v.result && v.result.status) || 0,
            html: null,
            title: null,
            h1: null,
            error: (v.result && v.result.error) || 'fetch-failed'
          });
        }
      }
    }
  }
  // If the global cap won the race, fall back to an empty pages list —
  // caller still has a usable homepage plus the candidate URLs to
  // retry against later.
  const capHit = !Array.isArray(settled);

  // Sprint M1.3: also extract title + h1 from the homepage so the
  // client has a consistent shape for every crawled page.
  const homepageHtml = truncateHtml(homepage.html, PAGE_CRAWL_MAX_HTML);
  const homepageMeta = extractTitleAndH1(homepageHtml);

  return jsonResponse({
    ok: true,
    homepage: {
      url: homepage.url,
      status: homepage.status,
      html: homepageHtml,
      title: homepageMeta.title,
      h1: homepageMeta.h1
    },
    candidates: candidates,
    pages: pages,
    capHit: capHit
  }, 200);
}

// Cap each HTML body at maxBytes so a pathological CMS page cannot
// blow the Worker's response budget. The client-side checks only
// need the first few-hundred KB of any realistic restaurant page
// (nav, menu, schema scripts). Returns the original string when it
// is already under the limit — avoids a copy on the common path.
function truncateHtml(html, maxBytes) {
  if (!html || typeof html !== 'string') return html;
  if (html.length <= maxBytes) return html;
  return html.slice(0, maxBytes);
}

// Stream a Response body as text, aborting at maxBytes. Without this,
// a malicious or broken upstream returning a 10 MB document forces the
// Worker to buffer the entire response before truncateHtml can even
// look at it — blowing memory and the 128 MB response budget. Reading
// chunk-by-chunk and cancelling the reader at the byte cap keeps us
// under the limit even when the upstream lies about its Content-Length.
//
// Returns { text, truncated, bytesRead }. `truncated: true` signals the
// cap was reached and the tail of the document was discarded — callers
// that need a deterministic doc length (schema parser, title extractor)
// still work correctly because the returned text is valid UTF-8 prefix.
export async function readTextCapped(res, maxBytes) {
  const limit = Math.max(0, maxBytes | 0) || 0;
  // Degenerate cap: if a caller passes 0 (or a negative) we refuse to
  // read anything. Cancel the body so the upstream doesn't keep
  // sending. Returning an empty string is the only honest answer.
  if (limit === 0) {
    try {
      if (res && res.body && typeof res.body.cancel === 'function') {
        await res.body.cancel();
      }
    } catch (_) { /* ignore */ }
    return { text: '', truncated: true, bytesRead: 0 };
  }
  const body = res && res.body;
  if (!body || typeof body.getReader !== 'function') {
    // No streamable body (shouldn't happen in Workers runtime, but be
    // defensive for mocked / non-streaming test responses).
    const fallback = await res.text();
    if (limit && fallback.length > limit) {
      return { text: fallback.slice(0, limit), truncated: true, bytesRead: limit };
    }
    return { text: fallback, truncated: false, bytesRead: fallback.length };
  }
  const reader = body.getReader();
  const chunks = [];
  let bytes = 0;
  let truncated = false;
  try {
    while (true) {
      const step = await reader.read();
      if (step.done) break;
      const value = step.value;
      if (!value) continue;
      const len = value.byteLength;
      if (limit > 0 && bytes + len > limit) {
        const remaining = Math.max(0, limit - bytes);
        if (remaining > 0) chunks.push(value.subarray(0, remaining));
        bytes = limit;
        truncated = true;
        try { await reader.cancel(); } catch (_) { /* ignore */ }
        break;
      }
      chunks.push(value);
      bytes += len;
    }
  } finally {
    try { reader.releaseLock(); } catch (_) { /* ignore */ }
  }
  // Concatenate once and decode the full buffer so no UTF-8 character
  // is split across a chunk boundary. TextDecoder with fatal:false
  // emits U+FFFD on a split at the tail; acceptable for our purposes
  // (schema parser + regex extractors ignore replacement characters).
  const merged = new Uint8Array(bytes);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  const text = new TextDecoder('utf-8', { fatal: false }).decode(merged);
  return { text: text, truncated: truncated, bytesRead: bytes };
}

// Slot-assigned link-text patterns. Each pattern matches a category
// of page that the audit wants to inspect separately. Order matters:
// we stop at the first slot that matches a given anchor, so more
// specific slots ('catering', 'events') should come before generic
// ones ('menu'). Patterns match against the anchor's visible text
// AND the href path (e.g. /catering-menu.pdf) so sites that style
// their nav with icons and aria-labels still classify.
const PAGE_CRAWL_SLOTS = [
  { slot: 'reserve',     patterns: [/reserv/i, /book\s*a?\s*table/i, /\bbooking\b/i] },
  { slot: 'order',       patterns: [/order\s*(online|now|here)?/i, /start\s+(an\s+)?order/i, /\bpickup\b/i, /\bdelivery\b/i] },
  { slot: 'catering',    patterns: [/\bcatering\b/i, /\bcater\s*your\b/i, /private\s+event/i, /\brfq\b/i] },
  { slot: 'events',      patterns: [/\bevents?\b/i, /\bparties\b/i, /\bweddings?\b/i, /private\s+dining/i] },
  // Phase 3 #5b: menu-slot patterns expanded to close the crawl-reach
  // limitation surfaced after shipping menu-depth. Three specific
  // additions, each chosen for low false-positive risk:
  //   /\bcarte\b/    — almost exclusively fine-dining menu pages
  //                    ("prix fixe", "à la carte"); zero hits on
  //                    generic English body copy
  //   /\bto-go\b/    — ordering-flow pages that carry the menu
  //                    alongside the pickup flow
  //   /\border[-\s]online\b/  — same; normalizes "Order Online" or
  //                    "order-online" URL slugs
  // Broader candidates rejected: /food/ matches "About our food" pages
  // and nav links; /eats/ collides with brand names; /kitchen/ matches
  // "Our Kitchen" about-us content.
  { slot: 'menu',        patterns: [/\bmenu\b/i, /\bmenus\b/i, /food\s*&?\s*drink/i, /\bwine\s+list\b/i, /\bdrink\s+list\b/i, /\bcarte\b/i, /\bto-go\b/i, /\border[-\s]online\b/i] },
  { slot: 'contact',     patterns: [/\bcontact\b/i, /\bvisit\b/i, /location/i, /find\s+us/i, /hours/i] },
  { slot: 'about',       patterns: [/\babout\b/i, /our\s+story/i, /\bchef\b/i, /\bteam\b/i] },
  // Sprint M1.3: three new slots so the existence of a dedicated
  // wholesale / gift-cards / careers page resolves the corresponding
  // priority checks without asking the owner "Is this right?".
  // Order after 'about' matters only for tie-breaking; each slot's
  // patterns are distinct enough that an anchor won't double-match.
  { slot: 'wholesale',   patterns: [/\bwholesale\b/i, /\bbulk\s+order/i, /\btrade\s+account/i, /\bB2B\b/i] },
  { slot: 'gift',        patterns: [/gift\s*cards?/i, /gift\s*certificate/i, /\begift\b/i, /e-?gift/i] },
  { slot: 'careers',     patterns: [/\bcareers?\b/i, /\bjobs\b/i, /\bjoin\s+(our|the)\s+team\b/i, /\bhiring\b/i, /\bwork\s+with\s+us\b/i] }
];

// Sprint M1.3: extract the first <h1> and <title> from HTML so the
// client can fingerprint a slot page without fully rendering it.
// Regex-based (HTMLRewriter would be better; this is cheap and
// correct for the shapes restaurant sites actually ship). Returns
// null on miss. Strips nested tags + collapses whitespace.
function extractTitleAndH1(html) {
  if (typeof html !== 'string' || !html) return { title: null, h1: null };
  let title = null, h1 = null;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    title = titleMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() || null;
    if (title && title.length > 180) title = title.slice(0, 180);
  }
  const h1Match = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    h1 = h1Match[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim() || null;
    if (h1 && h1.length > 180) h1 = h1.slice(0, 180);
  }
  return { title: title, h1: h1 };
}

// Extract up to 5 internal-link candidates from homepage HTML, one
// per priority slot. Returns an array of { slot, url } pointing at
// same-origin pages the caller should fetch to enrich the audit.
//
// Parsing is regex-based (HTMLRewriter would be more robust but
// requires streaming semantics this endpoint doesn't need). We
// capture every <a href="..."> with its inner text, then walk each
// PAGE_CRAWL_SLOTS entry in order and pick the SHORTEST matching
// same-origin URL — shortest wins because '/menu' is almost always
// the canonical menu page and '/menu/lunch-prix-fixe' is a sub-page.
function extractInternalLinkCandidates(html, baseUrlString) {
  if (!html || !baseUrlString) return [];
  let base;
  try { base = new URL(baseUrlString); } catch (e) { return []; }

  const anchorRe = /<a\s+[^>]*?href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const anchors = [];
  let m;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    // Inner text: strip nested tags, collapse whitespace. Also pick
    // up aria-label if present in the surrounding <a> open tag.
    const rawText = m[2].replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ');
    const text = rawText.replace(/\s+/g, ' ').trim();
    anchors.push({ href: href, text: text });
  }

  const candidates = [];
  const usedUrls = new Set();
  for (let i = 0; i < PAGE_CRAWL_SLOTS.length; i++) {
    const slotDef = PAGE_CRAWL_SLOTS[i];
    // Find all anchors whose text OR href matches any pattern in this slot.
    const matching = anchors.filter(function(a){
      const haystack = (a.text || '') + ' ' + (a.href || '');
      return slotDef.patterns.some(function(re){ return re.test(haystack); });
    });
    if (!matching.length) continue;
    // Resolve each match to an absolute URL, filter to same-origin.
    const resolved = [];
    for (let j = 0; j < matching.length; j++) {
      let abs;
      try { abs = new URL(matching[j].href, base).href; } catch (e) { continue; }
      const absUrl = new URL(abs);
      if (absUrl.origin !== base.origin) continue;
      // Skip the homepage itself (already fetched) and anchor-only links.
      if (absUrl.pathname === '/' && !absUrl.search) continue;
      if (absUrl.href === base.href) continue;
      // Skip file downloads that aren't HTML — PDFs/images aren't
      // useful for our text-based checks.
      if (/\.(pdf|jpe?g|png|gif|webp|svg|mp4|mp3|zip)$/i.test(absUrl.pathname)) continue;
      resolved.push(absUrl.href);
    }
    if (!resolved.length) continue;
    // Prefer the shortest URL for this slot (canonical > sub-page).
    resolved.sort(function(a, b){ return a.length - b.length; });
    for (let k = 0; k < resolved.length; k++) {
      if (!usedUrls.has(resolved[k])) {
        candidates.push({ slot: slotDef.slot, url: resolved[k] });
        usedUrls.add(resolved[k]);
        break;
      }
    }
    if (candidates.length >= 5) break;
  }
  return candidates;
}

// Shared single-URL fetch helper. Same shape as the other page-
// reading endpoints. Timeout is configurable so Phase E3 can use a
// tighter 6s per follow-up fetch while the homepage gets the
// default 8s — the homepage is the one we can't proceed without.
async function fetchPageForCrawl(target, timeoutMs) {
  const controller = new AbortController();
  const ms = (typeof timeoutMs === 'number' && timeoutMs > 0) ? timeoutMs : 8000;
  const timeout = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(target, {
      headers: { 'User-Agent': 'MuntinDigital-PageCrawl/1.0' },
      redirect: 'follow',
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) {
      return { ok: false, url: target, status: res.status, error: 'HTTP ' + res.status };
    }
    // Stream with a hard cap so a 10 MB homepage cannot exhaust the
    // Worker's memory budget before truncateHtml downstream can cap
    // it. PAGE_CRAWL_MAX_HTML is the outer intent; we allocate a
    // slightly larger byte budget so multi-byte UTF-8 doesn't clip
    // the truncateHtml char cap applied by the caller.
    const read = await readTextCapped(res, PAGE_CRAWL_MAX_HTML * 2);
    return { ok: true, url: res.url || target, status: res.status, html: read.text };
  } catch (err) {
    clearTimeout(timeout);
    const msg = (err && err.name === 'AbortError') ? 'Fetch timed out' : 'Fetch failed';
    return { ok: false, url: target, status: 0, error: msg };
  }
}


// ------------------------------------------------------------
// PageSpeed Insights proxy
// ------------------------------------------------------------
// Client-facing audit tools (restaurant + wellness) used to call PSI
// directly with an HTTP-referrer-restricted API key embedded in the
// HTML. That pattern is documented by Google for client-side keys,
// but (a) the key lives in git history forever, (b) referrer
// enforcement is spoofable, and (c) a key rotation has to fan out
// to every HTML page. This proxy keeps the key in env.PSI_API_KEY
// and forwards the client's request parameters to PSI unchanged.
//
// Behavior:
//   GET /api/psi?url=...&strategy=mobile&category=performance&...
//     → 200 with the full PSI JSON response on success
//     → 503 with error='psi-proxy-unconfigured' when env.PSI_API_KEY
//       is not set (lets the client detect this and transparently
//       fall back to the direct-PSI path during the migration
//       window; once the secret is set, the fallback dead-codes)
//     → 400 on missing/bad `url` parameter
//     → 4xx/5xx from PSI passed through with the error body
//
// Rate limiting: not enforced in this Worker — rely on Cloudflare's
// edge rate-limiting rules (configured in the dashboard) and on
// Google's own per-key quotas. Adding KV-backed per-IP limits here
// would require a KV namespace binding; that's a future upgrade.
async function handlePsi(request, env, ctx) {
  if (!env.PSI_API_KEY) {
    return jsonResponse(
      { ok: false, error: 'psi-proxy-unconfigured' },
      503
    );
  }

  const incoming = new URL(request.url);
  const target   = (incoming.searchParams.get('url') || '').trim();
  if (!target) {
    return jsonResponse({ ok: false, error: 'Missing ?url= parameter' }, 400);
  }
  // Require http(s) — don't let the client coax us into hitting
  // javascript:, data:, file:, or internal http://10.x URLs via PSI
  let parsedTarget;
  try {
    parsedTarget = new URL(target);
  } catch (e) {
    return jsonResponse({ ok: false, error: 'Invalid URL' }, 400);
  }
  if (parsedTarget.protocol !== 'http:' && parsedTarget.protocol !== 'https:') {
    return jsonResponse({ ok: false, error: 'Only http(s) URLs are supported' }, 400);
  }

  // Pass through all the audit's forwarded params; just swap in our key.
  const upstream = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  incoming.searchParams.forEach((value, key) => {
    if (key === 'key') return; // never honor a client-supplied key
    upstream.searchParams.append(key, value);
  });
  upstream.searchParams.set('key', env.PSI_API_KEY);

  try {
    // Sprint B1: cap the PSI call at 30s. Lighthouse runs occasionally
    // stall longer than that on origin-side issues, and without an
    // explicit signal the Worker previously held the connection open
    // up to Cloudflare's 120s ceiling, blocking the frontend loader
    // UI and tying up a Worker invocation slot.
    // Sprint B2: on 429/503 retry once after 2s. PSI throttles on
    // burst traffic (e.g. the competitor-comparison flow fires 3
    // audits back-to-back); a single retry recovers the most common
    // transient case without materially extending worst-case latency.
    let res = await fetch(upstream.toString(), {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(30000)
    });
    if (res.status === 429 || res.status === 503) {
      await new Promise((r) => setTimeout(r, 2000));
      res = await fetch(upstream.toString(), {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(30000)
      });
    }
    const body = await res.text();
    // Pass through status + JSON body so the client can see PSI's
    // structured error shape (body.error.message) unchanged.
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
        'X-Generator': MUNTIN_GENERATOR,
        'X-Powered-By': 'Muntin Digital',
      }
    });
  } catch (err) {
    console.error('[psi] upstream fetch failed:', err && err.stack ? err.stack : err);
    const isTimeout = err && (err.name === 'TimeoutError' || err.name === 'AbortError');
    // Sprint ES3: localized PSI error messages.
    const L = pickLang(request);
    const MSG = {
      timeout: { en: 'PageSpeed Insights took longer than 30s — please retry',
                 es: 'PageSpeed Insights tardó más de 30s — por favor reintenta' },
      fail:    { en: 'Failed to reach PageSpeed Insights',
                 es: 'No se pudo conectar con PageSpeed Insights' }
    };
    const pick = (m) => (L === 'es' && m.es) || m.en;
    return jsonResponse(
      { ok: false, error: isTimeout ? pick(MSG.timeout) : pick(MSG.fail) },
      isTimeout ? 504 : 502
    );
  }
}



// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------

// Sprint BB5: canonical generator header shared by every JSON
// response. Pairs with the HTML <meta name="generator"> tag set in
// BB4 so anyone introspecting the API or the page sees the same
// Muntin Digital attribution. Version string should move in lockstep
// with the HTML meta when the audit engine materially changes.
const MUNTIN_GENERATOR = 'Muntin Digital Audit v1.1';

// ------------------------------------------------------------
// /api/did-you-mean — DNS-over-HTTPS typo-suggestion helper.
//
// When the restaurant audit (or any future tool) fails because a
// user's URL doesn't resolve, the client calls this endpoint with
// the offending URL. We generate a small set of plausible typo
// corrections (single-character deletion + adjacent transposition
// on the SLD portion of the hostname) and DNS-query each against
// 1.1.1.1 via DNS-over-HTTPS. The first candidate that actually
// resolves gets returned as the suggestion.
//
// Rationale: a wrong suggestion is worse than no suggestion, so
// we only propose candidates that ALSO resolve — this avoids
// suggesting `example.co` or `exampl.com` as alternatives if
// those don't exist.
//
// Response shape:
//   { ok: true, input, suggestion: 'irishinnglenecho.com',
//     suggestedUrl: 'https://irishinnglenecho.com/' }
//   { ok: true, input, suggestion: null }   // no plausible match
//
// Budgeted at ~2s total: 40 DoH lookups in parallel, each capped
// at 1.5s. DoH at 1.1.1.1 answers in tens of milliseconds for
// unresolved names, so this rarely uses its full budget.
// ------------------------------------------------------------

async function handleDidYouMean(request, env, ctx) {
  const urlObj = new URL(request.url);
  const raw = (urlObj.searchParams.get('url') || '').trim();
  const gate = assertSafeHttpUrl(raw, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const parsed = gate.url;
  const host = parsed.hostname.toLowerCase();
  const cands = didYouMeanCandidates(host).slice(0, 40);

  const MAX_WAIT = 2000;
  const started = Date.now();
  let suggestion = null;
  const lookups = cands.map(async (cand) => {
    if (suggestion || Date.now() - started > MAX_WAIT) return;
    const ok = await dnsResolves(cand).catch(() => false);
    if (ok && !suggestion) suggestion = cand;
  });
  await Promise.race([
    Promise.all(lookups),
    new Promise((r) => setTimeout(r, MAX_WAIT))
  ]);

  if (!suggestion) {
    return jsonResponse({ ok: true, input: host, suggestion: null });
  }
  // Preserve the user's scheme, port, and path when echoing the
  // suggested URL back so the client can retry the full request.
  const out = new URL(parsed.toString());
  out.hostname = suggestion;
  return jsonResponse({
    ok: true,
    input: host,
    suggestion: suggestion,
    suggestedUrl: out.toString()
  });
}

// Build a small set of plausible typo-correction candidates for a
// hostname. Operates on the "second-level" portion only — e.g. for
// `irisihinnglenecho.com` we edit `irisihinnglenecho` and keep `.com`
// — so deletions don't turn `.com` into `.co` or `.om`, which would
// resolve but be wrong-domain suggestions. Preserves any `www.`
// prefix on the way out.
function didYouMeanCandidates(hostname) {
  const labels = hostname.split('.');
  if (labels.length < 2) return [];
  const hadWww = labels[0] === 'www';
  const withoutWww = hadWww ? labels.slice(1) : labels;
  if (withoutWww.length < 2) return [];
  const tld  = withoutWww.slice(-1)[0];
  const tld2 = withoutWww.length >= 3 ? withoutWww.slice(-2).join('.') : null; // handle co.uk etc.
  // Use the compound TLD only when both parts look like TLDs (<=3 chars).
  const useTld2 = tld2 && withoutWww.length >= 3 && withoutWww.slice(-2).every((l) => l.length <= 3);
  const suffix = useTld2 ? withoutWww.slice(-2).join('.') : tld;
  const sldEnd = useTld2 ? withoutWww.length - 2 : withoutWww.length - 1;
  const sld = withoutWww.slice(0, sldEnd).join('.');
  if (!sld || sld.length < 3) return [];

  const variants = new Set();
  // 1. Single-character deletions.
  for (let i = 0; i < sld.length; i++) {
    variants.add(sld.slice(0, i) + sld.slice(i + 1));
  }
  // 2. Adjacent transpositions.
  for (let i = 0; i < sld.length - 1; i++) {
    if (sld[i] === sld[i + 1]) continue; // transposing identical chars is a no-op
    variants.add(sld.slice(0, i) + sld[i + 1] + sld[i] + sld.slice(i + 2));
  }
  // 3. Remove doubled-letter runs (e.g. `irisih` → `irish` via
  //    collapsing `ih` would not help, but `bookking` → `booking`
  //    by collapsing `kk` would). Conceptually a deletion already
  //    covers this, but adding targeted collapses helps when the
  //    SLD is long and we'd otherwise prune the right candidate.
  for (let i = 0; i < sld.length - 1; i++) {
    if (sld[i] === sld[i + 1]) variants.add(sld.slice(0, i) + sld.slice(i + 1));
  }
  variants.delete(sld);

  const prefix = hadWww ? 'www.' : '';
  const out = [];
  for (const v of variants) {
    if (v.length < 3) continue; // too short to be a real domain
    out.push(prefix + v + '.' + suffix);
  }
  return out;
}

async function dnsResolves(hostname) {
  const url = 'https://cloudflare-dns.com/dns-query?name=' +
              encodeURIComponent(hostname) + '&type=A';
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/dns-json' },
      signal: AbortSignal.timeout(1500)
    });
    if (!res.ok) return false;
    const data = await res.json();
    // Status 0 = NOERROR. Answer[] contains A records when resolved.
    return data && data.Status === 0 && Array.isArray(data.Answer) && data.Answer.length > 0;
  } catch (_) {
    return false;
  }
}

// ------------------------------------------------------------
// /api/observatory — Mozilla HTTP Observatory proxy.
//
// Deep Scan adds a one-letter security-headers grade (A+ / A / B /
// C / D / F) sourced from Mozilla's free observatory. The API is
// two-step: POST /analyze kicks off a scan; GET /analyze polls for
// the result. We budget up to 10s across 5 polls — if the grade
// isn't ready by then we return ok:false and the client simply
// doesn't render the grade chip. Accuracy rule: we NEVER show a
// speculative grade. If observatory times out or errors, the UI
// omits the section entirely.
// ------------------------------------------------------------
async function handleObservatory(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const host = gate.url.hostname;

  // Sprint T3: 24h cache keyed on hostname. Security-header grades
  // change when a site redeploys — 24h is a reasonable freshness
  // window, and the withAuditCache helper no-ops when the
  // AUDIT_CACHE binding isn't provisioned (i.e. today).
  const cached = await withAuditCache(env, request, ['observatory', host], 86400, async () => {
    return await observatoryScan(host);
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function observatoryScan(host) {
  try {
    const startRes = await fetch(
      'https://http-observatory.security.mozilla.org/api/v1/analyze?host=' + encodeURIComponent(host),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'hidden=false&rescan=false',
        signal: AbortSignal.timeout(5000)
      }
    );
    if (!startRes.ok) return { ok: false, error: 'observatory-start-failed' };
    let data = await startRes.json();
    const deadline = Date.now() + 10000;
    let polls = 0;
    while (data && (data.state === 'PENDING' || data.state === 'STARTING' || data.state === 'RUNNING') && Date.now() < deadline && polls < 5) {
      await new Promise((r) => setTimeout(r, 1500));
      polls++;
      const pollRes = await fetch(
        'https://http-observatory.security.mozilla.org/api/v1/analyze?host=' + encodeURIComponent(host),
        { signal: AbortSignal.timeout(4000) }
      );
      if (!pollRes.ok) break;
      data = await pollRes.json();
    }
    if (!data || data.state !== 'FINISHED' || typeof data.grade !== 'string') {
      return { ok: false, error: 'observatory-not-ready' };
    }
    return {
      ok: true,
      grade: data.grade,
      score: typeof data.score === 'number' ? data.score : null,
      tests_passed: data.tests_passed || null,
      tests_failed: data.tests_failed || null,
      tests_quantity: data.tests_quantity || null,
      scan_id: data.scan_id || null
    };
  } catch (err) {
    console.error('[observatory]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'observatory-unreachable' };
  }
}

// ------------------------------------------------------------
// /api/wayback-first-seen — Internet Archive CDX lookup.
//
// Returns the year a URL was first captured by the Wayback Machine
// + total snapshot count. Deep Scan renders a subtle "live since
// YYYY" chip when the answer is definite; omits the chip when CDX
// returns nothing (accuracy rule: we do not show a year we are
// uncertain about). Free public API, no key required.
// ------------------------------------------------------------
async function handleWaybackFirstSeen(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Sprint T3: 7-day cache. First-seen year is stable by definition;
  // the Wayback CDX answer for a given URL never moves earlier.
  const cached = await withAuditCache(env, request, ['wayback', gate.url.toString()], 7 * 86400, async () => {
    return await waybackLookup(gate.url.toString());
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function waybackLookup(targetUrl) {
  try {
    const cdxUrl = 'https://web.archive.org/cdx/search/cdx?url=' +
                   encodeURIComponent(targetUrl) +
                   '&output=json&fl=timestamp&limit=1&filter=statuscode:200';
    const res = await fetch(cdxUrl, {
      headers: { 'User-Agent': 'MuntinDigital-Audit/1.0' },
      signal: AbortSignal.timeout(6000)
    });
    if (!res.ok) return { ok: false, error: 'wayback-unreachable' };
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length < 2 || !rows[1] || !rows[1][0]) {
      return { ok: true, firstSeen: null, year: null };
    }
    const ts = String(rows[1][0]);
    const year = parseInt(ts.slice(0, 4), 10);
    if (!Number.isFinite(year) || year < 1996 || year > (new Date().getUTCFullYear() + 1)) {
      return { ok: true, firstSeen: null, year: null };
    }
    return { ok: true, firstSeen: ts, year: year };
  } catch (err) {
    console.error('[wayback]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'wayback-error' };
  }
}

// ------------------------------------------------------------
// /api/crux-history — CrUX History API proxy.
//
// Returns 25 weeks of Core Web Vitals p75 history for the origin
// (LCP, INP, CLS) plus experience.overall if available. Sparkline
// rendering in the Deep Scan UI reads from this. Accuracy rule:
// we only surface metrics where history has ≥2 data points; a
// single-point series is not a trend. Uses the existing
// PSI_API_KEY env (CrUX History is covered by the same Google
// API key quota).
// ------------------------------------------------------------
async function handleCruxHistory(request, env, ctx) {
  if (!env.PSI_API_KEY) {
    return jsonResponse({ ok: false, error: 'crux-unconfigured' }, 503);
  }
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Sprint T3: 48h cache. Google publishes CrUX weekly so a 2-day
  // cache captures any new data while still cutting quota pressure
  // in half for frequent re-audits.
  const cached = await withAuditCache(env, request, ['crux', gate.url.origin], 48 * 3600, async () => {
    return await cruxHistoryQuery(env.PSI_API_KEY, gate.url.origin);
  });
  const status = (cached.value && cached.value.ok === false) ? 502 : 200;
  const res = jsonResponse(cached.value, status);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function cruxHistoryQuery(apiKey, origin) {
  try {
    const res = await fetch(
      'https://chromeuxreport.googleapis.com/v1/records:queryHistoryRecord?key=' + encodeURIComponent(apiKey),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: origin,
          formFactor: 'PHONE',
          metrics: [
            'largest_contentful_paint',
            'interaction_to_next_paint',
            'cumulative_layout_shift'
          ]
        }),
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) {
      if (res.status === 404) return { ok: true, hasData: false, reason: 'no-crux-record' };
      return { ok: false, error: 'crux-upstream-' + res.status };
    }
    const body = await res.json();
    const metrics = body && body.record && body.record.metrics ? body.record.metrics : null;
    if (!metrics) return { ok: true, hasData: false, reason: 'empty-metrics' };
    function seriesFor(key) {
      const m = metrics[key];
      if (!m || !Array.isArray(m.percentilesTimeseries) && !m.percentilesTimeseries) return null;
      const pts = m.percentilesTimeseries && m.percentilesTimeseries.p75s;
      if (!Array.isArray(pts) || pts.length < 2) return null;
      const values = pts.map(function(v){
        if (v === null || v === undefined) return null;
        var n = typeof v === 'string' ? parseFloat(v) : v;
        return Number.isFinite(n) ? n : null;
      });
      return { p75: values };
    }
    const periods = (body.record && Array.isArray(body.record.collectionPeriods))
      ? body.record.collectionPeriods.map(function(p){
          const d = p && p.lastDate;
          return d && d.year ? (d.year + '-' + String(d.month).padStart(2, '0') + '-' + String(d.day).padStart(2, '0')) : null;
        })
      : [];
    const out = {
      ok: true, hasData: true, periods: periods,
      lcp: seriesFor('largest_contentful_paint'),
      inp: seriesFor('interaction_to_next_paint'),
      cls: seriesFor('cumulative_layout_shift')
    };
    if (!out.lcp && !out.inp && !out.cls) {
      return { ok: true, hasData: false, reason: 'insufficient-samples' };
    }
    return out;
  } catch (err) {
    console.error('[crux-history]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'crux-error' };
  }
}

// ------------------------------------------------------------
// /api/gbp-details — Places Details v1 (reviews + extended fields).
//
// Second Places call, called only in Deep Scan. Takes a placeId
// (from the Fast Scan gbp-lookup response) and requests the
// review-level payload that's too quota-expensive for every audit:
// up to 5 recent reviews + owner-response presence, and the full
// currentOpeningHours.weekdayDescriptions as a fallback when the
// initial field mask didn't get them.
//
// Accuracy rule: we surface review counts and owner-reply presence
// as raw facts. We do NOT mine review text for sentiment in Sprint
// 2 — sentiment analysis would cross into the "judgment, not fact"
// zone we're deferring.
// ------------------------------------------------------------
async function handleGbpDetails(request, env, ctx) {
  if (!env.GOOGLE_PLACES_KEY) {
    return jsonResponse({ ok: false, error: 'places-unconfigured' }, 503);
  }
  const url = new URL(request.url);
  const placeId = (url.searchParams.get('placeId') || '').trim();
  if (!placeId || !/^[A-Za-z0-9_-]+$/.test(placeId) || placeId.length > 200) {
    return jsonResponse({ ok: false, error: 'invalid-placeId' }, 400);
  }
  // Sprint T3: 24h cache. Reviews change, but a day's staleness is
  // acceptable for a Deep Scan payload — the tradeoff is a huge cut
  // in Places quota usage for frequent re-audits of the same URL.
  const cached = await withAuditCache(env, request, ['gbp-details', placeId], 24 * 3600, async () => {
    return await gbpDetailsQuery(env.GOOGLE_PLACES_KEY, placeId);
  });
  const status = (cached.value && cached.value.ok === false) ? 502 : 200;
  const res = jsonResponse(cached.value, status);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

async function gbpDetailsQuery(apiKey, placeId) {
  try {
    const res = await fetch(
      'https://places.googleapis.com/v1/places/' + encodeURIComponent(placeId),
      {
        method: 'GET',
        headers: {
          'X-Goog-Api-Key': apiKey,
          'X-Goog-FieldMask': [
            'id','displayName','reviews','currentOpeningHours','regularOpeningHours',
            'priceLevel','userRatingCount','rating'
          ].join(',')
        },
        signal: AbortSignal.timeout(8000)
      }
    );
    if (!res.ok) {
      const body = await res.text();
      console.error('[gbp-details]', res.status, body);
      return { ok: false, error: 'places-details-' + res.status };
    }
    const data = await res.json();
    const reviews = Array.isArray(data.reviews) ? data.reviews.slice(0, 5).map(function(r){
      return {
        rating: typeof r.rating === 'number' ? r.rating : null,
        publishTime: r.publishTime || null,
        relativePublishTimeDescription: r.relativePublishTimeDescription || null,
        text: r.text && r.text.text ? r.text.text : null,
        languageCode: r.text && r.text.languageCode ? r.text.languageCode : null,
        hasOwnerReply: !!(r.authorAttribution && r.authorAttribution.uri && r.ownerResponseText)
                        || !!(r.reply && (r.reply.text || r.reply.comment))
      };
    }) : [];
    const hoursText = data.currentOpeningHours && Array.isArray(data.currentOpeningHours.weekdayDescriptions)
      ? data.currentOpeningHours.weekdayDescriptions : null;
    const reviewCount = typeof data.userRatingCount === 'number' ? data.userRatingCount : null;
    const ownerReplied = reviews.reduce(function(acc, r){ return acc + (r.hasOwnerReply ? 1 : 0); }, 0);
    return {
      ok: true,
      placeId: data.id || placeId,
      name: data.displayName && data.displayName.text ? data.displayName.text : null,
      rating: typeof data.rating === 'number' ? data.rating : null,
      reviewCount: reviewCount,
      weekdayHoursText: hoursText,
      reviews: reviews,
      ownerReplyRate: reviews.length > 0 ? (ownerReplied / reviews.length) : null,
      priceLevel: typeof data.priceLevel === 'string' ? data.priceLevel : null
    };
  } catch (err) {
    console.error('[gbp-details]', err && err.stack ? err.stack : err);
    return { ok: false, error: 'gbp-details-error' };
  }
}

// ------------------------------------------------------------
// /api/brand-dossier — strict-citation "facts dossier" (Sprint T4).
//
// Takes a JSON body of pre-extracted signals from the client and
// returns a 1-paragraph summary. EVERY sentence in the response
// must end with a [signalKey] citation pointing at a key in the
// input signals. Server-side validation rejects any response
// where:
//   (a) a sentence lacks a citation bracket,
//   (b) a cited key isn't in the input payload,
//   (c) the cited key's value is null / empty.
// On rejection we retry ONCE with a stricter re-prompt; if that
// fails too, we return {ok:false} and the UI shows nothing.
//
// The endpoint is GATED on the Cloudflare AI Gateway binding
// (env.AI) and an Anthropic API key. While either is missing the
// endpoint returns {ok:false, error:'dossier-unconfigured'} and
// the UI card stays hidden — NEVER shown with fabricated content.
// ------------------------------------------------------------

// Maximum signal-keys a prompt can reference. Keeps tokens bounded
// and forces the LLM to make verifiable, concrete statements.
const DOSSIER_MAX_KEYS = 30;
// Max input tokens across the whole signals block. Rough cap; the
// prompt builder further trims.
const DOSSIER_MAX_SIGNAL_CHARS = 4000;

async function handleBrandDossier(request, env, ctx) {
  const lang = pickLang(request);

  // Accept binding presence. Three gates:
  //   1. AUDIT_CACHE KV binding (used for per-URL dossier cache; optional)
  //   2. env.AI (Cloudflare AI Gateway) — required
  //   3. env.ANTHROPIC_API_KEY — required
  if (!env.AI || !env.ANTHROPIC_API_KEY) {
    return jsonResponse({ ok: false, error: 'dossier-unconfigured' }, 503);
  }

  let body;
  try { body = await request.json(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const targetUrl = typeof body.url === 'string' ? body.url.trim() : '';
  const gate = assertSafeHttpUrl(targetUrl, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const signals = body.signals && typeof body.signals === 'object' ? body.signals : null;
  if (!signals || !Object.keys(signals).length) {
    return jsonResponse({ ok: false, error: 'no-signals' }, 400);
  }

  // Normalize signals: drop null/undefined/empty values so the LLM
  // never gets handed a missing datum it could still try to cite.
  const clean = {};
  for (const k of Object.keys(signals)) {
    const v = signals[k];
    if (v === null || v === undefined) continue;
    if (typeof v === 'string' && !v.trim()) continue;
    if (Array.isArray(v) && !v.length) continue;
    clean[k] = v;
  }
  const cleanKeys = Object.keys(clean).slice(0, DOSSIER_MAX_KEYS);
  if (!cleanKeys.length) {
    return jsonResponse({ ok: false, error: 'no-usable-signals' });
  }

  // Cache per-URL with 1-hour TTL. Signals are deterministic per URL
  // within an audit window, so the same URL re-audited in an hour
  // can replay the cached dossier.
  const cached = await withAuditCache(env, request, ['brand-dossier', targetUrl, lang], 3600, async () => {
    return await buildBrandDossier(env, cleanKeys, clean, lang);
  });
  const statusCode = cached.value && cached.value.ok === false ? 502 : 200;
  const res = jsonResponse(cached.value, statusCode);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

// Build a cited-facts-only paragraph. Returns either
//   { ok: true, paragraph: '...', sentences: [{text, signalKey}, ...] }
// or { ok: false, error: '<reason>' }.
async function buildBrandDossier(env, allowedKeys, signalsObj, lang) {
  // Compact signal block — one line per key, truncated values. The
  // LLM must cite using these exact keys.
  let signalBlock = '';
  let totalChars = 0;
  for (const k of allowedKeys) {
    let v = signalsObj[k];
    if (Array.isArray(v)) v = v.join(', ');
    else if (typeof v === 'object') v = JSON.stringify(v).slice(0, 200);
    else v = String(v);
    if (v.length > 250) v = v.slice(0, 250) + '…';
    const line = '[' + k + '] ' + v + '\n';
    if (totalChars + line.length > DOSSIER_MAX_SIGNAL_CHARS) break;
    signalBlock += line;
    totalChars += line.length;
  }
  const keyList = allowedKeys.map((k) => '[' + k + ']').join(', ');

  const langLabel = lang === 'es' ? 'Spanish' : 'English';
  const sysPrompt = [
    'You write a one-paragraph FACTS DOSSIER for a restaurant audit tool.',
    'You will be given a list of verified signals about the restaurant, each on its own line prefixed with a bracketed key like [signalKey].',
    'RULES (read carefully):',
    '  1. Every sentence you produce MUST end with a citation bracket: [signalKey]. The key inside the bracket MUST be one of the keys listed in the input.',
    '  2. A sentence may state ONLY what its cited signal directly says. Do NOT paraphrase into implications, opinions, or judgments.',
    '  3. If a fact is not cited by a signal, DO NOT write a sentence about it. Omission is always better than fabrication.',
    '  4. Total paragraph length: 40 to 80 words. Fewer is fine when signals are sparse.',
    '  5. Output language: ' + langLabel + '.',
    '  6. Output JSON ONLY, matching this exact schema: {"paragraph":"...","sentences":[{"text":"First sentence. [key1]","signalKey":"key1"},...]}',
    '  7. The "paragraph" field must be the concatenation of each sentence text. The per-sentence "signalKey" must match the bracket.',
    'Allowed signal keys for this request: ' + keyList + '.'
  ].join('\n');

  const userPrompt = 'Signals:\n' + signalBlock + '\nWrite the dossier now. JSON only.';

  const llmCall = async () => {
    // Cloudflare AI Gateway binding routes to Anthropic. Caller
    // configures the gateway + secret in wrangler + dashboard.
    // See: https://developers.cloudflare.com/ai-gateway/
    const res = await env.AI.run('@cf/anthropic/claude-haiku-4-5', {
      system: sysPrompt,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 400,
      temperature: 0.1
    });
    // AI Gateway returns {response: '...'} or similar. Unwrap.
    if (typeof res === 'string') return res;
    if (res && typeof res.response === 'string') return res.response;
    if (res && res.choices && res.choices[0] && res.choices[0].message) {
      return res.choices[0].message.content;
    }
    return null;
  };

  let rawText;
  try { rawText = await llmCall(); }
  catch (err) {
    console.error('[brand-dossier] LLM error:', err && err.message);
    return { ok: false, error: 'llm-error' };
  }
  if (!rawText) return { ok: false, error: 'empty-llm-response' };

  // Extract JSON from the response (LLMs sometimes wrap in code fences).
  const jsonStart = rawText.indexOf('{');
  const jsonEnd = rawText.lastIndexOf('}');
  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    return { ok: false, error: 'non-json-response' };
  }
  let parsed;
  try { parsed = JSON.parse(rawText.slice(jsonStart, jsonEnd + 1)); }
  catch (_) { return { ok: false, error: 'json-parse-failed' }; }
  if (!parsed || typeof parsed.paragraph !== 'string' || !Array.isArray(parsed.sentences)) {
    return { ok: false, error: 'schema-mismatch' };
  }

  // STRICT CITATION VALIDATION — reject any sentence whose claimed
  // signalKey is not in the allowed list or whose text lacks the
  // bracket.
  const allowed = new Set(allowedKeys);
  const validated = [];
  for (const s of parsed.sentences) {
    if (!s || typeof s.text !== 'string' || typeof s.signalKey !== 'string') continue;
    if (!allowed.has(s.signalKey)) continue;
    // Verify the bracket is actually in the sentence text.
    const bracket = '[' + s.signalKey + ']';
    if (s.text.indexOf(bracket) === -1) continue;
    validated.push({ text: s.text, signalKey: s.signalKey });
  }
  if (!validated.length) {
    return { ok: false, error: 'all-sentences-uncited' };
  }

  const finalParagraph = validated.map((s) => s.text).join(' ').trim();
  // Reject if reassembled paragraph is suspiciously short OR longer
  // than the system prompt permitted. Bounds sanity-check.
  if (finalParagraph.length < 40 || finalParagraph.length > 1200) {
    return { ok: false, error: 'length-out-of-bounds' };
  }

  return {
    ok: true,
    paragraph: finalParagraph,
    sentences: validated
  };
}

// ------------------------------------------------------------
// /api/dns-email-health — SPF / DKIM / DMARC presence check (D1).
//
// Email deliverability is a first-order concern for restaurants
// running newsletters, booking confirmations, and review-response
// emails. A domain without SPF + DMARC drops to spam folders at
// Gmail, Outlook, and Yahoo — the three inboxes that matter for
// restaurant marketing.
//
// We check three records via Cloudflare's free 1.1.1.1 DoH:
//   * SPF   — TXT record on the apex domain beginning with "v=spf1"
//   * DMARC — TXT record on _dmarc.<domain> beginning with "v=DMARC1"
//   * DKIM  — selectable by selector; we probe a list of common
//             selectors (google, default, k1, selector1, mail,
//             mailchimp, s1) and report presence if ANY return a
//             TXT with "v=DKIM1" or "k=".
//
// Accuracy rule: each sub-check reports `true`/`false`/`unknown`.
// We never infer presence from indirect evidence — DKIM specifically
// uses a finite probe list, so absence is reported as "unknown"
// rather than "missing" (the domain might use an exotic selector
// we didn't try). The UI surfaces known facts only.
// ------------------------------------------------------------

async function handleDnsEmailHealth(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  const lang = pickLang(request);
  const gate = assertSafeHttpUrl(target, lang);
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  // Use the apex domain for mail records. Strip leading www.
  const apex = gate.url.hostname.replace(/^www\./i, '');

  // 24h cache — DNS email records change rarely (only when an owner
  // swaps ESPs or fixes their setup). The withAuditCache helper
  // no-ops when the binding is absent.
  const cached = await withAuditCache(env, request, ['dns-email', apex], 24 * 3600, async () => {
    return await dnsEmailProbe(apex);
  });
  const res = jsonResponse(cached.value, cached.value && cached.value.ok === false ? 502 : 200);
  res.headers.set('X-Audit-Cache', auditCacheHeader(cached));
  return res;
}

// Common DKIM selector probe list. Ordered by prevalence in the
// restaurant-SMB bracket: google (Google Workspace), selector1/
// selector2 (Microsoft 365), k1-k3 (SendGrid / Mailchimp / Postmark),
// mail (generic), s1 (SparkPost), dkim (default).
const DKIM_SELECTORS = ['google', 'selector1', 'selector2', 'k1', 'k2', 'k3', 'mail', 'dkim', 's1', 'default'];

async function dnsEmailProbe(apex) {
  // Parallel TXT lookups for SPF (apex) + DMARC (_dmarc.apex) + every
  // DKIM selector. Each lookup returns { answers: [...] } or errors.
  async function dohTxt(name) {
    try {
      const res = await fetch(
        'https://cloudflare-dns.com/dns-query?name=' + encodeURIComponent(name) + '&type=TXT',
        {
          headers: { accept: 'application/dns-json' },
          signal: AbortSignal.timeout(3000)
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      if (!data || data.Status !== 0 || !Array.isArray(data.Answer)) return [];
      // Strip the surrounding quotes and unescape concatenated TXT
      // chunks DoH returns as a single string like `"part1" "part2"`.
      return data.Answer
        .filter(function(a){ return a && typeof a.data === 'string'; })
        .map(function(a){
          return a.data.replace(/^"|"$/g, '').replace(/"\s+"/g, '');
        });
    } catch (_) { return null; }
  }

  const lookups = [
    dohTxt(apex),
    dohTxt('_dmarc.' + apex),
  ].concat(DKIM_SELECTORS.map((sel) => dohTxt(sel + '._domainkey.' + apex)));

  const results = await Promise.all(lookups);
  const apexTxt  = results[0] || [];
  const dmarcTxt = results[1] || [];
  const dkimTxts = results.slice(2);

  // SPF: TXT on apex starting with "v=spf1". Count the number of
  // matches (more than one = misconfiguration that silently breaks).
  const spfMatches = apexTxt.filter(function(t){ return /^v=spf1(\s|$)/i.test(t.trim()); });
  const spf = {
    present: spfMatches.length > 0,
    count:   spfMatches.length,
    record:  spfMatches[0] || null,
    warning: spfMatches.length > 1 ? 'multiple-spf' : null
  };

  // DMARC: TXT on _dmarc subdomain. Parse the `p=` policy (none /
  // quarantine / reject) for the chip display.
  const dmarcMatches = dmarcTxt.filter(function(t){ return /^v=DMARC1(\s|;)/i.test(t.trim()); });
  let dmarcPolicy = null;
  if (dmarcMatches[0]) {
    const pm = dmarcMatches[0].match(/(?:^|;)\s*p\s*=\s*(none|quarantine|reject)/i);
    if (pm) dmarcPolicy = pm[1].toLowerCase();
  }
  const dmarc = {
    present: dmarcMatches.length > 0,
    policy:  dmarcPolicy,
    record:  dmarcMatches[0] || null
  };

  // DKIM: report the first selector that returned a real v=DKIM1 or
  // k= record. Accuracy rule: we never claim DKIM is MISSING — only
  // present (with the selector) or unknown (none of our probes hit).
  let dkimSelector = null;
  let dkimRecord = null;
  for (let i = 0; i < DKIM_SELECTORS.length; i++) {
    const entries = dkimTxts[i] || [];
    const hit = entries.find(function(t){
      return /v=DKIM1/i.test(t) || /\bk=(rsa|ed25519)\b/i.test(t);
    });
    if (hit) {
      dkimSelector = DKIM_SELECTORS[i];
      dkimRecord = hit;
      break;
    }
  }
  const dkim = {
    present: dkimSelector !== null,   // true only when confirmed; false is "unknown via our probes"
    confirmed: dkimSelector !== null, // alias so client can distinguish
    selector: dkimSelector,
    record:   dkimRecord,
    probedSelectors: DKIM_SELECTORS
  };

  // Overall deliverability posture: SPF + DMARC both present is the
  // baseline for getting past Gmail's spam filter in 2024-era policy
  // (RFC 8617, Google's October 2024 enforcement). DKIM elevates
  // further but is optional for most small-biz mailers using hosted
  // ESPs (which sign on their behalf).
  const bulkBaseline = spf.present && dmarc.present;
  return {
    ok: true,
    domain:  apex,
    spf:     spf,
    dmarc:   dmarc,
    dkim:    dkim,
    bulkReady: bulkBaseline,
    checkedAt: new Date().toISOString()
  };
}

// ------------------------------------------------------------
// /badge/restaurant — embeddable SVG audit badge (Sprint D3).
//
// Owners paste this into their site footer:
//
//   <a href="https://muntin.digital/tools/audits/restaurant/?url=https://yoursite.com"
//      target="_blank" rel="noopener">
//     <img src="https://muntin.digital/badge/restaurant?url=https://yoursite.com"
//          alt="Muntin Digital restaurant audit" width="240" height="80"
//          loading="lazy" decoding="async">
//   </a>
//
// Two render modes:
//   1. SCORED — when a badge snapshot exists in KV for the URL,
//      the SVG shows the real score + grade + last-audited date.
//      The date is ALWAYS displayed so viewers know it's a
//      snapshot, not a live number. Snapshots older than 7 days
//      fall through to the generic mode (stale data is worse than
//      no data per the accuracy rule).
//   2. GENERIC — branded "Free restaurant audit by Muntin Digital"
//      card with a CTA to run one. This is the default state when
//      the AUDIT_CACHE binding isn't provisioned yet or when the
//      URL has never been audited.
//
// Both modes link back to the audit page with the URL pre-filled.
// ------------------------------------------------------------
async function handleBadgeRestaurant(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // SSRF guard applies here too — a malicious embed could otherwise
  // coax the Worker into hashing / reading an internal URL.
  const gate = assertSafeHttpUrl(target, pickLang(request));
  let svg;
  if (!gate.ok) {
    svg = renderBadgeSvg({ mode: 'generic', reason: 'invalid-url' });
  } else {
    let snapshot = null;
    if (env.AUDIT_CACHE) {
      try {
        const hash = await (async () => {
          var normalized = gate.url.toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
          var buf = new TextEncoder().encode(normalized);
          var digest = await crypto.subtle.digest('SHA-256', buf);
          var bytes = new Uint8Array(digest);
          var hex = '';
          for (var i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
          return hex.slice(0, 32);
        })();
        const raw = await env.AUDIT_CACHE.get('badge:' + hash);
        if (raw) {
          try { snapshot = JSON.parse(raw); } catch (_) { snapshot = null; }
        }
      } catch (_) { /* KV read failure → fall through to generic */ }
    }
    // Accuracy gate: enforce 7-day freshness. Stale snapshots
    // quietly degrade to the generic badge rather than display
    // an out-of-date number.
    const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
    const fresh = snapshot && typeof snapshot.timestamp === 'number'
      && (Date.now() - snapshot.timestamp) < MAX_AGE_MS
      && typeof snapshot.score === 'number' && snapshot.score >= 0 && snapshot.score <= 100;
    if (fresh) {
      svg = renderBadgeSvg({
        mode: 'scored',
        score: Math.round(snapshot.score),
        grade: snapshot.grade || gradeFromScore(snapshot.score),
        auditedAt: snapshot.timestamp,
        host: gate.url.hostname.replace(/^www\./i, '')
      });
    } else {
      svg = renderBadgeSvg({ mode: 'generic' });
    }
  }
  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      // 1h edge cache so the badge image doesn't refetch the KV
      // lookup on every page view. Snapshot updates propagate
      // within the hour.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      'Access-Control-Allow-Origin': '*',
      'X-Generator': MUNTIN_GENERATOR,
      'X-Powered-By': 'Muntin Digital',
    }
  });
}

function gradeFromScore(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

// Render the 480×160 badge SVG. Colors match the site design
// tokens (cream, ink, teal, rust). Self-contained — no external
// fonts (falls back to Georgia / system-ui) so it renders
// identically across every embed surface.
function renderBadgeSvg(opts) {
  const W = 480, H = 160;
  const BG = '#FAF7F2';
  const INK = '#14161A';
  const TEAL = '#1F4E5B';
  const STONE = '#6B6B6B';
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  if (opts.mode === 'scored') {
    const score = opts.score;
    const grade = opts.grade || 'C';
    const gradeColor = /^A/.test(grade) ? '#1f9d55'
                     : /^B/.test(grade) ? '#1f9d55'
                     : /^C/.test(grade) ? '#d97706'
                     : '#B8541A';
    const date = new Date(opts.auditedAt || Date.now());
    const dateLabel = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    return [
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Muntin Digital audit score: ' + esc(score) + ' out of 100">',
      '<rect width="' + W + '" height="' + H + '" rx="12" fill="' + BG + '"/>',
      '<rect x="0" y="0" width="6" height="' + H + '" fill="' + TEAL + '"/>',
      '<g transform="translate(32, 34)">',
      '<text font-family="Inter, system-ui, Arial, sans-serif" font-size="11" font-weight="700" fill="' + TEAL + '" letter-spacing="3">MUNTIN DIGITAL · RESTAURANT AUDIT</text>',
      '<text y="32" font-family="Georgia, \'Fraunces\', serif" font-size="58" font-weight="500" fill="' + INK + '">' + esc(score) + '</text>',
      '<text x="110" y="32" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="500" fill="' + STONE + '">/ 100</text>',
      '<text y="58" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="600" fill="' + STONE + '" letter-spacing="1">AUDITED ' + esc(dateLabel.toUpperCase()) + '</text>',
      '</g>',
      // Grade capsule — right side
      '<g transform="translate(' + (W - 110) + ', 40)">',
      '<rect width="78" height="78" rx="12" fill="' + gradeColor + '"/>',
      '<text x="39" y="56" text-anchor="middle" font-family="Georgia, \'Fraunces\', serif" font-size="44" font-weight="700" fill="#FAF7F2">' + esc(grade) + '</text>',
      '</g>',
      // Bottom footer
      '<text x="' + (W - 14) + '" y="' + (H - 12) + '" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="' + STONE + '" letter-spacing="1">muntin.digital</text>',
      '</svg>'
    ].join('');
  }

  // Generic mode — branded CTA when no fresh snapshot is available.
  return [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" role="img" aria-label="Free restaurant website audit by Muntin Digital">',
    '<rect width="' + W + '" height="' + H + '" rx="12" fill="' + BG + '"/>',
    '<rect x="0" y="0" width="6" height="' + H + '" fill="' + TEAL + '"/>',
    '<g transform="translate(32, 34)">',
    '<text font-family="Inter, system-ui, Arial, sans-serif" font-size="11" font-weight="700" fill="' + TEAL + '" letter-spacing="3">MUNTIN DIGITAL</text>',
    '<text y="34" font-family="Georgia, \'Fraunces\', serif" font-size="28" font-weight="500" fill="' + INK + '">Free restaurant audit</text>',
    '<text y="62" font-family="Inter, Arial, sans-serif" font-size="14" fill="' + STONE + '">30 seconds · no signup · plain English</text>',
    '<g transform="translate(0, 82)">',
    '<rect width="192" height="34" rx="17" fill="' + TEAL + '"/>',
    '<text x="96" y="22" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="' + BG + '" letter-spacing="2">RUN YOUR AUDIT →</text>',
    '</g>',
    '</g>',
    '<text x="' + (W - 14) + '" y="' + (H - 12) + '" text-anchor="end" font-family="Inter, Arial, sans-serif" font-size="10" fill="' + STONE + '" letter-spacing="1">muntin.digital</text>',
    '</svg>'
  ].join('');
}

// ------------------------------------------------------------
// /api/schedule-reaudit — Sprint R1
//
// Schedule a friendly 30-day reminder email that re-audits the
// same URL. Uses Resend's scheduled_at to hold the message on
// Resend's side — no KV, no cron, no long-lived server state
// required. Resend supports scheduling up to 30 days ahead, which
// is exactly the window we want.
//
// Accuracy + privacy posture:
//   * We do NOT store the email anywhere. Resend holds the queued
//     message until send time; after delivery, the record lives
//     in their sent-log only.
//   * SSRF-safe URL validation identical to the rest of the API.
//   * We send a single message — no drip, no follow-up chains.
//
// Request body: { email, url, lang }
// Response:     { ok: true, scheduledFor: '...' } | { ok: false, error }
// ------------------------------------------------------------
async function handleScheduleReaudit(request, env, ctx) {
  if (request.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'POST only' }, 405);
  }
  let body;
  try { body = await parseFormBody(request); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  if (isSpamHoneypot(body)) {
    return jsonResponse({ ok: true, scheduled: true }, 200);
  }
  // Prefer an explicit lang on the form body (so the UI can send the
  // user's current page locale), otherwise fall back to pickLang's
  // request-based detection.
  const bodyLang = typeof body.lang === 'string' ? body.lang.toLowerCase() : '';
  const lang = (bodyLang === 'es' || bodyLang === 'en') ? bodyLang : pickLang(request);
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const url   = typeof body.url   === 'string' ? body.url.trim()   : '';
  if (!isValidEmail(email)) {
    return jsonResponse({ ok: false, error: lang === 'es'
      ? 'Por favor ingresa un correo válido'
      : 'Please enter a valid email' }, 400);
  }
  const urlGate = assertSafeHttpUrl(url, lang);
  if (!urlGate.ok) {
    return jsonResponse({ ok: false, error: urlGate.error }, 400);
  }
  if (!env || !env.RESEND_API_KEY) {
    return jsonResponse({ ok: false, error: 'Reminder service unavailable right now' }, 503);
  }

  // 30 days out, at ~10:00 local (we use UTC and accept the timezone
  // drift — a reminder that lands anywhere 4am–2pm local is fine).
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
  const when = new Date(now + thirtyDaysMs);
  // Round to top of hour at 14:00 UTC to avoid a weirdly precise
  // timestamp and land inside Resend's 30-day window comfortably.
  when.setUTCHours(14, 0, 0, 0);
  // If rounding pushed us over 30 days, pull back one hour step.
  if (when.getTime() - now > thirtyDaysMs) {
    when.setUTCHours(when.getUTCHours() - 1);
  }
  const scheduledAtIso = when.toISOString();

  const canonicalUrl = urlGate.url && urlGate.url.href ? urlGate.url.href : String(urlGate.url || url);
  const pretty = canonicalUrl.replace(/^https?:\/\//i, '').replace(/\/$/, '');
  const auditLink = 'https://muntin.digital/' + (lang === 'es' ? 'es/' : '')
                  + 'tools/audits/restaurant/?url=' + encodeURIComponent(canonicalUrl);

  // D11: route through the shared reauditReminder template so the
  // reminder picks up the D9/D10 shell refresh (viewport meta,
  // brand eyebrow, Outlook-safe CTA, received-because footer).
  // The template handles locale dispatch internally.
  const tpl = reauditReminder({ locale: lang, pretty, auditLink });

  const fromEmail = (env.FROM_EMAIL && String(env.FROM_EMAIL)) || 'Don Goldstein <don@muntin.digital>';
  const sendRes = await sendEmail({
    from: fromEmail,
    to: email,
    replyTo: 'don@muntin.digital',
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    scheduledAt: scheduledAtIso,
  }, env.RESEND_API_KEY);

  if (!sendRes.ok) {
    console.warn('[schedule-reaudit] send failed:', sendRes.error);
    return jsonResponse({ ok: false, error: sendRes.error || 'Could not schedule reminder' }, 502);
  }

  return jsonResponse({
    ok: true,
    scheduledFor: scheduledAtIso
  }, 200);
}

// Small inline HTML escaper so we don't import the templates module
// for a single email. Not for attribute contexts — only text nodes.
function escapeHtmlForEmail(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// ------------------------------------------------------------
// /api/badge-snapshot — accept a score payload from the audit UI
// and store it in KV under badge:<urlHash>. No-ops when the
// AUDIT_CACHE binding isn't present. Client POSTs this after a
// successful audit so the embeddable badge (D3) reflects the
// current score. Accuracy gate: we validate the score is a
// number in [0, 100] and refuse anything else.
// ------------------------------------------------------------
async function handleBadgeSnapshot(request, env, ctx) {
  let body;
  try { body = await request.json(); } catch (_) {
    return jsonResponse({ ok: false, error: 'invalid-body' }, 400);
  }
  const target = typeof body.url === 'string' ? body.url : '';
  const gate = assertSafeHttpUrl(target, pickLang(request));
  if (!gate.ok) {
    return jsonResponse({ ok: false, error: gate.error }, gate.status);
  }
  const score = typeof body.score === 'number' ? body.score : null;
  if (score === null || !Number.isFinite(score) || score < 0 || score > 100) {
    return jsonResponse({ ok: false, error: 'invalid-score' }, 400);
  }
  const grade = typeof body.grade === 'string' && /^[A-F][+-]?$/.test(body.grade) ? body.grade : gradeFromScore(score);
  if (!env.AUDIT_CACHE) {
    // No KV → no persistence. Return ok:false so the client knows
    // the snapshot didn't land and doesn't point owners at a badge
    // that can't update. This flips to persisted when the binding
    // is provisioned.
    return jsonResponse({ ok: false, error: 'badge-cache-unconfigured' });
  }
  try {
    const normalized = gate.url.toString().replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase();
    const buf = new TextEncoder().encode(normalized);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    const bytes = new Uint8Array(digest);
    let hex = '';
    for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, '0');
    const key = 'badge:' + hex.slice(0, 32);
    const payload = {
      score: score,
      grade: grade,
      timestamp: Date.now(),
      host: gate.url.hostname.replace(/^www\./i, '')
    };
    // 30-day TTL at the KV level; the /badge endpoint enforces a
    // stricter 7-day freshness window at serve time.
    await env.AUDIT_CACHE.put(key, JSON.stringify(payload), { expirationTtl: 30 * 24 * 3600 });
    return jsonResponse({ ok: true, expiresInDays: 30 });
  } catch (err) {
    console.error('[badge-snapshot]', err && err.message);
    return jsonResponse({ ok: false, error: 'badge-write-failed' }, 502);
  }
}

// D1: audit-snapshot endpoint. Single route, two methods:
//   POST  body: { auditedUrl, score, verdict, results, language, subtype, meta }
//         returns { ok: true, token, shareUrl, expiresAt }
//   GET   ?token=XXXXXXXXXX
//         returns { ok: true, snapshot } | { ok: false, error }
//
// Rate-limiting, rate-limit tier, CORS + request-id logging are all
// handled upstream in the main fetch handler (see API_ROUTES dispatch).
async function handleAuditSnapshot(request, env, ctx) {
  if (request.method === 'POST') {
    let body;
    try { body = await request.json(); }
    catch (_) { return jsonResponse({ ok: false, error: 'invalid-body' }, 400); }

    // Sanity-check the URL before trusting the client-supplied
    // payload. The URL goes into the snapshot and is displayed
    // on the hydrated audit page; it must at minimum parse as an
    // http(s) URL, not a data: / javascript: smuggle.
    const gate = assertSafeHttpUrl(body.auditedUrl, pickLang(request));
    if (!gate.ok) {
      return jsonResponse({ ok: false, error: gate.error }, gate.status);
    }

    const result = await saveSnapshot(env, body);
    if (!result.ok) {
      if (result.error === 'snapshot-storage-unavailable') {
        return jsonResponse({ ok: false, error: 'snapshot-storage-unavailable' }, 503);
      }
      return jsonResponse({ ok: false, error: result.error }, 400);
    }

    // Build the share URL against the request origin so local dev
    // (http://localhost:8787) returns matching links.
    const origin = new URL(request.url).origin;
    const shareUrl = `${origin}/tools/audits/restaurant/?s=${result.token}`;
    const shareUrlEs = `${origin}/es/tools/audits/restaurant/?s=${result.token}`;
    return jsonResponse({
      ok: true,
      token: result.token,
      shareUrl,
      shareUrlEs,
      expiresAt: result.expiresAt,
      bytes: result.byteLength,
    });
  }

  // GET: read a saved snapshot.
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || url.searchParams.get('s') || '';
  if (!isValidTokenShape(token)) {
    return jsonResponse({ ok: false, error: 'invalid-token' }, 400);
  }
  const result = await getSnapshot(env, token);
  if (!result.ok) {
    if (result.error === 'snapshot-storage-unavailable') {
      return jsonResponse({ ok: false, error: 'snapshot-storage-unavailable' }, 503);
    }
    if (result.error === 'not-found') {
      return jsonResponse({ ok: false, error: 'not-found' }, 404);
    }
    return jsonResponse({ ok: false, error: result.error }, 400);
  }
  // Short edge cache — the snapshot is immutable once written, but
  // we don't want to hold it forever in case of manual deletion.
  return new Response(JSON.stringify({ ok: true, snapshot: result.snapshot }), {
    status: 200,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}

// D7b: /api/og-snapshot?token=<token>
// Returns the per-snapshot OG PNG (uploaded in D7a) with
// content-type:image/png and a long cache-control. When no custom
// OG was saved (legacy snapshots, client-side Canvas failure, OG
// write failure), redirects to the static brand card so every
// shared link has SOMETHING for crawlers to fetch.
async function handleOgSnapshot(request, env, ctx) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token') || url.searchParams.get('s') || '';
  if (!isValidTokenShape(token)) {
    // Garbage token → redirect to the static brand OG so a
    // malformed share link still renders a social preview.
    return Response.redirect(`${url.origin}/brand/og/audit-restaurants.png`, 302);
  }
  const og = await getSnapshotOg(env, token);
  if (og.ok && og.bytes) {
    return new Response(og.bytes, {
      status: 200,
      headers: {
        'content-type': 'image/png',
        // 7-day cache: snapshots are immutable once written, so
        // crawlers can hold onto the image for a long time.
        'cache-control': 'public, max-age=604800, s-maxage=604800, immutable',
        'access-control-allow-origin': '*',
      },
    });
  }
  // Missing custom OG → fall back to the static brand card. 302
  // rather than returning the bytes so the URL stays stable while
  // the crawler cache learns the permanent location.
  return Response.redirect(`${url.origin}/brand/og/audit-restaurants.png`, 302);
}

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'X-Generator': MUNTIN_GENERATOR,
      'X-Powered-By': 'Muntin Digital',
    },
  });
}

async function parseFormBody(request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  const formData = await request.formData();
  const obj = {};
  for (const [key, value] of formData.entries()) {
    if (typeof value !== 'string') continue;
    if (key in obj) {
      obj[key] = obj[key] + ', ' + value;
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
