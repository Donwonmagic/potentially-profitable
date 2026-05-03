// ============================================================
// Cloudflare Turnstile validation helper
// ============================================================
//
// Layer-2 anti-spam validator. Layer-1 is the honeypot in
// validation.js (cheap, runs on every submission, catches the
// brain-dead bots). Turnstile catches the smarter traffic — the
// headless browsers + real-time CAPTCHA solvers — without showing
// a visible challenge to legitimate humans 99% of the time.
//
// Wiring (one-time, owner-side):
//
//   1. CF dashboard → Turnstile → "Add site" → muntin.digital.
//      Choose "Managed" widget mode (invisible until needed).
//   2. Copy the Site Key (public). Add to wrangler.jsonc:
//        "vars": { "TURNSTILE_SITE_KEY": "0xAAAA..." }
//   3. Copy the Secret Key (server-only). Add via wrangler:
//        wrangler secret put TURNSTILE_SECRET_KEY
//   4. Add the widget to each form HTML:
//        <script src="https://challenges.cloudflare.com/turnstile/v0/api.js"
//                async defer></script>
//        <div class="cf-turnstile"
//             data-sitekey="<TURNSTILE_SITE_KEY>"
//             data-callback="onTurnstileToken"></div>
//      The callback writes the token to a hidden form field named
//      `cf-turnstile-response` (Cloudflare's standard) which the
//      server then validates here.
//   5. Add CSP exceptions to _headers:
//        script-src ... https://challenges.cloudflare.com
//        frame-src  ... https://challenges.cloudflare.com
//        connect-src ... https://challenges.cloudflare.com
//
// Until the secret is set the validator returns OK for every
// request (skip semantics) so existing forms keep working unchanged.
// That keeps this PR a true no-op for production traffic until the
// owner finishes the wiring above.
//
// Cost: one outbound POST per validated submission, ~50–150 ms p95
// from a Cloudflare worker (Turnstile's siteverify is also CF-hosted).
// Acceptable for low-volume submissions like Window threads or
// magic-link requests; never call this from a hot path.

const SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Validate a Turnstile token against CF's siteverify endpoint.
 *
 * @param {string} token   the cf-turnstile-response field from the form
 * @param {string} secret  TURNSTILE_SECRET_KEY env binding
 * @param {string} [ip]    optional client IP for additional context
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
export async function validateTurnstileToken(token, secret, ip) {
  if (!token || typeof token !== 'string') {
    return { ok: false, error: 'missing-token' };
  }
  if (!secret) {
    return { ok: false, error: 'missing-secret' };
  }
  const formData = new URLSearchParams();
  formData.append('secret', secret);
  formData.append('response', token);
  if (ip) formData.append('remoteip', ip);

  let res;
  try {
    res = await fetch(SITEVERIFY_URL, {
      method: 'POST',
      body: formData,
      // 10s upper bound on the verify call. CF's worker fetch already
      // has a default timeout, but make the budget explicit.
      signal: AbortSignal.timeout ? AbortSignal.timeout(10_000) : undefined,
    });
  } catch (err) {
    return { ok: false, error: 'network-error' };
  }
  if (!res.ok) return { ok: false, error: 'siteverify-non-200' };
  let data;
  try { data = await res.json(); } catch { return { ok: false, error: 'siteverify-json' }; }
  if (data && data.success === true) return { ok: true };
  // CF returns { success: false, "error-codes": [...] } on failure.
  const code = (data && Array.isArray(data['error-codes']) && data['error-codes'][0]) || 'unknown';
  return { ok: false, error: 'turnstile-' + code };
}

/**
 * Form-handler convenience: validates the token IFF the secret is
 * configured. When the secret is absent (i.e. Turnstile isn't yet
 * wired in this environment), returns { ok: true, skipped: true } so
 * the caller can fall through to honeypot-only validation. Lets us
 * land this code on production safely before the owner has finished
 * the dashboard setup.
 *
 * @param {object} body    parsed form body containing cf-turnstile-response
 * @param {object} env     worker env bindings
 * @param {Request} request used to extract CF-Connecting-IP
 * @returns {Promise<{ok: boolean, error?: string, skipped?: boolean}>}
 */
export async function checkTurnstile(body, env, request) {
  if (!env || !env.TURNSTILE_SECRET_KEY) {
    return { ok: true, skipped: true };
  }
  const token = body && (body['cf-turnstile-response'] || body.cf_turnstile_response || body.turnstile);
  const ip = (request && request.headers && request.headers.get('cf-connecting-ip')) || undefined;
  return validateTurnstileToken(token, env.TURNSTILE_SECRET_KEY, ip);
}
