#!/usr/bin/env node
/**
 * Phase G.5 (Growth) — stamp TL;DR + Key Takeaways blocks on every
 * blog post that has content registered in data/article-content.json.
 *
 * Two sentinel-bracketed asides per article:
 *
 *   <!-- article-tldr:start -->
 *   <aside class="tldr" data-llm="tldr">…</aside>
 *   <!-- article-tldr:end -->
 *
 *   <!-- article-takeaways:start -->
 *   <aside class="key-takeaways" data-llm="takeaways">…</aside>
 *   <!-- article-takeaways:end -->
 *
 * The TL;DR lands directly inside #post-body, before the article's
 * existing first <p>. The Key Takeaways lands at the end of #post-body,
 * after the last <p>. Both blocks reuse the .tldr / .key-takeaways
 * styles shipped in G.1.
 *
 * When an article retrofits successfully, the data-content-pending
 * attribute is removed from <body> — ending the G.1 escape hatch.
 *
 *   node scripts/inject-article-tldr.mjs           # rewrite
 *   node scripts/inject-article-tldr.mjs --check   # exit 1 on diff
 *   node scripts/inject-article-tldr.mjs --es      # use article-content.es.json
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');
const esMode     = process.argv.includes('--es');

const TLDR_RE       = /<!-- article-tldr:start -->[\s\S]*?<!-- article-tldr:end -->/;
const TAKEAWAYS_RE  = /<!-- article-takeaways:start -->[\s\S]*?<!-- article-takeaways:end -->/;
const POST_BODY_OPEN = /<article[^>]*\bid="post-body"[^>]*>/i;
const POST_BODY_CLOSE = /<\/article>/i;
const PENDING_ATTR_RE = /\s+data-content-pending="\d{4}-\d{2}-\d{2}"/;

function escHtml(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

function buildTldr(bullets, locale) {
  const eyebrow = locale === 'es' ? 'Resumen' : 'TL;DR';
  const items = bullets.map((b) => `        <li>${escHtml(b)}</li>`).join('\n');
  return [
    '<!-- article-tldr:start -->',
    `      <aside class="tldr" data-llm="tldr" aria-label="${eyebrow}">`,
    `        <p class="tldr__eyebrow">${eyebrow}</p>`,
    `        <ul class="tldr__list">`,
    items,
    `        </ul>`,
    '      </aside>',
    '      <!-- article-tldr:end -->',
  ].join('\n      ');
}

function buildTakeaways(bullets, locale) {
  const eyebrow = locale === 'es' ? 'Lo que importa' : 'Key takeaways';
  const items = bullets.map((b) => `        <li>${escHtml(b)}</li>`).join('\n');
  return [
    '<!-- article-takeaways:start -->',
    `      <aside class="key-takeaways" data-llm="takeaways" aria-label="${eyebrow}">`,
    `        <p class="key-takeaways__eyebrow">${eyebrow}</p>`,
    `        <ul class="key-takeaways__list">`,
    items,
    `        </ul>`,
    '      </aside>',
    '      <!-- article-takeaways:end -->',
  ].join('\n      ');
}

function injectInto(src, tldrBlock, takeawaysBlock) {
  let next = src;
  // 1. Replace or insert the TL;DR block right after the
  //    <article id="post-body"> opener.
  if (TLDR_RE.test(next)) {
    next = next.replace(TLDR_RE, tldrBlock);
  } else {
    const m = next.match(POST_BODY_OPEN);
    if (!m) return null;
    const insertAt = m.index + m[0].length;
    next = next.slice(0, insertAt) + '\n      ' + tldrBlock + '\n' + next.slice(insertAt);
  }
  // 2. Replace or insert the Key Takeaways block right before the
  //    closing </article> of #post-body.
  if (TAKEAWAYS_RE.test(next)) {
    next = next.replace(TAKEAWAYS_RE, takeawaysBlock);
  } else {
    const openIdx = next.search(POST_BODY_OPEN);
    if (openIdx === -1) return null;
    const tail = next.slice(openIdx);
    const closeMatch = tail.match(/<\/article>/);
    if (!closeMatch) return null;
    const closeIdx = openIdx + closeMatch.index;
    next = next.slice(0, closeIdx) + takeawaysBlock + '\n    ' + next.slice(closeIdx);
  }
  // 3. Only remove the data-content-pending escape hatch if the
  //    article ALSO meets the cross-link density required by
  //    check-content-guardrails (≥3 glossary, ≥2 tool). Articles
  //    that don't keep the hatch — the TL;DR still helps AI search
  //    even before the link density gets backfilled.
  const glossaryLinks = (next.match(/href="\/(?:es\/)?glossary\/[a-z0-9-]+\//g) || []).length;
  const toolLinks = (next.match(/href="\/(?:es\/)?tools\/[a-z0-9/-]+\//g) || []).length;
  if (glossaryLinks >= 3 && toolLinks >= 2) {
    next = next.replace(PENDING_ATTR_RE, '');
  }
  return next;
}

function articleFiles(locale) {
  const out = [];
  const dir = path.join(repoRoot, locale === 'es' ? 'es/blog' : 'blog');
  if (!fs.existsSync(dir)) return out;
  for (const slug of fs.readdirSync(dir)) {
    if (slug === 'drafts') continue;
    const file = path.join(dir, slug, 'index.html');
    if (fs.existsSync(file)) out.push({ file, slug });
  }
  return out;
}

const locale = esMode ? 'es' : 'en';
const dataPath = path.join(repoRoot, esMode ? 'data/article-content.es.json' : 'data/article-content.json');
if (!fs.existsSync(dataPath)) {
  console.log(`${path.basename(dataPath)} not found — skipping (${locale} retrofit deferred)`);
  process.exit(0);
}
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const articles = data.articles || {};

let changed = 0;
let skipped = 0;
const targets = articleFiles(locale);
for (const { file, slug } of targets) {
  const entry = articles[slug];
  if (!entry || !entry.tldr || !entry.key_takeaways) {
    skipped++;
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  const tldrBlock = buildTldr(entry.tldr, locale);
  const takeawaysBlock = buildTakeaways(entry.key_takeaways, locale);
  const next = injectInto(src, tldrBlock, takeawaysBlock);
  if (next == null) {
    console.warn(`${path.relative(repoRoot, file)}: no #post-body opener — skipped`);
    continue;
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${targets.length} ${locale.toUpperCase()} article(s); ${skipped} skipped (no entry).`);
if (checkOnly && changed > 0) process.exit(1);
