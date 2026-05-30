#!/usr/bin/env node
/**
 * Phase H.1 — batch-overview quality gate.
 *
 * The May-2026 publication run shipped two batch overviews
 * (may-2026-discovery-changed-under-you for Wave-2,
 * dmv-math-moved-june-2026 for Wave-3) at sub-standard quality: 1
 * <h2> each in the body, no quantitative viz, the deep-dives listed
 * as a single viz-flow TOC instead of cited inline, no knit-rail
 * capstone. Each one took an audit + multi-agent rewrite to bring
 * back up to the Wave-2 rewrite bar. This guard enforces that bar
 * at check-all time so future overviews can't ship below it.
 *
 * What counts as a "batch overview"
 *   - Any article whose URL matches data/library-batches.json's
 *     batches.<key>.overview_en or overview_es field.
 *   - Drafts (the <article> root carrying data-draft="true") bypass
 *     the gate with --skip-drafts.
 *
 * Rules
 *   1. Body H2 count >= 5
 *      Single-H2 overviews delegate the editorial spine to a figure.
 *      Five sections is the floor below which the article reads as a
 *      list, not a synthesis. Wave-1 ran at 4-5, Wave-2 + Wave-3
 *      rewrites at 6-7.
 *   2. >= 3 <figure class="viz-figure"> elements
 *      And at least ONE must contain a .viz-bars block (quantitative
 *      evidence of the unifying claim, not just a viz-flow TOC).
 *      Wave-1 at 2 figures gets an exception via per-batch override
 *      (see HISTORICAL_WAIVERS below) because it pre-dates the rule.
 *   3. Each batch deep-dive linked >= 2 times anywhere in the article
 *      (inline body + navigational capstone is the canonical pair).
 *      One inline + one in the capstone counts. Two inline counts.
 *      Two in the capstone alone does NOT — the rule's whole point is
 *      to force weaving, not listing.
 *   4. >= 1 navigational capstone — either <section class="wave-toc">
 *      (the Wave-1 pattern) OR an <aside class="knit-rail"> with a
 *      multi-row <ol class="knit-rail__cols"> (the post-Wave-2
 *      pattern). Bare empty sentinels do NOT count.
 *   5. data/article-audio.json status NOT 'pending' for the overview
 *      (an overview ships with audio in at least one language —
 *      'partial' is fine, 'pending' means nothing is rendered).
 *   6. Read-time eyebrow indicates >= 5 min EN or 5 min de lectura
 *      ES. Five min is the operator floor — under that the article
 *      reads as a teaser, not the canonical entry point.
 *
 * Historical waivers
 *   Pre-gate overviews (anything dated before the gate landed) may
 *   carry a small budget of pre-existing violations. Listed in
 *   HISTORICAL_WAIVERS by batch key + rule number. Use sparingly —
 *   every waiver is a known-broken thing.
 *
 * Usage
 *   node scripts/check-overview-quality.mjs           # strict
 *   node scripts/check-overview-quality.mjs --skip-drafts  # ignore data-draft="true"
 *
 * Exit codes
 *   0 — every batch overview meets the bar.
 *   1 — at least one overview fails. Per-rule per-file diagnostics
 *       on stderr; the call site can grep them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const SKIP_DRAFTS = process.argv.includes('--skip-drafts');

// Historical waivers — pre-gate articles allowed to keep specific
// pre-existing violations. Keyed by `${batchKey}/${locale}` →
// Set of rule numbers (1-6) to skip for that overview. The whole
// point of the gate is to prevent regressions on NEW overviews; the
// existing ones already shipped. Burn down this list by fixing the
// articles, not by adding entries.
const HISTORICAL_WAIVERS = {
  // Wave-1 (May 11) shipped before this gate. Lighter touch: 4 H2,
  // 2 figures (one viz-flow + one viz-bars), wave-toc capstone but
  // no inline weave of every deep-dive (the wave-toc IS its citation
  // surface). Audio currently 'pending'.
  '2026-w1/en': new Set([1, 2, 3, 5]),
  '2026-w1/es': new Set([1, 2, 3, 5]),
};

// --- helpers ---------------------------------------------------------

function urlToFile(url) {
  // "/blog/foo/" -> "blog/foo/index.html"
  // "/es/blog/foo/" -> "es/blog/foo/index.html"
  const trimmed = url.replace(/^\/+|\/+$/g, '');
  return path.join(REPO, trimmed, 'index.html');
}

function readJSON(rel) {
  return JSON.parse(fs.readFileSync(path.join(REPO, rel), 'utf8'));
}

function countMatches(haystack, re) {
  const m = haystack.match(re);
  return m ? m.length : 0;
}

function citationsAnywhere(src, href) {
  // Count anchor tags whose href targets the deep-dive's article URL,
  // anywhere in the article file (inline body + capstone capstone =
  // both surfaces count toward the >=2 rule). The regex escapes
  // forward slashes and hyphens so the literal href becomes a clean
  // regex literal.
  const escaped = href.replace(/[/.\-]/g, (c) => `\\${c}`);
  const re = new RegExp(`href="${escaped}"`, 'g');
  return countMatches(src, re);
}

function articleBody(src) {
  // Extract the article body (between <article ...> and </article>).
  // Falls back to the whole file if no <article> tag — better to
  // overcount H2s than to silently skip a file with non-canonical
  // structure.
  const m = src.match(/<article\b[^>]*>([\s\S]*?)<\/article>/);
  return m ? m[1] : src;
}

function isDraft(body) {
  return /<article\b[^>]*\bdata-draft="true"/i.test(body);
}

function readMinFromEyebrow(src) {
  // Try EN ("8 min read") then ES ("8 min de lectura").
  const en = src.match(/(\d+)\s*min\s*read\b/i);
  if (en) return parseInt(en[1], 10);
  const es = src.match(/(\d+)\s*min\s+de\s+lectura/i);
  if (es) return parseInt(es[1], 10);
  return null;
}

// --- collect overviews ------------------------------------------------

const batches = readJSON('data/library-batches.json').batches || {};
const audioManifest = readJSON('data/article-audio.json');
const tags = readJSON('data/library-tags.json');

const overviews = [];
for (const [key, batch] of Object.entries(batches)) {
  if (key.startsWith('_')) continue;
  // Only weekly article batches carry batch-overview quality rules.
  // Standalone launches (type:'course', etc.) point the banner at a
  // landing page (e.g. /course/) with its own standards — they are not
  // batch overviews, so they're excluded from this gate.
  if (batch.type && batch.type !== 'batch') continue;
  if (!batch.overview_en && !batch.overview_es) continue;
  // Resolve deep-dives by matching the batch's date in library-tags.
  // Each entry's `namespace` (blog | library) determines its current
  // URL prefix post the Phase 7 split. Default to "blog" for entries
  // that haven't been re-classified yet.
  const deepDives = [];
  for (const [slug, post] of Object.entries(tags.blog_posts || {})) {
    if (post.date && post.date === batch.date && !batch.overview_en.includes(slug)) {
      const namespace = (post && typeof post === 'object' && post.namespace) || 'blog';
      deepDives.push({ slug, namespace });
    }
  }
  if (batch.overview_en) {
    overviews.push({
      batchKey: key,
      locale: 'en',
      url:    batch.overview_en,
      file:   urlToFile(batch.overview_en),
      audioKey: batch.overview_en.replace(/^\/+blog\/+|\/+$/g, ''),
      deepDiveHrefs: deepDives.map((d) => `/${d.namespace}/${d.slug}/`),
    });
  }
  if (batch.overview_es) {
    // ES deep-dive hrefs join the EN→ES mapping at the per-namespace
    // section of i18n-slug-map (blog or library). Same namespace on
    // both sides of the EN↔ES pair.
    const slugMap = readJSON('data/i18n-slug-map.json');
    const blogMap = slugMap.blog || {};
    const libMap  = slugMap.library || {};
    const esDeepDiveHrefs = deepDives
      .map((d) => {
        const src = d.namespace === 'library' ? libMap : blogMap;
        const es = src[d.slug];
        return es ? `/es/${d.namespace}/${es}/` : null;
      })
      .filter(Boolean);
    overviews.push({
      batchKey: key,
      locale: 'es',
      url:    batch.overview_es,
      file:   urlToFile(batch.overview_es),
      audioKey: batch.overview_en.replace(/^\/+blog\/+|\/+$/g, ''),
      deepDiveHrefs: esDeepDiveHrefs,
    });
  }
}

// --- evaluate ---------------------------------------------------------

const failures = [];

for (const o of overviews) {
  if (!fs.existsSync(o.file)) {
    failures.push(`${o.file}: file not found (batch ${o.batchKey} ${o.locale})`);
    continue;
  }
  const src  = fs.readFileSync(o.file, 'utf8');
  const body = articleBody(src);

  if (SKIP_DRAFTS && isDraft(src)) continue;

  const waivers = HISTORICAL_WAIVERS[`${o.batchKey}/${o.locale}`] || new Set();
  const report = (rule, msg) => {
    if (waivers.has(rule)) return;
    failures.push(`${o.file}: [rule ${rule}] ${msg}`);
  };

  // Rule 1: >= 5 H2s inside <article>.
  const h2Count = countMatches(body, /<h2\b[^>]*>/g);
  if (h2Count < 5) {
    report(1, `only ${h2Count} <h2> sections (need >= 5 — overviews must have a real synthesis spine, not delegate to one figure)`);
  }

  // Rule 2: >= 3 viz-figures, >= 1 viz-bars.
  const vizFigures = countMatches(body, /<figure[^>]*class="[^"]*\bviz-figure\b[^"]*"/g);
  const vizBars    = countMatches(body, /class="[^"]*\bviz-bars\b[^"]*"/g);
  if (vizFigures < 3) {
    report(2, `only ${vizFigures} <figure class="viz-figure"> (need >= 3 — overview should carry quantitative + flow + framework graphics)`);
  }
  if (vizBars < 1) {
    report(2, `no .viz-bars block found (need >= 1 quantitative figure — operator readers want proof of the claim, not just a flow diagram)`);
  }

  // Rule 3: each deep-dive linked >= 2 times anywhere in the article
  // (inline body + navigational capstone is the canonical pair).
  for (const href of o.deepDiveHrefs) {
    const n = citationsAnywhere(src, href);
    if (n < 2) {
      report(3, `deep-dive ${href} linked ${n} time(s) (need >= 2 — overview must WEAVE deep-dives, not list once)`);
    }
  }

  // Rule 4: navigational capstone with multi-row links.
  // Accept wave-toc OR knit-rail-with-knit-rail__cols-list. Bare
  // empty sentinels (<!-- knit-rail:start --><!-- knit-rail:end -->)
  // do NOT count — the inject-knit-rail script renders empty
  // sentinels when an article isn't in its data sources, which is
  // exactly the "listed as no-op" failure mode we want to catch.
  const waveTocBlock  = countMatches(src, /<section[^>]*class="[^"]*\bwave-toc\b[^"]*"[\s\S]*?<\/section>/g);
  const knitRailRows  = countMatches(src, /<li class="knit-rail__col"/g);
  const overviewKnitRail = knitRailRows >= 4 ? 1 : 0;
  const capstoneCount = waveTocBlock + overviewKnitRail;
  if (capstoneCount < 1) {
    report(4, `no navigational capstone found (need either <section class="wave-toc"> with rows, or <aside class="knit-rail"> with >= 4 <li class="knit-rail__col"> rows — empty sentinels do not count)`);
  }

  // Rule 5: audio status not 'pending'.
  const audioEntry = audioManifest.blog && audioManifest.blog[o.audioKey];
  if (audioEntry && audioEntry.status === 'pending') {
    report(5, `data/article-audio.json status='pending' (need 'rendered' or 'partial' — an overview ships with at least one language audio)`);
  }

  // Rule 6: read-time >= 5 min.
  const readMin = readMinFromEyebrow(src);
  if (readMin !== null && readMin < 5) {
    report(6, `eyebrow reads ${readMin} min (need >= 5 — overviews shorter than that read as TOCs, not synthesis)`);
  }
}

// --- report -----------------------------------------------------------

if (failures.length > 0) {
  console.error(`Overview quality gate: ${failures.length} failure(s) across ${overviews.length} batch overview(s):`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error('');
  console.error('Batch overviews are the most-read page in any given week — the homepage banner points at them, the /learn/ Recently Added strip leads with them, and AI search engines lift their TL;DR verbatim. They have to earn the load. See scripts/check-overview-quality.mjs for the rule rationale.');
  process.exit(1);
}

console.log(`Overview quality: ${overviews.length} batch overview(s) clean.`);
process.exit(0);
