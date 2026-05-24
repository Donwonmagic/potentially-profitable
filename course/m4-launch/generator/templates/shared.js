/**
 * Shared helpers used by every L14 page template.
 *
 * Kept tiny on purpose: just the HTML/attr escapers + the hex-color
 * allowlist + the brand defaults. Each template imports only what it
 * needs so the lazy-loaded bundle stays small.
 *
 * The page-home template predates this module and inlines its own
 * copies of the helpers (rail iframe needs zero external imports, so
 * keeping page-home self-contained matters more than DRY). Other
 * generator-only templates import from here freely.
 */

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export const DEFAULT_PALETTE = ['#1F4E5B', '#FAF7F2', '#14161A'];

export function escHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/=/g, '&#61;')
    .replace(/`/g, '&#96;');
}

export function safeColor(value, fallback) {
  return (typeof value === 'string' && HEX_RE.test(value)) ? value.toUpperCase() : fallback;
}

export function readPalette(state) {
  const palette = Array.isArray(state && state.palette) && state.palette.length >= 3
    ? state.palette
    : DEFAULT_PALETTE;
  return {
    accent: safeColor(palette[0], DEFAULT_PALETTE[0]),
    cream:  safeColor(palette[1], DEFAULT_PALETTE[1]),
    ink:    safeColor(palette[2], DEFAULT_PALETTE[2])
  };
}

export const STRINGS = {
  en: {
    htmlLang: 'en',
    navHome: 'Home',
    navMenu: 'Menu',
    navAbout: 'About',
    navContact: 'Contact',
    cta: 'Reserve a table',
    menuHeading: 'Menu',
    menuEmpty: 'Menu coming soon — call the restaurant to ask what we are serving today.',
    aboutHeading: 'About',
    aboutEmpty: 'A short story about the restaurant goes here.',
    contactHeading: 'Find us',
    contactPhone: 'Call us',
    contactHours: 'Hours',
    contactClosed: 'Closed',
    daysFull: { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
  },
  es: {
    htmlLang: 'es',
    navHome: 'Inicio',
    navMenu: 'Menú',
    navAbout: 'Acerca',
    navContact: 'Contacto',
    cta: 'Reservar una mesa',
    menuHeading: 'Menú',
    menuEmpty: 'Menú próximamente — llama al restaurante para preguntar qué estamos sirviendo hoy.',
    aboutHeading: 'Acerca de nosotros',
    aboutEmpty: 'Una breve historia sobre el restaurante va aquí.',
    contactHeading: 'Encuéntranos',
    contactPhone: 'Llámanos',
    contactHours: 'Horarios',
    contactClosed: 'Cerrado',
    daysFull: { monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo' }
  }
};

export function pickStrings(opts) {
  const locale = (opts && opts.locale && STRINGS[opts.locale]) ? opts.locale : 'en';
  return { locale, t: STRINGS[locale] };
}

/**
 * Common <head> + minimal navigation chrome shared by all four pages.
 * Returns the doctype, opening html, <head> with inline styles, and the
 * top nav bar. Caller appends body content + closing tags.
 */
export function pageOpen(title, opts) {
  const { t } = pickStrings(opts);
  const { accent, cream, ink } = readPalette(opts && opts.state);
  const profile = (opts && opts.state && opts.state.restaurantProfile) || {};
  const restaurantName = profile.name || (opts && opts.locale === 'es' ? 'Restaurante' : 'Restaurant');

  return [
    '<!doctype html>',
    '<html lang="', escAttr(t.htmlLang), '">',
    '<head>',
    '<meta charset="utf-8"/>',
    '<meta name="viewport" content="width=device-width,initial-scale=1"/>',
    '<title>', escHtml(title), ' · ', escHtml(restaurantName), '</title>',
    '<meta name="robots" content="index,follow"/>',
    '<style>',
    '*,*:before,*:after{box-sizing:border-box}',
    'html,body{margin:0;padding:0}',
    'body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;background:', cream, ';color:', ink, ';line-height:1.55;font-size:16px;-webkit-font-smoothing:antialiased}',
    'a{color:', accent, '}',
    '.bar{background:', ink, ';color:', cream, ';padding:14px 24px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:14px}',
    '.bar .brand{font-family:Georgia,serif;font-size:18px;font-weight:600;text-decoration:none;color:', cream, '}',
    '.bar nav{display:flex;gap:18px;font-size:14px}',
    '.bar nav a{color:', cream, ';text-decoration:none;opacity:.85}',
    '.bar nav a:hover,.bar nav a.active{opacity:1;text-decoration:underline}',
    '.container{max-width:760px;margin:0 auto;padding:48px 24px}',
    'h1{font-family:Georgia,serif;font-size:36px;margin:0 0 18px;line-height:1.1;letter-spacing:-.5px;font-weight:500}',
    'h2{font-family:Georgia,serif;font-size:22px;margin:36px 0 14px;font-weight:500}',
    'p{margin:0 0 16px;max-width:560px}',
    '.cta{display:inline-block;margin-top:8px;padding:12px 22px;background:', accent, ';color:', cream, ';text-decoration:none;border-radius:6px;font-weight:600;font-size:14px}',
    '.foot{padding:24px;border-top:1px solid ', ink, '14;font-size:13px;color:', ink, ';opacity:.7;text-align:center}',
    '.foot a{color:inherit}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}',
    '</style>',
    '</head>',
    '<body>',
    '<header class="bar">',
    '<a class="brand" href="index.html">', escHtml(restaurantName), '</a>',
    '<nav aria-label="Primary"><a href="index.html"', (opts && opts.activePage === 'home' ? ' class="active"' : ''), '>', escHtml(t.navHome), '</a><a href="menu.html"', (opts && opts.activePage === 'menu' ? ' class="active"' : ''), '>', escHtml(t.navMenu), '</a><a href="about.html"', (opts && opts.activePage === 'about' ? ' class="active"' : ''), '>', escHtml(t.navAbout), '</a><a href="contact.html"', (opts && opts.activePage === 'contact' ? ' class="active"' : ''), '>', escHtml(t.navContact), '</a></nav>',
    '</header>',
    '<main class="container">'
  ].join('');
}

export function pageClose(opts) {
  const profile = (opts && opts.state && opts.state.restaurantProfile) || {};
  const name = profile.name || '';
  const year = String(new Date().getFullYear());
  const phone = profile.phone || '';
  const address = profile.address || '';
  const footerBits = [];
  if (name) footerBits.push(escHtml(name));
  if (address) footerBits.push(escHtml(address));
  if (phone) footerBits.push('<a href="tel:' + escAttr(phone) + '">' + escHtml(phone) + '</a>');
  footerBits.push('&copy; ' + year);
  return [
    '</main>',
    '<footer class="foot">',
    footerBits.join(' · '),
    '</footer>',
    '</body>',
    '</html>'
  ].join('');
}
