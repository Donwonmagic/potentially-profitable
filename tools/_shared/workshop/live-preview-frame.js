/**
 * Workshop Kit widget: live-preview-frame
 *
 * Renders a sandboxed <iframe> showing a miniature, live preview of the
 * operator's restaurant site as it stands right now. Reads from
 * MuntinContext.readRestaurantProfile() plus a few additional context
 * keys (palette, onePromise) and re-renders whenever a sibling widget
 * commits a change.
 *
 * This is the foundational widget — it powers the "Your site so far"
 * rail in every bootcamp lesson, and it's also the canonical example
 * future Workshop Kit authors look at when building new widgets.
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="live-preview-frame"
 *            data-preview-page="home">
 *     <!-- engine mounts here -->
 *   </section>
 *
 * The optional `data-preview-page` selects which generated page to
 * render — defaults to "home". Future pages: "menu", "about", "contact".
 *
 * State source of truth: MuntinContext (browser localStorage). When
 * empty, the preview renders a tasteful placeholder with skeleton
 * boxes and deep-links to the lesson that captures each missing field.
 *
 * No fetches. No account. Same posture as every other Muntin tool.
 */

export const tag = 'live-preview-frame';
export const contextKeys = ['palette', 'onePromise', 'customerParagraph'];

/* ============================================================
 * Tiny template — the eventual generator's page-home.template.js
 * will replace this. Kept inline here so the widget is testable
 * in isolation during P1 before the generator templates ship.
 * ============================================================ */
function renderHomeHtml(state) {
  var profile = state.restaurantProfile || {};
  var name = profile.name || 'Your restaurant';
  var cuisine = profile.cuisine || '';
  var address = profile.address || '';
  var palette = Array.isArray(state.palette) && state.palette.length >= 2
    ? state.palette
    : ['#1F4E5B', '#FAF7F2', '#14161A'];
  var promise = state.onePromise || '';
  var nameMissing = !profile.name;
  var promiseMissing = !promise;
  var paletteMissing = !(Array.isArray(state.palette) && state.palette.length);

  var ink    = palette[2] || '#14161A';
  var cream  = palette[1] || '#FAF7F2';
  var accent = palette[0] || '#1F4E5B';

  // Skeleton class hooks let CSS animate empty fields tastefully.
  var nameCls    = nameMissing    ? 'sk' : '';
  var promiseCls = promiseMissing ? 'sk' : '';
  var paletteHint = paletteMissing ? '<div class="hint">Pick your palette in Lesson 7.</div>' : '';

  // Escape minimal — these come from the operator's own profile, but
  // we're injecting into a sandboxed srcdoc so the blast radius is
  // contained. Still, escape to keep the preview honest.
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return [
    '<!doctype html><html lang="en"><head><meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>', esc(name), '</title>',
    '<style>',
    '*,*:before,*:after{box-sizing:border-box}',
    'html,body{margin:0;padding:0}',
    'body{font-family:Georgia,serif;background:', esc(cream), ';color:', esc(ink), ';line-height:1.45;font-size:14px;-webkit-font-smoothing:antialiased}',
    '.bar{background:', esc(ink), ';color:', esc(cream), ';padding:10px 16px;font-size:11px;display:flex;justify-content:space-between;align-items:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif}',
    '.bar .nav{display:flex;gap:14px}',
    '.bar a{color:inherit;text-decoration:none;opacity:.8}',
    '.hero{padding:48px 24px;text-align:center;background:linear-gradient(180deg,', esc(cream), ' 0%, ', esc(cream), 'CC 100%)}',
    '.hero h1{font-size:30px;margin:0 0 14px;line-height:1.1;letter-spacing:-.5px;font-weight:500}',
    '.hero .promise{font-size:15px;color:', esc(ink), ';opacity:.75;max-width:380px;margin:0 auto}',
    '.cuisine-chip{display:inline-block;padding:4px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;background:', esc(accent), ';color:', esc(cream), ';border-radius:999px;margin-bottom:14px;font-family:-apple-system,sans-serif;font-weight:600}',
    '.cta{display:inline-block;margin-top:18px;padding:10px 22px;background:', esc(accent), ';color:', esc(cream), ';font-family:-apple-system,sans-serif;font-size:12px;font-weight:600;border-radius:4px;text-decoration:none}',
    '.section{padding:32px 24px;border-top:1px solid ', esc(ink), '14}',
    '.section h2{font-size:18px;margin:0 0 10px}',
    '.section p{margin:0;font-size:13px;opacity:.75;max-width:420px}',
    '.foot{padding:18px 24px;border-top:1px solid ', esc(ink), '14;font-size:11px;opacity:.6;font-family:-apple-system,sans-serif}',
    '.sk{display:inline-block;min-width:140px;height:1em;background:', esc(ink), '14;border-radius:3px;vertical-align:baseline}',
    '.hint{margin-top:12px;font-size:10px;color:', esc(ink), '99;font-family:-apple-system,sans-serif}',
    '</style></head><body>',
    '<div class="bar"><span><strong>', nameMissing ? '<span class="sk">&nbsp;</span>' : esc(name), '</strong></span>',
    '<nav class="nav"><a>Menu</a><a>About</a><a>Reserve</a></nav></div>',
    '<section class="hero">',
    cuisine ? '<span class="cuisine-chip">' + esc(cuisine) + '</span>' : '',
    '<h1 class="', nameCls, '">', nameMissing ? '&nbsp;' : esc(name), '</h1>',
    '<p class="promise ', promiseCls, '">', promiseMissing ? '&nbsp;' : esc(promise), '</p>',
    paletteHint,
    '<a class="cta">Reserve a table</a>',
    '</section>',
    '<section class="section"><h2>Menu</h2><p>Your dish list will populate here once you finish Lesson 8.</p></section>',
    '<section class="section"><h2>Find us</h2><p>', address ? esc(address) : 'Add your address in Lesson 10 — it shows here.', '</p></section>',
    '<footer class="foot">© ', new Date().getFullYear(), ' ', nameMissing ? 'Your restaurant' : esc(name), '</footer>',
    '</body></html>'
  ].join('');
}

export function mount(rootEl, state, deps) {
  var page = rootEl.getAttribute('data-preview-page') || 'home';

  rootEl.innerHTML = [
    '<div class="lpf">',
      '<div class="lpf-bar">',
        '<span class="lpf-bar-dot" aria-hidden="true"></span>',
        '<span class="lpf-bar-dot" aria-hidden="true"></span>',
        '<span class="lpf-bar-dot" aria-hidden="true"></span>',
        '<span class="lpf-bar-url">your-restaurant.com/', page === 'home' ? '' : page, '</span>',
      '</div>',
      '<iframe class="lpf-frame" sandbox="allow-same-origin" title="Live preview of your site so far" loading="lazy"></iframe>',
      '<p class="lpf-caption" aria-live="polite"></p>',
    '</div>'
  ].join('');

  var iframe = rootEl.querySelector('.lpf-frame');
  var caption = rootEl.querySelector('.lpf-caption');

  function paint(nextState) {
    if (page !== 'home') {
      // Other pages land in P5/P6; for the first slice render a placeholder.
      iframe.srcdoc = '<!doctype html><body style="font-family:-apple-system,sans-serif;padding:24px;color:#6B6B6B;background:#F3EEE3;margin:0">Preview for <strong>' + page + '</strong> arrives in a later lesson.</body>';
      caption.textContent = 'Preview: ' + page + ' page (not yet built)';
      return;
    }
    iframe.srcdoc = renderHomeHtml(nextState);
    var profile = nextState.restaurantProfile || {};
    var filled = [];
    if (profile.name) filled.push('name');
    if (profile.cuisine) filled.push('cuisine');
    if (profile.address) filled.push('address');
    if (Array.isArray(nextState.palette) && nextState.palette.length) filled.push('palette');
    if (nextState.onePromise) filled.push('promise');
    caption.textContent = filled.length
      ? 'Updated: ' + filled.join(', ')
      : 'Preview updates as you finish lessons.';
  }

  paint(state);

  // Re-render when ANY other widget commits a context change.
  function onChange() {
    var ctx = (window.MuntinContext && window.MuntinContext.read()) || {};
    var profile = (window.MuntinContext && window.MuntinContext.readRestaurantProfile && window.MuntinContext.readRestaurantProfile()) || null;
    paint({
      palette: ctx.palette,
      onePromise: ctx.onePromise,
      customerParagraph: ctx.customerParagraph,
      restaurantProfile: profile
    });
  }
  window.addEventListener(window.WorkshopKit ? window.WorkshopKit.CONTEXT_CHANGE_EVENT : 'mtn:context-change', onChange);

  return {
    unmount: function () {
      window.removeEventListener(window.WorkshopKit ? window.WorkshopKit.CONTEXT_CHANGE_EVENT : 'mtn:context-change', onChange);
      rootEl.innerHTML = '';
    },
    refresh: function (nextState) { paint(nextState); }
  };
}

export function serialize() {
  // The preview frame is a viewer, not a data-entry widget. Nothing to serialize.
  return {};
}
