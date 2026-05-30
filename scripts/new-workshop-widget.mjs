#!/usr/bin/env node
/**
 * Workshop Kit widget scaffolder — emits the renderer module + the EN/ES
 * reference demo pages for a new widget. Mirrors the live-preview-frame
 * widget's structure so the kit stays consistent.
 *
 * Usage:
 *   node scripts/new-workshop-widget.mjs <tag>
 *
 * The <tag> should be lowercase kebab-case and must already exist in the
 * `widgets` array of data/course-lessons.json with status "planned".
 * This script flips its status to "shipped" and writes the implementation
 * stub plus reference pages.
 *
 * Example:
 *   node scripts/new-workshop-widget.mjs palette-picker
 *   → wrote: tools/_shared/workshop/palette-picker.js
 *   → wrote: method/workshop/palette-picker/index.html
 *   → wrote: es/method/workshop/palette-picker/index.html
 *   → updated: data/course-lessons.json (status: planned → shipped)
 *
 * After running:
 *   1. Implement the widget logic in tools/_shared/workshop/<tag>.js
 *   2. Update the EN + ES reference pages with the widget's actual demo
 *      controls and contract documentation.
 *   3. Run: node scripts/sync-includes.mjs
 *   4. Run: node scripts/stamp-hreflang.mjs
 *   5. Run: node scripts/build-sitemap.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const tag = process.argv[2];
if (!tag) {
  console.error('Usage: node scripts/new-workshop-widget.mjs <tag>');
  console.error('  e.g. node scripts/new-workshop-widget.mjs palette-picker');
  process.exit(1);
}
if (!/^[a-z][a-z0-9-]*$/.test(tag)) {
  console.error('Tag must be lowercase kebab-case (letters, digits, hyphens).');
  process.exit(1);
}

const manifestPath = path.join(REPO, 'data', 'course-lessons.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const widgetEntry = manifest.widgets.find((w) => w.tag === tag);
if (!widgetEntry) {
  console.error(`Widget "${tag}" not found in data/course-lessons.json.`);
  console.error('Add it to the widgets array first, then re-run.');
  process.exit(2);
}
if (widgetEntry.status === 'shipped') {
  console.error(`Widget "${tag}" is already marked shipped at ${widgetEntry.path}.`);
  console.error('Delete the existing files first if you really want to regenerate.');
  process.exit(3);
}

const rendererPath = path.join(REPO, 'tools', '_shared', 'workshop', `${tag}.js`);
const enDemoDir = path.join(REPO, 'method', 'workshop', tag);
const esDemoDir = path.join(REPO, 'es', 'method', 'workshop', tag);

function refuseIfExists(p) {
  if (fs.existsSync(p)) {
    console.error(`Refusing to overwrite: ${path.relative(REPO, p)}`);
    process.exit(4);
  }
}

refuseIfExists(rendererPath);
refuseIfExists(path.join(enDemoDir, 'index.html'));
refuseIfExists(path.join(esDemoDir, 'index.html'));

const rendererJs = `/**
 * Workshop Kit widget: ${tag}
 *
 * TODO — describe what this widget does, what it reads from MuntinContext,
 * what it writes back, and which lesson(s) use it.
 *
 * Markup expected:
 *
 *   <section class="course-widget" data-widget="${tag}">
 *     <!-- engine mounts here -->
 *   </section>
 */

export const tag         = '${tag}';
export const contextKeys = [/* list MuntinContext keys you read from */];

export function mount(rootEl, state, deps) {
  rootEl.innerHTML = '<p>TODO — implement the ${tag} widget.</p>';

  function onChange(/* event */) {
    // Re-render in response to other widgets committing changes.
  }
  window.addEventListener(window.WorkshopKit ? window.WorkshopKit.CONTEXT_CHANGE_EVENT : 'mtn:context-change', onChange);

  return {
    unmount: function () {
      window.removeEventListener(window.WorkshopKit ? window.WorkshopKit.CONTEXT_CHANGE_EVENT : 'mtn:context-change', onChange);
      rootEl.innerHTML = '';
    },
    refresh: function (/* nextState */) {
      // Optional: respond to MuntinContext.subscribe() callback.
    }
  };
}

export function serialize(rootEl) {
  // Return the widget's current state (only if it's a data-entry widget).
  return {};
}

// Optional: validate the widget's state before progressing.
// export function validate(state) {
//   return { ok: true };
// }
`;

function demoHtml(locale) {
  const isES = locale === 'es';
  const canonicalPath = isES ? `/es/method/workshop/${tag}/` : `/method/workshop/${tag}/`;
  const canonicalUrl = `https://muntin.digital${canonicalPath}`;
  const altPath = isES ? canonicalPath.replace(/^\/es\//, '/') : `/es${canonicalPath}`;
  const altUrl = `https://muntin.digital${altPath}`;
  const ogLocale = isES ? 'es_ES' : 'en_US';
  const ogLocaleAlt = isES ? 'en_US' : 'es_US';
  const inLang = isES ? 'es-ES' : 'en-US';

  const homeLabel  = isES ? 'Inicio' : 'Home';
  const homeHref   = isES ? '/es/' : '/';
  const methodLabel = isES ? 'El Método' : 'The Method';
  const methodHref  = isES ? '/es/method/' : '/method/';
  const kitLabel = 'Workshop Kit';
  const kitHref = isES ? '/es/method/workshop/' : '/method/workshop/';
  const skipLink = isES ? 'Saltar al contenido principal' : 'Skip to main content';
  const eyebrow = isES ? 'Widget del Workshop Kit' : 'Workshop Kit widget';
  const statusLabel = isES ? 'Borrador' : 'Draft';
  const tryLabel = isES ? 'Pruébalo' : 'Try it';
  const contractLabel = isES ? 'Contrato' : 'Contract';
  const placementLabel = isES ? 'Colocarlo en una página' : 'Place it on a page';
  const behaviorLabel = isES ? 'Cómo se comporta' : 'How it behaves';
  const todoLine = isES ? 'TODO — describe el widget aquí.' : 'TODO — describe the widget here.';

  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
<title>${tag} — Workshop Kit widget | Muntin Digital</title>
<meta name="description" content="The ${tag} Workshop Kit widget. ${todoLine}" />
<meta name="theme-color" content="#2A50C8" />
<link rel="canonical" href="${canonicalUrl}" />
<!-- i18n:hreflang START (generated by scripts/stamp-hreflang.mjs) -->
<link rel="alternate" hreflang="en" href="https://muntin.digital${isES ? altPath : canonicalPath}" />
<link rel="alternate" hreflang="es" href="https://muntin.digital${isES ? canonicalPath : altPath}" />
<link rel="alternate" hreflang="x-default" href="https://muntin.digital${isES ? altPath : canonicalPath}" />
<meta property="og:locale" content="${ogLocale}" />
<meta property="og:locale:alternate" content="${ogLocaleAlt}" />
<!-- i18n:hreflang END -->

<meta property="og:type" content="website" />
<meta property="og:title" content="${tag} — Workshop Kit widget" />
<meta property="og:url" content="${canonicalUrl}" />
<meta property="og:site_name" content="Muntin Digital" />

<link rel="icon" type="image/svg+xml" sizes="any" href="/brand/mark/mark-square-ink.svg" />
<link rel="preload" as="style" href="/assets/site-core.css" onload="this.onload=null;this.rel='stylesheet'">
<link rel="preload" as="style" href="/assets/site-article.css" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="/assets/site-core.css"><link rel="stylesheet" href="/assets/site-article.css"></noscript>

<style>
:root{--cream:#F6F7F8;--cream-2:#EDEEF1;--ink:#16181D;--ink-soft:#4A4F59;--teal:#2A50C8;--stone:#6B7280;--line:#E3E5E9;--max:1200px;--pad-x:clamp(20px,4vw,64px);--font-display:'Fraunces','Fraunces Fallback',Georgia,'Times New Roman',serif;--font-body:'Inter','Inter Fallback',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
html{box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}
body{margin:0;font-family:var(--font-body);color:var(--ink);background:var(--cream);line-height:1.6;font-size:17px}
h1,h2,h3{font-family:var(--font-display)}
.container{max-width:var(--max);margin:0 auto;padding-inline:var(--pad-x)}
.skip-link{position:absolute;left:-9999px;top:0}
.skip-link:focus{position:static;display:inline-block;background:#16181D;color:#F6F7F8;padding:12px 16px;z-index:100}
a{color:inherit}
header.nav{min-height:64px}
main{padding-top:64px}
.wd-hero{padding:80px 0 24px}
.wd-hero .eyebrow{font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:var(--stone);font-weight:600;margin:0 0 18px}
.wd-hero h1{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:clamp(28px,4vw,42px);font-weight:600;color:var(--teal);margin:0 0 14px;letter-spacing:-.2px}
.wd-hero .status-pill{display:inline-block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;padding:4px 10px;border-radius:99px;margin-bottom:18px;background:var(--cream-2);color:var(--stone)}
.wd-section{padding:48px 0;border-top:1px solid var(--line)}
.wd-section h2{margin:0 0 14px;font-size:24px;font-weight:500;line-height:1.2}
.wd-section p{font-size:16.5px;line-height:1.6;max-width:680px;margin:0 0 14px;color:var(--ink-soft)}
.wd-section code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:14px;background:var(--cream-2);padding:1px 6px;border-radius:3px}
.course-widget{display:block;padding:24px;background:var(--cream-2);border:1px solid var(--line);border-radius:8px}
</style>
</head>
<body>

<a class="skip-link" href="#main">${skipLink}</a>

<header class="nav" id="nav"><!-- sync-includes.mjs replaces this --></header>

<main id="main">
  <section class="wd-hero container">
    <nav aria-label="${isES ? 'Migas de pan' : 'Breadcrumb'}" style="font-size:13px;color:var(--stone);margin-bottom:24px">
      <ol style="list-style:none;padding:0;margin:0;display:flex;gap:8px;flex-wrap:wrap">
        <li><a href="${homeHref}" style="color:var(--teal)">${homeLabel}</a></li>
        <li aria-hidden="true">›</li>
        <li><a href="${methodHref}" style="color:var(--teal)">${methodLabel}</a></li>
        <li aria-hidden="true">›</li>
        <li><a href="${kitHref}" style="color:var(--teal)">${kitLabel}</a></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">${tag}</li>
      </ol>
    </nav>
    <p class="eyebrow">${eyebrow}</p>
    <span class="status-pill">${statusLabel}</span>
    <h1>${tag}</h1>
    <p style="font-size:17.5px;color:var(--ink-soft);max-width:680px">${todoLine}</p>
  </section>

  <section class="container wd-section">
    <h2>${tryLabel}</h2>
    <section class="course-widget" data-widget="${tag}" aria-label="${tag} demo">
      <!-- Workshop Kit engine mounts here -->
    </section>
  </section>

  <section class="container wd-section">
    <h2>${contractLabel}</h2>
    <p>${isES ? 'Ruta del módulo' : 'Module path'}: <code>/tools/_shared/workshop/${tag}.js</code>.</p>
    <p>TODO — list contextKeys, mount signature, serialize signature, validate signature.</p>
  </section>

  <section class="container wd-section">
    <h2>${placementLabel}</h2>
    <p>TODO — show the minimal markup snippet a lesson author uses to embed the widget.</p>
  </section>

  <section class="container wd-section">
    <h2>${behaviorLabel}</h2>
    <p>TODO — list the widget's behaviors, accessibility commitments, empty-state, and edge cases.</p>
  </section>
</main>

<footer><!-- sync-includes.mjs replaces this --></footer>

<script src="/tools/_shared/context-bus.js" defer></script>
<script src="/assets/js/workshop-widget.js" type="module" defer></script>

</body>
</html>
`;
}

// Write the renderer + both demo pages, then update the manifest.
fs.mkdirSync(path.dirname(rendererPath), { recursive: true });
fs.writeFileSync(rendererPath, rendererJs);
console.log(`wrote: ${path.relative(REPO, rendererPath)}`);

fs.mkdirSync(enDemoDir, { recursive: true });
fs.writeFileSync(path.join(enDemoDir, 'index.html'), demoHtml('en'));
console.log(`wrote: ${path.relative(REPO, path.join(enDemoDir, 'index.html'))}`);

fs.mkdirSync(esDemoDir, { recursive: true });
fs.writeFileSync(path.join(esDemoDir, 'index.html'), demoHtml('es'));
console.log(`wrote: ${path.relative(REPO, path.join(esDemoDir, 'index.html'))}`);

widgetEntry.status = 'shipped';
widgetEntry.path = `/tools/_shared/workshop/${tag}.js`;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`updated: data/course-lessons.json (status: planned → shipped)`);

console.log('');
console.log('Next steps:');
console.log(`  1. Implement the widget in tools/_shared/workshop/${tag}.js`);
console.log(`  2. Flesh out the EN + ES reference demo pages with real controls + docs`);
console.log('  3. Run: node scripts/sync-includes.mjs');
console.log('  4. Run: node scripts/stamp-hreflang.mjs');
console.log('  5. Run: node scripts/build-sitemap.mjs');
