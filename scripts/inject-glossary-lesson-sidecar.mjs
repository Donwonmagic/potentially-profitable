#!/usr/bin/env node
/**
 * Per-glossary-term sidecar: "First introduced in Lesson N" rail
 * that points each anchored term at the bootcamp lesson where the
 * concept is practiced. Modeled on inject-glossary-tool-sidecar.mjs
 * but operates per-term rather than on the glossary index.
 *
 * Data source: data/glossary-course-anchors.json — only terms with
 * an entry get a sidecar; unanchored terms are silently skipped.
 * Keeps the cardinality bounded (~25–30 terms) so the SEO surface
 * targets terms where the course meaningfully teaches the concept,
 * not every term in the library.
 *
 * Insertion anchor: right before </main>. Sentinel-bracketed for
 * idempotent refresh; placed AFTER any glossary-knit rail so the
 * existing rail keeps its position.
 *
 * Net new internal links into /course/: ~25 EN + ~25 ES = ~50
 * contextual links from high-PageRank glossary surfaces.
 *
 *   node scripts/inject-glossary-lesson-sidecar.mjs           # rewrite
 *   node scripts/inject-glossary-lesson-sidecar.mjs --check   # exit 1 on diff
 *   node scripts/inject-glossary-lesson-sidecar.mjs --dry-run # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const ANCHORS_PATH = path.join(repoRoot, 'data', 'glossary-course-anchors.json');
const anchorsFile  = JSON.parse(fs.readFileSync(ANCHORS_PATH, 'utf8'));
const anchors      = anchorsFile.anchors || {};

const SENTINEL_RE = /\n?\s*<!-- glossary-lesson-sidecar:start -->[\s\S]*?<!-- glossary-lesson-sidecar:end -->\n?/;
const ANCHOR_RE   = /(\n<\/main>)/;

function lessonPath(anchor, locale) {
  // Bootcamp manifest uses module-prefixed paths. The track-aware
  // forks (fresh/rebuild) get the fresh path by default since
  // anchors that are fresh-only (e.g., photo-brief, GBP from
  // scratch) carry an explicit "track":"fresh" field.
  const track = anchor.track === 'fresh' ? '/fresh' : '';
  const root  = locale === 'es' ? '/es/course/' : '/course/';
  // The L11/L9 fresh-track lessons live at module/fresh/<slug>/.
  // For all others, module/<slug>/.
  if (anchor.track === 'fresh') {
    return `${root}${anchor.module}${track}/${anchor.lesson}/`;
  }
  return `${root}${anchor.module}/${anchor.lesson}/`;
}

function buildBlock(termSlug, anchor, locale) {
  const url   = lessonPath(anchor, locale);
  const title = locale === 'es' ? anchor.title_es : anchor.title_en;
  const eyebrow = locale === 'es'
    ? `LECCIÓN ${anchor.position} · MÓDULO · ${anchor.module.replace('m', 'M').replace('-', ' ').toUpperCase()}`
    : `LESSON ${anchor.position} · MODULE · ${anchor.module.replace('m', 'M').replace('-', ' ').toUpperCase()}`;
  const heading = locale === 'es' ? 'Practica este concepto en el bootcamp' : 'Practice this in the bootcamp';
  const intro = locale === 'es'
    ? `Esta palabra aparece en la práctica en la Lección ${anchor.position} de Open the Doors — donde la usas para construir tu propio sitio, no solo para definirla.`
    : `This term shows up in practice in Lesson ${anchor.position} of Open the Doors — where you use it to build your own site, not just define it.`;
  const cta = locale === 'es'
    ? `Ir a la Lección ${anchor.position} →`
    : `Open Lesson ${anchor.position} →`;

  return [
    '<!-- glossary-lesson-sidecar:start -->',
    '<aside class="gloss-lesson-sidecar" aria-labelledby="gls-h-' + termSlug + '">',
    '  <p class="gls-eyebrow">' + eyebrow + '</p>',
    '  <h2 class="gls-h" id="gls-h-' + termSlug + '"><a href="' + url + '">' + title + '</a></h2>',
    '  <p class="gls-intro">' + intro + '</p>',
    '  <p class="gls-cta"><a href="' + url + '">' + cta + '</a></p>',
    '</aside>',
    '<style>',
    '.gloss-lesson-sidecar{margin:32px 0 24px;padding:22px 26px;border:1px solid var(--line);border-radius:14px;background:var(--cream);max-width:680px}',
    '.gloss-lesson-sidecar .gls-eyebrow{font-size:11.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stone);font-weight:600;margin:0 0 10px}',
    '.gloss-lesson-sidecar .gls-h{font-family:var(--font-display);font-weight:500;font-size:20px;line-height:1.25;margin:0 0 10px;color:var(--ink)}',
    '.gloss-lesson-sidecar .gls-h a{color:var(--ink);text-decoration:none;background:linear-gradient(to right,var(--teal),var(--teal)) no-repeat 0 100%/100% 1px}',
    '.gloss-lesson-sidecar .gls-h a:hover{color:var(--teal-dark)}',
    '.gloss-lesson-sidecar .gls-intro{font-size:15px;color:var(--ink-soft);line-height:1.55;margin:0 0 12px}',
    '.gloss-lesson-sidecar .gls-cta{margin:0;font-size:14.5px;font-weight:600}',
    '.gloss-lesson-sidecar .gls-cta a{color:var(--teal-dark);text-decoration:none}',
    '.gloss-lesson-sidecar .gls-cta a:hover{text-decoration:underline}',
    '</style>',
    '<!-- glossary-lesson-sidecar:end -->'
  ].join('\n');
}

function transform(src, termSlug, anchor, locale) {
  const block = buildBlock(termSlug, anchor, locale);
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

for (const [termSlug, anchor] of Object.entries(anchors)) {
  if (termSlug.startsWith('_')) continue;
  for (const locale of ['en', 'es']) {
    const filePath = locale === 'es'
      ? path.join(repoRoot, 'es', 'glossary', termSlug, 'index.html')
      : path.join(repoRoot, 'glossary', termSlug, 'index.html');
    if (!fs.existsSync(filePath)) { skipped++; continue; }
    const src = fs.readFileSync(filePath, 'utf8');
    const result = transform(src, termSlug, anchor, locale);
    if (result === null) { unchanged++; continue; }
    if (result === undefined) { noAnchor.push(path.relative(repoRoot, filePath)); continue; }
    stamped++;
    if (!checkOnly && !dryRun) fs.writeFileSync(filePath, result);
  }
}

if (noAnchor.length) {
  console.warn(`\ninject-glossary-lesson-sidecar: ${noAnchor.length} page(s) missing </main> anchor:`);
  for (const f of noAnchor.slice(0, 5)) console.warn(`  ${f}`);
}

console.log(`inject-glossary-lesson-sidecar: ${stamped} stamped, ${unchanged} unchanged, ${skipped} skipped (term missing).`);

if (checkOnly && stamped > 0) {
  console.error(`inject-glossary-lesson-sidecar: ${stamped} file(s) would change under --check (exit 1).`);
  process.exit(1);
}
process.exit(0);
