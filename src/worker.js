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
} from './lib/validation.js';
import {
  intakeNotification,
  intakeAutoResponder,
  checklistNotification,
  checklistAutoResponder,
  auditReportNotification,
  auditReportAutoResponder,
  auditDeepReportNotification,
  auditDeepReportAutoResponder,
} from './lib/templates.js';


// ------------------------------------------------------------
// API route table
// ------------------------------------------------------------

const API_ROUTES = {
  '/api/intake':        handleIntake,
  '/api/checklist':     handleChecklist,
  '/api/audit-report':  handleAuditReport,
  '/api/ping':          handlePing,
  '/api/gbp-lookup':    handleGbpLookup,
  '/api/seo-check':     handleSeoCheck,
  '/api/schema-check':  handleSchemaCheck,
  '/api/page-crawl':    handlePageCrawl,
  '/api/psi':           handlePsi,
};


// ------------------------------------------------------------
// Worker entry point
// ------------------------------------------------------------

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API routes — check the exact-match table first.
    if (pathname.startsWith('/api/')) {
      const handler = API_ROUTES[pathname];
      if (!handler) {
        return jsonResponse(
          { ok: false, error: 'Unknown API endpoint', path: pathname },
          404
        );
      }
      if (pathname === '/api/ping' || pathname === '/api/gbp-lookup' || pathname === '/api/seo-check' || pathname === '/api/schema-check' || pathname === '/api/page-crawl' || pathname === '/api/psi') {
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

    // Fall through to the static-asset server.
    return env.ASSETS.fetch(request);
  },
};


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
          'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types,places.regularOpeningHours,places.photos,places.websiteUri,places.googleMapsUri'
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
  const gate = assertSafeHttpUrl(target);
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

    const html = await res.text();

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
  // Sprint E3: SSRF guard — same ruleset as E2.
  const gate = assertSafeHttpUrl(target);
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
      return jsonResponse({ ok: false, error: 'Could not fetch the page (HTTP ' + res.status + ')' }, 502);
    }

    const html = await res.text();
    const parsed = extractJsonLd(html);
    const validation = validateRestaurantSchema(parsed.objects);

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
function validateRestaurantSchema(objects) {
  const restaurantObjects = (objects || []).filter(isRestaurantLikeSchema);
  return {
    restaurantObjectCount: restaurantObjects.length,
    openingHours:        validateOpeningHours(restaurantObjects),
    priceRange:          validatePriceRange(restaurantObjects),
    servesCuisine:       validateServesCuisine(restaurantObjects),
    acceptsReservations: validateAcceptsReservations(restaurantObjects),
    hasMenu:             validateHasMenu(restaurantObjects),
    // Sprint H3: new address validator — covers streetAddress /
    // addressLocality / addressRegion / postalCode presence, the
    // four highest-impact fields for Google's local-search rich
    // results on a Restaurant schema.
    address:             validateAddress(restaurantObjects)
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
  let reason = null;
  if (!present) reason = 'No address on the Restaurant schema.';
  else if (typeof rawAddress === 'string') reason = 'Address is a bare string; Google prefers a structured PostalAddress with streetAddress, addressLocality, addressRegion, and postalCode.';
  else if (missingFields.length) reason = 'Address is missing: ' + missingFields.join(', ') + '. Add these fields to qualify for local-search rich results.';
  return { present: present, valid: valid, reason: reason, missingFields: missingFields };
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
  return { present: present, accepts: accepts, raw: value };
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
  return { present: present, urlValid: urlValid, urls: urls };
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
  let reason = null;
  if (!present) reason = 'No priceRange on the Restaurant schema. Google uses this to filter by price level.';
  else if (!wellFormed) reason = 'priceRange "' + (value || '') + '" does not match a recognized shape (e.g. "$$", "$15-30", or "$25").';
  return {
    present: present,
    wellFormed: wellFormed,
    value: value,
    valid: present && wellFormed,
    reason: reason
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
  return {
    present: cuisines.length > 0,
    count:   cuisines.length,
    values:  cuisines
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
  let reason = null;
  if (!found) reason = 'No openingHours or openingHoursSpecification on the Restaurant schema.';
  else if (dayCount < 7) reason = 'Only ' + dayCount + ' of 7 days covered — Google shows the rich-hours panel only when every day is present.';
  else if (timeFieldsSeen > 0 && timeFieldsBad > 0) reason = timeFieldsBad + ' time values are not in HH:MM format — Google may silently drop the hours panel.';
  else if (parseErrors > 0) reason = parseErrors + ' day name could not be parsed — use Mo/Tu/We/Th/Fr/Sa/Su or full English names.';
  return {
    present:     found,
    dayCount:    dayCount,
    complete:    dayCount === 7,
    parseErrors: parseErrors,
    timesValid:  timesValid,
    timeFieldsSeen: timeFieldsSeen,
    timeFieldsBad:  timeFieldsBad,
    valid:       found && dayCount === 7 && (timeFieldsSeen === 0 || timesValid) && parseErrors === 0,
    reason:      reason
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
const PAGE_CRAWL_MAX_CANDIDATES   = 5;
const PAGE_CRAWL_PER_URL_TIMEOUT  = 6000;
const PAGE_CRAWL_GLOBAL_CAP       = 15000;
const PAGE_CRAWL_HOMEPAGE_TIMEOUT = 8000;

async function handlePageCrawl(request, env, ctx) {
  const url = new URL(request.url);
  const target = (url.searchParams.get('url') || '').trim();
  // Sprint E4: SSRF guard on the entry URL so a crafted input can't
  // coax the Worker into fetching an internal host.
  const gate = assertSafeHttpUrl(target);
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
          pages.push({
            slot: v.slot,
            url: v.url,
            status: v.result.status,
            html: truncateHtml(v.result.html, PAGE_CRAWL_MAX_HTML)
          });
        } else {
          pages.push({
            slot: v.slot,
            url: v.url,
            status: (v.result && v.result.status) || 0,
            html: null,
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

  return jsonResponse({
    ok: true,
    homepage: {
      url: homepage.url,
      status: homepage.status,
      html: truncateHtml(homepage.html, PAGE_CRAWL_MAX_HTML)
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
  { slot: 'menu',        patterns: [/\bmenu\b/i, /\bmenus\b/i, /food\s*&?\s*drink/i, /\bwine\s+list\b/i, /\bdrink\s+list\b/i] },
  { slot: 'contact',     patterns: [/\bcontact\b/i, /\bvisit\b/i, /location/i, /find\s+us/i, /hours/i] },
  { slot: 'about',       patterns: [/\babout\b/i, /our\s+story/i, /\bchef\b/i, /\bteam\b/i] }
];

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
    const html = await res.text();
    return { ok: true, url: res.url || target, status: res.status, html: html };
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
    return jsonResponse(
      { ok: false, error: isTimeout
          ? 'PageSpeed Insights took longer than 30s — please retry'
          : 'Failed to reach PageSpeed Insights' },
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
