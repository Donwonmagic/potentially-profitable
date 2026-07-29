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

/**
 * WIDENED 2026-07-28. This gate originally scanned only library/blog — and so
 * it would NOT have caught the thing that most needed catching: /learn/start-here/,
 * the library's own entry point, whose five steps were a website-build
 * walkthrough ending in a CTA for the retired Services page. A site-wide sweep
 * found 23 indexed pages over threshold and 12 of them outside the old roots.
 *
 * That is the same failure this repo wrote a lesson about the same day: a
 * link-graph or prose audit is only as good as its root list. So the scan is now
 * a full walk of every content surface, and the skip list below is explicit —
 * each entry is skipped because it is not reader-facing prose, not because it
 * was forgotten.
 */
const SKIP_TOP = new Set([
  'node_modules', 'assets', 'brand', 'docs', 'scripts', 'src', '_includes',
  'tests', 'dist', 'data',
  // 'course' was skipped here until 2026-07-29; PR #530 deleted the directory
  // outright (301s to /cost-index/), so there is nothing left to skip.
]);
const THRESHOLD = 3;
const MAX_DEPTH = 5;

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

  // ---- surfaces the widened scan reached (2026-07-28) ----------------------
  // Hubs list every entry including frozen ones. That IS freeze-don't-delete:
  // the pages stay reachable for a human, they are simply not advertised to
  // crawlers. Pruning a hub would hide live pages, not retire them.
  'blog/index.html': { since: '2026-07-28', why: 'Blog hub — a complete listing of posts including frozen ones, which is the point of freeze-don\'t-delete.' },
  'glossary/index.html': { since: '2026-07-28', why: 'Glossary hub — lists all 171 terms including frozen ones so a reader can still reach every definition.' },
  'es/glossary/index.html': { since: '2026-07-28', why: 'ES glossary hub — lists every term including frozen ones so a reader can still reach each definition.' },

  // A glossary legitimately DEFINES adjacent vocabulary. Defining "hosting" is
  // not claiming to sell websites, and these four are load-bearing: each is
  // linked from live pages, and client-side / fetch-request / url-fragment are
  // the in-browser vocabulary behind the tools' "nothing leaves your browser"
  // promise — that is the product's privacy story, not the retired line.
  'glossary/hosting': { since: '2026-07-28', why: 'Glossary definition of an adjacent term, linked from live pages. A reference work may define words it does not sell.' },
  'glossary/client-side': { since: '2026-07-28', why: 'Backs the in-browser tools promise ("runs in your browser, keeps nothing"). Product privacy vocabulary.' },
  'glossary/fetch-request': { since: '2026-07-28', why: 'Same in-browser privacy cluster as client-side; heavily cross-linked with data-literacy.' },
  'glossary/url-fragment': { since: '2026-07-28', why: 'Same in-browser privacy cluster — how a tool keeps state without sending it anywhere.' },
  'es/glossary/hosting': { since: '2026-07-28', why: 'ES mirror of glossary/hosting — a reference work may define words it does not sell.' },
  'es/glossary/client-side': { since: '2026-07-28', why: 'ES mirror of glossary/client-side — in-browser privacy vocabulary behind the tools promise.' },
  'es/glossary/fetch-request': { since: '2026-07-28', why: 'ES mirror of glossary/fetch-request — same in-browser privacy cluster as client-side.' },
  'es/glossary/url-fragment': { since: '2026-07-28', why: 'ES mirror of glossary/url-fragment — how a tool keeps state without sending it anywhere.' },

  // Margin research that happens to have studied websites. Cited by a kept
  // AI-search article and the kept operations-margin hub; its subject is
  // dollars lost, which is cost content.
  'learn/research/the-1-percent-margin-audit-50-restaurant-websites-2026': { since: '2026-07-28', why: 'Margin research measured in dollars; cited by kept content. Websites are the sample, not the subject.' },
  'es/learn/research/the-1-percent-margin-audit-50-restaurant-websites-2026': { since: '2026-07-28', why: 'ES mirror of the margin-audit research note — websites are the sample, not the subject.' },

  // OPEN DECISION, not a settled allow. "The Restaurant Website Checklist — 30
  // Things Your Site Should Do" is retired-line by subject, but it is promoted
  // from 11 live pages (about, for/restaurants, the learn hub, start-here), so
  // retiring it is a navigation change rather than a one-token freeze. Left
  // indexed and flagged here so it stays visible until the operator decides.
  'learn/checklists/restaurant-website-checklist': { since: '2026-07-28', why: 'OPEN DECISION — retired-line by subject but promoted from 11 live pages; retiring it means editing navigation, not just stamping noindex.' },
  'es/learn/checklists/restaurant-website-checklist': { since: '2026-07-28', why: 'ES mirror of the website checklist — same OPEN DECISION, promoted from live navigation.' },
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

/** Every reader-facing .html under the repo, skipping non-prose trees. */
export function walk(repo, skip = SKIP_TOP, maxDepth = MAX_DEPTH) {
  const out = [];
  (function rec(dir, depth, rel) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const next = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth === 0 && skip.has(e.name)) continue;
        rec(path.join(dir, e.name), depth + 1, next);
      } else if (e.name.endsWith('.html')) {
        out.push(next);
      }
    }
  })(repo, 0, '');
  return out;
}

/**
 * Match an ALLOW entry for a page path. Tries the full path, the containing
 * directory, and finally the bare slug — so the original slug-keyed entries
 * keep working while new entries can be path-precise.
 */
export function allowEntry(rel, allow = ALLOW) {
  const dir = rel.replace(/\/index\.html$/, '');
  return allow[rel] || allow[dir] || allow[dir.split('/').pop()] || null;
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
    [allowEntry('library/foo/index.html', { foo: { why: 'x' } }) !== null, true, 'a bare-slug entry still matches'],
    [allowEntry('learn/checklists/bar/index.html', { 'learn/checklists/bar': { why: 'x' } }) !== null, true, 'a directory-path entry matches'],
    [allowEntry('blog/index.html', { 'blog/index.html': { why: 'x' } }) !== null, true, 'a full-path entry matches a hub file'],
    [allowEntry('library/other/index.html', { foo: { why: 'x' } }), null, 'an unrelated page is not allowed'],
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

  for (const rel of walk(REPO)) {
    const html = fs.readFileSync(path.join(REPO, rel), 'utf8');
    if (NOINDEX_RE.test(html)) { frozen++; continue; }
    scanned++;
    const n = countRetired(prose(html));
    if (n < THRESHOLD) continue;
    if (allowEntry(rel)) { allowed++; continue; }
    drifted.push({ where: rel, n });
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
