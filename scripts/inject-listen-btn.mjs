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

// Phased activation controls.
//   --languages en[,es,…]  Restrict which languages the button advertises
//                          (further intersected with what's actually on
//                          disk). Default: every declared language whose
//                          audio file is present. This is what keeps a
//                          page from offering a language whose MP3 hasn't
//                          rendered yet (the player would 404 on it).
//   --sections blog,library,research,checklists
//                          Only process these manifest sections. Default:
//                          all. Lets an English-only activation skip the
//                          /es/ Spanish-locale pages.
const argv = process.argv.slice(2);
function argVal(name) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[i + 1] : null;
}
const requestedLangs = (argVal('--languages') || '')
  .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
const requestedSections = (argVal('--sections') || '')
  .split(',').map((s) => s.trim()).filter(Boolean);

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

// The audio filename for a language on a page whose source language is
// `sourceLang`. The source-language narration lives at the unsuffixed
// audio.mp3; every other language is audio.<lang>.mp3. Mirrors
// audioName() in scripts/render-post-audio.mjs.
function audioFileFor(lang, sourceLang) {
  return lang === sourceLang ? 'audio.mp3' : `audio.${lang}.mp3`;
}

// Languages this page can actually play right now: declared ∩ on-disk,
// intersected with --languages when given. The source language leads so
// it's the default track. Falls back to [sourceLang] so the attribute is
// never empty. This is the gate that delivers "English now, the rest as
// they render" — a language is advertised only once its MP3 exists.
function availableLanguagesFor(articleDir, declared, sourceLang) {
  const pool = requestedLangs.length
    ? declared.filter((l) => requestedLangs.includes(l))
    : declared.slice();
  const present = pool.filter((l) =>
    fs.existsSync(path.join(articleDir, audioFileFor(l, sourceLang))));
  if (!present.includes(sourceLang)
      && fs.existsSync(path.join(articleDir, 'audio.mp3'))
      && (!requestedLangs.length || requestedLangs.includes(sourceLang))) {
    present.unshift(sourceLang);
  }
  return present.length ? present : [sourceLang];
}

// Normalize a #listen-btn opening tag's audio attributes to the current
// on-disk reality: data-audio-src present iff the source MP3 exists,
// data-audio-source-lang only for non-English source pages, and
// data-audio-languages set to the live list. Idempotent.
function setButtonAudioAttrs(openTag, { hasStudio, langs, sourceLang }) {
  let tag = openTag
    .replace(/\s+data-audio-src="[^"]*"/g, '')
    .replace(/\s+data-audio-source-lang="[^"]*"/g, '')
    .replace(/\s+data-audio-languages="[^"]*"/g, '');
  const srcAttr  = hasStudio ? ' data-audio-src="audio.mp3"' : '';
  const slgAttr  = sourceLang !== 'en' ? ` data-audio-source-lang="${sourceLang}"` : '';
  const langAttr = ` data-audio-languages="${langs}"`;
  return tag.replace(/>\s*$/, `${srcAttr}${slgAttr}${langAttr}>`);
}

/**
 * Build the button markup. data-audio-src is included only when
 * audio.mp3 actually exists in the article directory (so listen.js
 * uses studio mode); otherwise the attribute is omitted and listen.js
 * falls back to Web Speech API.
 */
function buildButton({ articleDir, locale, declared }) {
  const hasStudio = fs.existsSync(path.join(articleDir, 'audio.mp3'));
  const langs = availableLanguagesFor(articleDir, declared, locale).join(',');
  const baseTag = '<button type="button" id="listen-btn" class="listen-btn" aria-pressed="false" data-state="idle">';
  const openTag = setButtonAudioAttrs(baseTag, { hasStudio, langs, sourceLang: locale });
  const label = LISTEN_LABEL[locale] || LISTEN_LABEL.en;
  return [
    '      <div class="row-center">',
    `        ${openTag}`,
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
  if (requestedSections.length && !requestedSections.includes(section.key)) continue;
  const entries = manifest[section.key] || {};
  for (const [slug, spec] of Object.entries(entries)) {
    if (slug.startsWith('_')) continue;
    if (!spec || typeof spec !== 'object' || !Array.isArray(spec.languages)) continue;

    const articlePath = path.join(section.root, slug, 'index.html');
    if (!fs.existsSync(articlePath)) {
      skipped++;
      continue;
    }
    const articleDir = path.join(section.root, slug);
    const src = fs.readFileSync(articlePath, 'utf8');
    if (/id="listen-btn"/.test(src)) {
      // Already present — re-normalize its audio attributes (src +
      // source-lang + advertised languages) to the current on-disk
      // reality. Gains studio mode the moment audio.mp3 lands; advertises
      // each language only once its MP3 is present.
      const hasStudio = fs.existsSync(path.join(articleDir, 'audio.mp3'));
      const langs = availableLanguagesFor(articleDir, spec.languages, section.locale).join(',');
      const btnRe = /<button\b[^>]*\bid="listen-btn"[^>]*?>/;
      const m = src.match(btnRe);
      if (m) {
        const nextTag = setButtonAudioAttrs(m[0], { hasStudio, langs, sourceLang: section.locale });
        if (nextTag !== m[0]) {
          const next = src.replace(btnRe, nextTag);
          if (!checkOnly && !dryRun) fs.writeFileSync(articlePath, next);
          changed++;
          console.log(`${dryRun || checkOnly ? 'would update' : 'updated'} (audio attrs): ${path.relative(repoRoot, articlePath)}`);
          continue;
        }
      }
      alreadyOk++;
      continue;
    }

    const button = buildButton({ articleDir, locale: section.locale, declared: spec.languages });
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
