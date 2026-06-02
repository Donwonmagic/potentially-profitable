#!/usr/bin/env node
/**
 * Wave G1 (Glossary growth) — stamp a per-term FAQ onto glossary term
 * pages, as BOTH a visible on-page section and a FAQPage JSON-LD node.
 *
 * Google's FAQ rich-result policy requires the FAQ to be visible on the
 * page (schema-only is non-compliant), so this injector does two things,
 * both idempotent and sentinel-bracketed:
 *
 *   1. Visible section — inserted after <!-- glossary-explainer-cue:end -->
 *      inside the term-body, wrapped in <!-- glossary-faq:start/end -->.
 *   2. FAQPage JSON-LD — a SEPARATE <script type="application/ld+json">
 *      block wrapped in <!-- glossary-faq-schema:start/end -->, inserted
 *      before </head>. Kept independent of the glossary-article-schema
 *      block (which regenerates its own @graph from a template and would
 *      otherwise strip a merged-in node).
 *
 * Source of truth: data/glossary-faq.json. Every answer there is derived
 * only from the term's already-fact-checked def/why prose — this script
 * introduces no new claims.
 *
 *   node scripts/inject-glossary-faq.mjs           # rewrite
 *   node scripts/inject-glossary-faq.mjs --check    # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';

const dataPath = path.join(repoRoot, 'data/glossary-faq.json');
if (!fs.existsSync(dataPath)) { console.log('glossary-faq data missing — skipping'); process.exit(0); }
const faqs = (JSON.parse(fs.readFileSync(dataPath, 'utf8')).faqs) || {};

const VISIBLE_RE = /\n?\s*<!-- glossary-faq:start -->[\s\S]*?<!-- glossary-faq:end -->/;
const SCHEMA_RE  = /\n?\s*<!-- glossary-faq-schema:start -->[\s\S]*?<!-- glossary-faq-schema:end -->/;
const CUE_END = '<!-- glossary-explainer-cue:end -->';

function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
// JSON-LD strings: escape per JSON; the surrounding JSON.stringify handles it,
// but answers may contain a stray backslash — normalize first.
function cleanForJson(s) {
  return String(s).replace(/\\(?!["\\/bfnrtu])/g, '');
}

function buildVisible(list, locale) {
  const heading = locale === 'es' ? 'Preguntas frecuentes' : 'Frequently asked';
  const rows = list.map((qa) => [
    '        <div class="term-faq__item">',
    `          <h3 class="term-faq__q">${escHtml(qa.q)}</h3>`,
    `          <p class="term-faq__a">${escHtml(qa.a)}</p>`,
    '        </div>',
  ].join('\n')).join('\n');
  return [
    '',
    '      <!-- glossary-faq:start -->',
    `      <section class="term-faq" aria-labelledby="term-faq-h">`,
    `        <h2 class="term-faq__h" id="term-faq-h">${heading}</h2>`,
    rows,
    '      </section>',
    '      <!-- glossary-faq:end -->',
  ].join('\n');
}

function faqNode(slug, list, locale) {
  const base = `${SITE}${locale === 'es' ? '/es' : ''}/glossary/${slug}/`;
  return {
    '@type': 'FAQPage',
    '@id': `${base}#faq`,
    inLanguage: locale === 'es' ? 'es' : 'en-US',
    mainEntity: list.map((qa) => ({
      '@type': 'Question',
      name: cleanForJson(qa.q),
      acceptedAnswer: { '@type': 'Answer', text: cleanForJson(qa.a) },
    })),
  };
}

function buildSchemaBlock(slug, list, locale) {
  const doc = { '@context': 'https://schema.org', '@graph': [faqNode(slug, list, locale)] };
  return [
    '',
    '<!-- glossary-faq-schema:start -->',
    '<script type="application/ld+json">',
    JSON.stringify(doc, null, 2),
    '</script>',
    '<!-- glossary-faq-schema:end -->',
  ].join('\n');
}

// FAQPage lives in its OWN script block (before </head>), independent of
// the glossary-article-schema block so the two injectors never collide.
function injectSchema(src, slug, list, locale) {
  const block = buildSchemaBlock(slug, list, locale);
  if (SCHEMA_RE.test(src)) return src.replace(SCHEMA_RE, block);
  if (src.includes('</head>')) return src.replace('</head>', `${block}\n</head>`);
  return src;
}

function findTerms(rootDir) {
  if (!fs.existsSync(rootDir)) return [];
  const out = [];
  for (const e of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const f = path.join(rootDir, e.name, 'index.html');
    if (fs.existsSync(f)) out.push({ slug: e.name, file: f });
  }
  return out;
}

let changed = 0, skipped = 0;
const diffs = [];
for (const [locale, dir] of [['en', 'glossary'], ['es', 'es/glossary']]) {
  for (const { slug, file } of findTerms(path.join(repoRoot, dir))) {
    const entry = faqs[slug];
    const list = entry && entry[locale];
    if (!list || !list.length) { skipped++; continue; }
    const src = fs.readFileSync(file, 'utf8');
    if (!src.includes(CUE_END)) { skipped++; continue; }

    // 1) visible section (idempotent replace or insert after the cue)
    let next = src;
    const block = buildVisible(list, locale);
    if (VISIBLE_RE.test(next)) {
      next = next.replace(VISIBLE_RE, block);
    } else {
      next = next.replace(CUE_END, CUE_END + block);
    }
    // 2) schema node
    next = injectSchema(next, slug, list, locale);

    if (next !== src) {
      diffs.push(path.relative(repoRoot, file));
      if (!checkOnly) fs.writeFileSync(file, next);
      changed++;
    }
  }
}

if (checkOnly && changed) {
  console.error(`glossary-faq: would update ${changed} file(s).`);
  for (const d of diffs.slice(0, 8)) console.error('  · ' + d);
  if (diffs.length > 8) console.error(`  … and ${diffs.length - 8} more`);
  process.exit(1);
}
console.log(`glossary-faq: ${changed} file(s) updated, ${skipped} skipped.`);
