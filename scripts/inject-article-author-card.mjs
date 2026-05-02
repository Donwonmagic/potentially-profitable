#!/usr/bin/env node
/**
 * End-of-article author bio card. The trust audit flagged the gap:
 * articles have a top byline but no bottom "About the author" card,
 * which is shallow E-E-A-T signal for Google + LLM citation.
 *
 * Stamps a sentinel-bracketed block immediately before the closing
 * </article> of #post-body in every blog article (EN + ES). The card
 * carries: a portrait placeholder (the lettermark D until a real
 * photo lands), credentials chip line, a stable 2-sentence bio, and
 * routes to /about/ + /window/.
 *
 * Sentinels:
 *   <!-- article-author-card:start -->
 *   <aside class="article-author-card">…</aside>
 *   <!-- article-author-card:end -->
 *
 *   node scripts/inject-article-author-card.mjs           # rewrite
 *   node scripts/inject-article-author-card.mjs --check   # exit 1 on diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SENTINEL_RE = /<!-- article-author-card:start -->[\s\S]*?<!-- article-author-card:end -->\n?/;
// Match the closing </article> that ends #post-body (the article body
// element, not the <article> tags that may wrap meta blocks).
const POST_BODY_END_RE = /(<\/article>\s*<!--[^>]*end of #post-body[^>]*-->)|(<article[^>]*\bid="post-body"[\s\S]*?)<\/article>/i;

function articleFiles() {
  const out = [];
  for (const dir of ['blog', 'es/blog']) {
    const root = path.join(repoRoot, dir);
    if (!fs.existsSync(root)) continue;
    const locale = dir.startsWith('es') ? 'es' : 'en';
    for (const slug of fs.readdirSync(root)) {
      if (slug === 'drafts' || slug === 'index.html') continue;
      const file = path.join(root, slug, 'index.html');
      if (fs.existsSync(file)) out.push({ file, slug, locale });
    }
  }
  return out;
}

function buildCard(locale) {
  const aboutUrl  = locale === 'es' ? '/es/about/' : '/about/';
  const windowUrl = locale === 'es' ? '/es/window/' : '/window/';
  const heading   = locale === 'es' ? 'Sobre el autor' : 'About the author';
  const credLabel = locale === 'es'
    ? 'ServSafe Manager &middot; ServSafe Allergens &middot; RAM Alcohol Awareness &middot; LLC de Maryland'
    : 'ServSafe Manager &middot; ServSafe Allergens &middot; RAM Alcohol Awareness &middot; Maryland LLC';
  const bio = locale === 'es'
    ? 'Soy Don. Llevo dos restaurantes en el DMV &mdash; The Irish Inn at Glen Echo y Tacombi Bethesda &mdash; y construyo Muntin Digital, el estudio web de una sola persona detr&aacute;s de esta biblioteca. Cada art&iacute;culo aqu&iacute; sale de un problema que vi en piso o en una auditor&iacute;a de cliente.'
    : 'I&rsquo;m Don. I manage two DMV restaurants &mdash; The Irish Inn at Glen Echo and Tacombi Bethesda &mdash; and I run Muntin Digital, the one-person web studio behind this library. Every article here comes from a problem I saw on the floor or in a client audit.';
  const moreLabel = locale === 'es' ? 'Conoce a Don &rarr;' : 'More about Don &rarr;';
  const writeLabel = locale === 'es' ? 'Escr&iacute;bele &rarr;' : 'Email Don &rarr;';
  return [
    '<!-- article-author-card:start -->',
    `<aside class="article-author-card" aria-labelledby="article-author-h" style="margin:48px 0 0;padding:24px;border:1px solid var(--line);border-radius:12px;background:var(--cream-2);display:flex;gap:20px;align-items:flex-start;flex-wrap:wrap">`,
    `  <div class="article-author-card__avatar" aria-hidden="true" style="flex:0 0 auto;width:72px;height:72px;border-radius:50%;background:var(--teal);color:var(--cream);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-size:34px;font-weight:500;letter-spacing:-0.02em">D</div>`,
    `  <div class="article-author-card__body" style="flex:1 1 280px;min-width:0">`,
    `    <p class="article-author-card__eyebrow" style="font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--stone);margin:0 0 4px" id="article-author-h">${heading}</p>`,
    `    <p class="article-author-card__name" style="font-family:var(--font-display);font-size:20px;font-weight:500;color:var(--ink);margin:0 0 6px"><a href="${aboutUrl}" style="color:var(--ink)">Don Goldstein</a></p>`,
    `    <p class="article-author-card__bio" style="font-size:14.5px;line-height:1.6;color:var(--ink-soft);margin:0 0 10px">${bio}</p>`,
    `    <p class="article-author-card__creds" style="font-size:12px;color:var(--stone);margin:0 0 12px;letter-spacing:0.01em">${credLabel}</p>`,
    `    <p class="article-author-card__cta" style="font-size:14px;margin:0">`,
    `      <a href="${aboutUrl}" style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none;margin-right:14px">${moreLabel}</a>`,
    `      <a href="${windowUrl}" class="js-window" style="color:var(--teal);font-weight:600;border-bottom:1px dashed currentColor;text-decoration:none">${writeLabel}</a>`,
    `    </p>`,
    `  </div>`,
    `</aside>`,
    '<!-- article-author-card:end -->',
  ].join('\n');
}

let changed = 0;
let skipped = 0;
for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const block = buildCard(locale);

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // Insert directly before the </article> that closes #post-body.
    // The article body opens with <article ... id="post-body"> and
    // closes with </article> at the end of the prose; we insert the
    // card just before that closing tag so it renders as the last
    // thing in the body.
    const m = src.match(/<article[^>]*\bid="post-body"[\s\S]*?<\/article>/);
    if (!m) { skipped++; continue; }
    const matched = m[0];
    const insertAt = matched.lastIndexOf('</article>');
    const replaced = matched.slice(0, insertAt) + block + '\n  ' + matched.slice(insertAt);
    next = src.replace(matched, replaced);
  }

  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
