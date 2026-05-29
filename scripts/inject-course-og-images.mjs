#!/usr/bin/env node
/**
 * Stamp og:image + twitter:image meta tags into every Open the
 * Doors bootcamp page that doesn't have them — module overviews,
 * lesson pages, and any other course page missing social card art.
 *
 * Mapping
 * -------
 * Module overview pages (course/m1-orient/, m2-decide/, etc.) get
 * their dedicated card (brand/og/course-m1-orient.png).
 *
 * Lesson pages share their parent module's OG card — when a
 * listener tweets "I just finished Lesson 8 menu", the Twitter
 * preview shows the Module 3 (Assemble) card with the lesson
 * title in the tweet body. Cheaper to maintain (8 cards instead
 * of 48) and equally effective for organic social CTR.
 *
 * Hub page (course/index.html) and the L14 generator + ES
 * mirrors already have og:image stamped manually — those are
 * skipped.
 *
 * Insertion anchor: right after the last og:* meta in <head>.
 * Sentinel-bracketed so the injector can refresh idempotently.
 *
 * Usage:
 *   node scripts/inject-course-og-images.mjs           # rewrite
 *   node scripts/inject-course-og-images.mjs --check   # exit 1 if drift
 *   node scripts/inject-course-og-images.mjs --dry-run # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const MANIFEST_PATH = path.join(repoRoot, 'data', 'course-lessons.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

const SENTINEL_START = '<!-- course-og-image:start -->';
const SENTINEL_END   = '<!-- course-og-image:end -->';
const SENTINEL_RE    = /\n?\s*<!-- course-og-image:start -->[\s\S]*?<!-- course-og-image:end -->\n?/;

// Anchor: right before </head>. Idempotent.
const ANCHOR_RE = /(\n<\/head>)/;

function moduleIdFromPath(lessonPath) {
  // e.g. "/course/m1-orient/welcome/" → "m1-orient"
  // e.g. "/course/m4-launch/generator/" → "m4-launch"
  const m = lessonPath.match(/\/course\/([^\/]+)\//);
  return m ? m[1] : null;
}

function buildBlock(moduleId, locale, lessonTitle) {
  const suffix = locale === 'es' ? '-es' : '';
  const cardSlug = `course-${moduleId}${suffix}`;
  const url = `https://muntin.digital/brand/og/${cardSlug}.png`;
  // OG card alt text — descriptive of the artifact (module + course).
  // Locale-aware copy so screen readers in ES get ES.
  const altMap = {
    en: {
      'm1-orient':   'Open the Doors · Module 1 · Orient — what you’re actually building',
      'm2-decide':   'Open the Doors · Module 2 · Decide — the eight decisions that shape the site',
      'm3-assemble': 'Open the Doors · Module 3 · Assemble — the operator paperwork',
      'm4-launch':   'Open the Doors · Module 4 · Launch — generate, deploy, keep alive'
    },
    es: {
      'm1-orient':   'Abre las puertas · Módulo 1 · Orientar — qué estás construyendo realmente',
      'm2-decide':   'Abre las puertas · Módulo 2 · Decidir — las ocho decisiones que dan forma al sitio',
      'm3-assemble': 'Abre las puertas · Módulo 3 · Ensamblar — el papeleo del operador',
      'm4-launch':   'Abre las puertas · Módulo 4 · Lanzar — generar, desplegar, mantener vivo'
    }
  };
  const alt = (altMap[locale] && altMap[locale][moduleId]) || lessonTitle || 'Open the Doors bootcamp';

  return [
    SENTINEL_START,
    `<meta property="og:image" content="${url}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="${alt}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:image" content="${url}" />`,
    `<meta name="twitter:image:alt" content="${alt}" />`,
    SENTINEL_END
  ].join('\n');
}

function alreadyHasOgImage(src) {
  // Skip pages that already declared og:image themselves (hub,
  // possibly L14, possibly accessibility). The sentinel test wins.
  // If there's an og:image declaration OUTSIDE the sentinel, we
  // assume the page wants to manage it manually.
  const stripSentinel = src.replace(SENTINEL_RE, '');
  return /<meta property="og:image"/i.test(stripSentinel);
}

function transform(src, moduleId, locale, lessonTitle) {
  const block = buildBlock(moduleId, locale, lessonTitle);
  if (SENTINEL_RE.test(src)) {
    const next = src.replace(SENTINEL_RE, '\n' + block + '\n');
    return next === src ? null : next;
  }
  if (alreadyHasOgImage(src)) return null;  // manual og:image — leave alone
  if (!ANCHOR_RE.test(src))   return undefined;
  return src.replace(ANCHOR_RE, '\n' + block + '$1');
}

function lessonHtmlPath(lesson, locale) {
  const rel = lesson.path.replace(/^\//, '').replace(/\/$/, '');
  const base = locale === 'es' ? path.join(repoRoot, 'es', rel) : path.join(repoRoot, rel);
  return path.join(base, 'index.html');
}

const MODULE_PAGES = [
  { path: 'course/m1-orient/index.html',   moduleId: 'm1-orient',   locale: 'en' },
  { path: 'course/m2-decide/index.html',   moduleId: 'm2-decide',   locale: 'en' },
  { path: 'course/m3-assemble/index.html', moduleId: 'm3-assemble', locale: 'en' },
  { path: 'course/m4-launch/index.html',   moduleId: 'm4-launch',   locale: 'en' },
  { path: 'es/course/m1-orient/index.html',   moduleId: 'm1-orient',   locale: 'es' },
  { path: 'es/course/m2-decide/index.html',   moduleId: 'm2-decide',   locale: 'es' },
  { path: 'es/course/m3-assemble/index.html', moduleId: 'm3-assemble', locale: 'es' },
  { path: 'es/course/m4-launch/index.html',   moduleId: 'm4-launch',   locale: 'es' }
];

let stamped = 0;
let unchanged = 0;
let skipped = 0;
const noAnchor = [];

function processFile(filePath, moduleId, locale, lessonTitle) {
  if (!fs.existsSync(filePath)) { skipped++; return; }
  const src = fs.readFileSync(filePath, 'utf8');
  const result = transform(src, moduleId, locale, lessonTitle);
  if (result === null) { unchanged++; return; }
  if (result === undefined) { noAnchor.push(path.relative(repoRoot, filePath)); return; }
  stamped++;
  if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
}

// Module overview pages
for (const m of MODULE_PAGES) {
  processFile(path.join(repoRoot, m.path), m.moduleId, m.locale, null);
}

// Lesson pages
for (const lesson of manifest.lessons) {
  const moduleId = moduleIdFromPath(lesson.path);
  if (!moduleId) continue;
  for (const locale of ['en', 'es']) {
    const filePath = lessonHtmlPath(lesson, locale);
    const titleField = lesson.title && (lesson.title[locale] || lesson.title.en);
    processFile(filePath, moduleId, locale, titleField);
  }
}

if (noAnchor.length) {
  console.warn(`\ninject-course-og-images: ${noAnchor.length} page(s) missing the </head> anchor — skipped:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
  if (noAnchor.length > 5) console.warn(`  …and ${noAnchor.length - 5} more`);
}

console.log(`inject-course-og-images: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped, ${noAnchor.length} no-anchor.`);

if (checkOnly && stamped > 0) {
  console.error(`inject-course-og-images: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
