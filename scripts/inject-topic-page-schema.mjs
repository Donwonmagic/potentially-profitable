#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — stamp Article + BreadcrumbList + ItemList
 * JSON-LD on every /learn/topics/<slug>/ page (EN + ES). The
 * essay shipped via inject-topic-pillar-essay.mjs becomes the
 * Article body in the schema; the cluster's articles become the
 * ItemList.
 *
 *   node scripts/inject-topic-page-schema.mjs           # rewrite
 *   node scripts/inject-topic-page-schema.mjs --check   # exit 1 on diff
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SITE = 'https://muntin.digital';
const SENTINEL_RE = /<!-- topic-schema:start -->[\s\S]*?<!-- topic-schema:end -->/;

const TOPIC_LABELS = {
  'local-seo':         { en: 'Local SEO',           es: 'SEO local' },
  'operations-margin': { en: 'Operations & Margin', es: 'Operaciones y márgenes' },
  'conversions':       { en: 'Conversions',         es: 'Conversiones' },
  'speed-mobile':      { en: 'Speed & Mobile',      es: 'Velocidad y móvil' },
  'trust-reviews':     { en: 'Trust & Reviews',     es: 'Confianza y reseñas' },
  'brand-design':      { en: 'Brand & Design',      es: 'Marca y diseño' },
  'information-security': { en: 'Information Security', es: 'Seguridad informática' },
};

function listTopicArticles(slug, locale) {
  // Heuristic: find the in-page <a href="/blog/..."> links inside
  // the topic page itself, dedupe, and use those as ItemList.
  const file = path.join(repoRoot, locale === 'es' ? 'es' : '', 'learn/topics', slug, 'index.html');
  if (!fs.existsSync(file)) return [];
  let src = fs.readFileSync(file, 'utf8');
  // Drop the batch-banner marquee before scraping. It links to whichever timely
  // dispatch is currently promoted, and inject-batch-banner.mjs hides it once the
  // campaign window passes — which runs AFTER this injector in the build chain.
  // Counting that transient link would seed the permanent ItemList with a promo
  // and break idempotency the day the banner retires (the end-of-build --check
  // then sees one fewer link than the writer baked in). The ItemList is the
  // topic's article cluster, never the rotating banner.
  src = src.replace(/<!-- batch-banner:start -->[\s\S]*?<!-- batch-banner:end -->/g, '');
  const re = locale === 'es' ? /href="\/es\/blog\/([a-z0-9-]+)\//g : /href="\/blog\/([a-z0-9-]+)\//g;
  const seen = new Set();
  const out = [];
  let m;
  while ((m = re.exec(src))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    out.push(m[1]);
  }
  return out.slice(0, 12);
}

function buildBlock(slug, locale) {
  const baseUrl = `${SITE}${locale === 'es' ? '/es' : ''}/learn/topics/${slug}/`;
  const learnUrl = `${SITE}${locale === 'es' ? '/es' : ''}/learn/`;
  const topicLabels = TOPIC_LABELS[slug] || { en: slug, es: slug };
  const label = locale === 'es' ? topicLabels.es : topicLabels.en;
  const articles = listTopicArticles(slug, locale);

  const obj = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        '@id': `${baseUrl}#article`,
        headline: label,
        url: baseUrl,
        inLanguage: locale === 'es' ? 'es-US' : 'en-US',
        author: { '@id': `${SITE}/#don-goldstein` },
        publisher: { '@id': `${SITE}/#business` },
        isPartOf: { '@id': `${learnUrl}#collection` },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: locale === 'es' ? 'Inicio' : 'Home', item: `${SITE}${locale === 'es' ? '/es' : ''}/` },
          { '@type': 'ListItem', position: 2, name: locale === 'es' ? 'Biblioteca' : 'Library', item: learnUrl },
          { '@type': 'ListItem', position: 3, name: locale === 'es' ? 'Temas' : 'Topics', item: `${SITE}${locale === 'es' ? '/es' : ''}/learn/topics/` },
          { '@type': 'ListItem', position: 4, name: label, item: baseUrl },
        ],
      },
      {
        '@type': 'ItemList',
        '@id': `${baseUrl}#articles`,
        numberOfItems: articles.length,
        itemListElement: articles.map((a, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${SITE}${locale === 'es' ? '/es' : ''}/blog/${a}/`,
        })),
      },
    ],
  };
  const json = JSON.stringify(obj, null, 2);
  return [
    '<!-- topic-schema:start -->',
    `<script type="application/ld+json">\n${json}\n</script>`,
    '<!-- topic-schema:end -->',
  ].join('\n');
}

let changed = 0;
for (const locale of ['en', 'es']) {
  const dir = path.join(repoRoot, locale === 'es' ? 'es' : '', 'learn/topics');
  if (!fs.existsSync(dir)) continue;
  for (const slug of fs.readdirSync(dir)) {
    const file = path.join(dir, slug, 'index.html');
    if (!fs.existsSync(file)) continue;
    if (!TOPIC_LABELS[slug]) continue;
    const src = fs.readFileSync(file, 'utf8');
    const block = buildBlock(slug, locale);
    let next;
    if (SENTINEL_RE.test(src)) {
      next = src.replace(SENTINEL_RE, block);
    } else {
      const headEnd = src.indexOf('</head>');
      if (headEnd === -1) continue;
      next = src.slice(0, headEnd) + block + '\n' + src.slice(headEnd);
    }
    if (next === src) continue;
    if (!checkOnly) fs.writeFileSync(file, next);
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
    changed++;
  }
}
console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} topic page(s).`);
if (checkOnly && changed > 0) process.exit(1);
