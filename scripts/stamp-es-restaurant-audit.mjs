#!/usr/bin/env node
// Sprint ES4: generate es/tools/audits/restaurant/index.html from
// tools/audits/restaurant/index.html by:
//   1. Rewriting <html lang>, canonical, hreflang, OG/Twitter, and
//      the SoftwareApplication JSON-LD to Spanish + /es/ URL.
//   2. Flipping script src paths from ./ (sibling) to absolute so the
//      shared subtypes.js / restaurant-checks.js load from the EN
//      directory — keeps one source of truth for audit logic.
//   3. Forcing window.__muntinLang = 'es' on boot so the UI_I18N map
//      (ES1) resolves to Spanish for every string routed through t().
//   4. Substituting a curated translation map over static HTML text
//      that wasn't yet moved behind t(). The map is conservative —
//      only strings we have vetted Spanish translations for. Anything
//      outside the map stays English until a translator sweeps it.
//
// Run as part of the build (or manually):
//   node scripts/stamp-es-restaurant-audit.mjs
//
// Keeping generation explicit (not on-the-fly) means `git diff` shows
// exactly what changed in the ES output, and the file deploys as
// static HTML with zero runtime penalty.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EN_PATH = path.join(root, 'tools/audits/restaurant/index.html');
const ES_PATH = path.join(root, 'es/tools/audits/restaurant/index.html');

// Static-text translations. Keys are literal substrings in the EN
// file; values are Spanish replacements. Applied in order, so more
// specific phrases (longer strings) first — prevents a short prefix
// from cannibalizing a longer match. Add entries here as translator
// vets them; anything missing stays English.
const STATIC = [
  // Page title + meta
  [
    'Free Restaurant Website Audit — Score Your Site in About Thirty Seconds | Muntin Digital',
    'Auditoría gratuita para sitios de restaurante — Puntúa tu sitio en unos treinta segundos | Muntin Digital'
  ],
  [
    'Audit your restaurant website in about thirty seconds. Mobile speed, menu legibility, click-to-call, online ordering and reservation detection, Google Business Profile — a real restaurant-specific audit, not a generic Lighthouse score. Free, no signup.',
    'Audita el sitio web de tu restaurante en unos treinta segundos. Velocidad móvil, legibilidad del menú, tocar para llamar, detección de pedidos en línea y reservas, Perfil de Empresa de Google — una auditoría real para restaurantes, no una puntuación genérica de Lighthouse. Gratis, sin registro.'
  ],
  // OG / Twitter titles + descriptions
  [
    'Free Restaurant Website Audit — A Muntin Digital Creation',
    'Auditoría gratuita para sitios de restaurante — Una creación de Muntin Digital'
  ],
  [
    'A Muntin Digital creation powered by Google Lighthouse, PageSpeed Insights, CrUX field data, and schema.org validation — plus restaurant-specific checks for ordering, reservations, menu legibility, click-to-call, and Google Business Profile readiness. Free, no signup.',
    'Una creación de Muntin Digital impulsada por Google Lighthouse, PageSpeed Insights, datos reales de CrUX y validación de schema.org — más verificaciones específicas para restaurantes: pedidos, reservas, legibilidad del menú, tocar para llamar y estado del Perfil de Empresa de Google. Gratis, sin registro.'
  ],
  [
    'A Muntin Digital creation powered by Lighthouse, CrUX, and schema.org — a real restaurant audit for mobile speed, menus, ordering, reservations, and Google Business Profile readiness. Free, no signup.',
    'Una creación de Muntin Digital impulsada por Lighthouse, CrUX y schema.org — una auditoría real de restaurante para velocidad móvil, menús, pedidos, reservas y estado del Perfil de Empresa de Google. Gratis, sin registro.'
  ],
  // SoftwareApplication JSON-LD description
  [
    'A Muntin Digital creation — a free restaurant website audit combining Google Lighthouse, PageSpeed Insights, CrUX field data, schema.org validation, and restaurant-specific checks. No signup, no paywall, no dark patterns.',
    'Una creación de Muntin Digital — una auditoría gratuita del sitio web de tu restaurante que combina Google Lighthouse, PageSpeed Insights, datos reales de CrUX, validación de schema.org y verificaciones específicas para restaurantes. Sin registro, sin muros de pago, sin trucos.'
  ],
  [ '"Muntin Digital Restaurant Website Audit"', '"Auditoría de sitio web para restaurantes de Muntin Digital"' ],
  // JSON-LD feature list
  [ '"Mobile performance (Google Lighthouse)"',       '"Rendimiento móvil (Google Lighthouse)"' ],
  [ '"Core Web Vitals field data (Google CrUX)"',     '"Métricas Web Esenciales en campo (Google CrUX)"' ],
  [ '"WCAG accessibility audit"',                     '"Auditoría de accesibilidad WCAG"' ],
  [ '"SEO + structured-data validation (schema.org)"','"SEO + validación de datos estructurados (schema.org)"' ],
  [ '"Restaurant-specific checks (ordering, reservations, menu, hours)"',
    '"Verificaciones específicas para restaurantes (pedidos, reservas, menú, horarios)"' ],
  [ '"Competitor comparison"',                        '"Comparación con la competencia"' ],
  [ '"Printable PDF report"',                         '"Informe PDF imprimible"' ],
  [ '"Shareable audit link"',                         '"Enlace de auditoría para compartir"' ],

  // Hero + form
  [ 'Your overall score', 'Tu puntuación general' ],
  [ 'Audited:', 'Auditado:' ],
  [ 'Copy link', 'Copiar enlace' ],
  [ 'Building share link…', 'Creando enlace para compartir…' ],
  // D4: snapshot banner copy. Structure matches the HTML exactly so
  // substring replace picks them up even when adjacent to <strong>
  // span boundaries. Order matters: longer strings first so the
  // shorter ones don't prematurely replace substrings of them.
  [ "You're viewing the original owner's results. Numbers may have shifted since.",
    'Estás viendo los resultados originales del propietario. Los números pueden haber cambiado desde entonces.' ],
  [ '>Shared audit<', '>Auditoría compartida<' ],
  [ '>Captured<', '>Capturada<' ],
  [ '>Re-run audit now<', '>Ejecutar auditoría ahora<' ],
  // The "for" inside the banner copy is a common English word that
  // appears elsewhere; we disambiguate via the surrounding <span> tag.
  [ '</strong>\n            <span>for</span>\n            <strong',
    '</strong>\n            <span>para</span>\n            <strong' ],
  // D3: snapshot-view error copy. Strings live inline in the
  // hydrateFromSnapshotToken / renderSnapshotError helpers; the EN
  // master is the source of truth, ES comes from this mapping.
  [ "This share link has expired or wasn't found. Run a fresh audit below to check the current state of the site.",
    'Este enlace compartido ha expirado o no se encontró. Ejecuta una auditoría nueva abajo para ver el estado actual del sitio.' ],
  [ "Saved-audit sharing isn't turned on right now. Run a fresh audit below.",
    'Compartir auditorías guardadas no está activado ahora mismo. Ejecuta una auditoría nueva abajo.' ],
  [ "Couldn't load this shared audit. Run a fresh audit below to see current results.",
    'No se pudo cargar esta auditoría compartida. Ejecuta una auditoría nueva abajo para ver los resultados actuales.' ],
  [ 'Shared audit not available', 'Auditoría compartida no disponible' ],
  [ 'Download share card', 'Descargar tarjeta' ],
  [ 'Print for your manager', 'Imprimir para tu gerente' ],
  [ 'Share:', 'Compartir:' ],
  [ '>Top 3 fixes<', '>3 arreglos principales<' ],
  [ 'Ranked by impact for your segment. Work top-down.',
    'Ordenados por impacto para tu segmento. Trabaja de arriba hacia abajo.' ],
  [ 'What this means', 'Qué significa esto' ],
  [ 'Running your audit…', 'Ejecutando tu auditoría…' ],
  [ 'This usually takes 15–40 seconds', 'Normalmente tarda de 15 a 40 segundos' ],
  [ "We couldn't audit that URL.", 'No pudimos auditar esa URL.' ],
  [ '>Try again<', '>Intentar de nuevo<' ],
  [ '>Use a different URL<', '>Usar otra URL<' ],

  // Category labels
  [ '>Performance<',      '>Rendimiento<' ],
  [ '>Accessibility<',    '>Accesibilidad<' ],
  [ '>Best Practices<',   '>Buenas prácticas<' ],
  [ '>SEO<',              '>SEO<' ],
  [ '>Restaurant<',       '>Restaurante<' ],
  [ '>How fast pages load on a phone<',    '>Qué tan rápido carga en móvil<' ],
  [ '>Contrast, labels, tap targets<',     '>Contraste, etiquetas, áreas tocables<' ],
  [ '>HTTPS, images, console errors<',     '>HTTPS, imágenes, errores de consola<' ],
  [ '>Meta tags, structured data, crawl<', '>Meta tags, datos estructurados, rastreo<' ],
  [ '>Restaurant-specific priority checks<', '>Verificaciones prioritarias específicas de restaurante<' ],

  // Core Web Vitals strip
  [ '>Core Web Vitals<', '>Métricas Web Esenciales<' ],
  [ '>Largest Contentful Paint<', '>Mayor elemento renderizado<' ],
  [ '>Cumulative Layout Shift<',  '>Cambio de diseño acumulativo<' ],
  [ '>Interaction to Next Paint<','>Interacción hasta el siguiente render<' ],
  [ '>Total Blocking Time<',      '>Tiempo total de bloqueo<' ],
  [ '>First Contentful Paint<',   '>Primer render con contenido<' ],

  // Glossary / Metric ranges
  [ 'Good: 90+ · Needs work: 50–89 · Failing: <50',
    'Bueno: 90+ · Necesita trabajo: 50–89 · Fallando: <50' ],

  // Compare panel
  [ 'How do you stack up?', '¿Cómo te comparas?' ],
  [ 'Run comparison', 'Ejecutar comparación' ],

  // Email card
  [ 'Email me the PDF', 'Envíame el PDF por correo' ],
  [ 'Your email stays with me. No list, no marketing drip.',
    'Tu correo se queda conmigo. Sin lista, sin goteo de marketing.' ],

  // Skip link / footer-ish
  [ 'Skip to main content', 'Saltar al contenido principal' ],

  // OG / Twitter card image — swap the EN restaurant-audit SVG for
  // the Spanish sibling that lives beside it in /brand/og/.
  [ '/brand/og/audit-restaurants.svg', '/brand/og/audit-restaurants-es.svg' ],
];

function applyTranslations(src) {
  let out = src;
  // Sort by length desc so longer phrases replace first.
  const sorted = STATIC.slice().sort((a, b) => b[0].length - a[0].length);
  for (const [en, es] of sorted) {
    // Literal substring replace, global.
    out = out.split(en).join(es);
  }
  return out;
}

function rewriteHead(src) {
  // <html lang="en"> → <html lang="es">
  src = src.replace(/<html lang="en">/, '<html lang="es">');
  // Canonical + hreflang — canonical points to /es/, hreflang en → EN root
  src = src.replace(
    /<link rel="canonical" href="https:\/\/muntin\.digital\/tools\/audits\/restaurant\/" \/>/,
    '<link rel="canonical" href="https://muntin.digital/es/tools/audits/restaurant/" />'
  );
  src = src.replace(
    /<meta property="og:url" content="https:\/\/muntin\.digital\/tools\/audits\/restaurant\/" \/>/,
    '<meta property="og:url" content="https://muntin.digital/es/tools/audits/restaurant/" />'
  );
  // og:locale flip — the EN file has en_US as default; the ES mirror
  // makes es_US primary and en_US the alternate.
  src = src.replace(
    /<meta property="og:locale" content="en_US" \/>\s*\n\s*<meta property="og:locale:alternate" content="es_US" \/>/,
    '<meta property="og:locale" content="es_US" />\n<meta property="og:locale:alternate" content="en_US" />'
  );
  // SoftwareApplication JSON-LD url field
  src = src.replace(
    /"url": "https:\/\/muntin\.digital\/tools\/audits\/restaurant\/"/,
    '"url": "https://muntin.digital/es/tools/audits/restaurant/"'
  );
  // inLanguage hint on the SoftwareApplication schema — insert just
  // after "operatingSystem": "Web"
  src = src.replace(
    /"operatingSystem": "Web",/,
    '"operatingSystem": "Web",\n  "inLanguage": "es",'
  );
  return src;
}

function rewriteScriptPaths(src) {
  // Make the shared helpers load from the EN directory so one copy
  // of subtypes.js + restaurant-checks.js serves both locales.
  src = src.replace(
    /<script src="\.\/subtypes\.js"><\/script>/,
    '<script src="/tools/audits/restaurant/subtypes.js"></script>'
  );
  src = src.replace(
    /<script src="\.\/restaurant-checks\.js"><\/script>/,
    '<script src="/tools/audits/restaurant/restaurant-checks.js"></script>'
  );
  return src;
}

function forceSpanishLang(src) {
  // Inject a single-line script before the first <script src=> that
  // pins window.__muntinLang = 'es' so the runtime i18n helpers
  // resolve correctly on boot.
  const marker = '<script src="/tools/audits/restaurant/subtypes.js"></script>';
  if (src.indexOf(marker) === -1) return src;
  return src.replace(
    marker,
    '<script>window.__muntinLang = "es";</script>\n' + marker
  );
}

function stamp() {
  const src = fs.readFileSync(EN_PATH, 'utf8');
  let out = src;
  out = rewriteScriptPaths(out);
  out = forceSpanishLang(out);
  out = rewriteHead(out);
  out = applyTranslations(out);
  fs.mkdirSync(path.dirname(ES_PATH), { recursive: true });
  fs.writeFileSync(ES_PATH, out, 'utf8');
  console.log('Stamped ES mirror → ' + path.relative(root, ES_PATH));
  console.log('  Source lines: ' + src.split('\n').length);
  console.log('  Translations applied: ' + STATIC.length);
}

stamp();
