#!/usr/bin/env node
/**
 * Phase G.9 (Growth) — stamp a per-article "Smart next" 3-line CTA
 * (Read / Try / Or send Don a note) directly after the existing
 * post-end-cta block. Sentinel-bracketed; idempotent.
 *
 * Sources:
 *   - Read   → first glossary term cited inside #post-body
 *   - Try    → tool-knit's per-article tool entry (data/tool-knit.json
 *              articles[<url>].tool, falls back to /tools/audits/restaurant/)
 *   - Or send Don a note → /window/?topic=<article-slug>
 *
 *   node scripts/inject-smart-next-cta.mjs           # rewrite
 *   node scripts/inject-smart-next-cta.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- smart-next:start -->[\s\S]*?<!-- smart-next:end -->/;

function escAttr(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' })[c]);
}

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

// Map article slug → preferred tool (mirrors data/post-end-cta.json
// where present; falls back to topic-cluster default).
function loadPostEndCtaTool(slug, locale) {
  const f = path.join(repoRoot, 'data/post-end-cta.json');
  if (!fs.existsSync(f)) return null;
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const entry = (data.posts || {})[slug];
  if (!entry) return null;
  return locale === 'es' ? entry.tool_url_es : entry.tool_url_en;
}

function firstGlossaryHrefIn(src) {
  const m = src.match(/<article[^>]*\bid="post-body"[^>]*>([\s\S]*?)<\/article>/i);
  if (!m) return null;
  const body = m[1];
  const link = body.match(/href="(\/(?:es\/)?glossary\/[a-z0-9-]+\/)"/);
  return link ? link[1] : null;
}

// Slug-specific overrides for articles whose body doesn't contain
// any glossary autolinks. Without this, the smart-next "Read" CTA
// falls back to the glossary index — which is what the auditor
// flagged as a generic, ungrounded next step.
const READ_OVERRIDE = {
  'does-my-restaurant-need-a-website':                       { en: '/glossary/owned-channel/',           es: '/es/glossary/owned-channel/' },
  'can-chatgpt-write-your-restaurant-website':               { en: '/glossary/cuisine-pitch/',           es: '/es/glossary/cuisine-pitch/' },
  'what-should-be-on-a-restaurant-website':                  { en: '/glossary/above-the-fold/',          es: '/es/glossary/above-the-fold/' },
  'como-saber-si-una-herramienta-de-restaurante-es-segura':  { es: '/es/glossary/client-side-tool/' },
  'como-salir-de-doordash-mi-restaurante':                   { es: '/es/glossary/owned-channel/' },
  'cuanto-cuesta-una-pagina-web-para-restaurante-2026':      { es: '/es/glossary/care-plan/' },
  'mi-restaurante-no-aparece-en-google-maps':                { es: '/es/glossary/gbp/' },
  'schema-markup-para-restaurante-ejemplo':                  { es: '/es/glossary/schema/' },
};

function buildBlock({ slug, locale, glossaryUrl, toolUrl }) {
  const windowHref = locale === 'es' ? `/es/window/?topic=${encodeURIComponent(slug)}` : `/window/?topic=${encodeURIComponent(slug)}`;
  const eyebrow = locale === 'es' ? 'Qué hacer ahora' : 'What to do next';
  const readLabel  = locale === 'es' ? 'Lee' : 'Read';
  const tryLabel   = locale === 'es' ? 'Prueba' : 'Try';
  const noteLabel  = locale === 'es' ? 'O escríbele a Don' : 'Or send Don a note';
  // Link-text strings localized too — the verb labels were already
  // translated; the link bodies were leaking English into ES articles.
  const readLink = locale === 'es' ? 'el término del glosario relacionado →' : 'the related glossary term →';
  const tryLink  = locale === 'es' ? 'la herramienta que acompaña este artículo →' : 'the tool that pairs with this article →';
  const noteLink = locale === 'es' ? 'La Ventana →' : 'The Window →';
  const fallbackTool = locale === 'es' ? '/es/tools/audits/restaurant/' : '/tools/audits/restaurant/';
  const tool = toolUrl || fallbackTool;
  const fallbackGlossary = locale === 'es' ? '/es/glossary/' : '/glossary/';
  const gloss = glossaryUrl || fallbackGlossary;
  const items = [
    `        <li class="smart-next__item smart-next__read"><span class="smart-next__verb">${readLabel}:</span> <a href="${escAttr(gloss)}">${readLink}</a></li>`,
    `        <li class="smart-next__item smart-next__try"><span class="smart-next__verb">${tryLabel}:</span> <a href="${escAttr(tool)}?from=blog/${slug}&intent=watch">${tryLink}</a></li>`,
    `        <li class="smart-next__item smart-next__note"><span class="smart-next__verb">${noteLabel}:</span> <a href="${escAttr(windowHref)}">${noteLink}</a></li>`,
  ].join('\n');
  return [
    '<!-- smart-next:start -->',
    '<aside class="smart-next" aria-labelledby="smart-next-h">',
    `  <p class="smart-next__eyebrow" id="smart-next-h">${eyebrow}</p>`,
    '  <ol class="smart-next__list">',
    items,
    '  </ol>',
    '</aside>',
    '<!-- smart-next:end -->',
  ].join('\n');
}

// Detect a populated KnitRail block. If the article carries one,
// the smart-next sentinel stays collapsed — KnitRail is the
// canonical four-lane rail and this 3-line variant is retired
// per the design review's consolidation recommendation.
const KNIT_RAIL_POPULATED_RE = /<!-- knit-rail:start -->\s*<aside class="knit-rail"/;

let changed = 0;
for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');

  // Skip articles where KnitRail has populated the unified rail.
  // The smart-next sentinel may still exist in those files but
  // should remain empty. inject-knit-rail.mjs is responsible for
  // collapsing it.
  if (KNIT_RAIL_POPULATED_RE.test(src)) continue;

  const override = (READ_OVERRIDE[slug] || {})[locale];
  const glossaryUrl = override || firstGlossaryHrefIn(src);
  const toolUrl = loadPostEndCtaTool(slug, locale);
  const block = buildBlock({ slug, locale, glossaryUrl, toolUrl });

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert after the existing post-end-cta block; fall back to
    // before </article> in #post-body.
    const postEndIdx = src.indexOf('<!-- post-end-cta:end -->');
    if (postEndIdx !== -1) {
      const insertAt = postEndIdx + '<!-- post-end-cta:end -->'.length;
      next = src.slice(0, insertAt) + '\n\n      ' + block + src.slice(insertAt);
    } else {
      const m = src.match(/<article[^>]*\bid="post-body"[^>]*>/);
      if (!m) continue;
      const close = src.indexOf('</article>', m.index);
      if (close === -1) continue;
      next = src.slice(0, close) + '\n      ' + block + '\n    ' + src.slice(close);
    }
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s).`);
if (checkOnly && changed > 0) process.exit(1);
