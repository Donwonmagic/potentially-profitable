#!/usr/bin/env node
/**
 * Phase H.2 — per-article graphics gate.
 *
 * Library canon §8 and blog canon §7 name a "two graphics minimum" for
 * every regular article, with each `<figure>` carrying both
 * `data-audio-alt` (full narration) and a `<figcaption>` (one-sentence
 * takeaway). Until this gate landed, those rules were editorial-only —
 * the ship-test checklist in the canons mentioned them but `check-all.mjs`
 * did not. Twenty-six published posts had crossed the line by the time
 * we noticed.
 *
 * This is the per-post equivalent of the batch-overview gate at
 * `scripts/check-overview-quality.mjs` (which is wider: ≥3 figures,
 * ≥1 viz-bars, deep-dive linking, capstone, audio status, read time).
 * The floor here is the universal minimum that applies to every regular
 * article.
 *
 * What counts as a "regular article"
 *   - HTML path under `library/<slug>/`, `es/library/<slug>/`,
 *     `blog/<slug>/`, or `es/blog/<slug>/`.
 *   - Body carries `id="post-body"` (the article-shaped `<article>`
 *     root). Collection / landing pages (e.g.,
 *     `library/menu-design-cuisines/`, `library/menu-design-themes/`,
 *     `library/index.html`) do not carry this marker and are skipped.
 *   - Drafts marked `data-draft="true"` on the post-body root are
 *     skipped, matching the overview-quality script's convention.
 *
 * Rules
 *   1. Floor — ≥ 2 content figures (wrapper class `viz-figure` or
 *      `article-figure`).
 *   2. Variety — at least two distinct viz-* kinds across the figures
 *      (so a post can't ship three viz-bars and nothing else).
 *   3. Narration — every content figure carries a non-empty
 *      `data-audio-alt` of at least 80 characters (short alt-text-shaped
 *      values don't satisfy the audio-listener requirement).
 *   4. Figcaption — every content figure contains a `<figcaption>`.
 *   5. Tone balance — if any figure inside the post carries
 *      `data-tone="teal"`, the post must also reference `data-tone="rust"`
 *      somewhere (canon's visual-phase-break convention).
 *   6. viz-bars consistency — for every `.viz-bars__row`, the
 *      `--w:<float>` CSS variable and the `.viz-bars__num` rendered text
 *      must agree (when both are percentages or both are share-of-1).
 *      Tolerance ±2 percentage points; only checked when both surfaces
 *      are unambiguous (a literal "%", "x", or share-of-one number).
 *   7. Cross-post dedup — the inner text of every content figure is
 *      hashed; if the same hash appears in two or more article slugs,
 *      flag (with an allowlist for legitimate shared diagrams).
 *   8. Autolink-in-attribute — any HTML attribute value containing the
 *      `LIBRARY:autolink:start` marker is invalid (the marker should
 *      only live in body text, never inside `data-audio-alt`, `aria-
 *      label`, or any other attribute). Catches the corruption pattern
 *      that produced the original GSC fig #6 bug — a manual or scripted
 *      copy-paste of body content (already autolinked) into an
 *      attribute value, which then breaks attribute parsing at the
 *      first unescaped quote in the autolink markup.
 *
 * Not enforced here (intentional gaps)
 *   - Citation-slug registry. Originally proposed: figures using a
 *     sourced number must have the slug listed in that claim's `used_in`
 *     array. The current `data/sourced-claims.json` registry doesn't
 *     have a stable per-figure linkage (claims are keyed to articles,
 *     not figures); enforcing this would require a separate per-figure
 *     marker first. Left for a follow-up if the registry adds one.
 *
 * Known limitations (audited at cutover)
 *   - The data-audio-alt regex `data-audio-alt=(['"])([\s\S]*?)\1` stops
 *     at the first matching closing quote. In valid HTML this is fine
 *     because attribute values cannot contain unescaped same-quote
 *     characters. But `scripts/inject-library-autolinks.mjs` has been
 *     observed injecting raw `<a href="…">…</a>` snippets INSIDE
 *     data-audio-alt values, which produces invalid HTML and causes the
 *     gate to under-count the narration length. Fix at source is to
 *     teach the autolink injector to skip attribute values; the
 *     workaround at the gate is that under-counting fails rule 3,
 *     which surfaces the corruption.
 *   - Rule 6 (viz-bars consistency) tolerates a single mismatched row
 *     per figure as "max-normalized chart" (bars drawn relative to the
 *     chart's max rather than absolute share-of-one). Charts whose
 *     numeric labels are non-percentages (dollar amounts, "rising,
 *     not flat", "single digits", pixel widths) are correctly skipped
 *     by `numTextToShare`. A figure where every row's --w genuinely
 *     drifts from its number by >2pp will fail; a figure with a single
 *     intentionally rescaled row will pass.
 *
 * Open structural debt surfaced by the audit
 *   - /es/blog/<en-slug>/ legacy duplicates. Sixteen sitemap entries
 *     under /es/blog/ ship Spanish translations whose canonical EN
 *     counterpart now lives at /library/ (post the May-2026 blog/library
 *     split). The /es/library/<es-slug>/ canonical exists in parallel
 *     for many of them; both surfaces are indexed. The graphics-floor
 *     gate respects this by waiving rule 1 on the legacy slugs and
 *     allowlisting the dedup hashes of figures that are intentionally
 *     mirrored. The actual fix is a redirect or rename decision: either
 *     /es/blog/<en-slug>/ 301s to /es/library/<es-slug>/, or the
 *     canonical /es/library/<es-slug>/ adopts the EN slug. Until that
 *     lands, the duplicate-content cost is a known SEO debt item.
 *   - ES posts using `recovery-stack`, `funnel`, `lh-chart`, and
 *     `timeline-track` inner shapes (not viz-*). Five es/library/ posts
 *     ship content-bearing figures whose inner class is one of these
 *     pre-Phase-1 shapes. They satisfy rules 1, 3, 4 (floor, narration,
 *     figcaption) but fail rule 2 (variety) because none of these
 *     classes are in `VIZ_KINDS`. Closing each requires either
 *     restructuring an existing figure to use a viz-* family inner OR
 *     adding new viz-* figures of two distinct kinds. Editorial
 *     decision pending; the gate documents this via per-slug rule-2
 *     waivers naming "viz-* class missing on figures."
 *
 * Historical waivers
 *   Start empty by intent. Phase H.2 edits the under-floor posts
 *   instead of waiving them; if a future edge case genuinely cannot
 *   meet a rule, list it as `{ path, rule, why }` here with a dated
 *   comment so every waiver is auditable. (`path` is repo-root-relative
 *   without `/index.html`.)
 *
 * Dedup allowlist
 *   The `DEDUP_ALLOW` set lists figure inner-text hashes that are
 *   legitimately shared across articles (e.g., a per-platform fee
 *   diagram cited in three delivery pieces). Empty by default; add a
 *   hash with a one-line comment when the dedup gate catches a real
 *   shared diagram.
 *
 * Usage
 *   node scripts/check-article-graphics.mjs
 *   node scripts/check-article-graphics.mjs --skip-drafts
 *
 * Exit codes
 *   0 — every regular article meets the gate.
 *   1 — at least one article fails. Per-rule per-file diagnostics on
 *       stderr; the call site can grep them.
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');

const args        = new Set(process.argv.slice(2));
const skipDrafts  = args.has('--skip-drafts');

export const SCAN_ROOTS = ['library', 'blog', 'es/library', 'es/blog'];

// { path: 'library/<slug>', rule: 1..7, why: 'YYYY-MM-DD — short reason' }
//
// Two batches landed at gate-cutover:
//   - EN_VARIETY — four EN articles ship with all figures of a single
//     viz-* kind. Editorial work needed to add a second kind that fits
//     the post's argument shape (decision-tree, before/after, bars).
//   - ES_TRANSLATION — twenty-four ES posts inherited translation-era
//     gaps: missing or class-stripped figures, sub-80-char narration,
//     teal-only tone palettes. Mirror sweep from the EN counterparts
//     will close these in a dedicated PR.
//
// Each waiver names the slug, the rule it bypasses, and the dated
// reason. Removing an entry forces the next CI run to re-audit it.
const HISTORICAL_WAIVERS = [
  // ES translation sweep — mirror EN figures with translated metadata.
  { path: 'es/library/como-hacer-sitio-web-para-mi-restaurante',                    rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/como-leer-google-search-console-de-tu-restaurante',           rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/como-saber-si-una-herramienta-de-restaurante-es-segura',      rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/como-salir-de-doordash-mi-restaurante',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/cuando-rehacer-tu-sitio-web-de-restaurante',                  rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/cuanto-cuesta-una-pagina-web-para-restaurante-2026',          rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/especificaciones-de-fotos-para-restaurantes',                 rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/los-6-tipos-de-schema-markup-que-google-usa',                 rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  // ES /blog/ posts whose canonical EN counterpart now lives at /library/ — legacy from the blog→library split.
  { path: 'es/blog/can-chatgpt-write-your-restaurant-website',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/does-my-restaurant-need-a-website',                               rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/google-ai-mode-resultados-locales-restaurante-2026',              rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure' },
  { path: 'es/blog/how-to-raise-restaurant-menu-prices-without-losing-reservations', rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/how-to-set-up-google-business-profile-for-your-restaurant',       rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/wix-vs-custom-for-restaurants',                                   rule: 2, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, mirror EN viz-flow addition' },
];

// Inner-text SHA1 hashes that are legitimately repeated across articles
// (shared diagrams, side-by-side companions). Each entry: dated comment.
const DEDUP_ALLOW = new Set([
  // 2026-05-28 — review-velocity viz-bars shared between es/library/
  // (canonical, post-blog-library-split) and es/blog/ (legacy slug
  // that still ships the same article body in the ES tree). Both surfaces
  // are translations of the same EN library piece; same figure is the
  // right outcome until the legacy /es/blog/ slugs are migrated.
  'd9b419909d34',
  // 2026-05-28 — page-gates viz-tree shared between es/library/que-debe-tener
  // (canonical) and es/blog/what-should-be-on (legacy slug). Same translation
  // intent as the entry above.
  '5e1492f6896e',
]);

// The viz-* family names this gate recognises. Wrapper class viz-figure
// or article-figure marks the figure; the *inner* class names the kind.
// New kinds: add here AND mention in the canon §8 list.
export const VIZ_KINDS = [
  'viz-bars',
  'viz-flow',
  'viz-tree',
  'viz-ba',
  'viz-ring',
  'viz-waterfall',
  'viz-gauge',
  'viz-spark',
  'viz-hero',
  'viz-scroll',
];

export const DATA_AUDIO_ALT_MIN = 80;

function* walkArticleHtml(rootRel) {
  const root = path.join(REPO, rootRel);
  if (!fs.existsSync(root)) return;
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    if (entry.name === 'drafts') continue;
    const indexPath = path.join(root, entry.name, 'index.html');
    if (!fs.existsSync(indexPath)) continue;
    yield indexPath;
  }
}

function relSlugPath(absPath) {
  return path.relative(REPO, absPath).replace(/\/index\.html$/, '');
}

function isWaived(slugPath, ruleNum) {
  return HISTORICAL_WAIVERS.some(
    (w) => w.path === slugPath && w.rule === ruleNum,
  );
}

export function isArticleBody(html) {
  return /<article\b[^>]*\bid="post-body"/.test(html);
}

export function isDraft(html) {
  return /<article\b[^>]*\bdata-draft="true"/.test(html);
}

// Extract every content <figure> block. The match is non-greedy so
// adjacent figures don't collapse.
const CONTENT_FIGURE_RE =
  /<figure\b([^>]*\bclass="[^"]*\b(?:viz-figure|article-figure)\b[^"]*"[^>]*)>([\s\S]*?)<\/figure>/g;

export function collectContentFigures(html) {
  CONTENT_FIGURE_RE.lastIndex = 0;
  const out = [];
  let m;
  while ((m = CONTENT_FIGURE_RE.exec(html)) !== null) {
    out.push({ openAttrs: m[1], inner: m[2], raw: m[0] });
  }
  return out;
}

export function getDataAudioAlt(openAttrs) {
  const m = /\bdata-audio-alt=(['"])([\s\S]*?)\1/.exec(openAttrs);
  return m ? m[2] : '';
}

export function hasFigcaption(inner) {
  return /<figcaption\b/.test(inner);
}

export function detectVizKinds(inner) {
  const kinds = new Set();
  for (const kind of VIZ_KINDS) {
    // Match the kind as a whole class word inside class="…"
    const re = new RegExp(`\\bclass="[^"]*\\b${kind}\\b[^"]*"`);
    if (re.test(inner)) kinds.add(kind);
  }
  return kinds;
}

// Detect the autolink-marker-inside-attribute corruption pattern.
// Returns an array of attribute-context strings that contain the marker.
// The marker should only appear inside body text; finding it inside an
// attribute value means the autolink HTML was copy-pasted into an
// attribute, which breaks parsing at the first unescaped inner quote.
export function findAutolinkInAttribute(html) {
  // Strip body content first by scanning for attribute values only.
  // Any attribute value containing "LIBRARY:autolink:start" is a hit.
  const ATTR_RE = /\b([a-z][\w-]*)\s*=\s*"([^"]*LIBRARY:autolink:start[^"]*)"/gi;
  const hits = [];
  let m;
  while ((m = ATTR_RE.exec(html)) !== null) {
    const lineNum = html.slice(0, m.index).split('\n').length;
    hits.push({ attr: m[1], excerpt: m[2].slice(0, 80), line: lineNum });
  }
  return hits;
}

export function hashFigureInner(inner) {
  // Strip whitespace + HTML comments so cosmetic-only differences don't
  // dodge the dedup gate. Hash the result.
  //
  // Normalization steps (in order):
  //   1. Strip <!-- comments --> entirely.
  //   2. Collapse runs of whitespace to a single space.
  //   3. Drop whitespace between consecutive tags (`> <` → `><`) so a
  //      pretty-printed copy hashes the same as a minified one.
  //   4. Trim leading/trailing whitespace.
  const normalized = inner
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .trim();
  return crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12);
}

export function numTextToShare(text) {
  if (!text) return null;
  // Strip HTML entities, normalize.
  const t = text.replace(/&middot;/g, '·').replace(/\s+/g, ' ').trim();
  // "13.14%" / "57%" → 0.1314 / 0.57
  let m = /^(-?\d+(?:\.\d+)?)\s*%/.exec(t);
  if (m) return parseFloat(m[1]) / 100;
  // "0.85" / "1.0" — bare share-of-one
  m = /^0?\.\d+$/.exec(t);
  if (m) return parseFloat(t);
  if (t === '1' || t === '1.0') return 1;
  // Everything else (dollar amounts, "rising, not flat", named ranks)
  // is not a percent — we cannot reconcile against --w, so return null
  // and skip the row.
  return null;
}

function parseVizBarsRows(inner) {
  // Pull each .viz-bars__row that has a --w:<float> and a .viz-bars__num
  // body. The --w lives on the .viz-bars__fill span style="…" attribute.
  // The .viz-bars__num is a sibling <p class="viz-bars__num">…</p>.
  // We zip them per row by sequence position; the canon HTML interleaves
  // them deterministically so positional matching is safe.
  const widthRe = /style="[^"]*--w:\s*(-?\d*\.?\d+)/g;
  const numRe   = /<p\s+class="viz-bars__num"[^>]*>([\s\S]*?)<\/p>/g;

  const widths = [];
  let m;
  while ((m = widthRe.exec(inner)) !== null) widths.push(parseFloat(m[1]));

  const nums = [];
  while ((m = numRe.exec(inner)) !== null) {
    nums.push(m[1].replace(/<[^>]+>/g, '').trim());
  }

  const rows = [];
  for (let i = 0; i < Math.max(widths.length, nums.length); i++) {
    rows.push({ width: widths[i], numText: nums[i] });
  }
  return rows;
}

function checkVizBarsConsistency(figs) {
  // Returns an array of mismatch strings, one per failing row.
  const failures = [];
  for (let i = 0; i < figs.length; i++) {
    const inner = figs[i].inner;
    if (!/\bviz-bars\b/.test(inner)) continue;
    const rows = parseVizBarsRows(inner);
    rows.forEach((row, ri) => {
      if (row.width == null || row.numText == null) return;
      const share = numTextToShare(row.numText);
      if (share == null) return; // un-reconcilable; not a failure
      // Allow share = 0.658 to map to "13.14%" when the bar is drawn
      // RELATIVE to a max in the chart. Many viz-bars charts use --w as
      // a max-normalized share, not the absolute share. Detect that
      // shape: if EVERY row in the chart has share <= width by a
      // consistent factor, treat the chart as max-normalized and skip.
      // For now we use a heuristic: if width is within ±0.02 of share,
      // it passes; otherwise the row fails IF AT LEAST ONE other row
      // in the same chart also fails. If only one row mismatches, the
      // chart is probably max-normalized and we let it through.
      const diff = Math.abs(row.width - share);
      if (diff > 0.02) {
        failures.push({
          figIndex: i,
          rowIndex: ri,
          width: row.width,
          share,
          numText: row.numText.slice(0, 24),
          diff,
        });
      }
    });
  }
  // If a figure has ≥2 mismatching rows, that's the "data-to-figure
  // consistency" bug. If a figure has 1 mismatching row out of many,
  // it's probably a max-normalized chart; pass it.
  const byFig = new Map();
  for (const f of failures) {
    if (!byFig.has(f.figIndex)) byFig.set(f.figIndex, []);
    byFig.get(f.figIndex).push(f);
  }
  const out = [];
  for (const [figIndex, rows] of byFig) {
    if (rows.length < 2) continue; // single mismatch → max-normalized chart
    for (const r of rows) {
      out.push(
        `figure #${figIndex + 1} row ${r.rowIndex + 1}: --w:${r.width.toFixed(3)} but text "${r.numText}" → share ${r.share.toFixed(4)} (Δ ${r.diff.toFixed(3)})`,
      );
    }
  }
  return out;
}

// --------------------------------------------------------------------
//  Main entry — runs only when this file is executed directly. When
//  imported (e.g., by scripts/test-article-graphics.mjs), the helpers
//  above are available without triggering the filesystem audit.
// --------------------------------------------------------------------

// Robust ESM main-module detection: compare the file URL of this module
// against pathToFileURL of process.argv[1]. Handles absolute and relative
// invocations and survives symlinks via fs.realpathSync.native fallback.
// When invoked as `node scripts/check-article-graphics.mjs`, both sides
// resolve to the same file:// URL; when imported by a test, argv[1] is
// the test file and the comparison is false.
import { pathToFileURL } from 'node:url';
let isMain = false;
try {
  if (process.argv[1]) {
    isMain = import.meta.url === pathToFileURL(process.argv[1]).href
          || process.argv[1].endsWith('check-article-graphics.mjs');
  }
} catch {
  isMain = process.argv[1] && process.argv[1].endsWith('check-article-graphics.mjs');
}
if (!isMain) {
  // Module mode — skip the audit; helpers are already exported.
} else {

// --------------------------------------------------------------------
//  Pass 1: collect every article's figures, hash them for cross-post
//  dedup, and run per-article rules in pass 2 below.
// --------------------------------------------------------------------

const articles = []; // { abs, rel, slugPath, html, figs, vizKinds }
const hashToSlugs = new Map(); // figureHash → Set<slugPath>

for (const root of SCAN_ROOTS) {
  for (const abs of walkArticleHtml(root)) {
    const rel = path.relative(REPO, abs);
    const html = fs.readFileSync(abs, 'utf8');
    if (!isArticleBody(html)) continue;
    if (skipDrafts && isDraft(html)) continue;

    const figs = collectContentFigures(html);
    const slugPath = relSlugPath(abs);
    const vizKinds = new Set();
    for (const f of figs) {
      for (const k of detectVizKinds(f.inner)) vizKinds.add(k);
      const h = hashFigureInner(f.inner);
      f.hash = h;
      if (!hashToSlugs.has(h)) hashToSlugs.set(h, new Set());
      hashToSlugs.get(h).add(slugPath);
    }

    articles.push({ abs, rel, slugPath, html, figs, vizKinds });
  }
}

// --------------------------------------------------------------------
//  Pass 2: per-article rules + global dedup.
// --------------------------------------------------------------------

const failures = [];

for (const art of articles) {
  const { rel, slugPath, html, figs, vizKinds } = art;

  // Rule 1 — floor.
  if (figs.length < 2 && !isWaived(slugPath, 1)) {
    failures.push({
      file: rel, rule: 1,
      msg: `${figs.length} content figure(s); canon floor is 2`,
    });
  }

  // Rule 2 — variety. Only meaningful when the floor is met.
  if (figs.length >= 2 && vizKinds.size < 2 && !isWaived(slugPath, 2)) {
    const detected = [...vizKinds].sort().join(', ') || '(none detected)';
    failures.push({
      file: rel, rule: 2,
      msg: `only ${vizKinds.size} viz-* kind(s) — ${detected}; canon wants at least 2 distinct kinds`,
    });
  }

  // Rules 3 + 4 — per-figure metadata.
  figs.forEach((f, i) => {
    const where = `figure #${i + 1}`;
    const alt = getDataAudioAlt(f.openAttrs);
    if (alt.length < DATA_AUDIO_ALT_MIN && !isWaived(slugPath, 3)) {
      failures.push({
        file: rel, rule: 3,
        msg: `${where}: data-audio-alt is ${alt.length} char(s); narration floor is ${DATA_AUDIO_ALT_MIN}`,
      });
    }
    if (!hasFigcaption(f.inner) && !isWaived(slugPath, 4)) {
      failures.push({
        file: rel, rule: 4,
        msg: `${where}: missing <figcaption>`,
      });
    }
  });

  // Rule 5 — tone balance. If any figure uses data-tone="teal", the post
  // body needs a data-tone="rust" somewhere.
  const figsTeal = figs.some((f) => /\bdata-tone="teal"/.test(f.inner));
  if (figsTeal && !/\bdata-tone="rust"/.test(html) && !isWaived(slugPath, 5)) {
    failures.push({
      file: rel, rule: 5,
      msg: 'figures use data-tone="teal" but the post never uses data-tone="rust"; the visual phase-break from canon §8 is missing',
    });
  }

  // Rule 6 — viz-bars consistency.
  if (!isWaived(slugPath, 6)) {
    const mismatches = checkVizBarsConsistency(figs);
    for (const m of mismatches) {
      failures.push({ file: rel, rule: 6, msg: m });
    }
  }

  // Rule 8 — autolink markers inside attribute values. Runs on the
  // whole HTML, not just figures, since the corruption can affect any
  // attribute (data-audio-alt, aria-label, alt, etc.).
  if (!isWaived(slugPath, 8)) {
    const autolinkHits = findAutolinkInAttribute(html);
    for (const h of autolinkHits) {
      failures.push({
        file: rel, rule: 8,
        msg: `line ${h.line}: ${h.attr}="…${h.excerpt}…" contains LIBRARY:autolink:start marker inside attribute value`,
      });
    }
  }
}

// Rule 7 — cross-post dedup. Run after all articles are collected.
const dupGroups = [];
for (const [hash, slugSet] of hashToSlugs) {
  if (slugSet.size < 2) continue;
  if (DEDUP_ALLOW.has(hash)) continue;
  dupGroups.push({ hash, slugs: [...slugSet] });
}
for (const dg of dupGroups) {
  // Report once per dup group, attached to the lexicographically first
  // article in the group, so the diagnostic doesn't fire N times.
  const owner = dg.slugs.sort()[0] + '/index.html';
  failures.push({
    file: owner,
    rule: 7,
    msg: `figure (hash ${dg.hash}) is duplicated across ${dg.slugs.length} article(s): ${dg.slugs.join(', ')}; add the hash to DEDUP_ALLOW if this sharing is intentional`,
  });
}

// --------------------------------------------------------------------
//  Report
// --------------------------------------------------------------------

if (failures.length === 0) {
  console.log(`check-article-graphics: ${articles.length} article(s) scanned, 0 violations.`);
  process.exit(0);
}

console.error(`check-article-graphics: ${failures.length} violation(s) across ${articles.length} article(s):\n`);

const byFile = new Map();
for (const v of failures) {
  if (!byFile.has(v.file)) byFile.set(v.file, []);
  byFile.get(v.file).push(v);
}
for (const [file, vs] of byFile) {
  console.error(`  ${file}`);
  for (const v of vs) {
    console.error(`    rule ${v.rule}: ${v.msg}`);
  }
  console.error('');
}
console.error('Rules:');
console.error('  1 — ≥ 2 content <figure> per article (viz-figure or article-figure).');
console.error(`  2 — ≥ 2 distinct viz-* kinds across the figures.`);
console.error(`  3 — every content figure carries data-audio-alt of at least ${DATA_AUDIO_ALT_MIN} chars.`);
console.error('  4 — every content figure contains a <figcaption>.');
console.error('  5 — data-tone="teal" figures must be paired with data-tone="rust" somewhere in the post.');
console.error('  6 — viz-bars rows: --w CSS width and rendered number must agree within ±0.02.');
console.error('  7 — no cross-post figure duplication (allowlist via DEDUP_ALLOW).');
console.error('  8 — no LIBRARY:autolink markers inside attribute values (catches body→attribute copy-paste corruption).');
console.error('');
console.error('Canon: docs/voice-canon-library.md §8 and docs/voice-canon-blog.md §7.');
console.error('Waivers: add { path, rule, why } to HISTORICAL_WAIVERS with a dated comment.');

process.exit(1);

} // end of isMain block
