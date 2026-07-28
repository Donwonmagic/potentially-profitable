#!/usr/bin/env node
/**
 * Positioning-drift gate — retired-line content presenting as cost content.
 *
 * WHY THIS EXISTS (2026-07-28)
 *
 * The operator's line is "we are a cost intelligence company, not a web design
 * blog." A freeze pass retired 20 articles selected by their canonical pillar
 * tag (`data/library-tags.json#blog_posts` → `topics[0]`). That sweep MISSED
 * five heavily web-design articles, including one with 74 web-design phrases in
 * its body, because every one of them is tagged `operations-margin` first —
 * filed under the cost pillar with `brand-design` demoted to second:
 *
 *     best-restaurant-website-platform          74 hits, topics[0]=operations-margin
 *     how-to-hire-a-restaurant-web-designer     33 hits, topics[0]=operations-margin
 *     custom-restaurant-website-pricing         20 hits, topics[0]=operations-margin
 *     when-to-rebuild-your-restaurant-website   11 hits, topics[0]=operations-margin
 *     does-my-restaurant-need-a-website          4 hits, topics[0]=operations-margin
 *
 * The tag said cost; the prose said web design. A tag sweep cannot catch that,
 * because the tag is the thing that is wrong. Reading the body can.
 *
 * WHAT THIS ENFORCES
 *
 * Any INDEXED article whose prose carries >= THRESHOLD retired-line phrases must
 * be either frozen (a `noindex` stamp) or listed in ALLOW with a reason. No
 * third state. A new web-design article, or one that slips a future sweep,
 * surfaces for a decision instead of sitting quietly in the cost corpus.
 *
 * This gate deliberately does NOT try to classify automatically. Raw counts do
 * not separate cleanly — a kept POS comparison scores 9 while a frozen
 * web-design piece scores 4 — so the judgement stays with a human and this gate
 * only guarantees the judgement is made and written down.
 *
 * Frozen articles are skipped entirely: freezing IS the resolution.
 *
 * Usage:
 *   node scripts/check-positioning-drift.mjs
 *   node scripts/check-positioning-drift.mjs --self-test
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const ROOTS = ['library', 'blog', 'es/library', 'es/blog'];
const THRESHOLD = 3;

/**
 * Vocabulary of the retired website-build line, EN + ES. Deliberately specific:
 * bare "website" would match half the cost corpus (every article mentions the
 * site it lives on), so these are phrases that only appear when the SUBJECT is
 * building or buying a website.
 */
export const RETIRED_VOCAB = [
  'web designer', 'web design', 'website design', 'website redesign',
  'wordpress', 'wix', 'squarespace', 'homepage design', 'site build',
  'website builder', 'domain name', 'web host', 'website platform',
  'diseñador web', 'diseño web', 'diseño de sitio', 'constructor de sitios',
  'nombre de dominio', 'plataforma de sitio',
];

/**
 * Indexed articles that legitimately score over the threshold. Each needs a
 * dated reason — an operator SPEND or SAFETY decision is cost content even when
 * it names website builders in passing.
 */
export const ALLOW = {
  'toast-vs-square-vs-clover-for-restaurants': {
    since: '2026-07-28',
    why: 'POS comparison — payment processing drives margin. The Wix/Squarespace mentions are integration context, not the subject.',
  },
  'restaurant-app-decision': {
    since: '2026-07-28',
    why: 'A spend decision ("should you build an app") whose honest answer is usually no. Cost content; builder names are incidental.',
  },
  'commission-free-online-ordering-restaurants': {
    since: '2026-07-28',
    why: 'Directly margin: avoiding 15-30% aggregator commissions. Three incidental builder mentions.',
  },
  'how-to-tell-if-a-restaurant-tool-is-safe': {
    since: '2026-07-28',
    why: 'The privacy/safety story that backs Muntin Ledger’s "your numbers stay here" promise. Builder names are examples.',
  },
  // ES mirrors of the four above — same articles, same reasoning.
  'toast-vs-square-vs-clover-para-restaurantes': { since: '2026-07-28', why: 'ES mirror of toast-vs-square-vs-clover-for-restaurants; see that entry.' },
  'decision-app-restaurante': { since: '2026-07-28', why: 'ES mirror of restaurant-app-decision; see that entry.' },
  'pedidos-en-linea-sin-comision-para-restaurantes': { since: '2026-07-28', why: 'ES mirror of commission-free-online-ordering-restaurants; see that entry.' },
  'como-saber-si-una-herramienta-de-restaurante-es-segura': { since: '2026-07-28', why: 'ES mirror of how-to-tell-if-a-restaurant-tool-is-safe; see that entry.' },
};

export const NOINDEX_RE = /<meta name="robots"[^>]*content="[^"]*noindex/i;

/** Body prose with markup and scripts removed, so we count words not attributes. */
export function prose(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ');
}

export function countRetired(text, vocab = RETIRED_VOCAB) {
  let n = 0;
  for (const phrase of vocab) {
    const re = new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    n += (text.match(re) || []).length;
  }
  return n;
}

function selfTest() {
  const cases = [
    [countRetired('We hired a web designer to do the website design.'), 2, 'counts distinct phrases'],
    [countRetired('Wix and Squarespace and WordPress'), 3, 'counts builders case-insensitively'],
    [countRetired('Your food cost and prime cost are what matter.'), 0, 'cost prose scores zero'],
    [countRetired('Visit our website for the menu.'), 0, 'bare "website" must NOT match'],
    [countRetired('Contratamos a un diseñador web.'), 1, 'ES vocabulary counts'],
    [prose('<p>a<script>var x="web design"</script>b</p>').includes('web design'), false, 'script contents are stripped'],
    [prose('<a href="/web-design/">x</a>').trim(), 'x', 'attributes are stripped'],
    [NOINDEX_RE.test('<meta name="robots" content="noindex, follow, max-image-preview:large" />'), true, 'detects the freeze stamp'],
    [NOINDEX_RE.test('<meta name="robots" content="max-image-preview:large" />'), false, 'unfrozen page is not detected'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`✗ self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  for (const [slug, e] of Object.entries(ALLOW)) {
    if (!e.since || !e.why || e.why.length < 40) {
      console.error(`✗ self-test: ALLOW["${slug}"] needs a date and a substantive reason`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`check-positioning-drift --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

function main(argv) {
  if (argv.includes('--self-test')) selfTest();

  const drifted = [];
  let scanned = 0;
  let frozen = 0;
  let allowed = 0;

  for (const root of ROOTS) {
    const dir = path.join(REPO, root);
    if (!fs.existsSync(dir)) continue;
    for (const slug of fs.readdirSync(dir)) {
      const file = path.join(dir, slug, 'index.html');
      if (!fs.existsSync(file)) continue;
      const html = fs.readFileSync(file, 'utf8');
      if (NOINDEX_RE.test(html)) { frozen++; continue; }
      scanned++;
      const n = countRetired(prose(html));
      if (n < THRESHOLD) continue;
      if (ALLOW[slug]) { allowed++; continue; }
      drifted.push({ where: `${root}/${slug}`, n });
    }
  }

  if (!drifted.length) {
    console.log(
      `check-positioning-drift: ${scanned} indexed article(s) scanned (${frozen} frozen, skipped) — none carries retired-line vocabulary above the threshold beyond ${allowed} allowlisted. 0 violations.`,
    );
    process.exit(0);
  }

  drifted.sort((a, b) => b.n - a.n);
  console.error(`check-positioning-drift: ${drifted.length} INDEXED article(s) read as web-design content:\n`);
  for (const d of drifted) console.error(`  ✗ ${String(d.n).padStart(3)} retired-line phrase(s)  ${d.where}`);
  console.error(`
This is a cost-intelligence company. An indexed article whose subject is
building or buying a website tells crawlers otherwise, and a pillar TAG cannot
catch it — the five articles that prompted this gate were all tagged
operations-margin while reading as web design.

Resolve each one deliberately:

  • It is retired-line content → freeze it. Change its robots meta from
    content="max-image-preview:large, …" to
    content="noindex, follow, max-image-preview:large, …" (EN and ES), then
    rerun build-sitemap, build-llms-txt, build-llms-full and
    inject-hub-collection-schema.
  • It is genuinely a cost, spend, or safety decision that merely names website
    builders → add it to ALLOW in this file with a dated reason.`);
  process.exit(1);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
