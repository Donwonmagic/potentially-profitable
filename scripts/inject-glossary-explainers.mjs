#!/usr/bin/env node
// Inject the 90-second narrated diagram (the "explainer") into the
// five flagship glossary term pages — menu-engineering, prime-cost,
// plate-cost, contribution-margin, aspect-ratio — between
//   <!-- glossary-explainer:start --> ... <!-- glossary-explainer:end -->
// sentinels. A small chip ("Watch the 90-second explainer →") is
// injected separately between
//   <!-- glossary-explainer-cue:start --> ... <!-- glossary-explainer-cue:end -->
// just below the term's "Why it matters" paragraph, so a reader can
// land on the page and see immediately that an explainer exists.
//
// Source of truth: data/glossary-explainers/<slug>.mjs — each module
// exports { term_slug, term_head, subhead, duration_ms, scenes,
// scenes_es, svg }. The script runs both locales: EN renders
// `scenes`, ES renders `scenes_es`. The SVG is locale-agnostic;
// only the captions translate.
//
//   node scripts/inject-glossary-explainers.mjs           # rewrites in place
//   node scripts/inject-glossary-explainers.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const DATA_DIR = path.join(REPO, 'data', 'glossary-explainers');

const PANEL_OPEN  = '<!-- glossary-explainer:start -->';
const PANEL_CLOSE = '<!-- glossary-explainer:end -->';
const CUE_OPEN    = '<!-- glossary-explainer-cue:start -->';
const CUE_CLOSE   = '<!-- glossary-explainer-cue:end -->';
const PANEL_RE = new RegExp(escapeForRegex(PANEL_OPEN) + '[\\s\\S]*?' + escapeForRegex(PANEL_CLOSE));
const CUE_RE   = new RegExp(escapeForRegex(CUE_OPEN)   + '[\\s\\S]*?' + escapeForRegex(CUE_CLOSE));

function escapeForRegex(s){ return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'); }

function escAttr(s){ return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function escText(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

// Friendly seconds-only label for the chrome.
function fmtSec(ms){ return Math.round(ms / 1000) + 's'; }

// ---------- copy in a few short locale strings -----------
const STR = {
  en: {
    eyebrow:    'Watch the 90-second explainer',
    explainer:  'The 90-second explainer',
    play:       'Play',
    pause:      'Pause',
    restart:    'Restart',
    sceneLabel: (i, n) => 'Scene ' + i + ' of ' + n,
    cue:        'Watch the 90-second explainer',
    captionsH:  'Transcript',
  },
  es: {
    eyebrow:    'Mira el explicador de 90 segundos',
    explainer:  'El explicador de 90 segundos',
    play:       'Reproducir',
    pause:      'Pausar',
    restart:    'Reiniciar',
    sceneLabel: (i, n) => 'Escena ' + i + ' de ' + n,
    cue:        'Mira el explicador de 90 segundos',
    captionsH:  'Transcripción',
  },
};

function renderPanel(locale, mod) {
  const strings = STR[locale];
  const scenes = locale === 'es' ? mod.scenes_es : mod.scenes;
  // Each ES scene_es is keyed by id; merge back with the duration
  // declared in mod.scenes.
  const durationsById = new Map(mod.scenes.map(s => [s.id, s.ms]));
  const ordered = scenes.map((s) => ({
    id: s.id,
    caption: s.caption,
    ms: durationsById.get(s.id),
  })).filter(s => s.ms != null && s.id);

  const captionList = ordered.map((s, i) => `        <li data-scene-id="${escAttr(s.id)}" data-duration-ms="${s.ms}"${i === 0 ? ' class="is-active"' : ''}>${escText(s.caption)}</li>`).join('\n');
  const dotMarkup = ordered.map((s, i) => `        <button type="button" class="term-explainer__scrub-dot" aria-label="${escAttr(strings.sceneLabel(i + 1, ordered.length))}"></button>`).join('\n');

  return `${PANEL_OPEN}
<aside class="term-explainer" data-term-slug="${escAttr(mod.term_slug)}" tabindex="0" aria-label="${escAttr(strings.explainer)}">
  <header class="term-explainer__head">
    <span class="eyebrow">${escText(strings.explainer)}</span>
    <h2>${escText(mod.term_head)}</h2>
    <p class="term-explainer__sub"><strong>${escText(mod.subhead)}</strong> <span aria-hidden="true">·</span> ${escText(fmtSec(mod.duration_ms))}</p>
  </header>
  <div class="term-explainer__stage">
    ${mod.svg.replace(/^\s*/, '')}
  </div>
  <div class="term-explainer__chrome">
    <button type="button" class="term-explainer__playpause" aria-label="${escAttr(strings.play)}">
      <svg class="icon-play"  width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>
      <svg class="icon-pause" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
    </button>
    <div class="term-explainer__scrub" role="presentation">
      <div class="term-explainer__scrub-fill"></div>
      <div class="term-explainer__scrub-dots">
${dotMarkup}
      </div>
    </div>
    <span class="term-explainer__time">0:00 / ${fmtTimeFloor(mod.duration_ms)}</span>
    <button type="button" class="term-explainer__restart">${escText(strings.restart)}</button>
  </div>
  <div class="term-explainer__captions">
    <h3 class="sr-only">${escText(strings.captionsH)}</h3>
    <ol>
${captionList}
    </ol>
  </div>
</aside>
${PANEL_CLOSE}`;
}

function fmtTimeFloor(ms){
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const ss = s - m * 60;
  return m + ':' + (ss < 10 ? '0' : '') + ss;
}

function renderCue(locale, mod) {
  const strings = STR[locale];
  // Cue links to the on-page anchor (the explainer's <aside>). We
  // expose the slug on the aside via data-term-slug and render an
  // anchor by id.
  return `${CUE_OPEN}
<p style="margin-top:18px"><a class="term-explainer-cue" href="#${escAttr(mod.term_slug)}-explainer">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polygon points="6 4 20 12 6 20 6 4"/></svg>
  ${escText(strings.cue)}
</a></p>
${CUE_CLOSE}`;
}

// We attach the anchor by stamping id="<slug>-explainer" onto the
// <aside class="term-explainer"> when the cue references it. We also
// add is-active to the first <g class="explainer-scene"> so the
// stage renders the opening scene at SSR (no-JS / reduced-motion
// readers see scene 1 instead of a blank canvas; the runtime
// toggles from there).
function panelWithAnchorId(panelHtml, slug) {
  let html = panelHtml.replace(
    '<aside class="term-explainer"',
    `<aside id="${slug}-explainer" class="term-explainer"`
  );
  // First-scene activation: only the FIRST <g class="explainer-scene">.
  let first = true;
  html = html.replace(/<g class="explainer-scene"/g, (m) => {
    if (!first) return m;
    first = false;
    return '<g class="explainer-scene is-active"';
  });
  return html;
}

// ---------- run -----------

async function loadExplainer(file) {
  const url = pathToFileURL(file).href + '?t=' + Date.now();
  const mod = await import(url);
  return mod.default;
}

const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.mjs'));
let touched = 0;
let wouldChange = false;

for (const f of files) {
  const data = await loadExplainer(path.join(DATA_DIR, f));
  if (!data || !data.term_slug) continue;

  for (const locale of ['en', 'es']) {
    const fp = locale === 'en'
      ? path.join(REPO, 'glossary',    data.term_slug, 'index.html')
      : path.join(REPO, 'es/glossary', data.term_slug, 'index.html');
    if (!fs.existsSync(fp)) {
      console.warn(`skip (no page): ${path.relative(REPO, fp)}`);
      continue;
    }
    const src = fs.readFileSync(fp, 'utf8');
    if (!PANEL_RE.test(src) || !CUE_RE.test(src)) {
      console.error(`${path.relative(REPO, fp)} is missing the explainer sentinels — re-run scripts/build-library.mjs first.`);
      process.exit(2);
    }
    const panel = panelWithAnchorId(renderPanel(locale, data), data.term_slug);
    const cue   = renderCue(locale, data);
    let next = src.replace(PANEL_RE, panel).replace(CUE_RE, cue);
    if (next === src) continue;
    if (checkOnly) { wouldChange = true; console.error('would update: ' + path.relative(REPO, fp)); continue; }
    fs.writeFileSync(fp, next);
    touched++;
    console.log('stamped: ' + path.relative(REPO, fp));
  }
}

// ---------- index-card explainer chip -----------
//
// Each of the five terms with an explainer also gets a small chip
// inside its <div class="gloss-tags"> on glossary/index.html (and
// the ES mirror) so a reader scanning the index sees that an
// explainer exists. The chip links straight to the on-page anchor
// on the term page.
//
// Idempotent: detects an existing chip on the card and skips. If
// the chip's label changed in this script, replaces in place.

const explainerSlugs = files
  .map((f) => path.basename(f, '.mjs'))
  .filter((slug) => fs.existsSync(path.join(REPO, 'glossary', slug, 'index.html')));

function stampIndexChips(locale) {
  const fp = locale === 'es'
    ? path.join(REPO, 'es/glossary/index.html')
    : path.join(REPO, 'glossary/index.html');
  if (!fs.existsSync(fp)) return false;
  let html = fs.readFileSync(fp, 'utf8');
  let changed = false;

  const label = locale === 'es' ? '90s · explicador' : '90s · explainer';
  const aria  = locale === 'es' ? 'Mira el explicador de 90 segundos' : 'Watch the 90-second explainer';

  for (const slug of explainerSlugs) {
    // Match the card's <article ...> opening through the first
    // </div> that closes <div class="gloss-tags">. Capture the tags
    // group so we can decide whether to inject the chip there.
    const cardRe = new RegExp(
      '<article class="gloss-term" id="' + slug + '"[\\s\\S]*?<div class="gloss-tags">([\\s\\S]*?)</div>',
      'm'
    );
    const m = cardRe.exec(html);
    if (!m) continue;
    if (/gloss-tag--explainer/.test(m[0])) {
      // already stamped — but its href / label might be stale, refresh.
      const refreshed = m[0].replace(
        /<a class="gloss-tag gloss-tag--explainer"[\s\S]*?<\/a>/,
        explainerChip(slug, locale, label, aria)
      );
      if (refreshed !== m[0]) {
        html = html.replace(cardRe, refreshed);
        changed = true;
      }
      continue;
    }
    // Fresh stamp — inject the chip just inside the tags block.
    const chip = '\n          ' + explainerChip(slug, locale, label, aria);
    const replaced = m[0].replace('<div class="gloss-tags">', '<div class="gloss-tags">' + chip);
    if (replaced !== m[0]) {
      html = html.replace(cardRe, replaced);
      changed = true;
    }
  }

  if (changed) {
    if (checkOnly) { wouldChange = true; console.error('would update: ' + path.relative(REPO, fp)); return true; }
    fs.writeFileSync(fp, html);
    console.log('chips stamped: ' + path.relative(REPO, fp));
    return true;
  }
  return false;
}

function explainerChip(slug, locale, label, aria) {
  const href = (locale === 'es' ? '/es/glossary/' : '/glossary/') + slug + '/#' + slug + '-explainer';
  return `<a class="gloss-tag gloss-tag--explainer" href="${escAttr(href)}" aria-label="${escAttr(aria)}"><svg viewBox="0 0 12 12" width="9" height="9" aria-hidden="true" fill="currentColor"><polygon points="2,1 11,6 2,11"/></svg> ${escText(label)}</a>`;
}

stampIndexChips('en');
stampIndexChips('es');

if (checkOnly) {
  if (wouldChange) process.exit(1);
  console.log('explainer pages up to date.');
} else {
  console.log(`\nUpdated ${touched} term page(s).`);
}
