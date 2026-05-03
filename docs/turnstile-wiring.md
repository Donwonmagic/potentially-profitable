# Cloudflare Turnstile — wiring checklist

Status as of this PR:
- **Worker side:** `src/lib/turnstile.js` shipped. `handleIntake`,
  `handleChecklist`, `handleAuthMagicLink`, `handleSubscribe` all call
  `checkTurnstile()` between the timestamp gate and the content
  classifier.
- **Behavior:** when `env.TURNSTILE_SECRET_KEY` is **not** bound,
  every call returns `{ ok: true, skipped: true }` and the form
  passes through to the existing honeypot path. **No production
  traffic is affected by this PR.**
- **Activation:** the four steps below, all owner-side. Once done,
  every submission to those four endpoints is gated by Turnstile.

---

## 1. Create the Turnstile site (CF dashboard)

CF dashboard → **Turnstile** → **Add site**.

| Field | Value |
|---|---|
| Site name | `muntin-digital-forms` |
| Domains | `muntin.digital`, `*.muntin.digital`, `muntin-digital.pages.dev` (preview) |
| Widget mode | **Managed** (invisible until needed; falls back to
inline challenge for high-risk requests). The other two modes
(Non-interactive / Invisible) are stricter and degrade UX more
than they buy us. |
| Pre-clearance | **Off** (we don't proxy through CF in front of
  the apex; pre-clearance is cosmetic for our setup). |

You'll get two keys:
- **Site key** (public, looks like `0x4AAAAAAA...`) — embedded in HTML.
- **Secret key** (server-only, looks like `0x4AAAAAAA...secret`) — passed
  to siteverify.

## 2. Bind the keys to the worker

```bash
# Public — committed to wrangler config
# Edit wrangler.jsonc, add to "vars":
#   "TURNSTILE_SITE_KEY": "0xAAAAAAAA..."

# Secret — never committed
wrangler secret put TURNSTILE_SECRET_KEY
# (paste the secret key when prompted)
```

After redeploy, `checkTurnstile()` will start enforcing on every
submission to the four endpoints. Until you complete step 3, the form
HTML doesn't include the widget yet, so the worker will see no
`cf-turnstile-response` field and reject every submission with a
silent-OK 200. **Do step 3 in the same deploy** so your forms keep
working.

## 3. Add the widget to the four form HTMLs

The four forms are:

| Form | Page(s) |
|---|---|
| Intake | `/index.html` (the homepage closing CTA) |
| Window magic-link sign-in | `/sign-in/`, `/es/sign-in/` |
| Newsletter | `_includes/footer.html`, `_includes/es/footer.html`, `index.html`, `es/index.html` |
| Checklist (audit-PDF email capture) | wherever the email-capture form ships |

Each one needs:

```html
<!-- Inside <head>, once per page (idempotent if multiple forms): -->
<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>

<!-- Inside the <form>, just above the submit button: -->
<div class="cf-turnstile"
     data-sitekey="<TURNSTILE_SITE_KEY>"
     data-action="<endpoint-name>"
     data-callback="onTurnstileToken"></div>

<!-- And a hidden field that the callback writes the token into: -->
<input type="hidden" name="cf-turnstile-response" value="" />
```

Plus a small JS snippet (once per page):

```html
<script>
  function onTurnstileToken(token) {
    document.querySelectorAll('input[name="cf-turnstile-response"]')
      .forEach(function (el) { el.value = token; });
  }
</script>
```

For best UX, place the widget block where it's visible if Turnstile
elevates to a visible challenge — typically just above the submit
button. The `data-action` attribute is logged in CF analytics so you
can see per-endpoint pass/fail rates.

## 4. Open up the CSP

In `_headers`, the existing `Content-Security-Policy` needs three
new sources:

```
script-src 'self' 'unsafe-inline' https://plausible.io https://challenges.cloudflare.com;
frame-src  'self' https://challenges.cloudflare.com;
connect-src 'self' https://plausible.io https://www.googleapis.com https://challenges.cloudflare.com;
```

(The widget loads from `challenges.cloudflare.com`, opens a same-domain
iframe for the challenge if needed, and posts the verification ping
back to that origin. Without all three, the widget either fails to
load or fails to validate.)

## 5. Verify

After deploy:

```bash
# Submit a real test from a browser; should succeed.
# Then submit the same form via curl WITHOUT a token:
curl -X POST https://muntin.digital/api/subscribe \
  -d "email=test@example.com&locale=en&source=footer&ts=$(date +%s)000&hp="

# Expected: HTTP 200 { "ok": true } — silent-OK so spammers can't
# distinguish accept from reject. Real-time check via worker logs:
wrangler tail muntin-digital --format pretty
# Expect to see: subscribe:spam { reason: 'turnstile', code: 'turnstile-missing-input-response' }
```

If you see `turnstile-invalid-input-response` repeatedly on real
traffic, your site key in HTML doesn't match the site you registered.
If `network-error` repeats, your worker can't reach
`challenges.cloudflare.com` — check the worker network gateway
config.

## 6. Operational notes

- **Cost:** free for the first 10M challenges/month (CF docs). Far above
  any plausible volume on this site.
- **Bypass for development:** add `127.0.0.1` to your Turnstile site's
  domain allowlist if local dev hits the worker directly.
- **Removing it:** unset the secret (`wrangler secret delete
  TURNSTILE_SECRET_KEY`) and the worker reverts to honeypot-only on
  next deploy. The widget HTML can stay in place; without a valid
  sitekey it shows a small placeholder, but no JS error.
