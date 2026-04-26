#!/usr/bin/env node
// Inject the per-entry "Keep going" knit-in module into every glossary
// term page (EN + ES) between <!-- glossary-knit -->...
// <!-- /glossary-knit --> sentinels. Phase 4 of the cohesion pass:
// every term now points back at its topic, the tools that use the
// concept, and the articles that go deeper.
//
// Inputs:
//   data/library-tags.json — tools{} carries each tool's
//     glossary_terms[] / glossary_term and articles[] / article;
//     blog_posts{} carries each post's topics[]; the script reverses
//     these mappings so a term page can list its callers.
//   data/topics.json     — topic slugs and EN+ES names.
//   data/tools.json      — live tool slugs, EN+ES titles, URLs.
//   data/tool-knit.json  — article labels (label_en / label_es).
//   glossary/<slug>/index.html (EN + es/) — receives the rendered
//     module between the sentinels.
//
// Per-term knit content:
//   TOPIC          — the term's primary topic (first in its data-topics
//                    list, computed from library-tags.json the same way
//                    wire-glossary-topics.mjs does).
//   USED IN        — every live tool whose library-tags.tools.<slug>
//                    glossary_terms[] / glossary_term mentions this
//                    term. Resolves to data/tools.json for label/URL.
//   READ           — every blog post whose library-tags.tools mentions
//                    this term as its primary glossary_term, plus any
//                    posts in the same topic. Capped at 3.
//   RELATED TERMS  — up to 4 sibling glossary slugs that share at
//                    least one topic with this term. Stable order
//                    (alphabetical) so layouts don't churn.
//
//   node scripts/wire-glossary-knit.mjs           # rewrites in place
//   node scripts/wire-glossary-knit.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const tags     = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'library-tags.json'), 'utf8'));
const topics   = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'topics.json'),       'utf8'));
const toolsCfg = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tools.json'),        'utf8'));
const knit     = JSON.parse(fs.readFileSync(path.join(REPO, 'data', 'tool-knit.json'),    'utf8'));

const SENTINEL_OPEN  = '<!-- glossary-knit -->';
const SENTINEL_CLOSE = '<!-- /glossary-knit -->';
const SENTINEL_RE = new RegExp(
  `${SENTINEL_OPEN.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}[\\s\\S]*?${SENTINEL_CLOSE.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`
);

const sectionMap  = tags.glossary_section_to_topics || {};
const overrideMap = tags.glossary_term_overrides    || {};
const validTopics = new Set(topics.topics.map((t) => t.slug));

function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// --- discover every glossary slug + its parent section -----------------

// Walk glossary/index.html once. Each .gloss-section's id is a section
// slug; each .gloss-term's id within that section is the term slug.
function discoverTerms() {
  const html = fs.readFileSync(path.join(REPO, 'glossary', 'index.html'), 'utf8');
  const result = {}; // slug → { section, topics: [...] }
  const SECTION_RE = /<section class="gloss-section" id="([^"]+)"[^>]*>([\s\S]*?)<\/section>/g;
  const TERM_RE    = /<article class="gloss-term"\s+id="([^"]+)"/g;
  let sm;
  while ((sm = SECTION_RE.exec(html)) !== null) {
    const sectionId = sm[1];
    const body      = sm[2];
    const sectionDefault = sectionMap[sectionId] || [];
    let tm;
    TERM_RE.lastIndex = 0;
    while ((tm = TERM_RE.exec(body)) !== null) {
      const slug    = tm[1];
      const tlist   = overrideMap[slug] !== undefined ? overrideMap[slug] : sectionDefault;
      result[slug] = { section: sectionId, topics: tlist.filter((t) => validTopics.has(t)) };
    }
  }
  return result;
}

const termIndex = discoverTerms();

// --- reverse maps ------------------------------------------------------

// term slug → list of live tool slugs that reference it.
function buildToolReverse() {
  const map = new Map();
  for (const [toolKey, t] of Object.entries(tags.tools || {})) {
    const refs = []
      .concat(t.glossary_term ? [t.glossary_term] : [])
      .concat(t.glossary_terms || []);
    for (const term of refs) {
      if (!map.has(term)) map.set(term, []);
      // Normalize tool key — library-tags uses "audits/restaurant"
      // for the restaurant audit; data/tools.json uses
      // "restaurant-audit". Map them.
      const normalized = toolKey === 'audits/restaurant' ? 'restaurant-audit' : toolKey;
      map.get(term).push(normalized);
    }
  }
  return map;
}
const toolByTerm = buildToolReverse();

// term slug → list of blog post slugs (primary association first).
function buildArticleReverse() {
  const direct = new Map(); // term → [post slugs explicitly linked via tools entry]
  for (const t of Object.values(tags.tools || {})) {
    const refs = []
      .concat(t.glossary_term ? [t.glossary_term] : [])
      .concat(t.glossary_terms || []);
    const articles = []
      .concat(t.article ? [t.article] : [])
      .concat(t.articles || []);
    for (const term of refs) {
      if (!direct.has(term)) direct.set(term, []);
      for (const a of articles) {
        if (!direct.get(term).includes(a)) direct.get(term).push(a);
      }
    }
  }
  return direct;
}
const articleSlugsByTerm = buildArticleReverse();

// term → siblings (same-topic terms, deterministic order).
function siblingsForTerm(slug) {
  const me = termIndex[slug];
  if (!me || !me.topics.length) return [];
  const ts = new Set(me.topics);
  return Object.entries(termIndex)
    .filter(([s, info]) => s !== slug && info.topics.some((t) => ts.has(t)))
    .map(([s]) => s)
    .sort()
    .slice(0, 4);
}

// --- label resolvers --------------------------------------------------

function topicLabel(slug, locale) {
  const t = topics.topics.find((x) => x.slug === slug);
  if (!t) return slug;
  return locale === 'en' ? t.name : (t.name_es || t.name);
}

function toolLabel(slug, locale) {
  const t = toolsCfg.tools[slug];
  if (!t) return slug;
  return locale === 'en' ? t.title_en : t.title_es;
}
function toolUrl(slug, locale) {
  const t = toolsCfg.tools[slug];
  if (!t) return '#';
  return locale === 'en' ? t.url_en : t.url_es;
}

function articleUrl(slug, locale) {
  return locale === 'en' ? `/blog/${slug}/` : `/es/blog/${slug}/`;
}
function articleLabel(slug, locale) {
  const url = `/blog/${slug}/`;
  const entry = knit.articles[url];
  if (entry) return locale === 'en' ? entry.label_en : entry.label_es;
  // Fall back to library-tags blog title if no friendly label exists.
  const post = (tags.blog_posts || {})[slug];
  return post ? post.title : slug;
}

// Decode the small set of HTML entities glossary term-h1 elements
// might use, so escText() can re-encode them once instead of producing
// "&amp;amp;" from "&amp;".
function decodeEntities(s) {
  return s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

const glossaryLabelCache = new Map();
function glossaryLabel(slug, locale) {
  const key = `${locale}:${slug}`;
  if (glossaryLabelCache.has(key)) return glossaryLabelCache.get(key);
  const file = locale === 'en'
    ? path.join(REPO, 'glossary', slug, 'index.html')
    : path.join(REPO, 'es', 'glossary', slug, 'index.html');
  if (!fs.existsSync(file)) { glossaryLabelCache.set(key, slug); return slug; }
  const html = fs.readFileSync(file, 'utf8');
  const m = html.match(/<h1 class="term-h1">([^<]+)<\/h1>/);
  const label = m ? decodeEntities(m[1].trim()) : slug;
  glossaryLabelCache.set(key, label);
  return label;
}

// --- rendering -------------------------------------------------------

function renderKnit(slug, locale) {
  const me = termIndex[slug];
  const headings = locale === 'en'
    ? { h2: 'Keep going.', topic: 'Topic', tools: 'Used in', read: 'Read', terms: 'Related terms', empty: 'Nothing yet' }
    : { h2: 'Sigue.',      topic: 'Tema',  tools: 'Aparece en', read: 'Lee', terms: 'Términos relacionados', empty: 'Nada todavía' };

  // TOPIC column — primary topic (first in list) only, to keep the
  // four columns visually balanced. If the term has no topic (e.g.
  // subtypes), fall back to the glossary index.
  const primaryTopic = me && me.topics.length ? me.topics[0] : null;
  const topicHref  = locale === 'en'
    ? (primaryTopic ? `/learn/topics/${primaryTopic}/` : '/glossary/')
    : (primaryTopic ? `/es/learn/topics/${primaryTopic}/` : '/es/glossary/');
  const topicCol = `<div class="glossary-knit__col">
        <h3>${escText(headings.topic)}</h3>
        <a href="${escAttr(topicHref)}">${escText(primaryTopic ? topicLabel(primaryTopic, locale) : (locale === 'en' ? 'Glossary index' : 'Índice del glosario'))}</a>
      </div>`;

  // USED IN — only live tools (filter by status); cap at 3.
  const toolSlugs = (toolByTerm.get(slug) || [])
    .filter((s) => toolsCfg.tools[s] && toolsCfg.tools[s].status === 'live')
    .slice(0, 3);
  const toolsList = toolSlugs.length
    ? toolSlugs.map((ts) => `          <li><a href="${escAttr(toolUrl(ts, locale))}">${escText(toolLabel(ts, locale))}</a></li>`).join('\n')
    : `          <li class="glossary-knit__col-empty">${escText(headings.empty)}</li>`;
  const toolsCol = `<div class="glossary-knit__col">
        <h3>${escText(headings.tools)}</h3>
        <ul>
${toolsList}
        </ul>
      </div>`;

  // READ — articles linked via library-tags.json, capped at 2 (column
  // gets a third slot only if no related tools exist).
  const articleSlugs = (articleSlugsByTerm.get(slug) || []).slice(0, 2);
  const articlesList = articleSlugs.length
    ? articleSlugs.map((as) => `          <li><a href="${escAttr(articleUrl(as, locale))}">${escText(articleLabel(as, locale))}</a></li>`).join('\n')
    : `          <li class="glossary-knit__col-empty">${escText(headings.empty)}</li>`;
  const articlesCol = `<div class="glossary-knit__col">
        <h3>${escText(headings.read)}</h3>
        <ul>
${articlesList}
        </ul>
      </div>`;

  // RELATED TERMS — same-topic siblings, alphabetical, max 4.
  const siblings = siblingsForTerm(slug);
  const siblingsList = siblings.length
    ? siblings.map((sg) => {
        const href = locale === 'en' ? `/glossary/${sg}/` : `/es/glossary/${sg}/`;
        return `          <li><a href="${escAttr(href)}">${escText(glossaryLabel(sg, locale))}</a></li>`;
      }).join('\n')
    : `          <li class="glossary-knit__col-empty">${escText(headings.empty)}</li>`;
  const termsCol = `<div class="glossary-knit__col">
        <h3>${escText(headings.terms)}</h3>
        <ul>
${siblingsList}
        </ul>
      </div>`;

  return `${SENTINEL_OPEN}
<aside class="glossary-knit" aria-labelledby="glossary-knit-h-${slug}">
    <div class="container">
      <h2 id="glossary-knit-h-${slug}" class="glossary-knit__h">${escText(headings.h2)}</h2>
      <div class="glossary-knit__grid">
      ${topicCol}
      ${toolsCol}
      ${articlesCol}
      ${termsCol}
      </div>
    </div>
  </aside>
${SENTINEL_CLOSE}`;
}

// --- write ------------------------------------------------------------

let changed = 0;
let skipped = 0;
const missingSentinels = [];
const totalSlugs = Object.keys(termIndex);

for (const slug of totalSlugs) {
  for (const locale of ['en', 'es']) {
    const fp  = locale === 'en'
      ? path.join(REPO, 'glossary', slug, 'index.html')
      : path.join(REPO, 'es', 'glossary', slug, 'index.html');
    const rel = path.relative(REPO, fp);
    if (!fs.existsSync(fp)) continue; // Some EN slugs don't have an ES counterpart yet — fine.
    const src = fs.readFileSync(fp, 'utf8');
    if (!SENTINEL_RE.test(src)) {
      missingSentinels.push(rel);
      continue;
    }
    const next = src.replace(SENTINEL_RE, renderKnit(slug, locale));
    if (next !== src) {
      if (!checkOnly) fs.writeFileSync(fp, next);
      changed++;
    } else {
      skipped++;
    }
  }
}

if (missingSentinels.length) {
  console.error(`\n${missingSentinels.length} term page(s) missing the glossary-knit sentinel pair:`);
  for (const r of missingSentinels.slice(0, 10)) console.error('  ' + r);
  if (missingSentinels.length > 10) console.error(`  … and ${missingSentinels.length - 10} more.`);
  console.error(`\nrun: node scripts/add-glossary-knit-sentinels.mjs`);
  process.exit(4);
}

console.log(`${checkOnly ? 'would update' : 'updated'} ${changed} term page(s); ${skipped} unchanged.`);
if (checkOnly && changed > 0) process.exit(1);
