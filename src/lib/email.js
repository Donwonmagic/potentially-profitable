// ============================================================
// Email adapter — Resend
// ============================================================
//
// Thin wrapper around the Resend HTTP API. Resend is chosen because:
//
//   1. Free tier is 3,000 emails/month, 100/day. The intake +
//      checklist + audit-report endpoints combined will not come
//      close to that ceiling for a one-person studio, and if they
//      do it's a happy problem to have.
//   2. The HTTP API is one POST with a JSON body and an API key
//      in the Authorization header. No SDK required, which matters
//      in a Worker where we can't import Node modules.
//   3. Domain verification is a few DNS records (one DKIM, one
//      SPF update). User already owns muntin.digital DNS in
//      Cloudflare so this is 5 minutes of dashboard work.
//   4. Delivery quality is on par with SendGrid/Postmark for
//      transactional volume at our size.
//
// Swapping providers is a one-file change: rewrite sendEmail()
// to POST to SES / MailChannels / Postmark / whatever, keep the
// same function signature. The handlers never import anything
// provider-specific — they only call sendEmail() with a neutral
// { to, from, subject, html, text } shape.
//
// Secrets: RESEND_API_KEY is provided via Wrangler secrets
// (`wrangler secret put RESEND_API_KEY`). DO NOT hard-code it
// or check it in. The FROM_EMAIL and NOTIFY_EMAIL values are
// environment variables set in wrangler.jsonc's [vars] block
// because they are not secrets, just config that differs between
// local dev and production.

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Send an email via the Resend API.
 *
 * @param {Object} opts
 * @param {string} opts.to       — Recipient email address.
 * @param {string} opts.from     — Sender email address. Must be on a
 *                                  verified domain in Resend.
 * @param {string} [opts.replyTo]— Reply-To header. Useful for auto-
 *                                  responders so the user can reply
 *                                  back to Don's real inbox instead
 *                                  of a no-reply address.
 * @param {string} opts.subject  — Subject line.
 * @param {string} opts.html     — HTML body.
 * @param {string} opts.text     — Plain-text body. Always include
 *                                  for accessibility + spam filters.
 * @param {Array<{filename:string, content:string}>} [opts.attachments]
 *                                  — Optional attachments array. Each
 *                                  entry is forwarded to Resend as
 *                                  { filename, content } with content
 *                                  as a base64-encoded string. Resend
 *                                  accepts up to 40MB total email
 *                                  size, content-type is inferred
 *                                  from the filename extension.
 * @param {string} apiKey        — Resend API key (env.RESEND_API_KEY)
 *
 * @returns {Promise<{ok: boolean, id?: string, error?: string}>}
 *   ok:true with Resend's message id on success, or ok:false with a
 *   human-readable error message on failure. Never throws — all
 *   provider errors are translated into a structured result so the
 *   caller can decide how to surface them to the user.
 */
export async function sendEmail(opts, apiKey) {
  if (!apiKey) {
    return { ok: false, error: 'RESEND_API_KEY is not configured' };
  }

  const payload = {
    from: opts.from,
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
  };
  if (opts.replyTo) payload.reply_to = opts.replyTo;
  if (Array.isArray(opts.attachments) && opts.attachments.length) {
    // Resend expects: [{ filename, content }] with content as
    // base64 string. Filter out any malformed entries silently so
    // a bad one doesn't fail the whole send.
    const filtered = opts.attachments.filter(function(a){
      return a && typeof a.filename === 'string' && typeof a.content === 'string' && a.content.length > 0;
    });
    if (filtered.length) payload.attachments = filtered;
  }

  let res;
  try {
    res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Network-level failure (DNS, TLS, timeout). Resend's API is
    // hosted on api.resend.com and is extremely reliable, so this
    // usually means the Worker couldn't reach out at all — which
    // on Cloudflare Workers essentially never happens outside a
    // configuration error. Still, translate it into a friendly
    // error instead of a crash.
    return { ok: false, error: 'Email provider unreachable: ' + (err && err.message ? err.message : String(err)) };
  }

  if (res.ok) {
    // Resend returns { id: '...' } on success
    let data = null;
    try { data = await res.json(); } catch (e) { /* no json body */ }
    return { ok: true, id: data && data.id };
  }

  // Resend error bodies look like:
  //   { name: 'validation_error', message: 'To field is required.' }
  //   { name: 'missing_api_key',  message: 'Missing API key ...' }
  // Pull out the message so the caller can surface it (or log it).
  let errMsg;
  try {
    const errBody = await res.json();
    errMsg = (errBody && errBody.message) || ('Resend HTTP ' + res.status);
  } catch (e) {
    errMsg = 'Resend HTTP ' + res.status;
  }
  return { ok: false, error: errMsg, status: res.status };
}
