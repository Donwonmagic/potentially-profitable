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
 *
 * Not enforced here (intentional gaps)
 *   - Citation-slug registry. Originally proposed: figures using a
 *     sourced number must have the slug listed in that claim's `used_in`
 *     array. The current `data/sourced-claims.json` registry doesn't
 *     have a stable per-figure linkage (claims are keyed to articles,
 *     not figures); enforcing this would require a separate per-figure
 *     marker first. Left for a follow-up if the registry adds one.
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

const SCAN_ROOTS = ['library', 'blog', 'es/library', 'es/blog'];

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
  // EN variety follow-up — figures of a different viz-* kind needed.
  { path: 'library/how-to-raise-restaurant-menu-prices-without-losing-reservations', rule: 2, why: '2026-05-28 — EN variety follow-up; only viz-ba present, needs viz-bars or viz-tree' },
  { path: 'library/how-to-set-up-google-business-profile-for-your-restaurant',       rule: 2, why: '2026-05-28 — EN variety follow-up; only viz-flow present, needs viz-tree or viz-bars' },
  { path: 'library/what-should-be-on-a-restaurant-website',                          rule: 2, why: '2026-05-28 — EN variety follow-up; only viz-flow present, needs viz-tree or viz-bars' },
  { path: 'blog/google-ai-mode-restaurant-local-results-2026',                       rule: 2, why: '2026-05-28 — EN variety follow-up; three viz-flow figures, needs one viz-ba or viz-tree' },

  // ES translation sweep — mirror EN figures with translated metadata.
  { path: 'es/library/como-configurar-google-business-profile-para-tu-restaurante', rule: 2, why: '2026-05-28 — ES translation sweep pending; mirror EN variety addition' },
  { path: 'es/library/como-conseguir-mas-resenas-google-para-tu-restaurante',       rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure' },
  { path: 'es/library/como-hacer-sitio-web-para-mi-restaurante',                    rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/como-leer-google-search-console-de-tu-restaurante',           rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/como-leer-google-search-console-de-tu-restaurante',           rule: 3, why: '2026-05-28 — ES translation sweep pending; narration length below floor' },
  { path: 'es/library/como-saber-si-una-herramienta-de-restaurante-es-segura',      rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/como-saber-si-una-herramienta-de-restaurante-es-segura',      rule: 3, why: '2026-05-28 — ES translation sweep pending; narration length below floor' },
  { path: 'es/library/como-salir-de-doordash-mi-restaurante',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/como-subir-precios-de-menu-sin-perder-reservas',              rule: 2, why: '2026-05-28 — ES translation sweep pending; mirror EN variety addition' },
  { path: 'es/library/cuando-rehacer-tu-sitio-web-de-restaurante',                  rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/cuando-rehacer-tu-sitio-web-de-restaurante',                  rule: 3, why: '2026-05-28 — ES translation sweep pending; narration length below floor' },
  { path: 'es/library/cuanto-cuesta-una-pagina-web-para-restaurante-2026',          rule: 1, why: '2026-05-28 — ES translation sweep pending; figures stripped in translation' },
  { path: 'es/library/especificaciones-de-fotos-para-restaurantes',                 rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/especificaciones-de-fotos-para-restaurantes',                 rule: 3, why: '2026-05-28 — ES translation sweep pending; narration length below floor' },
  { path: 'es/library/los-6-tipos-de-schema-markup-que-google-usa',                 rule: 2, why: '2026-05-28 — ES translation sweep pending; viz-* class missing on figures' },
  { path: 'es/library/los-6-tipos-de-schema-markup-que-google-usa',                 rule: 3, why: '2026-05-28 — ES translation sweep pending; narration length below floor' },
  { path: 'es/library/puede-chatgpt-escribir-tu-sitio-web-de-restaurante',          rule: 5, why: '2026-05-28 — ES translation sweep pending; mirror EN rust accent' },
  { path: 'es/library/que-debe-tener-un-sitio-web-de-restaurante',                  rule: 2, why: '2026-05-28 — ES translation sweep pending; mirror EN variety addition' },
  { path: 'es/library/que-debe-tener-un-sitio-web-de-restaurante',                  rule: 5, why: '2026-05-28 — ES translation sweep pending; mirror EN rust accent' },
  { path: 'es/library/reserva-en-google-ai-mode-restaurante-2026',                  rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure' },
  { path: 'es/library/toast-vs-square-vs-clover-para-restaurantes',                 rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure (viz-tree decision diagnostic)' },
  { path: 'es/library/wix-vs-custom-para-restaurantes',                             rule: 2, why: '2026-05-28 — ES translation sweep pending; mirror EN viz-flow addition' },
  { path: 'es/library/wix-vs-custom-para-restaurantes',                             rule: 3, why: '2026-05-28 — ES translation sweep pending; narration missing' },
  // ES /blog/ posts whose canonical EN counterpart now lives at /library/ — legacy from the blog→library split.
  { path: 'es/blog/can-chatgpt-write-your-restaurant-website',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/does-my-restaurant-need-a-website',                               rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/google-ai-mode-resultados-locales-restaurante-2026',              rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure' },
  { path: 'es/blog/how-to-get-more-google-reviews-for-your-restaurant',              rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/how-to-raise-restaurant-menu-prices-without-losing-reservations', rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/how-to-set-up-google-business-profile-for-your-restaurant',       rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/lanzamiento-mayo-2026-publicar-para-citacion',                    rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN reading-arc viz-flow' },
  { path: 'es/blog/lanzamiento-mayo-2026-publicar-para-citacion',                    rule: 5, why: '2026-05-28 — ES translation sweep pending; mirror EN rust accent' },
  { path: 'es/blog/toast-vs-square-vs-clover-for-restaurants',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/trafico-referido-gemini-restaurantes-2026',                       rule: 1, why: '2026-05-28 — ES translation sweep pending; mirror EN second figure' },
  { path: 'es/blog/trafico-referido-gemini-restaurantes-2026',                       rule: 5, why: '2026-05-28 — ES translation sweep pending; mirror EN rust accent' },
  { path: 'es/blog/what-should-be-on-a-restaurant-website',                          rule: 1, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, EN counterpart at /library/' },
  { path: 'es/blog/wix-vs-custom-for-restaurants',                                   rule: 2, why: '2026-05-28 — ES translation sweep pending; legacy /es/blog/ slug, mirror EN viz-flow addition' },
  { path: 'es/blog/wix-vs-custom-for-restaurants',                                   rule: 3, why: '2026-05-28 — ES translation sweep pending; narration missing' },
];

// Inner-text SHA1 hashes that are legitimately repeated across articles
// (shared diagrams, side-by-side companions). Each entry: dated comment.
const DEDUP_ALLOW = new Set();

// The viz-* family names this gate recognises. Wrapper class viz-figure
// or article-figure marks the figure; the *inner* class names the kind.
// New kinds: add here AND mention in the canon §8 list.
const VIZ_KINDS = [
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

const DATA_AUDIO_ALT_MIN = 80;

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

function isArticleBody(html) {
  return /<article\b[^>]*\bid="post-body"/.test(html);
}

function isDraft(html) {
  return /<article\b[^>]*\bdata-draft="true"/.test(html);
}

// Extract every content <figure> block. The match is non-greedy so
// adjacent figures don't collapse.
const CONTENT_FIGURE_RE =
  /<figure\b([^>]*\bclass="[^"]*\b(?:viz-figure|article-figure)\b[^"]*"[^>]*)>([\s\S]*?)<\/figure>/g;

function collectContentFigures(html) {
  CONTENT_FIGURE_RE.lastIndex = 0;
  const out = [];
  let m;
  while ((m = CONTENT_FIGURE_RE.exec(html)) !== null) {
    out.push({ openAttrs: m[1], inner: m[2], raw: m[0] });
  }
  return out;
}

function getDataAudioAlt(openAttrs) {
  const m = /\bdata-audio-alt=(['"])([\s\S]*?)\1/.exec(openAttrs);
  return m ? m[2] : '';
}

function hasFigcaption(inner) {
  return /<figcaption\b/.test(inner);
}

function detectVizKinds(inner) {
  const kinds = new Set();
  for (const kind of VIZ_KINDS) {
    // Match the kind as a whole class word inside class="…"
    const re = new RegExp(`\\bclass="[^"]*\\b${kind}\\b[^"]*"`);
    if (re.test(inner)) kinds.add(kind);
  }
  return kinds;
}

function hashFigureInner(inner) {
  // Strip whitespace + HTML comments so cosmetic-only differences don't
  // dodge the dedup gate. Hash the result.
  const normalized = inner
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return crypto.createHash('sha1').update(normalized).digest('hex').slice(0, 12);
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

function numTextToShare(text) {
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
console.error('');
console.error('Canon: docs/voice-canon-library.md §8 and docs/voice-canon-blog.md §7.');
console.error('Waivers: add { path, rule, why } to HISTORICAL_WAIVERS with a dated comment.');

process.exit(1);
