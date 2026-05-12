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
  // D13: worksheet print header. <dt> labels inside the header
  // + the H1 title (handled at print time by JS — no stamp
  // needed for that path). Stamps here cover the static
  // markup so screen readers that peek at aria-hidden nodes
  // still get ES context.
  [ '<dt>Audited URL</dt>',   '<dt>URL auditada</dt>' ],
  [ '<dt>Captured</dt>',      '<dt>Capturada</dt>' ],
  [ '<dt>Overall score</dt>', '<dt>Puntuación general</dt>' ],
  [ 'Restaurant website audit worksheet',
    'Hoja de auditoría del sitio web del restaurante' ],
  // D5: developer brief buttons. Labels appear in the share row
  // alongside Copy link / Print for your manager.
  [ 'Copy for your developer', 'Copiar para tu desarrollador' ],
  [ 'Open printable brief',    'Abrir resumen imprimible' ],
  // D8: permalink display copy. Label sits above the URL input;
  // disclosure underneath. "Copy" and "Copied ✓" are button states.
  [ 'Your shareable link', 'Tu enlace para compartir' ],
  [ "Auto-deletes in 90 days. Unlisted but not secret — don't share sensitive URLs.",
    'Se borra automáticamente en 90 días. No está listado pero no es secreto — no compartas URLs sensibles.' ],
  [ '>Copy<',   '>Copiar<' ],
  [ '>Copied ✓<', '>Copiado ✓<' ],
  [ 'aria-label="Copy shareable link"', 'aria-label="Copiar enlace para compartir"' ],
  [ 'aria-label="Shareable audit permalink"', 'aria-label="Enlace permanente de auditoría para compartir"' ],
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

  // OG / Twitter card image — swap the EN restaurant-audit asset
  // for the Spanish sibling that lives beside it in /brand/og/.
  // Both extensions listed because OG delivery migrated from SVG
  // to PNG; this script has to cover both until the EN master
  // source settles.
  [ '/brand/og/audit-restaurants.png', '/brand/og/audit-restaurants-es.png' ],
  [ '/brand/og/audit-restaurants.svg', '/brand/og/audit-restaurants-es.svg' ],

  // Research-note "Learn more" enrichment (added during Sprint R+).
  // The rendered audit rows and the metric-glossary get second
  // "Based on …" links that point at /learn/research/<slug>/ notes.
  // Swap the URL prefix to /es/learn/research/ on the ES mirror and
  // translate the label copy natively. All new-tab.
  [ '"/learn/research/lighthouse-performance-scoring/"', '"/es/learn/research/lighthouse-performance-scoring/"' ],
  [ '"/learn/research/mobile-page-speed-3-second-rule/"', '"/es/learn/research/mobile-page-speed-3-second-rule/"' ],
  [ '"/learn/research/fittss-law/"',                     '"/es/learn/research/fittss-law/"' ],
  [ '"/learn/research/cart-abandonment-rate/"',          '"/es/learn/research/cart-abandonment-rate/"' ],
  [ '"/learn/research/local-business-websites/"',        '"/es/learn/research/local-business-websites/"' ],

  // Row-level "Based on …" link labels (appear alongside "Learn more →"
  // on audit result rows when the check maps to a research note).
  [ "label: \"Based on Fitts's Law\"",                     "label: \"Con base en la Ley de Fitts\"" ],
  [ "label: 'Based on Baymard research'",                  "label: 'Con base en la investigación de Baymard'" ],
  [ "label: 'Based on NNG research'",                      "label: 'Con base en la investigación de NNG'" ],
  [ "label: \"Based on Google's 3-second study\"",        "label: \"Con base en el estudio de 3 segundos de Google\"" ],
  [ 'Muntin research note — opens in a new tab',           'Nota de investigación de Muntin — se abre en una pestaña nueva' ],
  [ ' (opens in a new tab)',                               ' (se abre en una pestaña nueva)' ],

  // Metric-glossary "Based on:" inline copy + the research-note link labels.
  [ '<strong>Based on:</strong>',                          '<strong>Con base en:</strong>' ],
  [ 'How Lighthouse scores performance ',                  'Cómo califica Lighthouse el rendimiento ' ],
  [ 'The 3-second mobile load rule ',                      'La regla de los 3 segundos en móvil ' ],
  [ ' (opens in new tab)',                                 ' (se abre en una pestaña nueva)' ],

  // Wave-B2 (a11y reviewer): the Methodology body inside the
  // "What do these numbers actually mean?" disclosure was hard-coded
  // English in the EN master, so a Spanish-speaking owner expanding
  // it saw a wall of English. Translations land here so the
  // ES mirror picks them up at build time without needing to
  // wrap every paragraph in data-tr keys.
  [ 'What do these numbers actually mean?',                '¿Qué significan estos números, en realidad?' ],

  // Performance pillar
  [ 'Performance (0–100)',                                 'Rendimiento (0–100)' ],
  [ "How fast your pages load and become usable on a phone. This is the metric that quietly costs restaurants the most money — Google's own research found that 53% of mobile visitors leave a page that takes longer than three seconds to load. A higher score means more people stick around long enough to see your menu.",
    'Qué tan rápido tus páginas cargan y se vuelven usables en un teléfono. Esta es la métrica que más les cuesta dinero a los restaurantes en silencio — la propia investigación de Google encontró que el 53% de los visitantes móviles se van de una página que tarda más de tres segundos en cargar. Una puntuación más alta significa que más personas se quedan lo suficiente para ver tu menú.' ],
  [ '<strong>Good:</strong> 90+ &nbsp;·&nbsp; <strong>Needs work:</strong> 50–89 &nbsp;·&nbsp; <strong>Failing:</strong> &lt;50',
    '<strong>Bien:</strong> 90+ &nbsp;·&nbsp; <strong>Necesita trabajo:</strong> 50–89 &nbsp;·&nbsp; <strong>Reprobado:</strong> &lt;50' ],

  // Accessibility pillar
  [ 'Accessibility (0–100)',                               'Accesibilidad (0–100)' ],
  [ 'Whether people with vision impairments, motor differences, or screen readers can actually use your site. Half of this is legally required in many states. The other half is just good manners — about one in five of your customers benefits directly from an accessible site, and everyone benefits indirectly (better text contrast makes your site easier to read in sunlight too).',
    'Si las personas con discapacidades visuales, diferencias motrices o lectores de pantalla pueden usar tu sitio de verdad. La mitad de esto es un requisito legal en muchos estados. La otra mitad es buena educación — alrededor de uno de cada cinco de tus clientes se beneficia directamente de un sitio accesible, y todos se benefician indirectamente (un mejor contraste de texto también hace que tu sitio sea más fácil de leer al sol).' ],
  [ '<strong>Target:</strong> 100. Anything less means real people are being shut out.',
    '<strong>Meta:</strong> 100. Cualquier valor menor significa que personas reales están quedando fuera.' ],

  // Modern & secure setup pillar
  [ 'Modern &amp; secure setup (0–100)',                   'Bases modernas y seguras (0–100)' ],
  [ 'Whether your site is built on a modern, secure foundation — HTTPS, no vulnerable libraries, no deprecated browser features. A well-built site should score 100 here by default. A score under 90 usually points at one specific thing worth fixing, like a missing security header or an old plugin.',
    'Si tu sitio está construido sobre bases modernas y seguras — HTTPS, sin librerías vulnerables, sin funciones de navegador obsoletas. Un sitio bien hecho debería sacar 100 aquí por defecto. Una puntuación bajo 90 normalmente apunta a una cosa concreta que vale la pena arreglar, como un encabezado de seguridad faltante o un plugin antiguo.' ],
  [ '<strong>Target:</strong> 100.',                       '<strong>Meta:</strong> 100.' ],

  // SEO pillar
  [ 'SEO (0–100)',                                         'SEO (0–100)' ],
  [ "The technical SEO fundamentals — a working title tag, a meta description, a crawlable URL, a mobile-friendly viewport, structured data. This score measures whether Google <em>can</em> rank your site. It doesn't measure whether you <em>do</em> rank for specific keywords — that's a longer-term question about content and inbound links.",
    'Los fundamentos técnicos de SEO — una etiqueta de título funcional, una meta descripción, una URL rastreable, un viewport apto para móvil, datos estructurados. Esta puntuación mide si Google <em>puede</em> posicionar tu sitio. No mide si <em>sí</em> posicionas para palabras específicas — esa es una pregunta a más largo plazo sobre contenido y enlaces entrantes.' ],
  [ '<strong>Target:</strong> 100. Anything less is leaving ranking signals on the table.',
    '<strong>Meta:</strong> 100. Cualquier valor menor deja señales de posicionamiento sobre la mesa.' ],

  // Restaurant Readiness pillar
  [ 'Restaurant Readiness (0–100)',                        'Listo para restaurantes (0–100)' ],
  [ 'Our own rubric, specific to independent restaurant websites. Covers nine checks that matter for turning a mobile visitor into a booked table: a working mobile viewport, tap-target size, text contrast, legible font sizes, a tappable phone number, an embedded map or directions link, online ordering or reservations (either a known platform like Toast/OpenTable or a self-hosted equivalent), an HTML menu (not a PDF or image), and Restaurant schema.org markup for local search. Each check is weighted by its conversion impact — a pass earns full weight, a fail earns zero. Anything we honestly couldn\'t verify is excluded from both sides of the average, so "unknown" never penalizes you. Non-restaurant sites show "N/A" here and don\'t count this category toward their overall score.',
    'Nuestra propia rúbrica, específica para sitios de restaurantes independientes. Cubre nueve verificaciones que importan para convertir a un visitante móvil en una mesa reservada: un viewport móvil que funcione, tamaño de área tocable, contraste de texto, tamaños de fuente legibles, un teléfono tocable, un mapa embebido o enlace a direcciones, pedidos en línea o reservas (una plataforma conocida como Toast/OpenTable o un equivalente propio), un menú HTML (no un PDF o imagen) y marcado schema.org de Restaurant para la búsqueda local. Cada verificación pesa según su impacto en conversión — pasar gana peso completo, fallar gana cero. Lo que honestamente no pudimos confirmar queda fuera de ambos lados del promedio, así que "desconocido" nunca te penaliza. Los sitios que no son de restaurante muestran "N/D" aquí y esta categoría no cuenta para su puntuación general.' ],

  // Core Web Vitals body
  [ 'Core Web Vitals',                                     'Core Web Vitals' ],
  [ 'Five specific timing and interactivity measurements. Three of them (LCP, CLS, INP) are the current Core Web Vitals Google uses for mobile search ranking. Each card shows either <em>real-user data</em> (the 28-day median of actual visitor experiences that Google collects from Chrome) or a <em>lab estimate</em> (a simulated mobile run) — real-user data is preferred when available, since it reflects the site your customers actually experience. New or low-traffic restaurant sites usually only have lab data until they accumulate enough visits.',
    'Cinco mediciones específicas de tiempos e interactividad. Tres de ellas (LCP, CLS, INP) son las Core Web Vitals actuales que Google usa para el posicionamiento de búsqueda móvil. Cada tarjeta muestra o bien <em>datos de usuarios reales</em> (la mediana de 28 días de experiencias reales que Google recopila desde Chrome) o una <em>estimación de laboratorio</em> (una ejecución móvil simulada) — los datos reales se prefieren cuando están disponibles, ya que reflejan el sitio que tus clientes experimentan de verdad. Los sitios nuevos o de poco tráfico normalmente solo tienen datos de laboratorio hasta acumular suficientes visitas.' ],
  [ '<strong>LCP — Largest Contentful Paint.</strong> How long until the biggest visible thing on the page (usually a hero image or headline) shows up. <em>Good: under 2.5s · Poor: over 4s.</em>',
    '<strong>LCP — Largest Contentful Paint.</strong> Cuánto tarda en aparecer lo más grande visible de la página (normalmente una imagen principal o un encabezado). <em>Bien: menos de 2.5s · Lento: más de 4s.</em>' ],
  [ '<strong>CLS — Cumulative Layout Shift.</strong> How much the page jumps around while loading. Shifting layouts are the reason you sometimes tap "Reserve" and accidentally hit an ad because the ad loaded a second late and pushed everything down. <em>Good: under 0.1 · Poor: over 0.25.</em>',
    '<strong>CLS — Cumulative Layout Shift.</strong> Cuánto se mueve la página mientras carga. Los diseños que se mueven son la razón por la que a veces tocas "Reservar" y das sin querer en un anuncio porque el anuncio cargó un segundo tarde y empujó todo hacia abajo. <em>Bien: menos de 0.1 · Lento: más de 0.25.</em>' ],
  [ '<strong>INP — Interaction to Next Paint.</strong> How long the page takes to respond to a tap or click — the third Core Web Vital, replacing FID in 2024. Field-only: requires enough real visits to report. <em>Good: under 200ms · Poor: over 500ms.</em>',
    '<strong>INP — Interaction to Next Paint.</strong> Cuánto tarda la página en responder a un toque o clic — la tercera Core Web Vital, que sustituye a FID en 2024. Solo de campo: requiere suficientes visitas reales para reportarse. <em>Bien: menos de 200ms · Lento: más de 500ms.</em>' ],
  [ '<strong>TBT — Total Blocking Time.</strong> The lab-only proxy for INP. How long the page is frozen while JavaScript runs during the simulated load. Useful when CrUX hasn\'t collected INP yet. <em>Good: under 200ms · Poor: over 600ms.</em>',
    '<strong>TBT — Total Blocking Time.</strong> La aproximación de laboratorio para INP. Cuánto tiempo la página queda congelada mientras JavaScript se ejecuta durante la carga simulada. Útil cuando CrUX aún no ha recogido INP. <em>Bien: menos de 200ms · Lento: más de 600ms.</em>' ],
  [ '<strong>FCP — First Contentful Paint.</strong> How long until the very first pixel renders. Often earlier than LCP — this is "the page is doing something" versus "the page is usable." <em>Good: under 1.8s · Poor: over 3s.</em>',
    '<strong>FCP — First Contentful Paint.</strong> Cuánto tarda en renderizarse el primerísimo pixel. Frecuentemente antes que LCP — esto es "la página está haciendo algo" en lugar de "la página es usable." <em>Bien: menos de 1.8s · Lento: más de 3s.</em>' ],
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
