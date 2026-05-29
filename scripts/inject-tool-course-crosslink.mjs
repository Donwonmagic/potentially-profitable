#!/usr/bin/env node
/**
 * Stamp a "Related Open the Doors lesson" callout into high-traffic
 * tool pages where the tool maps cleanly to a specific bootcamp
 * lesson. SEO purpose: every operator landing on a tool from
 * organic search discovers the course as the "full-depth" path,
 * and internal-link equity flows from tool to course.
 *
 * Mapping (tool slug → course lesson):
 *   brand-suite        → L7 Palette + voice
 *   menu-engineering   → L8 Menu + plate-cost loop
 *   plate-cost         → L8 Menu + plate-cost loop
 *   seo-grader         → L12 Local SEO anchors
 *   gbp-grader         → L11a/b GBP
 *   store-hours        → L10 Hours + holidays + contact
 *   photo-brief        → L9a/b Photo brief
 *
 * Insertion anchor: right before the data-promise rail at the
 * bottom of every tool page. Sentinel-bracketed for idempotent
 * refresh.
 *
 * Usage:
 *   node scripts/inject-tool-course-crosslink.mjs           # rewrite
 *   node scripts/inject-tool-course-crosslink.mjs --check   # exit 1 if drift
 *   node scripts/inject-tool-course-crosslink.mjs --dry-run # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const SENTINEL_START = '<!-- tool-course-crosslink:start -->';
const SENTINEL_END   = '<!-- tool-course-crosslink:end -->';
const SENTINEL_RE    = /\n?\s*<!-- tool-course-crosslink:start -->[\s\S]*?<!-- tool-course-crosslink:end -->\n?/;

// Insert anchor: before </main>. Tool pages all have <main>...</main>.
const ANCHOR_RE = /(\n\s*<\/main>)/;

// Tool → lesson mapping. Each entry produces one callout HTML block.
const MAPPING = [
  {
    tool: 'brand-suite',
    lessonPath: '/course/m2-decide/palette-voice/',
    lessonNum: 7,
    moduleEn: 'Decide',
    moduleEs: 'Decidir',
    titleEn: 'Palette + voice',
    titleEs: 'Paleta + voz',
    introEn: 'This tool gives you a palette and a voice in 5 minutes. The bootcamp lesson takes you further — locking the palette across your home page, menu, contact page, and Google Business Profile so every customer touchpoint looks like one brand.',
    introEs: 'Esta herramienta te da una paleta y una voz en 5 minutos. La lección del bootcamp te lleva más lejos — fijando la paleta en toda tu página de inicio, menú, página de contacto y Perfil de Negocio de Google para que cada punto de contacto se vea como una sola marca.'
  },
  {
    tool: 'menu-engineering',
    lessonPath: '/course/m3-assemble/menu/',
    lessonNum: 8,
    moduleEn: 'Assemble',
    moduleEs: 'Ensamblar',
    titleEn: 'Menu + plate-cost loop',
    titleEs: 'Menú + ciclo de costo por plato',
    introEn: 'You graded your menu here. The bootcamp lesson reorders it, picks the 8 dishes that ship on your site, and feeds them into the live preview so you can see the menu page take shape as you decide.',
    introEs: 'Calificaste tu menú aquí. La lección del bootcamp lo reordena, elige los 8 platos que van en tu sitio, y los alimenta a la vista previa en vivo para que veas cómo toma forma la página del menú mientras decides.'
  },
  {
    tool: 'plate-cost',
    lessonPath: '/course/m3-assemble/menu/',
    lessonNum: 8,
    moduleEn: 'Assemble',
    moduleEs: 'Ensamblar',
    titleEn: 'Menu + plate-cost loop',
    titleEs: 'Menú + ciclo de costo por plato',
    introEn: 'Once you have plate costs per dish, the bootcamp menu lesson uses them to choose which 8 dishes go on your site — the high-margin ones that actually pay rent.',
    introEs: 'Una vez que tienes los costos por plato, la lección del menú del bootcamp los usa para elegir qué 8 platos van en tu sitio — los de margen alto que realmente pagan la renta.'
  },
  {
    tool: 'seo-grader',
    lessonPath: '/course/m4-launch/local-seo/',
    lessonNum: 12,
    moduleEn: 'Launch',
    moduleEs: 'Lanzar',
    titleEn: 'Local SEO anchors',
    titleEs: 'Anclas de SEO local',
    introEn: 'This grader scores your URL. The bootcamp local-SEO lesson builds the page — neighborhood keywords, cuisine anchors, Google Maps embed, schema markup — so the next time you grade, every score is green.',
    introEs: 'Este graduador califica tu URL. La lección de SEO local del bootcamp construye la página — palabras clave de barrio, anclas de cocina, embed de Google Maps, marcado schema — para que la próxima vez que califiques, cada puntaje esté en verde.'
  },
  {
    tool: 'gbp-grader',
    lessonPath: '/course/m3-assemble/fresh/gbp/',
    lessonPathRebuild: '/course/m3-assemble/rebuild/gbp/',
    lessonNum: 11,
    moduleEn: 'Assemble',
    moduleEs: 'Ensamblar',
    titleEn: 'Google Business Profile',
    titleEs: 'Perfil de Negocio de Google',
    introEn: 'You graded your GBP here. The bootcamp lesson takes you through the 9 fields that move the score — primary category, description, attributes, photos, opening date — and pairs each with the matching update on your site so they stay in sync.',
    introEs: 'Calificaste tu GBP aquí. La lección del bootcamp te lleva por los 9 campos que mueven el puntaje — categoría primaria, descripción, atributos, fotos, fecha de apertura — y empareja cada uno con la actualización correspondiente en tu sitio para que se mantengan sincronizados.'
  },
  {
    tool: 'store-hours',
    lessonPath: '/course/m3-assemble/hours-contact/',
    lessonNum: 10,
    moduleEn: 'Assemble',
    moduleEs: 'Ensamblar',
    titleEn: 'Hours + holidays + contact',
    titleEs: 'Horarios + feriados + contacto',
    introEn: 'You built your hours here. The bootcamp lesson takes the same hours grid and threads it through the contact page, the GBP card, and the holiday-hours block — one source of truth, three places it shows up.',
    introEs: 'Construiste tus horarios aquí. La lección del bootcamp toma la misma cuadrícula de horarios y la pasa por la página de contacto, la tarjeta GBP, y el bloque de horarios de feriados — una sola fuente de verdad, tres lugares donde aparece.'
  },
  {
    tool: 'photo-brief',
    lessonPath: '/course/m3-assemble/fresh/photos/',
    lessonPathRebuild: '/course/m3-assemble/rebuild/photos/',
    lessonNum: 9,
    moduleEn: 'Assemble',
    moduleEs: 'Ensamblar',
    titleEn: 'Photo brief from scratch',
    titleEs: 'Brief de fotos desde cero',
    introEn: 'This builder gives you the brief. The bootcamp lesson shows you which shots go on which page (hero, menu, about), how to direct the photographer, and what to do if you can\'t hire one — phone shots that look professional.',
    introEs: 'Este creador te da el brief. La lección del bootcamp te muestra qué tomas van en qué página (hero, menú, acerca de), cómo dirigir al fotógrafo, y qué hacer si no puedes contratar uno — fotos de teléfono que se ven profesionales.'
  }
];

function buildBlock(entry, locale) {
  const lessonPath = locale === 'es'
    ? `/es${entry.lessonPath}`
    : entry.lessonPath;
  const moduleLabel = locale === 'es' ? entry.moduleEs : entry.moduleEn;
  const titleLabel  = locale === 'es' ? entry.titleEs  : entry.titleEn;
  const intro       = locale === 'es' ? entry.introEs  : entry.introEn;
  const eyebrowText = locale === 'es'
    ? `LECCIÓN ${entry.lessonNum} · MÓDULO · ${moduleLabel.toUpperCase()}`
    : `LESSON ${entry.lessonNum} · MODULE · ${moduleLabel.toUpperCase()}`;
  const ctaText = locale === 'es'
    ? `Continúa en la Lección ${entry.lessonNum} →`
    : `Continue at Lesson ${entry.lessonNum} →`;
  const lessonLabel = locale === 'es'
    ? `Lección ${entry.lessonNum}: ${titleLabel}`
    : `Lesson ${entry.lessonNum}: ${titleLabel}`;
  const partOfPath = locale === 'es' ? 'Open the Doors' : 'Open the Doors';
  const partOfHref = locale === 'es' ? '/es/course/' : '/course/';

  return [
    SENTINEL_START,
    '<aside class="tool-course-crosslink" aria-labelledby="tcx-h">',
    '  <p class="tcx-eyebrow">' + eyebrowText + '</p>',
    '  <h3 class="tcx-h" id="tcx-h"><a href="' + lessonPath + '">' + lessonLabel + '</a></h3>',
    '  <p class="tcx-intro">' + intro + '</p>',
    '  <p class="tcx-cta"><a href="' + lessonPath + '">' + ctaText + '</a>',
    '     <span class="tcx-divider">·</span>',
    '     <a class="tcx-context" href="' + partOfHref + '">' + (locale === 'es' ? 'el bootcamp completo' : 'the full bootcamp') + '</a></p>',
    '</aside>',
    '<style>',
    '.tool-course-crosslink{margin:40px 0 24px;padding:24px 28px;border:1px solid var(--line);border-radius:14px;background:var(--cream);max-width:680px}',
    '.tool-course-crosslink .tcx-eyebrow{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stone);font-weight:600;margin:0 0 10px}',
    '.tool-course-crosslink .tcx-h{font-family:var(--font-display);font-weight:500;font-size:21px;line-height:1.25;margin:0 0 10px;color:var(--ink)}',
    '.tool-course-crosslink .tcx-h a{color:var(--ink);text-decoration:none;background:linear-gradient(to right,var(--teal),var(--teal)) no-repeat 0 100%/100% 1px}',
    '.tool-course-crosslink .tcx-h a:hover{color:var(--teal-dark)}',
    '.tool-course-crosslink .tcx-intro{font-size:15.5px;color:var(--ink-soft);line-height:1.55;margin:0 0 14px}',
    '.tool-course-crosslink .tcx-cta{margin:0;font-size:14.5px;font-weight:600;color:var(--teal-dark)}',
    '.tool-course-crosslink .tcx-cta a{color:var(--teal-dark);text-decoration:none}',
    '.tool-course-crosslink .tcx-cta a:hover{text-decoration:underline}',
    '.tool-course-crosslink .tcx-divider{color:var(--stone);margin:0 8px;font-weight:400}',
    '.tool-course-crosslink .tcx-context{font-weight:500}',
    '</style>',
    SENTINEL_END
  ].join('\n');
}

function transform(src, entry, locale) {
  const block = buildBlock(entry, locale);
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (!ANCHOR_RE.test(src)) return undefined;
  return src.replace(ANCHOR_RE, '\n' + block + '$1');
}

let stamped = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

for (const entry of MAPPING) {
  for (const locale of ['en', 'es']) {
    const filePath = locale === 'es'
      ? path.join(repoRoot, 'es', 'tools', entry.tool, 'index.html')
      : path.join(repoRoot, 'tools', entry.tool, 'index.html');
    if (!fs.existsSync(filePath)) { skipped++; continue; }
    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, entry, locale);
    if (result === null) { unchanged++; continue; }
    if (result === undefined) { noAnchor.push(path.relative(repoRoot, filePath)); continue; }
    stamped++;
    if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
  }
}

if (noAnchor.length) {
  console.warn(`\ninject-tool-course-crosslink: ${noAnchor.length} page(s) missing </main> anchor:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
}

console.log(`inject-tool-course-crosslink: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped, ${noAnchor.length} no-anchor.`);

if (checkOnly && stamped > 0) {
  console.error(`inject-tool-course-crosslink: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
