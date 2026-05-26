#!/usr/bin/env node
/**
 * Per-article "Build it: Lesson N" rail — surfaces the bootcamp
 * lesson that practices the article's main thesis. Modeled on the
 * structural posture of inject-knit-rail.mjs (each article carries
 * its own lesson anchor) but ships as a sentinel-bracketed FIFTH
 * lane rather than restructuring the existing four-lane KnitRail.
 *
 * Sentinel-bracketed (<!-- article-course-rail:start --> ... :end -->),
 * inserted right after knit-rail:end so the existing 4-lane "Apply
 * / Read / Define / Talk" rail is preserved and the course-specific
 * "Build it" rail is a clearly distinct row below it.
 *
 *   node scripts/inject-article-course-rail.mjs           # rewrite
 *   node scripts/inject-article-course-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- article-course-rail:start -->[\s\S]*?<!-- article-course-rail:end -->\n?/;
const KNIT_END_RE = /<!-- knit-rail:end -->/;

function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Article slug → bootcamp lesson it most directly maps to. Each
// entry is the lesson the operator runs to actually DO the thing
// the article describes. Articles without a clean lesson mapping
// are silently skipped — the KnitRail's existing four lanes
// already cover the article's other "next steps."
const ARTICLE_LESSONS = {
  'how-to-set-up-google-business-profile-for-your-restaurant': {
    module: 'm3-assemble', slug: 'gbp', position: 11, track: 'fresh',
    title_en: 'Google Business Profile', title_es: 'Perfil de Negocio de Google',
    pitch_en: 'The article tells you why. The lesson walks you through every field with your own restaurant — and pairs each GBP change with the matching update on your site.',
    pitch_es: 'El artículo te dice por qué. La lección te lleva por cada campo con tu propio restaurante — y empareja cada cambio de GBP con la actualización del sitio.'
  },
  'my-restaurant-isnt-on-google-maps-10-minute-diagnostic': {
    module: 'm3-assemble', slug: 'gbp', position: 11, track: 'fresh',
    title_en: 'Google Business Profile', title_es: 'Perfil de Negocio de Google',
    pitch_en: 'Done with the diagnostic? The bootcamp\'s GBP lesson is the long-form fix — every field, every screenshot, your own restaurant as the working example.',
    pitch_es: '¿Hiciste el diagnóstico? La lección de GBP del bootcamp es el arreglo de largo plazo — cada campo, cada captura, tu propio restaurante como ejemplo.'
  },
  'how-to-get-more-google-reviews-for-your-restaurant': {
    module: 'm4-launch', slug: 'reviews', position: 13,
    title_en: 'Reviews + first-week trust', title_es: 'Reseñas + confianza la primera semana',
    pitch_en: 'The article is the playbook. The lesson is where you build the QR postcard, the host-stand script, and the response template inside your own brand voice.',
    pitch_es: 'El artículo es el manual. La lección es donde construyes la tarjeta QR, el guión del anfitrión y la plantilla de respuesta en tu propia voz de marca.'
  },
  'how-to-respond-to-google-reviews-restaurant-playbook-2026': {
    module: 'm4-launch', slug: 'reviews', position: 13,
    title_en: 'Reviews + first-week trust', title_es: 'Reseñas + confianza la primera semana',
    pitch_en: 'Practice the four review-response archetypes against your own restaurant\'s voice — and ship the response templates as a saved artifact.',
    pitch_es: 'Practica los cuatro arquetipos de respuesta a reseñas con la voz de tu propio restaurante — y guarda las plantillas como artefacto.'
  },
  'how-to-appear-in-ai-search-restaurant-2026': {
    module: 'm4-launch', slug: 'local-seo', position: 12,
    title_en: 'Local SEO anchors', title_es: 'Anclas de SEO local',
    pitch_en: 'The four numbers the article names get measured in real time as you build the local-SEO page in this lesson.',
    pitch_es: 'Los cuatro números que nombra el artículo se miden en tiempo real mientras construyes la página de SEO local en esta lección.'
  },
  'how-to-get-cited-in-google-ai-overviews-restaurant': {
    module: 'm4-launch', slug: 'local-seo', position: 12,
    title_en: 'Local SEO anchors', title_es: 'Anclas de SEO local',
    pitch_en: 'The citation pattern from the article shipped as schema markup in this lesson — your own restaurant, your own facts, citable by AI engines.',
    pitch_es: 'El patrón de cita del artículo se entrega como marcado schema en esta lección — tu propio restaurante, tus propios datos, citables por motores de IA.'
  },
  'restaurant-schema-markup-6-types-google-uses': {
    module: 'm4-launch', slug: 'local-seo', position: 12,
    title_en: 'Local SEO anchors', title_es: 'Anclas de SEO local',
    pitch_en: 'The six schema types ship as part of the generator output in this lesson — pre-filled with your hours, menu, address, and reviews.',
    pitch_es: 'Los seis tipos de schema se entregan como parte del generador en esta lección — pre-llenados con tus horarios, menú, dirección y reseñas.'
  },
  'restaurant-schema-markup-complete-paste-ready-example': {
    module: 'm4-launch', slug: 'local-seo', position: 12,
    title_en: 'Local SEO anchors', title_es: 'Anclas de SEO local',
    pitch_en: 'You can paste the article\'s example, or you can run the lesson and have the schema generated for you, populated with your real fields.',
    pitch_es: 'Puedes pegar el ejemplo del artículo, o correr la lección y tener el schema generado para ti, lleno con tus campos reales.'
  },
  'restaurant-photo-spec-sheet': {
    module: 'm3-assemble', slug: 'photos', position: 9, track: 'fresh',
    title_en: 'Photo brief from scratch', title_es: 'Brief de fotos desde cero',
    pitch_en: 'The spec sheet is the reference. The lesson builds the brief you hand the photographer — your dishes, your aesthetic, your shot list.',
    pitch_es: 'La hoja de especificaciones es la referencia. La lección construye el brief que entregas al fotógrafo — tus platos, tu estética, tu lista de tomas.'
  },
  'what-should-be-on-a-restaurant-website': {
    module: 'm1-orient', slug: 'what-a-site-does', position: 2,
    title_en: 'What a restaurant site actually does', title_es: 'Qué hace realmente un sitio de restaurante',
    pitch_en: 'The article lists what should be there. The lesson decides — with your restaurant — which of those things lead the home page, which go below the fold, which never appear at all.',
    pitch_es: 'El artículo lista qué debe estar. La lección decide — con tu restaurante — cuál encabeza la página, cuál va abajo del pliegue, cuál no aparece.'
  },
  'how-much-does-a-custom-restaurant-website-cost-in-2026': {
    module: 'm1-orient', slug: 'welcome', position: 1,
    title_en: 'Welcome + track picker', title_es: 'Bienvenida + selector de pista',
    pitch_en: 'The article frames the budget shape. The bootcamp is the free option that lands you with a real site at the end — no contract, no monthly fee.',
    pitch_es: 'El artículo enmarca la forma del presupuesto. El bootcamp es la opción gratis que te deja con un sitio real al final — sin contrato, sin pago mensual.'
  },
  'does-my-restaurant-need-a-website': {
    module: 'm1-orient', slug: 'what-a-site-does', position: 2,
    title_en: 'What a restaurant site actually does', title_es: 'Qué hace realmente un sitio de restaurante',
    pitch_en: 'If the answer is yes, the lesson is where you start.',
    pitch_es: 'Si la respuesta es sí, la lección es donde empiezas.'
  },
  'can-chatgpt-write-your-restaurant-website': {
    module: 'm1-orient', slug: 'one-promise', position: 3,
    title_en: 'Your one promise', title_es: 'Tu única promesa',
    pitch_en: 'ChatGPT can\'t write the one sentence your restaurant\'s site hangs on. This lesson does — with you, in your voice, for your customer.',
    pitch_es: 'ChatGPT no puede escribir la frase única de la que cuelga tu sitio. Esta lección sí lo hace — contigo, en tu voz, para tu cliente.'
  },
  'when-to-rebuild-your-restaurant-website': {
    module: 'm2-decide', slug: 'audit', position: 5, track: 'rebuild',
    title_en: 'Audit your current site', title_es: 'Audita tu sitio actual',
    pitch_en: 'The article tells you when. The lesson is the audit — six leak points, your own URL, decided in 30 minutes.',
    pitch_es: 'El artículo te dice cuándo. La lección es la auditoría — seis puntos de fuga, tu propia URL, decidido en 30 minutos.'
  },
  'why-your-restaurant-loses-reservations-every-night': {
    module: 'm3-assemble', slug: 'hours-contact', position: 10,
    title_en: 'Hours + holidays + contact', title_es: 'Horarios + feriados + contacto',
    pitch_en: 'The article maps the six leaks. The lesson ships the fixes — tap-to-call, tap-to-directions, weekly hours, holiday hours — all wired into your site.',
    pitch_es: 'El artículo mapea las seis fugas. La lección entrega los arreglos — toca-para-llamar, toca-para-llegar, horarios semanales, horarios de feriados — todos cableados.'
  },
  'how-to-raise-restaurant-menu-prices-without-losing-reservations': {
    module: 'm3-assemble', slug: 'menu', position: 8,
    title_en: 'Menu + plate-cost loop', title_es: 'Menú + ciclo de costo por plato',
    pitch_en: 'The article is the playbook. The lesson runs the plate-cost loop on your own menu and stages the price changes for the site.',
    pitch_es: 'El artículo es el manual. La lección corre el ciclo de costo por plato en tu propio menú y prepara los cambios de precio para el sitio.'
  },
  'wix-vs-custom-for-restaurants': {
    module: 'm1-orient', slug: 'welcome', position: 1,
    title_en: 'Welcome + track picker', title_es: 'Bienvenida + selector de pista',
    pitch_en: 'If you\'re looking at Wix because custom feels out of reach, the bootcamp is the third option: custom-quality, $0, you own the files.',
    pitch_es: 'Si miras Wix porque lo custom se siente fuera de alcance, el bootcamp es la tercera opción: calidad custom, $0, tú eres dueño de los archivos.'
  }
};

const COPY = {
  en: { eyebrow: 'Build it', heading: 'Practice this in the bootcamp.', cta: 'Open the lesson' },
  es: { eyebrow: 'Constrúyelo', heading: 'Practica esto en el bootcamp.', cta: 'Abrir la lección' }
};

function lessonUrl(lesson, locale) {
  const root = locale === 'es' ? '/es/course/' : '/course/';
  const fork = lesson.track === 'fresh' ? '/fresh' : (lesson.track === 'rebuild' ? '/rebuild' : '');
  if (fork) return `${root}${lesson.module}${fork}/${lesson.slug}/`;
  return `${root}${lesson.module}/${lesson.slug}/`;
}

function slugFromPath(filepath) {
  const m = filepath.match(/blog\/([^/]+)\/index\.html$/);
  return m ? m[1] : null;
}

function buildBlock(slug, locale) {
  const lesson = ARTICLE_LESSONS[slug];
  if (!lesson) return null;
  const c = COPY[locale];
  const url   = lessonUrl(lesson, locale);
  const title = locale === 'es' ? lesson.title_es : lesson.title_en;
  const pitch = locale === 'es' ? lesson.pitch_es : lesson.pitch_en;
  const eyebrowText = locale === 'es' ? `${c.eyebrow} · Lección ${lesson.position}` : `${c.eyebrow} · Lesson ${lesson.position}`;

  return `<!-- article-course-rail:start -->
<aside class="article-course-rail" aria-labelledby="acr-h">
  <p class="acr-eyebrow">${escText(eyebrowText)}</p>
  <h2 class="acr-h" id="acr-h"><a href="${escAttr(url)}">${escText(title)}</a></h2>
  <p class="acr-pitch">${escText(pitch)}</p>
  <p class="acr-cta"><a href="${escAttr(url)}">${escText(c.cta)} →</a></p>
</aside>
<style>
.article-course-rail{max-width:680px;margin:36px auto 24px;padding:24px 28px;border:1px solid var(--line);border-radius:14px;background:var(--cream)}
.article-course-rail .acr-eyebrow{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);font-weight:600;margin:0 0 10px}
.article-course-rail .acr-h{font-family:var(--font-display);font-weight:500;font-size:22px;line-height:1.25;margin:0 0 12px;color:var(--ink)}
.article-course-rail .acr-h a{color:var(--ink);text-decoration:none;background:linear-gradient(to right,var(--teal),var(--teal)) no-repeat 0 100%/100% 1px}
.article-course-rail .acr-h a:hover{color:var(--teal-dark)}
.article-course-rail .acr-pitch{font-size:15.5px;color:var(--ink-soft);line-height:1.55;margin:0 0 14px}
.article-course-rail .acr-cta{margin:0;font-size:14.5px;font-weight:600}
.article-course-rail .acr-cta a{color:var(--teal-dark);text-decoration:none}
.article-course-rail .acr-cta a:hover{text-decoration:underline}
</style>
<!-- article-course-rail:end -->`;
}

let changed = 0;
let skipped = 0;

const TARGETS = [];
for (const root of [['en', 'blog'], ['es', 'es/blog']]) {
  const [locale, dir] = root;
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) continue;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name === 'drafts') continue;
    const file = path.join(full, entry.name, 'index.html');
    if (fs.existsSync(file)) TARGETS.push({ file, locale, slug: entry.name });
  }
}

for (const { file, locale, slug } of TARGETS) {
  const block = buildBlock(slug, locale);
  const src = fs.readFileSync(file, 'utf8');

  let next;
  if (block) {
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      const m = KNIT_END_RE.exec(src);
      if (!m) { skipped++; continue; }
      const insertAt = m.index + m[0].length;
      next = src.slice(0, insertAt) + '\n' + block + src.slice(insertAt);
    }
  } else {
    if (!SENTINEL_RE.test(src)) { skipped++; continue; }
    next = src.replace(SENTINEL_RE, '');
  }

  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
