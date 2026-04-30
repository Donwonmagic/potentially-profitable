#!/usr/bin/env node
/**
 * Phase G.2 (Growth) — schema depth for tool pages.
 *
 * Injects a sentinel-bracketed second <script type="application/ld+json">
 * block into every tool page (EN + ES). The block contains:
 *
 *   - A SoftwareApplication node that re-references the existing tool's
 *     @id, adding featureList, applicationSubCategory: "RestaurantOps",
 *     and a screenshot URL (the tool's OG card).
 *   - A sibling HowTo node ("How to read your <tool> result") with
 *     3 short steps. LLM search engines (ChatGPT, Perplexity, Google AI
 *     Overviews) lift HowTo step text + featureList nearly verbatim.
 *
 * Locale-aware via data/tool-howto.json's `name_en/_es`,
 * `featureList_en/_es`, and `steps_en/_es` shapes.
 *
 * Sentinels:
 *   <!-- tool-schema:start -->
 *   <script type="application/ld+json">{...}</script>
 *   <!-- tool-schema:end -->
 *
 *   node scripts/inject-tool-howto.mjs           # rewrite
 *   node scripts/inject-tool-howto.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- tool-schema:start -->[\s\S]*?<!-- tool-schema:end -->/;

const data = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/tool-howto.json'), 'utf8'));
const TOOLS = data.tools;

function ogCardFor(slug) {
  // Sub-tools (audits/restaurant) collapse to tool-audits-restaurant.png
  // matching the pattern in scripts/build-og-cards.mjs.
  const flat = slug.replace(/\//g, '-');
  return `${SITE}/brand/og/tool-${flat}.png`;
}

function buildBlock({ slug, locale, entry }) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/tools/${slug}/`;
  const featureList = locale === 'es' ? entry.featureList_es : entry.featureList_en;
  const howtoName = locale === 'es' ? entry.name_es : entry.name_en;
  const stepsRaw  = locale === 'es' ? entry.steps_es : entry.steps_en;
  const steps = stepsRaw.map((s, i) => ({
    '@type': 'HowToStep',
    position: i + 1,
    name: s.name,
    text: s.text,
    url: `${baseUrl}#step-${i + 1}`,
  }));

  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${baseUrl}#tool`,
        applicationCategory: 'BusinessApplication',
        applicationSubCategory: 'RestaurantOps',
        operatingSystem: 'Web',
        screenshot: ogCardFor(slug),
        featureList,
      },
      {
        '@type': 'HowTo',
        '@id': `${baseUrl}#howto`,
        name: howtoName,
        step: steps,
        about: { '@id': `${baseUrl}#tool` },
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
      },
    ],
  };

  const json = JSON.stringify(obj, null, 2);
  return [
    '<!-- tool-schema:start -->',
    `<script type="application/ld+json">\n${json}\n</script>`,
    '<!-- tool-schema:end -->',
  ].join('\n');
}

function findToolPages() {
  const out = [];
  for (const root of ['tools', 'es/tools']) {
    const fullRoot = path.join(repoRoot, root);
    if (!fs.existsSync(fullRoot)) continue;
    const locale = root.startsWith('es') ? 'es' : 'en';
    function walk(rel) {
      const full = path.join(fullRoot, rel);
      for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
        if (!entry.isDirectory()) continue;
        const sub = path.posix.join(rel, entry.name);
        const idx = path.join(fullRoot, sub, 'index.html');
        if (fs.existsSync(idx)) out.push({ file: idx, slug: sub.replace(/^\/+/, ''), locale });
        walk(sub);
      }
    }
    walk('');
  }
  return out;
}

let changed = 0;
let skipped = 0;
const pages = findToolPages();
for (const { file, slug, locale } of pages) {
  // Allow either the literal slug or, for sub-tools, just the leaf
  // (audits/restaurant, brand-suite/, etc.). We register sub-tools
  // by their compound slug; index pages get skipped by absence.
  const entry = TOOLS[slug];
  if (!entry) {
    skipped++;
    continue;
  }
  const src = fs.readFileSync(file, 'utf8');
  const block = buildBlock({ slug, locale, entry });

  let next;
  if (SENTINEL_RE.test(src)) {
    next = src.replace(SENTINEL_RE, block);
  } else {
    // First-time insert: place directly before </head>.
    const headM = src.match(/<\/head>/);
    if (!headM) continue;
    next = src.replace('</head>', `${block}\n</head>`);
  }
  if (next === src) continue;
  if (!checkOnly) fs.writeFileSync(file, next);
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
  changed++;
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} of ${pages.length} tool page(s); ${skipped} skipped (no howto entry).`);
if (checkOnly && changed > 0) process.exit(1);
