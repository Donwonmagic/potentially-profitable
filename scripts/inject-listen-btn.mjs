#!/usr/bin/env node
/**
 * Idempotently insert a #listen-btn affordance into every written
 * piece declared in data/article-audio.json that doesn't already
 * have one.
 *
 * Why a separate inject (rather than wiring it into render-post-
 * audio.mjs): the render pipeline is heavy (Python deps, ~300 MB
 * Kokoro model, hours of compute). The button itself is just HTML
 * and can ship the moment the manifest declares the piece. The
 * runtime player (assets/js/listen.js) gracefully falls back to
 * the Web Speech API when audio.mp3 isn't on disk yet, so a piece
 * goes from "no audio at all" to "speech-tier" the moment this
 * script stamps the markup, then to "studio-tier" the moment the
 * renderer writes audio.mp3 next to the page.
 *
 * Where the button gets stamped:
 *
 *   - blog/<slug>/         : right after the article hero's <h1>'s
 *                            sibling <p class="post-meta"> if one
 *                            exists; otherwise after the first <h1>
 *                            inside the article body.
 *   - es/blog/<slug>/      : same pattern, ES copy.
 *   - learn/research/<s>/  : after the eyebrow + h1 + dek block at
 *                            the top of <article class="research-body">.
 *   - learn/checklists/<s>/: after the page header h1 inside the
 *                            checklist's main wrapper.
 *
 * Idempotent: if the page already has id="listen-btn", the file is
 * left alone. The data-audio-src attribute is added when audio.mp3
 * is on disk, omitted otherwise (so listen.js auto-selects between
 * studio and speech engines).
 *
 * Usage
 * -----
 *   node scripts/inject-listen-btn.mjs           # write
 *   node scripts/inject-listen-btn.mjs --check   # exit 1 if any change
 *   node scripts/inject-listen-btn.mjs --dry-run # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { NON_ARTICLE_LIBRARY_SLUGS } from './lib/library-skips.mjs';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const args     = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

const MANIFEST = path.join(repoRoot, 'data', 'article-audio.json');
if (!fs.existsSync(MANIFEST)) {
  console.error(`inject-listen-btn: manifest not found at data/article-audio.json`);
  process.exit(2);
}
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));

const SECTIONS = [
  { key: 'blog',        root: path.join(repoRoot, 'blog'),                  insertAfter: postHeaderInjector,    locale: 'en' },
  { key: 'es-blog',     root: path.join(repoRoot, 'es', 'blog'),            insertAfter: postHeaderInjector,    locale: 'es' },
  { key: 'library',     root: path.join(repoRoot, 'library'),               insertAfter: postHeaderInjector,    locale: 'en' },
  { key: 'es-library',  root: path.join(repoRoot, 'es', 'library'),         insertAfter: postHeaderInjector,    locale: 'es' },
  { key: 'research',    root: path.join(repoRoot, 'learn', 'research'),     insertAfter: researchHeaderInjector, locale: 'en' },
  { key: 'checklists',  root: path.join(repoRoot, 'learn', 'checklists'),   insertAfter: researchHeaderInjector, locale: 'en' },
];

const LISTEN_LABEL = {
  en: 'Listen to this article',
  es: 'Escuchar este artículo',
};

/**
 * Build the button markup. data-audio-src is included only when
 * audio.mp3 actually exists in the article directory (so listen.js
 * uses studio mode); otherwise the attribute is omitted and listen.js
 * falls back to Web Speech API.
 */
function buildButton({ articleDir, locale }) {
  const hasStudio = fs.existsSync(path.join(articleDir, 'audio.mp3'));
  const audioAttr = hasStudio ? ' data-audio-src="audio.mp3"' : '';
  const label = LISTEN_LABEL[locale] || LISTEN_LABEL.en;
  return [
    '      <div class="row-center">',
    `        <button type="button" id="listen-btn" class="listen-btn" aria-pressed="false" data-state="idle"${audioAttr} data-audio-languages="en,es,fr,it,pt,zh">`,
    '          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">',
    '            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor"/>',
    '            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>',
    '            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>',
    '          </svg>',
    `          <span class="listen-label i18n">${label}</span>`,
    '        </button>',
    '      </div>',
  ].join('\n');
}

/**
 * Blog/post-style injector — finds <p class="post-meta"> ...
 * </p> inside .post-hero / .article-body and stamps the button
 * directly after it. Falls back to the closing of the first <h1>
 * if no post-meta is found.
 */
function postHeaderInjector(src, button) {
  // Already has one?
  if (/id="listen-btn"/.test(src)) return src;

  // Best anchor: closing </p> of <p class="post-meta">...</p>
  const metaRe = /(<p class="post-meta"[^>]*>[\s\S]*?<\/p>)/;
  if (metaRe.test(src)) {
    return src.replace(metaRe, `$1\n${button}`);
  }
  // Second: closing </h1> within an <article> or <header> region
  const h1Re = /(<\/h1>)/;
  if (h1Re.test(src)) {
    return src.replace(h1Re, `$1\n${button}`);
  }
  // Couldn't find a place — leave the file alone and report.
  return null;
}

/**
 * Research / checklist injector — these pages have a different
 * hero layout. The closing of the lede <p> following <h1> is the
 * cleanest insertion point. Falls back to closing of <h1>.
 */
function researchHeaderInjector(src, button) {
  if (/id="listen-btn"/.test(src)) return src;

  // Best anchor: <header>...<h1>...</h1>...<p>...lede paragraph...</p></header>
  // We target the FIRST </p> after the FIRST </h1> within an article container.
  const m = src.match(/<h1\b[\s\S]*?<\/h1>([\s\S]*?<\/p>)/);
  if (m) {
    const insertAt = m.index + m[0].length;
    return src.slice(0, insertAt) + '\n' + button + src.slice(insertAt);
  }
  // Fallback: just after the first </h1>
  const h1Re = /(<\/h1>)/;
  if (h1Re.test(src)) {
    return src.replace(h1Re, `$1\n${button}`);
  }
  return null;
}

let changed = 0;
let skipped = 0;
let alreadyOk = 0;
const failures = [];

for (const section of SECTIONS) {
  const entries = manifest[section.key] || {};
  for (const [slug, spec] of Object.entries(entries)) {
    if (slug.startsWith('_')) continue;
    if (!spec || typeof spec !== 'object' || !Array.isArray(spec.languages)) continue;

    const articlePath = path.join(section.root, slug, 'index.html');
    if (!fs.existsSync(articlePath)) {
      skipped++;
      continue;
    }
    const src = fs.readFileSync(articlePath, 'utf8');
    if (/id="listen-btn"/.test(src)) {
      // Already present — but make sure data-audio-src reflects the
      // current studio-readiness state (gain studio mode the moment
      // audio.mp3 lands; lose it if removed).
      const hasStudio = fs.existsSync(path.join(section.root, slug, 'audio.mp3'));
      const studioRe = /(<button[^>]*\bid="listen-btn"[^>]*?)(\s+data-audio-src="[^"]*")?(\s+data-audio-languages)/;
      const m = src.match(studioRe);
      if (m) {
        const want = hasStudio ? ' data-audio-src="audio.mp3"' : '';
        const cur  = m[2] || '';
        if (cur !== want) {
          const next = src.replace(studioRe, `$1${want}$3`);
          if (next !== src) {
            if (!checkOnly && !dryRun) fs.writeFileSync(articlePath, next);
            changed++;
            console.log(`${dryRun ? 'would update' : checkOnly ? 'would update' : 'updated'} (audio-src): ${path.relative(repoRoot, articlePath)}`);
            continue;
          }
        }
      }
      alreadyOk++;
      continue;
    }

    const button = buildButton({ articleDir: path.dirname(articlePath), locale: section.locale });
    const next = section.insertAfter(src, button);
    if (next == null) {
      failures.push(`${path.relative(repoRoot, articlePath)}: no <h1> or <p class="post-meta"> anchor — manual placement required`);
      continue;
    }
    if (next === src) {
      alreadyOk++;
      continue;
    }
    if (!checkOnly && !dryRun) fs.writeFileSync(articlePath, next);
    changed++;
    console.log(`${dryRun ? 'would write' : checkOnly ? 'would update' : 'wrote'}: ${path.relative(repoRoot, articlePath)}`);
  }
}

console.log(`\nlisten-btn: ${alreadyOk} already had it, ${changed} ${checkOnly ? 'would update' : (dryRun ? 'would write' : 'updated')}, ${skipped} skipped (article missing).`);
if (failures.length) {
  console.error(`\n${failures.length} placement failure(s):`);
  for (const f of failures) console.error(`  · ${f}`);
}

if (checkOnly && (changed > 0 || failures.length > 0)) process.exit(1);
process.exit(failures.length > 0 ? 1 : 0);
