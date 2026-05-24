/**
 * Shared home-page template.
 *
 * This module is the SINGLE source of truth for how the operator's
 * restaurant home page is rendered. Two consumers import it:
 *
 *   1. The Workshop Kit rail (tools/_shared/workshop/live-preview-frame.js)
 *      — renders the operator's home page into an iframe srcdoc that
 *      updates lesson by lesson.
 *
 *   2. The L14 terminal generator (course/m4-launch/generator/) — produces
 *      the index.html shipped inside the operator's downloaded ZIP.
 *
 * Because both consumers share this module, "what the operator sees in the
 * rail" and "what gets generated when they hit download" can never drift.
 *
 * Locale support: STRINGS carries EN + ES; the renderer accepts an
 * options.locale parameter. New locales add a key here and ship.
 *
 * Security: the render function does its own attribute-context-aware
 * escaping for all operator-provided values. CSS color tokens go through
 * a strict 6-hex-digit allowlist (any value not matching falls back to
 * the brand default) so an operator typing into a color picker cannot
 * inject CSS via the palette path. Strings go through HTML escaping plus
 * an attribute-escape pass when interpolated into attributes.
 *
 * Output: a complete, self-contained HTML document (doctype + html + head
 * + body) ready to be assigned to iframe.srcdoc or written to disk as
 * index.html. Zero JS in the output. Zero external resource references —
 * inlined system-font stack only.
 */

const STRINGS = {
  en: {
    htmlLang: 'en',
    navMenu: 'Menu',
    navAbout: 'About',
    navReserve: 'Reserve',
    cta: 'Reserve a table',
    namePlaceholder: 'Your restaurant',
    menuHeading: 'Menu',
    menuPlaceholder: 'Your dish list will populate here once you finish Lesson 8.',
    findHeading: 'Find us',
    addressPlaceholder: 'Add your address in Lesson 10 — it shows here.',
    palettePromptShown: 'Pick your palette in Lesson 7.'
  },
  es: {
    htmlLang: 'es',
    navMenu: 'Menú',
    navAbout: 'Acerca',
    navReserve: 'Reservar',
    cta: 'Reservar una mesa',
    namePlaceholder: 'Tu restaurante',
    menuHeading: 'Menú',
    menuPlaceholder: 'Tu lista de platos aparecerá aquí cuando termines la Lección 8.',
    findHeading: 'Encuéntranos',
    addressPlaceholder: 'Agrega tu dirección en la Lección 10 — aparece aquí.',
    palettePromptShown: 'Elige tu paleta en la Lección 7.'
  }
};

const DEFAULT_PALETTE = ['#1F4E5B', '#FAF7F2', '#14161A'];
const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

// Local copy of the font-pair-picker widget's id → stack mapping.
// Kept duplicated (rather than imported) so an attacker who somehow
// rewrites MuntinContext.fontPair.heading to a CSS-injection string
// cannot escape — the template only reads `state.fontPair.id` and
// always re-derives heading/body from this allowlist.
const FONT_PAIRS = {
  'editorial-modern': {
    heading: "'Fraunces','Playfair Display',Georgia,serif",
    body:    "'Inter','Helvetica Neue',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
  },
  'diner-classic': {
    heading: "'Bebas Neue','Oswald','Impact','Arial Narrow',sans-serif",
    body:    "Georgia,'Times New Roman',serif"
  },
  'trattoria': {
    heading: "'Playfair Display','Cormorant Garamond',Garamond,Georgia,serif",
    body:    "'Lora','EB Garamond',Georgia,serif"
  },
  'taqueria': {
    heading: "'Anton','Bebas Neue','Impact',sans-serif",
    body:    "'Inter','Helvetica Neue',-apple-system,sans-serif"
  },
  'minimal-tasting': {
    heading: "'Inter','Helvetica Neue','Arial',sans-serif",
    body:    "'Inter','Helvetica Neue','Arial',sans-serif"
  },
  'corner-store': {
    heading: "'Caveat','Kalam','Comic Sans MS',cursive",
    body:    "'Inter','Helvetica Neue',-apple-system,sans-serif"
  }
};
const DEFAULT_FONT_PAIR = {
  heading: 'Georgia,serif',
  body:    '-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif'
};

function readFontPair(state) {
  const id = state && state.fontPair && state.fontPair.id;
  return (id && FONT_PAIRS[id]) || DEFAULT_FONT_PAIR;
}

function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Attribute-context escape — for values interpolated into attribute
// positions inside the iframe's srcdoc. Stricter than the HTML version:
// also escapes characters that can break out of an unquoted attribute
// or open a JS-handler context.
function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/=/g, '&#61;')
    .replace(/`/g, '&#96;');
}

// CSS color allowlist — anything not matching #RRGGBB falls back to the
// brand default. This stops palette-path CSS injection (e.g. an operator
// pasting "red; background:url(...)" or similar) cold.
function safeColor(value, fallback) {
  return (typeof value === 'string' && HEX_RE.test(value)) ? value.toUpperCase() : fallback;
}

/**
 * Compute WCAG 2.2 relative luminance + contrast ratio for two #RRGGBB
 * colors. Exposed so consumers (the rail, the generator's readiness
 * checklist) can warn operators about unreadable palette choices.
 */
export function contrastRatio(a, b) {
  function lum(hex) {
    const m = HEX_RE.test(hex) ? hex : '#000000';
    const rgb = [m.slice(1, 3), m.slice(3, 5), m.slice(5, 7)]
      .map((h) => parseInt(h, 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
  }
  const la = lum(a);
  const lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/**
 * Render the operator's home page to a complete HTML document string.
 *
 * @param {object} state — derived from MuntinContext, including
 *   restaurantProfile, palette, onePromise.
 * @param {object} [opts]
 * @param {string} [opts.locale='en']
 * @returns {string} complete HTML document.
 */
export function renderHome(state, opts) {
  const locale = (opts && opts.locale && STRINGS[opts.locale]) ? opts.locale : 'en';
  const t = STRINGS[locale];

  const profile = (state && state.restaurantProfile) || {};
  const name = profile.name || '';
  const cuisine = profile.cuisine || '';
  const address = profile.address || '';
  const promise = (state && state.onePromise) || '';

  const palette = Array.isArray(state && state.palette) && state.palette.length >= 3
    ? state.palette
    : DEFAULT_PALETTE;

  const accent = safeColor(palette[0], DEFAULT_PALETTE[0]);
  const cream  = safeColor(palette[1], DEFAULT_PALETTE[1]);
  const ink    = safeColor(palette[2], DEFAULT_PALETTE[2]);

  const fontPair = readFontPair(state);
  const headingFamily = fontPair.heading;
  const bodyFamily    = fontPair.body;

  const nameMissing    = !name;
  const promiseMissing = !promise;
  const paletteMissing = !(Array.isArray(state && state.palette) && state.palette.length);

  const nameDisplay    = nameMissing    ? '&nbsp;'                  : escHtml(name);
  const promiseDisplay = promiseMissing ? '&nbsp;'                  : escHtml(promise);
  const addressDisplay = address        ? escHtml(address)          : escHtml(t.addressPlaceholder);
  const barName        = nameMissing    ? '<span class="sk">&nbsp;</span>' : escHtml(name);
  const footerName     = nameMissing    ? escHtml(t.namePlaceholder)       : escHtml(name);

  const paletteHint = paletteMissing
    ? '<div class="hint">' + escHtml(t.palettePromptShown) + '</div>'
    : '';
  const cuisineChip = cuisine
    ? '<span class="cuisine-chip">' + escHtml(cuisine) + '</span>'
    : '';

  return [
    '<!doctype html>',
    '<html lang="', escAttr(t.htmlLang), '">',
    '<head>',
    '<meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>', nameMissing ? escHtml(t.namePlaceholder) : escHtml(name), '</title>',
    '<style>',
    '*,*:before,*:after{box-sizing:border-box}',
    'html,body{margin:0;padding:0}',
    'body{font-family:', bodyFamily, ';background:', cream, ';color:', ink, ';line-height:1.45;font-size:14px;-webkit-font-smoothing:antialiased}',
    'h1,h2{font-family:', headingFamily, '}',
    '.bar{background:', ink, ';color:', cream, ';padding:10px 16px;font-size:11px;display:flex;justify-content:space-between;align-items:center;font-family:-apple-system,BlinkMacSystemFont,sans-serif}',
    '.bar .nav{display:flex;gap:14px}',
    '.bar a{color:inherit;text-decoration:none;opacity:.8}',
    '.hero{padding:48px 24px;text-align:center}',
    '.hero h1{font-size:30px;margin:0 0 14px;line-height:1.1;letter-spacing:-.5px;font-weight:500}',
    '.hero .promise{font-size:15px;color:', ink, ';opacity:.75;max-width:380px;margin:0 auto}',
    '.cuisine-chip{display:inline-block;padding:4px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.1em;background:', accent, ';color:', cream, ';border-radius:999px;margin-bottom:14px;font-family:-apple-system,sans-serif;font-weight:600}',
    '.cta{display:inline-block;margin-top:18px;padding:10px 22px;background:', accent, ';color:', cream, ';font-family:-apple-system,sans-serif;font-size:12px;font-weight:600;border-radius:4px;text-decoration:none}',
    '.section{padding:32px 24px;border-top:1px solid ', ink, '14}',
    '.section h2{font-size:18px;margin:0 0 10px}',
    '.section p{margin:0;font-size:13px;opacity:.75;max-width:420px}',
    '.foot{padding:18px 24px;border-top:1px solid ', ink, '14;font-size:11px;opacity:.6;font-family:-apple-system,sans-serif}',
    '.sk{display:inline-block;min-width:140px;height:1em;background:', ink, '14;border-radius:3px;vertical-align:baseline}',
    '.hint{margin-top:12px;font-size:10px;color:', ink, '99;font-family:-apple-system,sans-serif}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}',
    '</style></head>',
    '<body>',
    '<div class="bar">',
    '<span><strong>', barName, '</strong></span>',
    '<nav class="nav"><a>', escHtml(t.navMenu), '</a><a>', escHtml(t.navAbout), '</a><a>', escHtml(t.navReserve), '</a></nav>',
    '</div>',
    '<section class="hero">',
    cuisineChip,
    '<h1>', nameDisplay, '</h1>',
    '<p class="promise">', promiseDisplay, '</p>',
    paletteHint,
    '<a class="cta">', escHtml(t.cta), '</a>',
    '</section>',
    '<section class="section"><h2>', escHtml(t.menuHeading), '</h2><p>', escHtml(t.menuPlaceholder), '</p></section>',
    '<section class="section"><h2>', escHtml(t.findHeading), '</h2><p>', addressDisplay, '</p></section>',
    '<footer class="foot">&copy; ', String(new Date().getFullYear()), ' ', footerName, '</footer>',
    '</body></html>'
  ].join('');
}

/**
 * Produce a semantic-HTML summary of the same home page, suitable for
 * placing in the parent document where assistive tech can navigate it.
 * Replaces direct AT exposure of the iframe's contents.
 *
 * Returns a fragment of valid HTML (no doctype, no html/body wrapper)
 * that the rail / generator can drop into a visually-hidden region.
 */
export function renderHomeSummary(state, opts) {
  const locale = (opts && opts.locale && STRINGS[opts.locale]) ? opts.locale : 'en';
  const t = STRINGS[locale];

  const profile = (state && state.restaurantProfile) || {};
  const name = profile.name || t.namePlaceholder;
  const cuisine = profile.cuisine || '';
  const address = profile.address || t.addressPlaceholder;
  const promise = (state && state.onePromise) || '';

  const labelName    = locale === 'es' ? 'Nombre'   : 'Name';
  const labelCuisine = locale === 'es' ? 'Cocina'   : 'Cuisine';
  const labelPromise = locale === 'es' ? 'Promesa'  : 'Promise';
  const labelAddress = locale === 'es' ? 'Dirección': 'Address';

  const rows = [
    '<dt>' + escHtml(labelName) + '</dt><dd>' + escHtml(name) + '</dd>'
  ];
  if (cuisine) rows.push('<dt>' + escHtml(labelCuisine) + '</dt><dd>' + escHtml(cuisine) + '</dd>');
  if (promise) rows.push('<dt>' + escHtml(labelPromise) + '</dt><dd>' + escHtml(promise) + '</dd>');
  rows.push('<dt>' + escHtml(labelAddress) + '</dt><dd>' + escHtml(address) + '</dd>');

  return '<dl class="page-home-summary">' + rows.join('') + '</dl>';
}

/**
 * Identify which fields changed between two states, returning a short
 * locale-aware sentence usable for an aria-live announcement.
 * Returns "" when nothing meaningful changed.
 */
export function summarizeChange(prevState, nextState, opts) {
  const locale = (opts && opts.locale && STRINGS[opts.locale]) ? opts.locale : 'en';
  const prev = prevState || {};
  const next = nextState || {};
  const prevProfile = prev.restaurantProfile || {};
  const nextProfile = next.restaurantProfile || {};
  const changes = [];

  function diff(label, before, after) {
    if (before !== after && after) changes.push(label + ': ' + after);
  }

  if (locale === 'es') {
    diff('Nombre',   prevProfile.name,    nextProfile.name);
    diff('Cocina',   prevProfile.cuisine, nextProfile.cuisine);
    diff('Dirección', prevProfile.address, nextProfile.address);
    diff('Promesa',  prev.onePromise,     next.onePromise);
  } else {
    diff('Name',     prevProfile.name,    nextProfile.name);
    diff('Cuisine',  prevProfile.cuisine, nextProfile.cuisine);
    diff('Address',  prevProfile.address, nextProfile.address);
    diff('Promise',  prev.onePromise,     next.onePromise);
  }

  if (!changes.length && JSON.stringify(prev.palette) !== JSON.stringify(next.palette) && next.palette) {
    changes.push(locale === 'es' ? 'Paleta actualizada' : 'Palette updated');
  }

  const prevPairId = prev.fontPair && prev.fontPair.id;
  const nextPairId = next.fontPair && next.fontPair.id;
  if (!changes.length && prevPairId !== nextPairId && nextPairId) {
    changes.push(locale === 'es' ? 'Par tipográfico actualizado' : 'Font pair updated');
  }

  return changes.join(' · ');
}

export { STRINGS, DEFAULT_PALETTE };
