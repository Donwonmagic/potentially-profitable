#!/usr/bin/env node
/**
 * Phase F.4 (Field Notes) — stamp the "Submit a field note" form
 * partial into every blog article between the sentinels:
 *
 *   <!-- field-notes-submit:start -->
 *   <section class="field-notes-submit">…</section>
 *   <!-- field-notes-submit:end -->
 *
 * The partial is locale-aware (EN vs ES) and respects the
 * FIELD_NOTES_ENABLED env var at build time:
 *   - When 'true', stamps the full form (signed-in upgrade is
 *     handled client-side by assets/js/article-fieldnotes.js).
 *   - When unset/false, stamps a single-line pause message so the
 *     article still reads coherently.
 *
 * Idempotent: running with same env produces no diff.
 *
 * Usage:
 *   node scripts/inject-article-fieldnote-form.mjs           # rewrite in place
 *   node scripts/inject-article-fieldnote-form.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- field-notes-submit:start -->[\s\S]*?<!-- field-notes-submit:end -->/;

const COPY = {
  en: {
    pause:    'Field notes are paused this season.',
    headline: 'Be the first field note on this piece.',
    subhead:  'Tried this in your own restaurant? 100–400 words, your name on it. Don reads every one. Your note shows up here once approved.',
    nameLabel:    'Your name',
    namePlaceholder: 'How you want to be credited',
    bodyLabel:    'Your note',
    bodyPlaceholder: 'What you tried, what happened, what you learned. Plain text — no links.',
    submit:       'Send to Don',
    counterFmt:   (n) => `${n} word${n === 1 ? '' : 's'} (need 100–400)`,
    signin:       'Sign in to share your experience →',
  },
  es: {
    pause:    'Los apuntes están en pausa esta temporada.',
    headline: 'Sé el primer apunte de campo en este artículo.',
    subhead:  '¿Lo probaste en tu propio restaurante? 100–400 palabras, con tu nombre. Don lee cada una. Tu apunte aparece aquí una vez aprobado.',
    nameLabel:    'Tu nombre',
    namePlaceholder: 'Cómo quieres aparecer',
    bodyLabel:    'Tu apunte',
    bodyPlaceholder: 'Qué probaste, qué pasó, qué aprendiste. Texto simple — sin enlaces.',
    submit:       'Enviar a Don',
    counterFmt:   (n) => `${n} palabra${n === 1 ? '' : 's'} (se necesita 100–400)`,
    signin:       'Inicia sesión para compartir tu experiencia →',
  },
};

// Resolve the flag from process.env first; fall back to parsing
// wrangler.jsonc's vars block so local --check matches the deploy
// state without requiring the env var be exported.
function resolveEnabled() {
  if (process.env.FIELD_NOTES_ENABLED === 'true') return true;
  if (process.env.FIELD_NOTES_ENABLED === 'false') return false;
  try {
    const raw = fs.readFileSync(path.join(repoRoot, 'wrangler.jsonc'), 'utf8');
    const m = raw.match(/"FIELD_NOTES_ENABLED"\s*:\s*"(true|false)"/);
    if (m) return m[1] === 'true';
  } catch (_) { /* default to false */ }
  return false;
}
const ENABLED = resolveEnabled();

function articleSlugFromPath(file) {
  // file = .../blog/<slug>/index.html or .../es/blog/<slug>/index.html
  const parts = file.split(path.sep);
  const idx = parts.lastIndexOf('blog');
  if (idx < 0) return '';
  return parts[idx + 1] || '';
}

function localeFromPath(file) {
  return file.includes(`${path.sep}es${path.sep}blog${path.sep}`) ? 'es' : 'en';
}

function renderPaused(locale) {
  const c = COPY[locale];
  return [
    '<!-- field-notes-submit:start -->',
    '      <section class="field-notes-submit field-notes-submit--paused" aria-label="Field notes">',
    `        <p class="field-notes-submit__paused">${c.pause}</p>`,
    '      </section>',
    '      <!-- field-notes-submit:end -->',
  ].join('\n      ');
}

function renderEnabled(locale, articleSlug) {
  const c = COPY[locale];
  // The form ships server-rendered with both states present; client
  // JS reads /api/auth/me and unhides the right one. This means
  // anonymous-with-JS-disabled visitors still see the sign-in CTA;
  // signed-in-with-JS-disabled visitors see the form (it posts
  // standard form-encoded body to /api/submission/create).
  const signinHref = locale === 'es'
    ? `/es/sign-in/?return=%2Fes%2Fblog%2F${encodeURIComponent(articleSlug)}%2F%23field-note-form`
    : `/sign-in/?return=%2Fblog%2F${encodeURIComponent(articleSlug)}%2F%23field-note-form`;
  return [
    '<!-- field-notes-submit:start -->',
    '      <section class="field-notes-submit" id="field-note-form" aria-labelledby="field-note-heading"',
    `              data-article-slug="${articleSlug}" data-locale="${locale}" data-fnenabled="true">`,
    `        <p class="field-notes-submit__eyebrow">${locale === 'es' ? 'Cuéntanos' : 'Tell us'}</p>`,
    `        <h2 class="field-notes-submit__headline" id="field-note-heading">${c.headline}</h2>`,
    `        <p class="field-notes-submit__subhead">${c.subhead}</p>`,
    '        <p class="field-notes-submit__signin js-field-notes-signin" hidden>',
    `          <a href="${signinHref}">${c.signin}</a>`,
    '        </p>',
    '        <form class="field-notes-form js-field-notes-form" hidden method="post" action="/api/submission/create">',
    '          <label class="field-notes-form__label">',
    `            <span class="field-notes-form__label-text">${c.nameLabel}</span>`,
    `            <input type="text" name="authorDisplayName" class="field-notes-form__name" maxlength="40" placeholder="${c.namePlaceholder}" required>`,
    '          </label>',
    '          <label class="field-notes-form__label">',
    `            <span class="field-notes-form__label-text">${c.bodyLabel}</span>`,
    `            <textarea name="body" class="field-notes-form__body" rows="6" placeholder="${c.bodyPlaceholder}" required></textarea>`,
    '            <span class="field-notes-form__counter js-field-notes-counter" aria-live="polite"></span>',
    '          </label>',
    `          <input type="hidden" name="articleSlug" value="${articleSlug}">`,
    `          <input type="hidden" name="locale" value="${locale}">`,
    `          <button type="submit" class="field-notes-form__submit btn btn-primary">${c.submit}</button>`,
    '          <p class="field-notes-form__msg js-field-notes-msg" role="status" hidden></p>',
    '        </form>',
    '        <script src="/assets/js/article-fieldnotes.js?v=20260429-batch3" defer></script>',
    '      </section>',
    '      <!-- field-notes-submit:end -->',
  ].join('\n      ');
}

function findArticles() {
  const out = [];
  for (const dir of ['blog', 'es/blog']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    for (const slug of fs.readdirSync(root)) {
      const file = path.join(root, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const src = fs.readFileSync(file, 'utf8');
      if (!SENTINEL_RE.test(src)) continue;
      out.push(file);
    }
  }
  return out;
}

let changed = 0;
const files = findArticles();
for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  const locale = localeFromPath(file);
  const slug = articleSlugFromPath(file);
  const block = ENABLED ? renderEnabled(locale, slug) : renderPaused(locale);
  const next = src.replace(SENTINEL_RE, block);
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${files.length} article(s) (FIELD_NOTES_ENABLED=${ENABLED}).`);
if (checkOnly && changed > 0) process.exit(1);
