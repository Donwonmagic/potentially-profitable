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
// just uploaded the static assets. Sprint 7 adds this script so we
// can replace the three Formspree endpoints (new-project intake,
// restaurant-website-checklist PDF request, and audit-report-email)
// with self-hosted form handlers that cost zero and give us
// automated responses without the Formspree subscription.
//
// Sprint 7 is broken into four sub-sprints so each piece ships
// independently and the site never goes into a broken state:
//
//   7a (THIS SPRINT)  — Scaffold + routing. /api/* returns stub
//                       501 responses so we can verify routing
//                       works end-to-end before wiring real logic.
//   7b               — Email library + templates (Resend adapter,
//                       notification + auto-responder templates,
//                       validation + honeypot helpers). Pure
//                       library code — not wired yet.
//   7c               — Handlers wired: /api/intake, /api/checklist,
//                       /api/audit-report each send a real
//                       notification email + auto-responder.
//   7d               — Deployment guide + HTML form cutover
//                       (Formspree retirement).
//
// None of the sub-sprints touch production forms until 7d. Until
// then, the existing Formspree endpoints keep running and this
// Worker just handles stub /api/* requests.

// ------------------------------------------------------------
// API route table
// ------------------------------------------------------------
//
// Each entry maps a path to a handler function. Paths are matched
// exactly (not as prefixes) so /api/intake matches only /api/intake
// — not /api/intake/sub. Add new endpoints here.

const API_ROUTES = {
  '/api/intake':        handleIntake,
  '/api/checklist':     handleChecklist,
  '/api/audit-report':  handleAuditReport,
  // Small ping endpoint so you can verify the Worker is live and
  // the API router is hooked up without hitting a real handler.
  // Returns JSON with sprint info + current timestamp.
  '/api/ping':          handlePing,
};


// ------------------------------------------------------------
// Worker entry point
// ------------------------------------------------------------
//
// Modern Cloudflare Workers use the ES Module default export.
// The fetch handler receives (request, env, ctx):
//   request — standard Request
//   env     — bindings from wrangler.jsonc, including env.ASSETS
//             (the static-asset binding automatically provided by
//             the "assets" config block)
//   ctx     — execution context (waitUntil, passThroughOnException)
//
// For /api/* we always return a JSON response with a consistent
// shape. For everything else we fall through to the static asset
// server.

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API routes — check the exact-match table first.
    if (pathname.startsWith('/api/')) {
      const handler = API_ROUTES[pathname];
      if (!handler) {
        return jsonResponse(
          {
            ok: false,
            error: 'Unknown API endpoint',
            path: pathname,
          },
          404
        );
      }
      // Only allow POST for form submissions, GET for ping. Reject
      // everything else with a 405 so casual GETs of the intake
      // endpoint don't show a misleading "missing field" error.
      if (pathname === '/api/ping') {
        if (request.method !== 'GET') {
          return jsonResponse({ ok: false, error: 'Method not allowed' }, 405);
        }
      } else {
        if (request.method !== 'POST') {
          return jsonResponse(
            {
              ok: false,
              error: 'Method not allowed — form endpoints accept POST only',
            },
            405
          );
        }
      }
      try {
        return await handler(request, env, ctx);
      } catch (err) {
        // Anything uncaught becomes a 500. Errors are logged to
        // Workers' observability so we can diagnose later.
        console.error('[api]', pathname, err && err.stack ? err.stack : err);
        return jsonResponse(
          {
            ok: false,
            error: 'Internal error — please try again in a moment',
          },
          500
        );
      }
    }

    // Not an API route — fall through to the static-asset server.
    // env.ASSETS is injected automatically because wrangler.jsonc
    // has an "assets" block.
    return env.ASSETS.fetch(request);
  },
};


// ------------------------------------------------------------
// Sprint 7a stub handlers
// ------------------------------------------------------------
//
// These return a shape identical to what Sprint 7c's real handlers
// will return, minus the side effects. Lets us verify routing,
// content-type handling, and error paths end-to-end before wiring
// the email provider.
//
// Each stub returns 501 Not Implemented because the endpoint
// exists but doesn't do anything useful yet. Swap in real logic
// in Sprint 7c.

async function handleIntake(request, env, ctx) {
  // Parse the body so we verify form POSTs reach this handler and
  // the Content-Type parsing path works. Don't keep the data —
  // this is a stub.
  let body;
  try {
    body = await parseFormBody(request);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: 'Could not parse request body: ' + err.message },
      400
    );
  }
  return jsonResponse(
    {
      ok: false,
      error: 'Intake endpoint not yet implemented (Sprint 7c)',
      sprint: '7a',
      fields_received: Object.keys(body).length,
    },
    501
  );
}

async function handleChecklist(request, env, ctx) {
  let body;
  try {
    body = await parseFormBody(request);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: 'Could not parse request body: ' + err.message },
      400
    );
  }
  return jsonResponse(
    {
      ok: false,
      error: 'Checklist endpoint not yet implemented (Sprint 7c)',
      sprint: '7a',
      fields_received: Object.keys(body).length,
    },
    501
  );
}

async function handleAuditReport(request, env, ctx) {
  let body;
  try {
    body = await parseFormBody(request);
  } catch (err) {
    return jsonResponse(
      { ok: false, error: 'Could not parse request body: ' + err.message },
      400
    );
  }
  return jsonResponse(
    {
      ok: false,
      error: 'Audit-report endpoint not yet implemented (Sprint 7c)',
      sprint: '7a',
      fields_received: Object.keys(body).length,
    },
    501
  );
}

// ------------------------------------------------------------
// Diagnostic: /api/ping
// ------------------------------------------------------------
//
// GET-only. Returns { ok, sprint, timestamp } so you can verify
// from a browser address bar or curl that the Worker is live and
// the API router is hooked up correctly. Good smoke test after a
// deploy.

async function handlePing(request, env, ctx) {
  return jsonResponse(
    {
      ok: true,
      service: 'muntin-digital forms api',
      sprint: '7a',
      timestamp: new Date().toISOString(),
      routes: Object.keys(API_ROUTES),
    },
    200
  );
}


// ------------------------------------------------------------
// Shared helpers
// ------------------------------------------------------------

// Wrap a payload in a standard JSON Response with sensible
// security + caching headers. API responses should never be
// cached by browsers or CDNs — they contain per-request state.
function jsonResponse(payload, status) {
  return new Response(JSON.stringify(payload), {
    status: status || 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      // CORS: allow our own origin (same-origin requests don't need
      // this header but curl / test clients benefit from an explicit
      // allow). We never send credentials so the wildcard is safe.
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

// Parse a form POST body. Accepts either
//   application/x-www-form-urlencoded  (native HTML form POSTs)
//   multipart/form-data                (HTML form with file input)
//   application/json                   (fetch() calls from site.js)
//
// Returns a plain object {fieldName: value}. Multi-value fields
// (like a checkbox group) are joined with ", " — the only form that
// has one is the intake form's services checkbox group, and joining
// with a comma is how Formspree surfaced it too, so downstream
// notification emails read the same.
async function parseFormBody(request) {
  const contentType = (request.headers.get('content-type') || '').toLowerCase();

  if (contentType.includes('application/json')) {
    return await request.json();
  }

  // formData() handles both urlencoded and multipart
  const formData = await request.formData();
  const obj = {};
  for (const [key, value] of formData.entries()) {
    // Skip File entries (we don't handle file uploads in Sprint 7)
    if (typeof value !== 'string') continue;
    if (key in obj) {
      obj[key] = obj[key] + ', ' + value;
    } else {
      obj[key] = value;
    }
  }
  return obj;
}
