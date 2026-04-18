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
  '/api/yelp-lookup':   handleYelpLookup,
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
      if (pathname === '/api/ping' || pathname === '/api/gbp-lookup' || pathname === '/api/seo-check' || pathname === '/api/schema-check' || pathname === '/api/page-crawl' || pathname === '/api/yelp-lookup' || pathname === '/api/psi') {
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
      try {
        return await handler(request, env, ctx);
      } catch (err) {
        console.error('[api]', pathname, err && err.stack ? err.stack : err);
        return jsonResponse(
          { ok: false, error: 'Internal error — please try again in a moment' },
          500
        );
      }
    }

    // Not an API route — fall through to the static-asset server.
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

  // Required fields: name, email, services, goals. Business,
  // website, budget, and referral are optional per the form HTML.
  const required = requireFields(body, ['name', 'email', 'services', 'goals']);
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

  // Phase J5: dispatch on body.interest so the deep-gate unlock
  // flow gets its own subtype-voiced template pair from the J3
  // additions in templates.js. Legacy 'email me this report'
  // submissions (no interest or any other value) keep the
  // original templates for backward compatibility with already-
  // rendered UIs that predate the split.
  const isDeepReport = String(body.interest || '').trim() === 'restaurant-audit-deep-report';
  const notificationTmpl = isDeepReport
    ? auditDeepReportNotification(body)
    : auditReportNotification(body);
  const autoReplyTmpl = isDeepReport
    ? auditDeepReportAutoResponder(body)
    : auditReportAutoResponder(body);

  return await sendPair({
    env,
    userEmail: body.email.trim(),
    notification: notificationTmpl,
    autoReply:    autoReplyTmpl,
    endpoint:     isDeepReport ? 'audit-deep-report' : 'audit-report',
  });
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

async function sendPair({ env, userEmail, notification, autoReply, endpoint }) {
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
      // fallback, Places lookup disabled, Yelp lookup disabled,
      // email send disabled, …) so ops can verify secrets are
      // plumbed without actually exercising the upstreams.
      configured: {
        resend:  Boolean(env.RESEND_API_KEY),
        from:    Boolean(env.FROM_EMAIL),
        notify:  Boolean(env.NOTIFY_EMAIL),
        psi:     Boolean(env.PSI_API_KEY),
        places:  Boolean(env.GOOGLE_PLACES_KEY),
        yelp:    Boolean(env.YELP_API_KEY),
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
        body: JSON.stringify({ textQuery: query, maxResultCount: 1 })
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

    const p = places[0];

    // Build a clean response
    const result = {
      ok: true,
      name: p.displayName ? p.displayName.text : null,
      address: p.formattedAddress || null,
      rating: p.rating || null,
      reviewCount: p.userRatingCount || 0,
      types: (p.types || []).slice(0, 5),
      photoCount: p.photos ? p.photos.length : 0,
      hasHours: !!(p.regularOpeningHours && p.regularOpeningHours.periods && p.regularOpeningHours.periods.length),
      website: p.websiteUri || null,
      mapsUrl: p.googleMapsUri || null,
    };

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
  if (!target) {
    return jsonResponse({ ok: false, error: 'Missing ?url= parameter' }, 400);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(target, {
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
  if (!target) {
    return jsonResponse({ ok: false, error: 'Missing ?url= parameter' }, 400);
  }

  try {
    const res = await fetch(target, {
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
    hasMenu:             validateHasMenu(restaurantObjects)
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
  return { present: present, wellFormed: wellFormed, value: value };
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
      });
    } else if (spec && typeof spec === 'object') {
      found = true;
      const dow = spec.dayOfWeek;
      if (Array.isArray(dow)) dow.forEach(addDay);
      else addDay(dow);
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
      });
    }
  });

  const dayCount = Object.keys(covered).length;
  return {
    present:     found,
    dayCount:    dayCount,
    complete:    dayCount === 7,
    parseErrors: parseErrors
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
  if (!target) {
    return jsonResponse({ ok: false, error: 'Missing ?url= parameter' }, 400);
  }

  const homepage = await fetchPageForCrawl(target, PAGE_CRAWL_HOMEPAGE_TIMEOUT);
  if (!homepage.ok) {
    return jsonResponse({ ok: false, error: homepage.error || 'Fetch failed' }, 502);
  }

  // Sprint E2: rank up to PAGE_CRAWL_MAX_CANDIDATES internal-link
  // candidates from the homepage HTML.
  const candidates = extractInternalLinkCandidates(homepage.html, homepage.url)
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
    const res  = await fetch(upstream.toString(), {
      headers: { 'Accept': 'application/json' }
    });
    const body = await res.text();
    // Pass through status + JSON body so the client can see PSI's
    // structured error shape (body.error.message) unchanged.
    return new Response(body, {
      status: res.status,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (err) {
    console.error('[psi] upstream fetch failed:', err && err.stack ? err.stack : err);
    return jsonResponse({ ok: false, error: 'Failed to reach PageSpeed Insights' }, 502);
  }
}


// ------------------------------------------------------------
// Yelp Fusion v3 lookup — Phase G2
// ------------------------------------------------------------
// Proxies a Yelp business search so the restaurant audit can
// surface the site's rating, review count, price tier, and
// categories without shipping the API key to the browser.
//
// Behavior mirrors /api/psi:
//   - Missing env.YELP_API_KEY → 503 { error: 'yelp-unconfigured' }
//     so the client can treat the feature as optional and fall
//     back to the on-page review-widget scan (Phase G4).
//   - Missing `term` or `location` → 400.
//   - Yelp upstream error → 502 with a scrubbed message.
//   - Success → 200 with the first match's core fields.
//
//   GET /api/yelp-lookup?term=Joe%27s%20Pizza&location=Brooklyn%20NY
//
// No caching headers — the caller is expected to handle caching
// via the shared jsonResponse helper's no-store defaults. Yelp's
// own rate limit (5000 calls/day on the free tier) is the
// operational budget.
async function handleYelpLookup(request, env, ctx) {
  if (!env.YELP_API_KEY) {
    return jsonResponse(
      { ok: false, error: 'yelp-unconfigured' },
      503
    );
  }
  const url = new URL(request.url);
  const term     = (url.searchParams.get('term')     || '').trim();
  const location = (url.searchParams.get('location') || '').trim();
  if (!term || !location) {
    return jsonResponse({ ok: false, error: 'Missing term or location parameter' }, 400);
  }

  const params = new URLSearchParams({
    term: term,
    location: location,
    limit: '1',
    sort_by: 'best_match'
  });
  const endpoint = 'https://api.yelp.com/v3/businesses/search?' + params.toString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(function(){ controller.abort(); }, 8000);
    const res = await fetch(endpoint, {
      headers: {
        'Authorization': 'Bearer ' + env.YELP_API_KEY,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      // Don't leak Yelp's upstream error body — it can contain
      // auth debug hints that we don't want to expose to the
      // browser. Just pass along a scrubbed status.
      return jsonResponse(
        { ok: false, error: 'Yelp returned HTTP ' + res.status },
        502
      );
    }
    const body = await res.json();
    const first = (body && Array.isArray(body.businesses) && body.businesses[0]) || null;
    if (!first) {
      return jsonResponse({ ok: true, match: null }, 200);
    }

    return jsonResponse({
      ok: true,
      match: {
        id:           first.id || null,
        name:         first.name || null,
        url:          first.url || null,
        rating:       (typeof first.rating === 'number') ? first.rating : null,
        reviewCount:  (typeof first.review_count === 'number') ? first.review_count : null,
        price:        first.price || null,
        categories:   Array.isArray(first.categories)
                      ? first.categories.map(function(c){ return c && c.title; }).filter(Boolean)
                      : [],
        phone:        first.display_phone || first.phone || null,
        location:     first.location && first.location.display_address
                      ? first.location.display_address.join(', ') : null,
        distance:     (typeof first.distance === 'number') ? first.distance : null,
        imageUrl:     first.image_url || null,
        closed:       !!first.is_closed
      }
    }, 200);
  } catch (err) {
    const timedOut = err && err.name === 'AbortError';
    console.error('[yelp-lookup] upstream failed:', err && err.stack ? err.stack : err);
    return jsonResponse(
      { ok: false, error: timedOut ? 'Yelp timed out' : 'Failed to reach Yelp' },
      502
    );
  }
}


// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------

function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
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
