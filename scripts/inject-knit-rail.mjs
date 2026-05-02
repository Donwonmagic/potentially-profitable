#!/usr/bin/env node
/**
 * KnitRail — unified four-lane "what's next" component for articles.
 *
 * The cohesion audit flagged a stack of competing rails at the foot
 * of every article (smart-next + see-also + further-reading +
 * post-end-cta). The KnitRail collapses the structured "next step"
 * surface into a single four-column block:
 *
 *   Apply  → a tool the article calls back to
 *   Read   → the next article in the same topic cluster
 *   Define → one key glossary term central to the article
 *   Talk   → /window/?topic=<slug>  (Email Don)
 *
 * Sentinel-bracketed and idempotent. The smart-next sentinel is
 * collapsed (the new KnitRail supersedes it on every article that
 * has KnitRail data). The post-end-cta + see-also blocks are kept:
 * post-end-cta stays the inline closing argument; see-also stays
 * the "more in this topic" browse rail.
 *
 *   node scripts/inject-knit-rail.mjs           # rewrite
 *   node scripts/inject-knit-rail.mjs --check   # exit 1 on diff
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const KNIT_SENTINEL_RE = /<!-- knit-rail:start -->[\s\S]*?<!-- knit-rail:end -->\n?/;
const SMART_SENTINEL_RE = /<!-- smart-next:start -->[\s\S]*?<!-- smart-next:end -->\n?/;
const POST_END_RE = /<!-- post-end-cta:end -->/;

const POST_END_CTA = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/post-end-cta.json'), 'utf8'));

// Slug-specific Define overrides — the same map used by
// inject-smart-next-cta.mjs's READ_OVERRIDE. Centralizing the
// Define source here so the two injectors stay aligned.
const DEFINE_OVERRIDE = {
  'does-my-restaurant-need-a-website':                       { en: { url: '/glossary/owned-channel/',           label: 'Owned channel'              }, es: { url: '/es/glossary/owned-channel/',           label: 'Canal propio'                } },
  'can-chatgpt-write-your-restaurant-website':               { en: { url: '/glossary/cuisine-pitch/',           label: 'Cuisine pitch'              }, es: { url: '/es/glossary/cuisine-pitch/',           label: 'Cuisine pitch'                } },
  'what-should-be-on-a-restaurant-website':                  { en: { url: '/glossary/above-the-fold/',          label: 'Above the fold'             }, es: { url: '/es/glossary/above-the-fold/',          label: 'Above the fold'               } },
  'como-saber-si-una-herramienta-de-restaurante-es-segura':  {                                                                                          es: { url: '/es/glossary/client-side-tool/',         label: 'Herramienta client-side'      } },
  'como-salir-de-doordash-mi-restaurante':                   {                                                                                          es: { url: '/es/glossary/owned-channel/',            label: 'Canal propio'                 } },
  'cuanto-cuesta-una-pagina-web-para-restaurante-2026':      {                                                                                          es: { url: '/es/glossary/care-plan/',                label: 'Care plan'                    } },
  'mi-restaurante-no-aparece-en-google-maps':                {                                                                                          es: { url: '/es/glossary/gbp/',                      label: 'Google Business Profile'      } },
  'schema-markup-para-restaurante-ejemplo':                  {                                                                                          es: { url: '/es/glossary/schema/',                   label: 'Schema markup'                } },
};

// Build article-slug → topic-slug reverse map by scraping each
// /learn/topics/<slug>/index.html for `topic-article-card href`.
function buildArticleTopicMap(locale) {
  const map = {};
  const root = path.join(repoRoot, locale === 'es' ? 'es/learn/topics' : 'learn/topics');
  if (!fs.existsSync(root)) return map;
  for (const topicSlug of fs.readdirSync(root)) {
    const f = path.join(root, topicSlug, 'index.html');
    if (!fs.existsSync(f)) continue;
    const src = fs.readFileSync(f, 'utf8');
    const blogPrefix = locale === 'es' ? '/es/blog/' : '/blog/';
    const re = new RegExp(`<a class="topic-article-card" href="${blogPrefix}([^"/]+)/`, 'g');
    let m;
    let order = 0;
    while ((m = re.exec(src)) !== null) {
      const slug = m[1];
      // Keep the first topic match per article (an article can appear
      // in multiple topic clusters; the first one is canonical for the
      // KnitRail "Read next" pick).
      if (!map[slug]) map[slug] = { topic: topicSlug, order };
      order++;
    }
  }
  return map;
}

function buildTopicArticleList(locale, topicSlug) {
  const f = path.join(repoRoot, locale === 'es' ? 'es/learn/topics' : 'learn/topics', topicSlug, 'index.html');
  if (!fs.existsSync(f)) return [];
  const src = fs.readFileSync(f, 'utf8');
  const blogPrefix = locale === 'es' ? '/es/blog/' : '/blog/';
  const re = new RegExp(`<a class="topic-article-card" href="${blogPrefix}([^"/]+)/`, 'g');
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

function readArticleTitle(file) {
  const src = fs.readFileSync(file, 'utf8');
  const m = src.match(/<title>([^<]+)<\/title>/);
  if (!m) return null;
  // Strip the " | Muntin Digital" / " — Muntin Digital glossary" suffix
  // and any pipe-separated trailing fragments. The remainder is a
  // good link label.
  return m[1].split(' | ')[0].split(' — Muntin')[0].split(' — Una')[0].trim();
}

function firstGlossaryHrefIn(src) {
  const m = src.match(/<article[^>]*\bid="post-body"[^>]*>([\s\S]*?)<\/article>/i);
  if (!m) return null;
  const body = m[1];
  // Match the FIRST autolinked glossary term with a popover blurb,
  // because those are the deliberate cross-references (vs. passing
  // mentions). Falls back to any /glossary/<slug>/ link if no
  // popover-annotated link is present.
  const annotated = body.match(/<a href="(\/(?:es\/)?glossary\/[a-z0-9-]+\/)"[^>]*data-glossary-blurb="([^"]+)"[^>]*data-glossary-head="([^"]+)"/);
  if (annotated) return { url: annotated[1], label: decodeEntities(annotated[3]) };
  const plain = body.match(/<a href="(\/(?:es\/)?glossary\/([a-z0-9-]+)\/)"[^>]*>([^<]+)<\/a>/);
  if (plain) return { url: plain[1], label: plain[3].trim() };
  return null;
}

function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
          .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&rsquo;/g, '’')
          .replace(/&ldquo;/g, '“').replace(/&rdquo;/g, '”')
          .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–');
}

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

function articleTitleForSlug(slug, locale) {
  const file = path.join(repoRoot, locale === 'es' ? 'es/blog' : 'blog', slug, 'index.html');
  if (!fs.existsSync(file)) return null;
  return readArticleTitle(file);
}

function ctaToolFor(slug, locale) {
  const post = (POST_END_CTA.posts || {})[slug];
  if (!post) return null;
  const url = locale === 'es' ? post.tool_url_es : post.tool_url_en;
  const label = locale === 'es' ? post.tool_label_es : post.tool_label_en;
  if (!url || !label) return null;
  // Strip the verb-prefix from "Open Margin Math" → "Margin Math".
  // The KnitRail's verb chip already says "Apply"; the link text
  // shouldn't repeat the verb.
  const trimmed = label.replace(/^(Open|Run|Abrir|Correr)\s+/i, '');
  return { url, label: trimmed };
}

function nextInTopicFor(slug, locale, articleTopicMap) {
  const meta = articleTopicMap[slug];
  if (!meta) return null;
  const ordered = buildTopicArticleList(locale, meta.topic);
  const i = ordered.indexOf(slug);
  if (i === -1) return null;
  // Prefer the next article in the cluster; if the current is the
  // last one, fall back to the first (cyclic). A reader at the end
  // of a cluster benefits more from a fresh path through it than
  // from a dead-end.
  const nextSlug = ordered[i + 1] || ordered[0];
  if (!nextSlug || nextSlug === slug) return null;
  const title = articleTitleForSlug(nextSlug, locale);
  if (!title) return null;
  const blogPrefix = locale === 'es' ? '/es/blog/' : '/blog/';
  return { url: `${blogPrefix}${nextSlug}/`, label: title };
}

function defineFor(slug, locale, articleSrc) {
  // Per-slug overrides win over body extraction — keeps
  // intentionally-routed reads (the agent's recommendation for
  // articles whose body has no autolinks) consistent.
  const ov = (DEFINE_OVERRIDE[slug] || {})[locale];
  if (ov) return ov;
  const found = firstGlossaryHrefIn(articleSrc);
  if (found) return found;
  // Fallback to the bare glossary index. Worst case is a generic
  // browse target; the KnitRail still renders four populated
  // columns rather than dropping the lane.
  const url = locale === 'es' ? '/es/glossary/' : '/glossary/';
  const label = locale === 'es' ? 'Glosario' : 'Glossary';
  return { url, label };
}

function talkFor(slug, locale) {
  const url = locale === 'es' ? `/es/window/?topic=${encodeURIComponent(slug)}` : `/window/?topic=${encodeURIComponent(slug)}`;
  const label = locale === 'es' ? 'Escr&iacute;bele a Don' : 'Email Don';
  return { url, label };
}

function buildBlock({ slug, locale, articleSrc, articleTopicMap }) {
  const apply  = ctaToolFor(slug, locale);
  const read   = nextInTopicFor(slug, locale, articleTopicMap);
  const define = defineFor(slug, locale, articleSrc);
  const talk   = talkFor(slug, locale);

  // If there's no Apply (the article opted out of post-end-cta),
  // skip the rail entirely — those are deliberately CTA-free
  // articles per data/post-end-cta.json `_status.skipped`.
  if (!apply || !read) return null;

  const heading = locale === 'es' ? 'Sigue adelante.' : 'Keep going.';
  const verbApply  = locale === 'es' ? 'Aplica'    : 'Apply';
  const verbRead   = locale === 'es' ? 'Lee'       : 'Read';
  const verbDefine = locale === 'es' ? 'Define'    : 'Define';
  const verbTalk   = locale === 'es' ? 'Habla'     : 'Talk';

  return [
    '<!-- knit-rail:start -->',
    `<aside class="knit-rail" data-knit="article" aria-labelledby="knit-rail-h-${slug}">`,
    `  <h3 class="knit-rail__h" id="knit-rail-h-${slug}">${heading}</h3>`,
    '  <ol class="knit-rail__cols">',
    `    <li class="knit-rail__col"><span class="knit-rail__verb">${verbApply}</span><a href="${apply.url}">${escHtml(apply.label)}</a></li>`,
    `    <li class="knit-rail__col"><span class="knit-rail__verb">${verbRead}</span><a href="${read.url}">${escHtml(read.label)}</a></li>`,
    `    <li class="knit-rail__col"><span class="knit-rail__verb">${verbDefine}</span><a href="${define.url}">${escHtml(define.label)}</a></li>`,
    `    <li class="knit-rail__col"><span class="knit-rail__verb">${verbTalk}</span><a href="${talk.url}" class="js-window">${talk.label}</a></li>`,
    '  </ol>',
    '</aside>',
    '<!-- knit-rail:end -->',
  ].join('\n');
}

function escHtml(s) {
  // Already-encoded entities should pass through (e.g. &mdash; in
  // article titles); plain " < > & ' get converted.
  return String(s)
    .replace(/&(?!#?\w+;)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

let changed = 0;
let skipped = 0;
const articleTopicMapEN = buildArticleTopicMap('en');
const articleTopicMapES = buildArticleTopicMap('es');

for (const { file, slug, locale } of articleFiles()) {
  const src = fs.readFileSync(file, 'utf8');
  const articleTopicMap = locale === 'es' ? articleTopicMapES : articleTopicMapEN;
  const block = buildBlock({ slug, locale, articleSrc: src, articleTopicMap });

  if (!block) {
    // No rail for this article (philosophical post, missing topic
    // mapping, etc.). If a previous run stamped one, clear it.
    if (KNIT_SENTINEL_RE.test(src)) {
      const next = src.replace(KNIT_SENTINEL_RE, '<!-- knit-rail:start --><!-- knit-rail:end -->\n');
      if (next !== src && !checkOnly) fs.writeFileSync(file, next);
      if (next !== src) changed++;
    }
    skipped++;
    continue;
  }

  let next;
  if (KNIT_SENTINEL_RE.test(src)) {
    next = src.replace(KNIT_SENTINEL_RE, block + '\n');
  } else {
    // Insert immediately after the post-end-cta sentinel so the rail
    // sits between the inline closing CTA and the see-also browse rail.
    if (!POST_END_RE.test(src)) { skipped++; continue; }
    next = src.replace(POST_END_RE, (m) => `${m}\n${block}`);
  }

  // Now that the KnitRail is in place on this article, collapse the
  // legacy smart-next sentinel content. The four-column KnitRail
  // strictly supersedes the three-line smart-next: same Define
  // (glossary), same Apply (tool), same Talk (Window) lanes plus a
  // new Read (next article in topic) lane the smart-next never had.
  // Sentinel itself stays in place so future runs of inject-smart-
  // next-cta.mjs are no-ops on these articles.
  if (SMART_SENTINEL_RE.test(next)) {
    next = next.replace(SMART_SENTINEL_RE, '<!-- smart-next:start --><!-- smart-next:end -->\n');
  }

  if (next === src) { skipped++; continue; }
  if (!checkOnly) fs.writeFileSync(file, next);
  changed++;
  console.log(`${checkOnly ? 'would update' : 'updated'}: ${path.relative(repoRoot, file)}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} article(s); ${skipped} skipped.`);
if (checkOnly && changed > 0) process.exit(1);
