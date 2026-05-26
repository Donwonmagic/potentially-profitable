#!/usr/bin/env node
/**
 * Per-topic-page rail: "Lessons in this topic" — surfaces the 2–4
 * Open the Doors bootcamp lessons that map to the topic cluster.
 * Modeled exactly on scripts/inject-topic-sheets-rail.mjs.
 *
 * Each /learn/topics/<cluster>/ page already surfaces ARTICLES,
 * TOOLS, and (for some) SHEETS. This injector adds the LESSON
 * lane so the topic cluster represents all four taxonomic
 * surfaces: articles (read), tools (do), sheets (paperwork),
 * lessons (sequence).
 *
 * Sentinel-bracketed (<!-- topic-course-rail:start --> ... :end -->),
 * inserted before the topic-essay block, replaces existing stamp
 * on re-runs.
 *
 *   node scripts/inject-topic-course-rail.mjs           # rewrite
 *   node scripts/inject-topic-course-rail.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- topic-course-rail:start -->[\s\S]*?<!-- topic-course-rail:end -->/;
const ESSAY_ANCHOR = '<!-- topic-essay:start -->';

function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }

// Topic cluster → lessons that practice the topic. Each lesson
// has the module (for URL), slug, position (for "Lesson N"
// display), titles in EN+ES, and an optional one-line "what
// happens in this lesson" intro per locale.
const TOPIC_LESSONS = {
  'brand-design': [
    { module: 'm1-orient',   slug: 'one-promise',    position: 3, title_en: 'Your one promise',                title_es: 'Tu única promesa',
      intro_en: 'Write the one sentence every other decision hangs on.', intro_es: 'Escribe la frase de la que cuelga todo lo demás.' },
    { module: 'm2-decide',   slug: 'palette-voice',  position: 7, title_en: 'Palette + voice',                 title_es: 'Paleta + voz',
      intro_en: 'Three colors, a font pair, and a voice — locked across every page.', intro_es: 'Tres colores, un par de fuentes, y una voz — fijos en cada página.' }
  ],
  'conversions': [
    { module: 'm1-orient',   slug: 'what-a-site-does', position: 2, title_en: 'What a restaurant site actually does', title_es: 'Qué hace realmente un sitio de restaurante',
      intro_en: 'The four jobs every restaurant site has on a Tuesday at 7:42pm.', intro_es: 'Los cuatro trabajos que tiene cada sitio un martes a las 7:42pm.' },
    { module: 'm3-assemble', slug: 'hours-contact',  position: 10, title_en: 'Hours + holidays + contact',     title_es: 'Horarios + feriados + contacto',
      intro_en: 'Tap-to-call, tap-to-directions, holiday hours that match GBP.', intro_es: 'Toca-para-llamar, toca-para-llegar, horarios de feriados que coinciden con GBP.' }
  ],
  'local-seo': [
    { module: 'm3-assemble', slug: 'gbp',            position: 11, title_en: 'Google Business Profile',        title_es: 'Perfil de Negocio de Google',
      intro_en: 'The nine fields that move the score, paired with the matching site update.', intro_es: 'Los nueve campos que mueven el puntaje, emparejados con la actualización del sitio.', track: 'fresh' },
    { module: 'm4-launch',   slug: 'local-seo',      position: 12, title_en: 'Local SEO anchors',              title_es: 'Anclas de SEO local',
      intro_en: 'Neighborhood keywords, cuisine anchors, the schema markup that makes Google understand the place.', intro_es: 'Palabras clave de barrio, anclas de cocina, el marcado schema que hace que Google entienda el lugar.' }
  ],
  'operations-margin': [
    { module: 'm3-assemble', slug: 'menu',           position: 8,  title_en: 'Menu + plate-cost loop',         title_es: 'Menú + ciclo de costo por plato',
      intro_en: 'Plate cost per dish drives the eight dishes that ship on your site.', intro_es: 'El costo por plato decide los ocho platos que van en tu sitio.' },
    { module: 'm3-assemble', slug: 'hours-contact',  position: 10, title_en: 'Hours + holidays + contact',     title_es: 'Horarios + feriados + contacto',
      intro_en: 'Operating hours fed to the site, GBP, and the front-door sign — once.', intro_es: 'Los horarios alimentan el sitio, GBP, y el cartel de la puerta — una vez.' }
  ],
  'speed-mobile': [
    { module: 'm4-launch',   slug: 'generator',      position: 14, title_en: 'The Generator — download your site', title_es: 'El Generador — descarga tu sitio',
      intro_en: 'A zero-JS plain HTML+CSS site that loads in under 200 ms on a phone with two bars.', intro_es: 'Un sitio plano HTML+CSS sin JavaScript que carga en menos de 200 ms con dos rayitas de señal.' }
  ],
  'trust-reviews': [
    { module: 'm4-launch',   slug: 'reviews',        position: 13, title_en: 'Reviews + first-week trust',     title_es: 'Reseñas + confianza la primera semana',
      intro_en: 'The flywheel that gets you to 100 reviews without begging.', intro_es: 'El ciclo que te lleva a 100 reseñas sin rogar.' }
  ],
  'ai-search': [
    { module: 'm4-launch',   slug: 'local-seo',      position: 12, title_en: 'Local SEO anchors',              title_es: 'Anclas de SEO local',
      intro_en: 'The schema markup that lets AI engines cite your site as an authoritative answer.', intro_es: 'El marcado schema que permite a los motores de IA citar tu sitio como respuesta autoritativa.' }
  ]
  // 'information-security' has no direct lesson mapping — skipped.
};

const COPY = {
  en: { eyebrow: 'Practice in the bootcamp', heading: 'Lessons in this topic.', cta: 'Open the lesson' },
  es: { eyebrow: 'Practica en el bootcamp',  heading: 'Lecciones de este tema.', cta: 'Abrir la lección' }
};

function lessonUrl(lesson, locale) {
  const root = locale === 'es' ? '/es/course/' : '/course/';
  if (lesson.track === 'fresh') {
    return `${root}${lesson.module}/fresh/${lesson.slug}/`;
  }
  return `${root}${lesson.module}/${lesson.slug}/`;
}

function buildBlock(topicSlug, locale) {
  const lessons = TOPIC_LESSONS[topicSlug];
  if (!lessons || !lessons.length) return null;
  const c = COPY[locale];

  const items = lessons.map((lesson) => {
    const url   = lessonUrl(lesson, locale);
    const title = locale === 'es' ? lesson.title_es : lesson.title_en;
    const intro = locale === 'es' ? lesson.intro_es : lesson.intro_en;
    const eyebrow = locale === 'es' ? `LECCIÓN ${lesson.position}` : `LESSON ${lesson.position}`;
    return `      <li>
        <a class="topic-tool-card topic-tool-card--course" href="${escAttr(url)}">
          <span class="topic-tool-eyebrow">${escText(eyebrow)}</span>
          <h4>${escText(title)}</h4>
          <p>${escText(intro)}</p>
          <span class="topic-tool-cta">${escText(c.cta)} <span aria-hidden="true">→</span></span>
        </a>
      </li>`;
  }).join('\n');

  return `<!-- topic-course-rail:start -->
<section class="topic-section">
  <div class="container">
    <header class="topic-section-head">
      <span class="eyebrow">${escText(c.eyebrow)}</span>
      <h2>${escText(c.heading)}</h2>
    </header>
    <ul class="topic-tool-list">
${items}
    </ul>
  </div>
</section>
<style>
.topic-tool-card--course .topic-tool-eyebrow{display:block;font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--teal);font-weight:600;margin-bottom:6px}
</style>
<!-- topic-course-rail:end -->`;
}

let changed = 0;
let skipped = 0;

const TARGETS = [];
for (const root of [['en', 'learn/topics'], ['es', 'es/learn/topics']]) {
  const [locale, dir] = root;
  const full = path.join(repoRoot, dir);
  if (!fs.existsSync(full)) continue;
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
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
      const idx = src.indexOf(ESSAY_ANCHOR);
      if (idx === -1) {
        const closeMain = src.indexOf('</main>');
        if (closeMain === -1) { skipped++; continue; }
        next = src.slice(0, closeMain) + block + '\n\n' + src.slice(closeMain);
      } else {
        next = src.slice(0, idx) + block + '\n\n' + src.slice(idx);
      }
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

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} topic page(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
