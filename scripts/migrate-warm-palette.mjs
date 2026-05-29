#!/usr/bin/env node
/**
 * Wave 8b completion — migrate the retired WARM editorial palette to the
 * COOL financial-grade palette across the site.
 *
 * Background: commit fb86dad3f ("Wave 8b — apex muntin.digital adopts
 * financial-grade DNA") re-pigmented assets/site.css to the cool slate +
 * blue palette but left the per-page INLINE critical CSS (and the page-
 * generator templates) warm. Result: every page declares a warm :root in
 * its <head>, then site.css repaints it cool — a sitewide warm flash, and
 * new pages are still born warm. This finishes the job.
 *
 * SAFE BY CONSTRUCTION. It rewrites hex ONLY in these contexts:
 *   1. muntin token DECLARATIONS:  --cream:#FAF7F2   -> --cream:#F6F7F8
 *   2. token var() FALLBACKS:      var(--teal,#1F4E5B) -> var(--teal,#2A50C8)
 *   3. the FULL retired set, but ONLY inside a <style> block that declares
 *      --cream (a confirmed muntin critical-CSS block — never a theme
 *      swatch block, which has no --cream).
 *   4. <meta name="theme-color"> values.
 * Prose, inline theme swatches (style="background:#B8541A"), and the
 * palette-demo tools (EXCLUDE) are never touched.
 *
 * Modes:
 *   (default)    rewrite in place; print a summary
 *   --dry-run    print what WOULD change (counts + sample), write nothing
 *   --check      report only; exit 1 if any in-scope retired hex remains
 *                (CI lock, wired into scripts/check-all.mjs)
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");

// Per-token old -> new (the canonical editorial register; see
// packages/ui/muntin.tokens.json in the product repo / data/muntin.tokens.json).
const TOKENS = {
  "--cream": ["#FAF7F2", "#F6F7F8"],
  "--cream-2": ["#F3EEE3", "#EDEEF1"],
  "--ink": ["#14161A", "#16181D"],
  "--ink-soft": ["#2A2D33", "#4A4F59"],
  "--stone": ["#6B6B6B", "#6B7280"],
  "--stone-2": ["#9A958B", "#9AA0AB"],
  "--teal": ["#1F4E5B", "#2A50C8"],
  "--teal-dark": ["#143640", "#1F3A93"],
  "--teal-tint": ["#E8F1F3", "#EAF0FE"],
  "--rust": ["#B8541A", "#C42E2E"],
  "--line": ["#E8E2D6", "#E3E5E9"],
  "--line-dark": ["#D4CCBC", "#D7DAE0"],
  "--line-input": ["#8A8378", "#868D9A"],
};

// Union retired -> cool (for the in-a-muntin-block full replace + metas).
// Includes a few raw literals that only ever appear as muntin chrome.
const HEX = {
  "#faf7f2": "#F6F7F8",
  "#f3eee3": "#EDEEF1",
  "#fffdf8": "#FFFFFF",
  "#14161a": "#16181D",
  "#2a2d33": "#4A4F59",
  "#6b6b6b": "#6B7280",
  "#9a958b": "#9AA0AB",
  "#1f4e5b": "#2A50C8",
  "#143640": "#1F3A93",
  "#e8f1f3": "#EAF0FE",
  "#b8541a": "#C42E2E",
  "#e8e2d6": "#E3E5E9",
  "#d4ccbc": "#D7DAE0",
  "#8a8378": "#868D9A",
  "#d9d5cb": "#D7DAE0", // legacy .btn-ghost border (chrome only)
  // Older stale literals that linger only in chrome stylesheets:
  "#e5dfd2": "#E3E5E9", // pre-Wave-8b --line fallback
  "#c9c2b6": "#D7DAE0", // pre-Wave-8b --line-dark fallback
  "#b8901a": "#B7791F", // pre-Wave-8b --gold fallback
  "#d4a24c": "#B7791F", // pre-Wave-8b --gold fallback (lighter)
  "#143a45": "#1F3A93", // stale --teal-deep fallback (token undefined -> rendered warm)
  "#fbefe3": "#EDEEF1", // warm cream variant in decorative gradients (.pane/.portrait)
};

// Old-teal rgba() glazes -> cool blue. Applied to chrome stylesheets only
// (HTML inline swatches may legitimately use rgba and are left untouched).
const RGBA = {
  // old teal -> brand blue (#2A50C8)
  "rgba(31, 78, 91,": "rgba(42, 80, 200,",
  "rgba(31,78,91,": "rgba(42,80,200,",
  // old teal-tint -> cool accent-soft (#EAF0FE)
  "rgba(232, 241, 243,": "rgba(234, 240, 254,",
  "rgba(232,241,243,": "rgba(234,240,254,",
  // old teal-dark -> blue-dark (#1F3A93)
  "rgba(20, 54, 64,": "rgba(31, 58, 147,",
  "rgba(20,54,64,": "rgba(31,58,147,",
  // old rust -> brand blue (decorative tints only; status red stays #C42E2E)
  "rgba(201, 102, 45,": "rgba(42, 80, 200,",
  "rgba(201,102,45,": "rgba(42,80,200,",
};

// Paths never touched: VCS, deps, editorial docs, this script + token
// data, and the palette-demo tools the operator carved out explicitly.
const EXCLUDE = [
  `${path.sep}.git${path.sep}`,
  `${path.sep}node_modules${path.sep}`,
  `${path.sep}docs${path.sep}`,
  `${path.sep}tools${path.sep}brand-suite${path.sep}`,
  "palette-picker",
  "palette-sheet",
  "migrate-warm-palette",
  "muntin.tokens.json",
];

function excluded(p) {
  return EXCLUDE.some((frag) => p.includes(frag));
}

const reHex = (h) => new RegExp(h.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

/** Safe subset: only token declarations + token var() fallbacks. */
function safeSubset(s) {
  for (const [tok, [oldHex, newHex]] of Object.entries(TOKENS)) {
    const t = tok.replace(/[-]/g, "\\-");
    // declaration:  --tok : #old   (boundary stops --cream matching --cream-2)
    s = s.replace(new RegExp(`(${t}\\s*:\\s*)${oldHex}\\b`, "gi"), `$1${newHex}`);
    // fallback:     var( --tok , #old )
    s = s.replace(
      new RegExp(`(var\\(\\s*${t}\\s*,\\s*)${oldHex}(\\s*\\))`, "gi"),
      `$1${newHex}$2`,
    );
  }
  return s;
}

/** Full retired-hex replace — only ever run on confirmed muntin chrome. */
function fullHex(s) {
  for (const [oldHex, newHex] of Object.entries(HEX)) {
    s = s.replace(reHex(oldHex), newHex);
  }
  return s;
}

function transform(html) {
  let out = html;

  // 1+3) <style> blocks. Confirmed muntin block (declares --cream) gets the
  // full retired-hex sweep (catches the skip-link / nav raw literals); any
  // other <style> block (e.g. a theme-swatch block) gets only the safe subset.
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_m, open, body, close) => {
      const next = /--cream\b/.test(body) ? fullHex(safeSubset(body)) : safeSubset(body);
      return open + next + close;
    },
  );

  // 2) inline style="..."/'...' attributes — safe subset only (protects
  // inline theme swatches like style="background:#B8541A").
  out = out.replace(/(\sstyle=")([^"]*)(")/gi, (_m, a, v, b) => a + safeSubset(v) + b);
  out = out.replace(/(\sstyle=')([^']*)(')/gi, (_m, a, v, b) => a + safeSubset(v) + b);

  // 4) <meta name="theme-color" content="#..."> — color meta is always chrome.
  out = out.replace(/<meta\b[^>]*\btheme-color\b[^>]*>/gi, (m) => fullHex(m));

  return out;
}

// ---- walk + run -------------------------------------------------------

function walk(dir, acc) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (excluded(full + path.sep)) continue;
    const st = statSync(full);
    if (st.isDirectory()) walk(full, acc);
    else if (full.endsWith(".html") && !excluded(full)) acc.push(full);
  }
  return acc;
}

const mode = process.argv.includes("--check")
  ? "check"
  : process.argv.includes("--dry-run")
    ? "dry"
    : "write";

// Page-generator templates carry the same chrome (warm :root + theme-color).
// Fix them at the source so NEW pages are born cool, and lock them via --check.
// Same safe transform (their CSS lives in <style> blocks inside the template).
const TEMPLATES = [
  "build-theme-story-pages.mjs",
  "new-article-skeleton.mjs",
  "new-workshop-widget.mjs",
  "build-themes-review-board.mjs",
  "build-cuisine-landing-pages.mjs",
  "new-course-lesson.mjs",
].map((s) => path.join(REPO, "scripts", s));

// Chrome stylesheets (no theme-swatch content) get a full safe sweep.
const STYLESHEETS = ["assets/sheets.css", "assets/site.css"].map((s) =>
  path.join(REPO, s),
);
// Injector scripts whose template strings stamp chrome into pages. Warm
// hex here would re-warm output on the next build, so sweep + lock them.
// Safe to fullHex: these emit chrome only, no theme-swatch color data.
const SCRIPTS = [
  "scripts/inject-critical-fonts.mjs",
  "scripts/inject-critical-link-color.mjs",
  "scripts/inject-course-mark-complete.mjs",
  "scripts/build-sheets-index.mjs",
].map((s) => path.join(REPO, s));
// Brand chrome SVGs used directly in page HTML — cool + lock them here. NOT
// brand/og (those render to PNGs -> the OG re-render follow-on) and NOT
// brand/icons (they feed build-og-cards -> same follow-on).
function collectSvg(dir) {
  const out = [];
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return out;
  }
  for (const n of names) {
    const full = path.join(dir, n);
    if (statSync(full).isDirectory()) out.push(...collectSvg(full));
    else if (full.endsWith(".svg")) out.push(full);
  }
  return out;
}
const BRAND_SVGS = collectSvg(path.join(REPO, "brand/lockup"));
// Tool pages whose warm hex lives in render-JS / inline SVG strings (beyond the
// safe transform's reach). Full sweep is safe — calculator UI, no theme-swatch
// color content.
const TOOLS_FULLHEX = [
  "tools/menu-engineering/index.html",
  "es/tools/menu-engineering/index.html",
].map((s) => path.join(REPO, s));

const SWEEP = new Set([...STYLESHEETS, ...SCRIPTS, ...BRAND_SVGS, ...TOOLS_FULLHEX]);
const files = [
  ...new Set([
    ...walk(REPO, []),
    ...TEMPLATES,
    ...SCRIPTS,
    ...STYLESHEETS,
    ...BRAND_SVGS,
    ...TOOLS_FULLHEX,
  ]),
];
let changed = 0;
const samples = [];

function purgeStylesheet(s) {
  s = fullHex(s);
  for (const [oldRgba, newRgba] of Object.entries(RGBA)) s = s.split(oldRgba).join(newRgba);
  return s;
}

for (const f of files) {
  const src = readFileSync(f, "utf8");
  const next = SWEEP.has(f) ? purgeStylesheet(src) : transform(src);
  if (next === src) continue;
  changed++;
  if (samples.length < 3) {
    const i = [...src].findIndex((_, k) => src[k] !== next[k]);
    samples.push(`  ${path.relative(REPO, f)} @${i}: …${src.slice(i, i + 40).replace(/\n/g, " ")}… -> …${next.slice(i, i + 40).replace(/\n/g, " ")}…`);
  }
  if (mode === "write") writeFileSync(f, next);
}

if (mode === "check") {
  if (changed) {
    console.error(`✗ warm-palette purge: ${changed} file(s) still carry retired warm hex in muntin chrome. Run: node scripts/migrate-warm-palette.mjs`);
    process.exit(1);
  }
  console.log(`✓ warm-palette purge: no retired warm hex in muntin chrome across ${files.length} HTML files`);
} else {
  console.log(`${mode === "dry" ? "[dry-run] would change" : "migrated"} ${changed} of ${files.length} HTML files`);
  if (samples.length) console.log("samples:\n" + samples.join("\n"));
  if (mode === "dry") console.log("(no files written)");
}
