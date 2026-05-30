#!/usr/bin/env node
/**
 * Course lesson skeleton generator — emits the EN + ES HTML stubs for a
 * new bootcamp lesson, wired to data/course-lessons.json for prev/next
 * navigation, breadcrumbs, and module metadata.
 *
 * Usage:
 *   node scripts/new-course-lesson.mjs <lesson-id>
 *
 * The <lesson-id> must already exist in data/course-lessons.json — that
 * file is the single source of truth for course ordering, titles, and
 * widget composition. This script reads from it; it doesn't write to it.
 *
 * Example:
 *   node scripts/new-course-lesson.mjs customer
 *   → wrote: course/m2-decide/customer/index.html
 *   → wrote: es/course/m2-decide/customer/index.html
 *
 * After running:
 *   1. Fill in the body content (the stub has a clearly-marked TODO).
 *   2. Translate the ES copy (the stub starts as a marked translation of EN).
 *   3. Run: node scripts/sync-includes.mjs
 *   4. Run: node scripts/stamp-hreflang.mjs
 *   5. Run: node scripts/build-sitemap.mjs
 *
 * The stub follows the canonical lesson template documented in
 * /root/.claude/plans/i-want-to-design-piped-diffie.md §Architecture.1.
 * Hero, breadcrumb, course-body, course-widget slots, template card,
 * cross-links, takeaways, pager, save-strip — all stubbed.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const lessonId = process.argv[2];
if (!lessonId) {
  console.error('Usage: node scripts/new-course-lesson.mjs <lesson-id>');
  console.error('  e.g. node scripts/new-course-lesson.mjs customer');
  console.error('');
  console.error('The <lesson-id> must exist in data/course-lessons.json.');
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'course-lessons.json'), 'utf8'));
const lesson = manifest.lessons.find((l) => l.id === lessonId);
if (!lesson) {
  console.error(`Lesson "${lessonId}" not found in data/course-lessons.json.`);
  console.error('Add it there first, then re-run this script.');
  process.exit(2);
}

const moduleMeta = manifest.modules.find((m) => m.id === lesson.module);
if (!moduleMeta) {
  console.error(`Module "${lesson.module}" referenced by lesson "${lessonId}" not found in manifest.`);
  process.exit(2);
}

// Compute prev/next lessons by ordinal position. Lessons with the same
// position but different tracks are siblings, not predecessors of each
// other. Track-aware traversal: for a shared lesson, prev/next are the
// nearest shared OR track-specific lesson at adjacent positions; for a
// fresh-track lesson, walk through other fresh or shared lessons; same
// for rebuild. The scaffolder picks the simplest behavior: use the
// previous/next position regardless of track, and the operator's UI
// can refine this later in course-progress.js.
const sorted = [...manifest.lessons].sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
const idx = sorted.indexOf(lesson);
const prev = idx > 0 ? sorted[idx - 1] : null;
const next = idx < sorted.length - 1 ? sorted[idx + 1] : null;

// Build a clean URL path string from a lesson (or null).
function pathOf(l) { return l ? l.path : null; }

const titleEN = lesson.title.en;
const titleES = lesson.title.es;
const slug = lesson.id;
const moduleId = lesson.module;
const moduleTitleEN = moduleMeta.title.en;
const moduleTitleES = moduleMeta.title.es;

// Output directory for EN: course/<module>/[<track>/]<slug>/
// Output directory for ES: es/course/<module>/[<track>/]<slug>/
// The track prefix only applies for fresh/rebuild lessons; shared
// lessons sit directly under the module.
const trackSeg = (lesson.track && lesson.track !== 'shared') ? `${lesson.track}/` : '';
const enDir = path.join(REPO, 'course', moduleId, trackSeg, slug);
const esDir = path.join(REPO, 'es', 'course', moduleId, trackSeg, slug);

function widgetBlocks(widgets) {
  if (!Array.isArray(widgets) || !widgets.length) return '';
  return widgets.map((w) => `
      <section class="course-widget" data-widget="${w}" aria-label="Workshop widget: ${w}">
        <!-- Workshop Kit engine mounts the ${w} widget here -->
      </section>`).join('\n');
}

function makeHtml({ locale, title, moduleTitle }) {
  const isES = locale === 'es';
  const canonicalPath = isES
    ? `/es/course/${moduleId}/${trackSeg}${slug}/`
    : `/course/${moduleId}/${trackSeg}${slug}/`;
  const canonicalUrl = `https://muntin.digital${canonicalPath}`;
  const altPath = isES
    ? canonicalPath.replace(/^\/es\//, '/')
    : `/es${canonicalPath}`;
  const altUrl = `https://muntin.digital${altPath}`;
  const ogLocale = isES ? 'es_ES' : 'en_US';
  const ogLocaleAlt = isES ? 'en_US' : 'es_US';
  const inLang = isES ? 'es-ES' : 'en-US';

  const homeLabel  = isES ? 'Inicio' : 'Home';
  const homeHref   = isES ? '/es/' : '/';
  const courseLabel = isES ? 'Curso' : 'Course';
  const courseHref  = isES ? '/es/course/' : '/course/';
  const skipLink = isES ? 'Saltar al contenido principal' : 'Skip to main content';
  const markCompleteLabel = isES ? 'Marcar como completada' : 'Mark complete';
  const nextLabel = isES ? 'Siguiente' : 'Next';
  const prevLabel = isES ? 'Anterior' : 'Previous';
  const timeLabel = isES ? `~${lesson.estimatedMinutes} min` : `~${lesson.estimatedMinutes} min`;
  const positionLabel = isES
    ? `Módulo ${moduleMeta.position} · Lección ${lesson.position} de ${manifest.totalLessons}`
    : `Module ${moduleMeta.position} · Lesson ${lesson.position} of ${manifest.totalLessons}`;
  const trackBadge = lesson.track === 'fresh'
    ? (isES ? 'Recién abriendo' : 'Pre-opening')
    : lesson.track === 'rebuild'
      ? (isES ? 'Rehaciendo' : 'Rebuilding')
      : (isES ? 'Compartida' : 'Shared');
  const railLabel = isES ? 'Tu sitio hasta ahora' : 'Your site so far';
  const todoLabel = isES ? 'TODO — escribe el cuerpo de la lección aquí.' : 'TODO — write the lesson body here.';
  const takeawaysLabel = isES ? 'Lo que tienes ahora' : 'What you have now';
  const pairsLabel = isES ? 'Combina con' : 'Pairs with';
  const saveLabel = isES
    ? 'Inicia sesión y tu progreso sincroniza entre dispositivos. Opcional — todo funciona sin cuenta.'
    : 'Sign in and your progress syncs across devices. Optional — everything works without an account.';

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${title} | Muntin Digital</title>
<meta name="description" content="${title} — ${moduleTitle}, Lesson ${lesson.position} of the Open the Doors bootcamp." />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${canonicalUrl}" />
<!-- i18n:hreflang START (generated by scripts/stamp-hreflang.mjs) -->
<link rel="alternate" hreflang="en" href="https://muntin.digital${isES ? altPath : canonicalPath}" />
<link rel="alternate" hreflang="es" href="https://muntin.digital${isES ? canonicalPath : altPath}" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital${isES ? altPath : canonicalPath}" />
<meta property="og:locale" content="${ogLocale}" />
<meta property="og:locale:alternate" content="${ogLocaleAlt}" />
<!-- i18n:hreflang END -->

<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="Muntin Digital" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "LearningResource",
      "name": ${JSON.stringify(title)},
      "url": "${canonicalUrl}",
      "inLanguage": "${inLang}",
      "learningResourceType": "Lesson",
      "educationalLevel": "Beginner",
      "isPartOf": { "@id": "https://muntin.digital/course/#course" },
      "position": ${lesson.position},
      "timeRequired": "PT${lesson.estimatedMinutes}M"
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": ${JSON.stringify(homeLabel)}, "item": "https://muntin.digital${homeHref}" },
        { "@type": "ListItem", "position": 2, "name": ${JSON.stringify(courseLabel)}, "item": "https://muntin.digital${courseHref}" },
        { "@type": "ListItem", "position": 3, "name": ${JSON.stringify(moduleTitle)}, "item": "https://muntin.digital${courseHref}${moduleId}/" },
        { "@type": "ListItem", "position": 4, "name": ${JSON.stringify(title)}, "item": "${canonicalUrl}" }
      ]
    }
  ]
}
</script>

<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/fraunces-variable-latin-wght-normal.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="/assets/fonts/inter-variable-latin-wght-normal.woff2" crossorigin>
<link rel="preload" as="style" href="/assets/site-core.css" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css"><link rel="stylesheet" href="/assets/site-article.css"></noscript>

<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--teal-dark:#1F3A93;--stone:#6B7280;--line:#E3E5E9;--status-good:#2E7D5B;--max:1200px;--pad-x:clamp(20px,4vw,64px);--font-display:'Fraunces','Fraunces Fallback',Georgia,'Times New Roman',serif;--font-body:'Inter','Inter Fallback',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:var(--font-body);color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px}
h1,h2,h3,h4,h5,.serif-italic{font-family:var(--font-display)}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#16181D;color:#F6F7F8;padding:12px 16px;z-index:100}
a{color:inherit}
header.nav{min-height:64px}
main{padding-top:64px}

/* Course lesson layout — these rules will hoist into site-course.css
   when the shell extraction lands in P1. */
.course-layout{display:grid;gap:32px;padding:32px 0 80px}
@media (min-width:980px){.course-layout{grid-template-columns:minmax(0,720px) minmax(0,360px);gap:48px}}
.course-hero{padding:60px 0 8px}
.course-hero .eyebrow{font-size:12.5px;letter-spacing:.12em;text-transform:uppercase;color:var(--stone);font-weight:600;margin:0 0 12px}
.course-hero .track-badge{display:inline-block;font-size:10px;letter-spacing:.12em;text-transform:uppercase;font-weight:700;padding:3px 8px;border-radius:99px;background:var(--cream-2);color:var(--ink-soft);margin-left:8px}
.course-hero h1{font-size:clamp(32px,4.5vw,46px);font-weight:500;line-height:1.05;letter-spacing:-.3px;margin:0 0 16px}
.course-progress{margin-top:20px}
.course-progress progress{width:100%;height:6px;border-radius:3px;overflow:hidden}
.course-body p{margin:0 0 18px;font-size:17.5px;line-height:1.6}
.course-body h2{margin:32px 0 14px;font-size:24px;font-weight:500;line-height:1.2}
.course-callout{padding:18px 22px;background:var(--cream-2);border-left:3px solid var(--teal);border-radius:8px;margin:24px 0;font-size:15.5px;line-height:1.55}
.course-callout--tip{border-left-color:var(--teal)}
.course-widget{margin:32px 0;display:block}
.course-template{margin:32px 0;padding:24px;border:1px solid var(--line);border-radius:8px;background:var(--cream-2)}
.course-template h2{margin:0 0 8px;font-size:18px;font-weight:600;font-family:var(--font-body)}
.course-template p{margin:0 0 14px;font-size:14.5px;color:var(--ink-soft)}
.course-template a{display:inline-block;padding:10px 20px;background:var(--ink);color:var(--cream);text-decoration:none;border-radius:99px;font-size:14px;font-weight:600}
.course-cross-links{margin:48px 0 0;padding:24px;background:var(--cream-2);border-radius:8px}
.course-cross-links h2{margin:0 0 12px;font-size:15px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--stone);font-family:var(--font-body)}
.course-cross-links ul{margin:0;padding-left:18px;font-size:15px;line-height:1.7}
.course-takeaways{margin:48px 0 0;padding:24px;border:1px solid var(--teal);border-radius:8px;background:var(--cream)}
.course-takeaways h2{margin:0 0 10px;font-size:18px;font-weight:600;font-family:var(--font-body);color:var(--teal-dark)}
.course-takeaways ul{margin:0;padding-left:20px;font-size:15.5px;line-height:1.6}
.course-pager{display:flex;justify-content:space-between;align-items:center;gap:16px;margin:48px 0 0;padding:24px 0;border-top:1px solid var(--line);flex-wrap:wrap}
.course-pager a{font-size:15px;color:var(--teal);text-decoration:none;font-weight:600}
.course-pager button{padding:11px 24px;background:var(--ink);color:var(--cream);border:0;border-radius:99px;font-size:14.5px;font-weight:600;cursor:pointer}
.course-save-strip{margin:24px 0 0;padding:16px 20px;background:var(--cream-2);border-radius:8px;font-size:14px;color:var(--ink-soft);display:none}
.course-save-strip.visible{display:block}
.course-rail{position:sticky;top:80px;align-self:start;border:1px solid var(--line);border-radius:8px;padding:20px;background:var(--cream-2);max-height:calc(100vh - 100px);overflow-y:auto}
.course-rail h2{margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:.1em;color:var(--stone);font-family:var(--font-body)}
.term-link{text-decoration:underline;text-decoration-style:dotted;text-decoration-thickness:1px;text-underline-offset:3px;color:inherit}
.term-link:hover{text-decoration-style:solid;color:var(--teal)}
@media (max-width:979px){.course-rail{position:static;max-height:none}}
</style>
</head>
<body
  data-page="course-lesson"
  data-course-track="${lesson.track}"
  data-course-module="${moduleId}"
  data-course-lesson="${slug}"
  data-course-position="${lesson.position}"
  data-course-total="${manifest.totalLessons}">

<a class="skip-link" href="#main">${skipLink}</a>

<header class="nav" id="nav"><!-- sync-includes.mjs replaces this --></header>

<main id="main" class="container">
  <nav aria-label="Breadcrumb" style="margin-top:80px;font-size:13px;color:var(--stone)">
    <ol style="list-style:none;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap">
      <li><a href="${homeHref}" style="color:var(--teal)">${homeLabel}</a></li>
      <li aria-hidden="true">›</li>
      <li><a href="${courseHref}" style="color:var(--teal)">${courseLabel}</a></li>
      <li aria-hidden="true">›</li>
      <li><a href="${courseHref}${moduleId}/" style="color:var(--teal)">${moduleTitle}</a></li>
      <li aria-hidden="true">›</li>
      <li aria-current="page">${title}</li>
    </ol>
  </nav>

  <section class="course-hero">
    <p class="eyebrow">${positionLabel} · ${timeLabel}<span class="track-badge">${trackBadge}</span></p>
    <h1>${title}</h1>
    <div class="course-progress" aria-label="${isES ? 'Progreso del curso' : 'Course progress'}">
      <progress max="${manifest.totalLessons}" value="${lesson.position}">${lesson.position} ${isES ? 'de' : 'of'} ${manifest.totalLessons}</progress>
    </div>
  </section>

  <div class="course-layout">
    <article class="course-body" id="post-body">
      <p>${todoLabel}</p>
      ${widgetBlocks(lesson.widgets)}
      <section class="course-template">
        <h2>${isES ? 'Plantilla' : 'Template'}</h2>
        <p>${isES ? 'TODO — agregar enlace a /sheets/course-' + slug + '/' : 'TODO — add link to /sheets/course-' + slug + '/'}</p>
        <a href="${isES ? '/es/sheets/' : '/sheets/'}course-${slug}/">${isES ? 'Abrir la plantilla' : 'Open the template'}</a>
      </section>
      <section class="course-cross-links">
        <h2>${pairsLabel}</h2>
        <ul>
          <li>TODO — link a related tool</li>
          <li>TODO — link a related /learn/ topic</li>
          <li>TODO — link a related glossary term</li>
        </ul>
      </section>
      <section class="course-takeaways">
        <h2>${takeawaysLabel}</h2>
        <ul>
          <li>TODO — what the operator has now that they didn't before</li>
          <li>TODO — second outcome</li>
          <li>TODO — third outcome</li>
        </ul>
      </section>
      <nav class="course-pager" aria-label="${isES ? 'Navegación de lección' : 'Lesson navigation'}">
        ${prev ? `<a rel="prev" href="${isES ? '/es' : ''}${pathOf(prev)}">← ${prevLabel}: ${(prev.title[locale] || prev.title.en).split(' — ')[0]}</a>` : '<span></span>'}
        <button type="button" class="js-course-complete">${markCompleteLabel} →</button>
        ${next ? `<a rel="next" href="${isES ? '/es' : ''}${pathOf(next)}">${nextLabel}: ${(next.title[locale] || next.title.en).split(' — ')[0]} →</a>` : '<span></span>'}
      </nav>
      <aside class="course-save-strip">
        ${saveLabel}
      </aside>
    </article>

    <aside class="course-rail" aria-label="${railLabel}">
      <h2>${railLabel}</h2>
      <section class="course-widget" data-widget="live-preview-frame" data-preview-page="home"></section>
    </aside>
  </div>
</main>

<footer><!-- sync-includes.mjs replaces this --></footer>

<script src="/tools/_shared/context-bus.js" defer></script>
<script src="/assets/js/workshop-widget.js" type="module" defer></script>

</body>
</html>
`;
}

function writeStub(dir, html) {
  if (fs.existsSync(path.join(dir, 'index.html'))) {
    console.error(`Refusing to overwrite existing file: ${path.relative(REPO, path.join(dir, 'index.html'))}`);
    console.error('Delete it first if you really want to regenerate.');
    process.exit(3);
  }
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), html);
  console.log(`wrote: ${path.relative(REPO, path.join(dir, 'index.html'))}`);
}

writeStub(enDir, makeHtml({ locale: 'en', title: titleEN, moduleTitle: moduleTitleEN }));
writeStub(esDir, makeHtml({ locale: 'es', title: titleES, moduleTitle: moduleTitleES }));

console.log('');
console.log('Next steps:');
console.log('  1. Edit the EN body in:', path.relative(REPO, path.join(enDir, 'index.html')));
console.log('  2. Translate the ES body in:', path.relative(REPO, path.join(esDir, 'index.html')));
console.log('  3. Add a template fragment at scripts/sheets-fragments/course-' + slug + '.html (when /sheets/ infrastructure lands)');
console.log('  4. Run: node scripts/sync-includes.mjs');
console.log('  5. Run: node scripts/stamp-hreflang.mjs');
console.log('  6. Run: node scripts/build-sitemap.mjs');
