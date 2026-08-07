#!/usr/bin/env node
/**
 * build-design-inventory.mjs — the Design BOM. The visual + verbal system, MEASURED.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * Sixteen planning documents across 2,723 lines describe what this site should look
 * like. The site still looks the same. The 2026-08-07 company audit measured why:
 * prior audits close at 26%, and no closure in company history came from anyone
 * working a document's list. This repo's working architecture is
 * manifest -> injector -> gate. So the redesign's starting inventory is written as a
 * MANIFEST, not as prose: every number below is read off the files on disk, and a
 * re-run tells the truth about the tree as it is that day.
 *
 * WHAT IT ANSWERS
 *
 *   1. TOKENS — every CSS custom property defined in either repo, its value(s), which
 *      repo defines it, and whether the two agree. The audit asserted the token spine
 *      is "byte-identical and hash-locked". This VERIFIES that claim three ways: a
 *      sha256 of the shared manifest in both repos, a name-by-name comparison of the
 *      declared properties, and a VALUE bridge (the two repos deliberately use
 *      different NAMES — --teal here, --mun-accent-text there — so name overlap alone
 *      would badly understate the agreement).
 *   2. TYPOGRAPHY — every font-family stack, font-size and font-weight literal
 *      actually used, with counts and unit distribution, plus the shipped webfonts.
 *   3. COLOR — every hex literal in a colour-bearing position, split into token
 *      DEFINITIONS (`--x:#hex`) and raw LITERAL uses (`color:#hex`). A literal that
 *      does not equal any token value is off-system drift; a literal that DOES equal
 *      a token value is hardcoding — a weaker drift, but drift. Near-misses (RGB
 *      distance <= NEAR_MISS) are called out separately because they are the ones a
 *      human eye cannot catch (--stone #9AA0AB vs a literal #9aa0aa).
 *   4. VIZ FAMILIES — how many actual <figure> elements of each viz-* kind exist
 *      across the corpus, which families the CSS defines but nothing uses, and which
 *      the HTML uses but the CSS never defines.
 *   5. BRAND ASSETS — every file under brand/, its format and size, every file in the
 *      repo that references it, and therefore which ones are orphaned.
 *   6. COPY — the product's microcopy library (key count, EN/ES parity measured over
 *      EVERY namespace, not just the two the gate covers) and the storefront's voice
 *      canons, each marked gate-enforced or prose-only by measuring which check-*.mjs
 *      names it and whether that gate is wired into a runner.
 *
 * ROOT LIST (the hard-won lesson — CLAUDE.md, "A scanner is only as good as its root
 * list"). This walks BOTH repos in full and carries the explicit SKIP map below, where
 * every entry states why the tree is not authored, reader-facing design surface. Three
 * gates in this repo shipped bugs in 2026-07 by scanning a narrow subtree. Silent
 * scope is the defect; narrow scope declared out loud is fine.
 *
 * HEX IS NOT A COLOUR UNTIL IT IS IN A COLOUR POSITION. A naive `#[0-9a-f]{3,8}` sweep
 * of the HTML returns 57,824 hits — it counts `href="#faq"`-shaped anchors, SVG
 * `url(#gradient)` references and id attributes as brand colours. Literals are
 * therefore only counted inside CSS files, <style> blocks, style="" attributes and SVG
 * paint attributes (fill/stroke/stop-color/flood-color/lighting-color), with url(...)
 * stripped from every value first. Same failure mode as check-claim-usage's footer
 * URLs reading as citations.
 *
 * GENERATED vs AUTHORED. assets/site-core.css, site-article.css and site-tool.css are
 * emitted by build-css-shells.mjs from assets/site.css. They are scanned (they ship to
 * readers) but flagged `generated:true`, and the authored-surface rollups exclude them
 * so one edit is not counted four times.
 *
 * TOKENS vs INSTANCE VARIABLES. `--teal:#2A50C8` in a <style> block is a token
 * declaration; `style="--w:.42"` on a viz-bars row is per-figure geometry. They are
 * bucketed apart — conflating them makes 3,579 chart bars look like a token system.
 *
 * DETERMINISM. No wall clock, no network, no npm. `asOf` is the newest commit date in
 * the storefront, so --check is stable until a commit lands. Every map is emitted in a
 * sorted order. Two runs against the same tree are byte-identical.
 *
 * DO NOT WIRE THIS INTO check-all.mjs. --check here does not assert the site is
 * correct; it asserts the emitted inventory matches what the tree currently contains.
 * The inventory is SUPPOSED to move when the design moves — wiring it into the deploy
 * would turn "someone finally deleted a stray hex" into a red deploy. Re-run it by
 * hand at the top of a design session and commit the diff; the diff is the report.
 *
 * Output: docs/handoff/bones/design-inventory.json
 *
 *   node scripts/build-design-inventory.mjs             # write the manifest
 *   node scripts/build-design-inventory.mjs --check     # exit 1 if the output would change
 *   node scripts/build-design-inventory.mjs --report    # print the rollups + top-10 to stdout
 *   node scripts/build-design-inventory.mjs --self-test # unit-test the pure helpers
 *
 * Exit codes:
 *   0 — written / up to date / self-test passed
 *   1 — --check found drift, or the self-test failed
 */

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const PRODUCT = path.resolve(REPO, '..', 'Muntin-Invoice-Decoder');
const OUT = 'docs/handoff/bones/design-inventory.json';

/** Two hexes closer than this in summed RGB distance are a "near miss" — invisible drift. */
const NEAR_MISS = 12;

/* ------------------------------------------------------------------ root list */

/**
 * Directory names never walked, in EITHER repo. Every entry states why it is not
 * authored, reader-facing design surface. Anything not listed here IS walked — this
 * list is the honest denominator.
 */
const SKIP = {
  '.git': 'VCS internals — not authored content',
  node_modules: 'vendored third-party dependencies — not our design system',
  '.next': 'Next.js build output — a compiled copy of source already walked',
  '.open-next': 'OpenNext build output — same, compiled',
  '.wrangler': 'local Cloudflare build cache — regenerated, never edited',
  '.turbo': 'task-runner cache — regenerated',
  dist: 'deploy staging — a copy of files already walked at their source path',
  build: 'compiled output — a copy of source already walked',
  coverage: 'test coverage output — regenerated, not shipped',
  '.venv': 'Python virtualenv — third-party, not ours',
  __pycache__: 'Python bytecode cache — regenerated',
  'test-results': 'Playwright run output — regenerated',
  'playwright-report': 'Playwright run output — regenerated',
};

/**
 * Storefront trees the HTML page walk skips, with why. Everything else under the repo
 * root that ends in .html is treated as a reader-facing page.
 */
const SKIP_HTML = {
  docs: 'internal editorial/handoff prose, excluded from the deploy tar and never served — including the redesign prototypes whose whole point is to look different from the site',
  tests: 'Playwright fixtures and harness pages — never served',
  'assets/vendor': 'third-party vendored libraries — not our design system',
};

/** CSS emitted by scripts/build-css-shells.mjs from assets/site.css. Scanned, but not authored. */
const GENERATED_CSS = new Set([
  'assets/site-core.css',
  'assets/site-article.css',
  'assets/site-tool.css',
]);

/** Text extensions scanned when looking for references to brand/ assets. */
const REF_EXT = new Set([
  '.html', '.css', '.js', '.mjs', '.cjs', '.json', '.md', '.txt', '.xml',
  '.webmanifest', '.ts', '.tsx', '.jsx', '.yml', '.yaml', '.svg', '.jsonc',
]);

/* ------------------------------------------------------- pure helpers (self-tested) */

/** Strip CSS block comments so commented-out examples never count as declarations. */
export function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, ' ');
}

/** Strip // line comments and block comments from JS/TS source. */
export function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/\/\/[^\n]*/g, ' ');
}

/** Normalise a hex colour to lowercase 6-digit (#abc -> #aabbcc). 8-digit keeps alpha. */
export function normHex(h) {
  const s = h.toLowerCase();
  if (s.length === 4) return '#' + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  return s;
}

/** Summed absolute RGB distance between two normalised hexes. null if either is not 6-digit. */
export function hexDistance(a, b) {
  if (a.length !== 7 || b.length !== 7) return null;
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  if ([ar, ag, ab, br, bg, bb].some((n) => Number.isNaN(n))) return null;
  return Math.abs(ar - br) + Math.abs(ag - bg) + Math.abs(ab - bb);
}

/**
 * Split a comment-stripped CSS body into `{prop, value}` declarations.
 *
 * Deliberately forgiving: the site ships minified CSS with no trailing semicolon on the
 * last declaration in a block, so values terminate on `;`, `{` or `}`. Selector
 * fragments (`a:hover`) parse as junk declarations, which is harmless — every consumer
 * below filters on a specific property name or on the value containing a hex.
 */
export function parseDeclarations(css) {
  const out = [];
  const re = /(--[A-Za-z0-9_-]+|[A-Za-z-]+)\s*:\s*([^;{}]*)/g;
  let m;
  while ((m = re.exec(css)) !== null) out.push({ prop: m[1], value: m[2].trim() });
  return out;
}

/** Remove url(...) so `fill:url(#grad)` never reads as the colour #grad. */
export function stripUrls(value) {
  return value.replace(/url\([^)]*\)/gi, ' ');
}

/** Every hex colour literal in a declaration value, normalised. */
export function hexesIn(value) {
  const v = stripUrls(value);
  return [...v.matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map((m) => normHex(m[0]));
}

/** Collapse whitespace so `font-family: var(--x)` and `font-family:var(--x)` are one stack. */
export function normStack(v) {
  return v.replace(/\s+/g, ' ').replace(/\s*,\s*/g, ',').trim();
}

/** Contents of every <style> block in an HTML document. */
export function styleBlocks(html) {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1]);
}

/** Contents of every style="" / style='' attribute. */
export function styleAttrs(html) {
  return [
    ...html.matchAll(/\sstyle="([^"]*)"/gi),
    ...html.matchAll(/\sstyle='([^']*)'/gi),
  ].map((m) => m[1]);
}

/** SVG paint attributes carrying a literal hex (fill="#2a50c8"), normalised. */
export function svgPaintHexes(html) {
  return [
    ...html.matchAll(/\s(fill|stroke|stop-color|flood-color|lighting-color)="(#[0-9a-fA-F]{3,8})"/gi),
  ].map((m) => ({ attr: m[1].toLowerCase(), hex: normHex(m[2]) }));
}

/**
 * Every <figure> whose class carries the corpus figure wrapper, with the viz-* kinds
 * found on the figure element itself and inside its body. Mirrors the figure regex in
 * check-article-graphics.mjs so the inventory and the gate cannot disagree about what
 * counts as a figure.
 */
export function figuresIn(html) {
  const re = /<figure\b([^>]*\bclass="[^"]*\b(?:viz-figure|article-figure)\b[^"]*"[^>]*)>([\s\S]*?)<\/figure>/g;
  const out = [];
  let m;
  while ((m = re.exec(html)) !== null) {
    const kinds = new Set();
    for (const k of (m[1] + m[2]).matchAll(/\bviz-([a-z][a-z0-9]*)\b/g)) {
      if (k[1] === 'figure' || k[1] === 'sr') continue; // wrapper + the screen-reader table
      kinds.add('viz-' + k[1]);
    }
    out.push({ wrapper: /\bviz-figure\b/.test(m[1]) ? 'viz-figure' : 'article-figure', kinds: [...kinds].sort() });
  }
  return out;
}

/**
 * Leaf key paths of a `export const COPY = { ... }` TypeScript object literal.
 * Adapted from the product repo's scripts/check-locale-parity.mjs walker so the two
 * agree on what a "key" is, but rooted at the whole object rather than one namespace.
 */
export function copyLeafPaths(source) {
  const s = stripJsComments(source);
  const open = /export\s+const\s+COPY\s*(?::[^=]+)?=\s*\{/.exec(s);
  if (!open) return [];
  let i = open.index + open[0].length;
  const paths = [];
  const stack = [];
  let depth = 1;
  while (i < s.length && depth > 0) {
    const ch = s[i];
    if (ch === '}') {
      depth--;
      if (depth === 0) break;
      stack.pop();
      i++;
      continue;
    }
    if (ch === '{') { depth++; i++; continue; }
    if (/[\s,]/.test(ch)) { i++; continue; }
    const rest = s.slice(i);
    const keyMatch = /^([A-Za-z_$][A-Za-z0-9_$]*)\s*:\s*/.exec(rest) || /^"([^"]+)"\s*:\s*/.exec(rest);
    if (!keyMatch) { i++; continue; }
    const key = keyMatch[1];
    i += keyMatch[0].length;
    const next = s[i];
    if (next === '{') { stack.push(key); depth++; i++; continue; }
    if (next === '"' || next === "'" || next === '`') {
      const quote = next;
      i++;
      while (i < s.length) {
        if (s[i] === '\\') { i += 2; continue; }
        if (s[i] === quote) { i++; break; }
        i++;
      }
      paths.push([...stack, key].join('.'));
      continue;
    }
    if (next === '[') {
      let d = 0;
      while (i < s.length) {
        if (s[i] === '[') d++;
        else if (s[i] === ']') { d--; if (d === 0) { i++; break; } }
        i++;
      }
      paths.push([...stack, key].join('.'));
      continue;
    }
    while (i < s.length && s[i] !== ',' && s[i] !== '}') i++;
    paths.push([...stack, key].join('.'));
  }
  return paths.sort();
}

/* ------------------------------------------------------------------ self-test */

if (process.argv.includes('--self-test')) {
  const fails = [];
  const eq = (label, got, want) => {
    const a = JSON.stringify(got);
    const b = JSON.stringify(want);
    if (a !== b) fails.push(`${label}\n  got  ${a}\n  want ${b}`);
  };
  eq('normHex 3-digit', normHex('#ABC'), '#aabbcc');
  eq('normHex 6-digit', normHex('#2A50C8'), '#2a50c8');
  eq('hexDistance identical', hexDistance('#2a50c8', '#2a50c8'), 0);
  eq('hexDistance near miss', hexDistance('#9aa0aa', '#9aa0ab'), 1);
  eq('hexDistance 8-digit -> null', hexDistance('#2a50c8ff', '#2a50c8'), null);
  eq('stripUrls kills gradient ref', hexesIn('fill:url(#grad) #ABC'), ['#aabbcc']);
  eq('hexesIn ignores 5-char id', hexesIn('color:#abcde1x'), []);
  eq(
    'parseDeclarations minified last-decl',
    parseDeclarations(':root{--a:#fff;--b:2px}').map((d) => d.prop + '=' + d.value),
    ['--a=#fff', '--b=2px']
  );
  eq('stripCssComments', parseDeclarations(stripCssComments('/*--z:#000*/--a:#fff')).length, 1);
  eq('normStack', normStack("  'Inter' ,   serif  "), "'Inter',serif");
  eq('styleBlocks', styleBlocks('<style>a{}</style>x<style id="d">b{}</style>'), ['a{}', 'b{}']);
  eq('styleAttrs', styleAttrs('<i style="--w:.4"></i>'), ['--w:.4']);
  eq('svgPaintHexes', svgPaintHexes('<path fill="#2A50C8"/>'), [{ attr: 'fill', hex: '#2a50c8' }]);
  eq(
    'figuresIn kinds',
    figuresIn('<figure class="viz-figure"><div class="viz-bars"><i class="viz-bars__row"></i></div></figure>'),
    [{ wrapper: 'viz-figure', kinds: ['viz-bars'] }]
  );
  eq('figuresIn skips non-figure', figuresIn('<figure class="plain"><div class="viz-bars"></div></figure>'), []);
  eq(
    'copyLeafPaths nested + comment',
    copyLeafPaths('export const COPY = {\n a: { b: "x" }, // c: "no"\n d: "y"\n};'),
    ['a.b', 'd']
  );
  eq(
    'copyLeafPaths array leaf',
    copyLeafPaths('export const COPY = { list: ["a","b"], t: "z" };'),
    ['list', 't']
  );
  if (fails.length) {
    console.error('✗ build-design-inventory self-test FAILED\n' + fails.join('\n'));
    process.exit(1);
  }
  console.log('✓ build-design-inventory self-test: 16 assertions passed.');
  process.exit(0);
}

/* ------------------------------------------------------------------ walkers */

function walk(root, rel = '', out = []) {
  let entries;
  try {
    entries = fs.readdirSync(path.join(root, rel), { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (e.isDirectory()) {
      if (SKIP[e.name]) continue;
      walk(root, r, out);
    } else if (e.isFile()) {
      out.push(r);
    }
  }
  return out;
}

const bump = (m, k, n = 1) => m.set(k, (m.get(k) || 0) + n);
const addTo = (m, k, v) => {
  if (!m.has(k)) m.set(k, new Set());
  m.get(k).add(v);
};
const sortedCounts = (m) =>
  [...m.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
const objFromCounts = (m) => Object.fromEntries(sortedCounts(m));

const sha256 = (p) => {
  try { return createHash('sha256').update(fs.readFileSync(p)).digest('hex'); }
  catch { return null; }
};

const read = (root, rel) => {
  try { return fs.readFileSync(path.join(root, rel), 'utf8'); } catch { return null; }
};

function newestCommitISO(root) {
  try {
    return execFileSync('git', ['-C', root, 'log', '-1', '--format=%cI'], {
      encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'],
    }).trim() || null;
  } catch { return null; }
}

/* ------------------------------------------------------------------ collect */

// This script's own output is filtered out of the walk entirely, not just out of the
// reference scan: leaving it in makes `filesWalked` differ between a first run (absent)
// and every later run (present), which breaks --check for a reason that has nothing to
// do with the design system.
const storefrontFiles = walk(REPO).filter((r) => r !== OUT);
const productPresent = fs.existsSync(PRODUCT);
const productFiles = productPresent ? walk(PRODUCT) : [];

const skipHtmlPrefixes = Object.keys(SKIP_HTML);
const isPage = (rel) =>
  rel.endsWith('.html') && !skipHtmlPrefixes.some((p) => rel === p || rel.startsWith(p + '/'));

const pages = storefrontFiles.filter(isPage);
const storefrontCss = storefrontFiles.filter((r) => r.endsWith('.css') && !r.startsWith('tests/'));
const productCss = productFiles.filter((r) => r.endsWith('.css'));

/* ---- token + colour + type accumulators ------------------------------------ */

// name -> Map(value -> count), and name -> Set(source)
const sfTokenVals = new Map();
const sfTokenSrc = new Map();
const prTokenVals = new Map();
const prTokenSrc = new Map();
// instance variables: per-element style="" custom props (geometry, not tokens)
const instanceVars = new Map();
const instanceVarFiles = new Map();

// literal colours: hex -> count, per context; and hex -> Set(file)
const litByContext = { cssFile: new Map(), inlineStyleBlock: new Map(), styleAttr: new Map(), svgAttr: new Map(), productSource: new Map() };
const litTotal = new Map();
const litFiles = new Map();
const litProps = new Map(); // which CSS property carries raw hex

const colorFns = new Map(); // rgba(/rgb(/hsl(/color-mix(/oklch(

const fontFamilies = new Map();
const fontSizes = new Map();
const fontWeights = new Map();
const fontSizeUnits = new Map();
const fontFaceFamilies = new Map();
let fontFaceBlocks = 0;

const tokenPropUseCount = new Map(); // var(--x) usage counts across the storefront

function ingestCss(text, { context, file, tokenSink, tokenSrcSink }) {
  const raw = stripCssComments(text);
  // @font-face DECLARES a family; it does not USE one. Counting its descriptors put
  // `'Fraunces'` and `'Inter'` in the "literal font stacks" column 526 times each and a
  // variable-font `font-weight:100 900` range in the weights column 1,052 times — all of
  // it face metadata, none of it a typographic choice on the page. Harvested separately,
  // then removed before the usage scan.
  let faceBlocks = 0;
  const css = raw.replace(/@font-face\s*\{[^}]*\}/gi, (block) => {
    faceBlocks++;
    const fam = /font-family\s*:\s*([^;}]+)/i.exec(block);
    if (fam) bump(fontFaceFamilies, normStack(fam[1]));
    return ' ';
  });
  fontFaceBlocks += faceBlocks;
  for (const { prop, value } of parseDeclarations(css)) {
    const isToken = prop.startsWith('--');
    if (isToken) {
      if (tokenSink) {
        if (!tokenSink.has(prop)) tokenSink.set(prop, new Map());
        bump(tokenSink.get(prop), value);
        addTo(tokenSrcSink, prop, file);
      }
      // hexes inside a token definition are the palette itself, not drift.
      continue;
    }
    const p = prop.toLowerCase();
    if (p === 'font-family') bump(fontFamilies, normStack(value));
    if (p === 'font-size') {
      const v = normStack(value);
      bump(fontSizes, v);
      const unit = /var\(/.test(v) ? 'var()' : /clamp\(/.test(v) ? 'clamp()' : /calc\(/.test(v) ? 'calc()'
        : (/(-?[\d.]+)(px|rem|em|pt|%|ch|vw|vh|ex)\b/.exec(v)?.[2] ?? 'keyword');
      bump(fontSizeUnits, unit);
    }
    if (p === 'font-weight') bump(fontWeights, normStack(value));
    for (const fn of value.matchAll(/\b(rgba?|hsla?|color-mix|oklch|oklab|lab|lch)\(/gi)) bump(colorFns, fn[1].toLowerCase());
    for (const v of value.matchAll(/var\((--[A-Za-z0-9_-]+)/g)) bump(tokenPropUseCount, v[1]);
    const hexes = hexesIn(value);
    for (const h of hexes) {
      bump(litByContext[context], h);
      bump(litTotal, h);
      addTo(litFiles, h, file);
      bump(litProps, p);
    }
  }
}

// --- storefront CSS files
const cssFileRecords = [];
for (const rel of storefrontCss) {
  const text = read(REPO, rel);
  if (text == null) continue;
  const before = new Map(sfTokenVals);
  ingestCss(text, { context: 'cssFile', file: rel, tokenSink: sfTokenVals, tokenSrcSink: sfTokenSrc });
  void before;
  cssFileRecords.push({
    path: rel,
    repo: 'storefront',
    bytes: Buffer.byteLength(text),
    lines: text.split('\n').length,
    generated: GENERATED_CSS.has(rel),
    generatedBy: GENERATED_CSS.has(rel) ? 'scripts/build-css-shells.mjs' : null,
  });
}

// --- product CSS files
for (const rel of productCss) {
  const text = read(PRODUCT, rel);
  if (text == null) continue;
  ingestCss(text, { context: 'productSource', file: rel, tokenSink: prTokenVals, tokenSrcSink: prTokenSrc });
  cssFileRecords.push({
    path: rel, repo: 'product', bytes: Buffer.byteLength(text), lines: text.split('\n').length,
    generated: false, generatedBy: null,
  });
}

// --- product TS/TSX colour literals (component-level drift off the token layer)
let productSourceFilesScanned = 0;
for (const rel of productFiles) {
  if (!/\.(tsx?|jsx?|mjs)$/.test(rel)) continue;
  const text = read(PRODUCT, rel);
  if (text == null) continue;
  productSourceFilesScanned++;
  const src = stripJsComments(text);
  for (const m of src.matchAll(/#[0-9a-fA-F]{6}\b/g)) {
    const h = normHex(m[0]);
    bump(litByContext.productSource, h);
    bump(litTotal, h);
    addTo(litFiles, h, rel);
  }
}

// --- storefront HTML
const vizFigureCount = new Map();     // kind -> figures
const vizFigurePages = new Map();     // kind -> Set(page)
const vizClassOccurrences = new Map();// kind -> raw class-token occurrences
let figureTotal = 0;
const wrapperCount = new Map();
const pagesWithStyleBlock = new Set();
const pagesWithTokenRedeclare = new Set();
// Every <figure> on the site, including the ones outside the gated wrapper vocabulary.
let figureElementsTotal = 0;
const nonWrapperFigureClasses = new Map();
let styleBlockCount = 0;
let styleAttrCount = 0;

for (const rel of pages) {
  const html = read(REPO, rel);
  if (html == null) continue;

  for (const block of styleBlocks(html)) {
    styleBlockCount++;
    pagesWithStyleBlock.add(rel);
    if (/--[A-Za-z0-9_-]+\s*:/.test(stripCssComments(block))) pagesWithTokenRedeclare.add(rel);
    ingestCss(block, { context: 'inlineStyleBlock', file: rel, tokenSink: sfTokenVals, tokenSrcSink: sfTokenSrc });
  }

  for (const attr of styleAttrs(html)) {
    styleAttrCount++;
    for (const { prop, value } of parseDeclarations(attr)) {
      if (prop.startsWith('--')) {
        bump(instanceVars, prop);
        addTo(instanceVarFiles, prop, rel);
        continue;
      }
      const p = prop.toLowerCase();
      if (p === 'font-family') bump(fontFamilies, normStack(value));
      if (p === 'font-size') {
        const v = normStack(value);
        bump(fontSizes, v);
        const unit = /var\(/.test(v) ? 'var()' : /clamp\(/.test(v) ? 'clamp()' : /calc\(/.test(v) ? 'calc()'
          : (/(-?[\d.]+)(px|rem|em|pt|%|ch|vw|vh|ex)\b/.exec(v)?.[2] ?? 'keyword');
        bump(fontSizeUnits, unit);
      }
      if (p === 'font-weight') bump(fontWeights, normStack(value));
      for (const fn of value.matchAll(/\b(rgba?|hsla?|color-mix|oklch|oklab|lab|lch)\(/gi)) bump(colorFns, fn[1].toLowerCase());
      for (const v of value.matchAll(/var\((--[A-Za-z0-9_-]+)/g)) bump(tokenPropUseCount, v[1]);
      for (const h of hexesIn(value)) {
        bump(litByContext.styleAttr, h);
        bump(litTotal, h);
        addTo(litFiles, h, rel);
        bump(litProps, p);
      }
    }
  }

  for (const { attr, hex } of svgPaintHexes(html)) {
    bump(litByContext.svgAttr, hex);
    bump(litTotal, hex);
    addTo(litFiles, hex, rel);
    bump(litProps, 'svg@' + attr);
  }

  for (const m of html.matchAll(/<figure\b([^>]*)>/g)) {
    figureElementsTotal++;
    const cls = /\bclass="([^"]*)"/.exec(m[1])?.[1] || '(no class)';
    if (!/\b(?:viz-figure|article-figure)\b/.test(cls)) bump(nonWrapperFigureClasses, normStack(cls));
  }

  for (const f of figuresIn(html)) {
    figureTotal++;
    bump(wrapperCount, f.wrapper);
    const kinds = f.kinds.length ? f.kinds : ['(no viz-* kind)'];
    for (const k of kinds) {
      bump(vizFigureCount, k);
      addTo(vizFigurePages, k, rel);
    }
  }
  for (const c of html.matchAll(/\bviz-([a-z][a-z0-9]*)(?:__[a-z0-9-]+)?\b/g)) bump(vizClassOccurrences, 'viz-' + c[1]);
}

// viz families the CSS actually defines
const allCss = storefrontCss.map((r) => read(REPO, r) || '').join('\n');
// viz-figure is the WRAPPER class and viz-sr the screen-reader-table utility (matched out
// of `.viz-sr-table` by the family regex). Neither is a graphic family; leaving them in
// reported two phantom "defined-but-unused" families.
const NON_FAMILY = new Set(['viz-figure', 'viz-sr']);
const vizDefined = new Set();
for (const m of allCss.matchAll(/\.viz-([a-z][a-z0-9]*)\b/g)) {
  const k = 'viz-' + m[1];
  if (!NON_FAMILY.has(k)) vizDefined.add(k);
}

/* ---- brand assets ---------------------------------------------------------- */

const brandFiles = storefrontFiles.filter((r) => r.startsWith('brand/'));
const brandRefs = new Map();     // 'brand/x.png' -> Set(referencing file), excluding docs/
const brandRefDocs = new Map();  // 'brand/x.png' -> Set(referencing file under docs/)
const brandRefPages = new Map(); // 'brand/x.png' -> Set(referencing HTML page)
// Extension bound is 12, not 5: `site.webmanifest` is referenced on 1,300 pages and a
// 5-char bound silently reported it orphaned. A too-tight matcher is a root-list bug.
const brandRefRe = /(?:\.\.\/)*\/?(brand\/[A-Za-z0-9._\/-]+\.[A-Za-z0-9]{2,12})/g;

for (const rel of storefrontFiles) {
  const ext = path.extname(rel).toLowerCase();
  if (!REF_EXT.has(ext)) continue;
  if (rel.startsWith('brand/') && ext === '.svg') continue; // an SVG's own markup is not a reference to itself
  // SELF-REFERENCE. This script's own output lists every brand path, so scanning it makes
  // every asset look referenced exactly once and the orphan count collapses to zero. It
  // did, on the first run. Same failure as check-claim-usage reading footer URLs as
  // citations: a scanner that eats its own output measures itself.
  if (rel === OUT) continue;
  const text = read(REPO, rel);
  if (text == null) continue;
  const inDocs = rel === 'docs' || rel.startsWith('docs/');
  for (const m of text.matchAll(brandRefRe)) {
    const target = m[1];
    if (inDocs) { addTo(brandRefDocs, target, rel); continue; }
    addTo(brandRefs, target, rel);
    if (isPage(rel)) addTo(brandRefPages, target, rel);
  }
}

/**
 * An OG card is never referenced by literal path from a generator — build-og-cards.mjs
 * interpolates `${card.slug}.svg|.png` out of brand/og/cards.json. Treating those as
 * orphans would be the same class of error as a scanner with a short root list, so the
 * manifest is read and its slugs resolved to real filenames before anything is called
 * orphaned. Same for a print-master sibling (og-image.svg behind og-image.png).
 */
let declaredCardSlugs = [];
try {
  const cards = JSON.parse(read(REPO, 'brand/og/cards.json') || '{}');
  declaredCardSlugs = (cards.cards || []).map((c) => c.slug).filter(Boolean).sort();
} catch { declaredCardSlugs = []; }
const declaredCardFiles = new Set(declaredCardSlugs.flatMap((s) => [`brand/og/${s}.svg`, `brand/og/${s}.png`]));

const referencedPaths = new Set([...brandRefs.keys()]);
const stemOf = (rel) => rel.slice(0, rel.length - path.extname(rel).length);
const referencedStems = new Set([...referencedPaths].map(stemOf));

const brandAssets = brandFiles.map((rel) => {
  let bytes = 0;
  try { bytes = fs.statSync(path.join(REPO, rel)).size; } catch { /* unreadable */ }
  const refs = brandRefs.get(rel) || new Set();
  const pageRefs = brandRefPages.get(rel) || new Set();
  const docRefs = brandRefDocs.get(rel) || new Set();
  const declared = declaredCardFiles.has(rel);
  const siblingReferenced = refs.size === 0 && referencedStems.has(stemOf(rel));
  const role =
    refs.size > 0 ? 'referenced'
    : declared ? 'generated-declared'
    : siblingReferenced ? 'build-input-sibling'
    : docRefs.size > 0 ? 'docs-only'
    : 'orphan';
  return {
    path: rel,
    dir: rel.split('/').slice(0, 2).join('/'),
    ext: path.extname(rel).toLowerCase().replace('.', ''),
    bytes,
    referencedByFiles: refs.size,
    referencedByPages: pageRefs.size,
    referencedByDocs: docRefs.size,
    declaredInCardsManifest: declared,
    role,
    orphan: role === 'orphan',
    sampleReferrers: [...refs].sort().slice(0, 3),
  };
});

/* ---- copy system ----------------------------------------------------------- */

const copyEnSrc = productPresent ? read(PRODUCT, 'apps/web/lib/copy.ts') : null;
const copyEsSrc = productPresent ? read(PRODUCT, 'apps/web/lib/copy.es.ts') : null;
const enKeys = copyEnSrc ? copyLeafPaths(copyEnSrc) : [];
const esKeys = copyEsSrc ? copyLeafPaths(copyEsSrc) : [];
const enSet = new Set(enKeys);
const esSet = new Set(esKeys);
const onlyEn = enKeys.filter((k) => !esSet.has(k));
const onlyEs = esKeys.filter((k) => !enSet.has(k));

const nsOf = (k) => k.split('.')[0];
const namespaces = [...new Set([...enKeys, ...esKeys].map(nsOf))].sort();
const parityGateSrc = productPresent ? read(PRODUCT, 'scripts/check-locale-parity.mjs') : null;
const gatedNs = parityGateSrc
  ? (/const WAVE_NAMESPACES\s*=\s*\[([^\]]*)\]/.exec(parityGateSrc)?.[1] || '')
      .split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean).sort()
  : [];

const productWorkflows = productPresent
  ? productFiles.filter((r) => r.startsWith('.github/workflows/')).map((r) => read(PRODUCT, r) || '').join('\n')
  + '\n' + productFiles.filter((r) => r.startsWith('scripts/') && r.endsWith('.sh')).map((r) => read(PRODUCT, r) || '').join('\n')
  : '';

const namespaceParity = namespaces.map((ns) => {
  const en = enKeys.filter((k) => nsOf(k) === ns);
  const es = esKeys.filter((k) => nsOf(k) === ns);
  const esS = new Set(es);
  const missing = en.filter((k) => !esS.has(k));
  return {
    namespace: ns,
    enKeys: en.length,
    esKeys: es.length,
    missingFromEs: missing.length,
    gateEnforced: gatedNs.includes(ns),
  };
}).sort((a, b) => b.enKeys - a.enKeys || (a.namespace < b.namespace ? -1 : 1));

/* ---- voice canons + their enforcement -------------------------------------- */

const checkAllSrc = read(REPO, 'scripts/check-all.mjs') || '';
// check-all.mjs is the orchestrator, not a gate — counting it credits every canon it
// merely lists with an enforcement it does not perform.
const storefrontChecks = storefrontFiles.filter(
  (r) => /^scripts\/check-[a-z0-9-]+\.mjs$/.test(r) && r !== 'scripts/check-all.mjs'
);
const wiredInCheckAll = new Set(
  [...checkAllSrc.matchAll(/check-[a-z0-9-]+\.mjs/g)].map((m) => 'scripts/' + m[0])
);

/**
 * Needles are declared PER CANON, never derived from the basename. Deriving them
 * matched `index.html` and credited the voice contract to 50 unrelated gates — the same
 * over-broad-matcher failure that made footer URLs read as citations.
 */
const canonDocs = storefrontFiles.filter((r) => /^docs\/voice-canon-[a-z]+\.md$/.test(r));
const canonTargets = [
  ...canonDocs.map((d) => ({ id: d, kind: 'doc', file: d, needles: [d, path.basename(d)] })),
  {
    id: 'methods/index.html#voice-contract',
    kind: 'page',
    file: 'methods/index.html',
    needles: ['voice-contract', 'voice contract', 'banned-words', 'CTA canon', 'cta-canon'],
  },
  { id: 'docs/fact-check.md', kind: 'doc', file: 'docs/fact-check.md', needles: ['docs/fact-check.md', 'fact-check.md'] },
  { id: 'data/sourced-claims.json', kind: 'manifest', file: 'data/sourced-claims.json', needles: ['sourced-claims.json'] },
];

const canonEnforcement = canonTargets.map(({ id, kind, file, needles }) => {
  const enforcedBy = storefrontChecks.filter((c) => {
    const src = read(REPO, c) || '';
    return needles.some((n) => src.includes(n));
  }).sort();
  const wired = enforcedBy.filter((c) => wiredInCheckAll.has(c));
  return {
    canon: id,
    kind,
    file,
    matchedOn: needles,
    exists: storefrontFiles.includes(file),
    lines: storefrontFiles.includes(file) ? (read(REPO, file) || '').split('\n').length : null,
    namedByChecks: enforcedBy,
    wiredIntoCheckAll: wired,
    // Honest wording: a gate NAMING a canon is evidence it consults it, not proof it
    // enforces every rule in it. The three states are measured, the strength is not.
    enforcement: wired.length ? 'named-by-wired-gate' : enforcedBy.length ? 'named-by-unwired-gate' : 'prose-only',
  };
});

/* ---- token comparison ------------------------------------------------------ */

const primaryOf = (vals) => sortedCounts(vals)[0]?.[0] ?? null;

/**
 * The value each token is DECLARED with in an authored stylesheet (assets/site.css or
 * assets/sheets.css), as opposed to the value that appears most often once ~1,300
 * per-page inline <style> blocks are counted.
 */
const sfDeclaredValue = new Map();
for (const rel of storefrontCss) {
  if (GENERATED_CSS.has(rel)) continue;
  const text = read(REPO, rel);
  if (text == null) continue;
  for (const { prop, value } of parseDeclarations(stripCssComments(text))) {
    if (prop.startsWith('--') && !sfDeclaredValue.has(prop)) sfDeclaredValue.set(prop, value);
  }
}
const tokenNames = [...new Set([...sfTokenVals.keys(), ...prTokenVals.keys()])].sort();

const properties = tokenNames.map((name) => {
  const sf = sfTokenVals.get(name);
  const pr = prTokenVals.get(name);
  const sfSrc = [...(sfTokenSrc.get(name) || [])];
  const prSrc = [...(prTokenSrc.get(name) || [])];
  const sfCssSrc = sfSrc.filter((f) => f.endsWith('.css')).sort();
  const sfHtmlSrc = sfSrc.filter((f) => !f.endsWith('.css'));
  const sfPrimary = sf ? primaryOf(sf) : null;
  const prPrimary = pr ? primaryOf(pr) : null;
  // The DECLARED value (what assets/site.css says) can differ from the most common one
  // (what 1,300 inline <style> blocks say). --font-display is exactly that case: the
  // stylesheet ships a 5-family stack, the inline blocks a 3-family one. Emit both.
  const sfDeclared = sfDeclaredValue.get(name) ?? null;
  const norm = (v) => (v == null ? null : v.trim().toLowerCase());
  return {
    name,
    in: sf && pr ? 'both' : sf ? 'storefront-only' : 'product-only',
    storefront: sf
      ? {
          primaryValue: sfPrimary,
          declaredInStylesheet: sfDeclared,
          stylesheetMatchesPrimary: sfDeclared == null ? null : norm(sfDeclared) === norm(sfPrimary),
          distinctValues: sf.size,
          values: sortedCounts(sf).slice(0, 6).map(([value, count]) => ({ value, count })),
          cssFiles: sfCssSrc,
          htmlPagesDeclaringIt: sfHtmlSrc.length,
          varUses: tokenPropUseCount.get(name) || 0,
        }
      : null,
    product: pr
      ? {
          primaryValue: prPrimary,
          distinctValues: pr.size,
          values: sortedCounts(pr).slice(0, 6).map(([value, count]) => ({ value, count })),
          cssFiles: prSrc.sort(),
        }
      : null,
    agreeOnPrimaryValue: sf && pr ? norm(sfPrimary) === norm(prPrimary) : null,
  };
});

// The two repos deliberately use different NAMES for the same spine. Bridge by VALUE.
const sfTokenHexes = new Map(); // hex -> Set(name)
const prTokenHexes = new Map();
for (const [name, vals] of sfTokenVals) for (const v of vals.keys()) for (const h of hexesIn(v)) addTo(sfTokenHexes, h, name);
for (const [name, vals] of prTokenVals) for (const v of vals.keys()) for (const h of hexesIn(v)) addTo(prTokenHexes, h, name);
const sharedHexes = [...sfTokenHexes.keys()].filter((h) => prTokenHexes.has(h)).sort();

const tokenValueSet = new Set([...sfTokenHexes.keys(), ...prTokenHexes.keys()]);

/* ---- literal drift classification ------------------------------------------ */

const tokenValueList = [...tokenValueSet].sort();
function nearestToken(hex) {
  let best = null;
  for (const t of tokenValueList) {
    const d = hexDistance(hex, t);
    if (d == null) continue;
    if (best == null || d < best.distance) best = { token: t, distance: d };
  }
  return best;
}

/**
 * WHERE THE DRIFT IS AUTHORED. 88% of colour literals live in per-page <style> blocks,
 * and nobody hand-writes 1,300 of those — build scripts emit them. Attributing each hex
 * back to the generator that contains it turns "16,788 off-palette occurrences" into a
 * list of files to edit. Only scripts/ and src/ are scanned (the authoring layer); the
 * pages themselves are output, and this script's own source is excluded because it
 * quotes hexes in its comments and self-tests.
 */
const SELF = 'scripts/build-design-inventory.mjs';
const hexToScripts = new Map();
const scriptHexCount = new Map();
const scriptFiles = storefrontFiles.filter(
  (r) => (r.startsWith('scripts/') || r.startsWith('src/')) && /\.(mjs|js|ts)$/.test(r) && r !== SELF
);
for (const rel of scriptFiles) {
  const text = read(REPO, rel);
  if (text == null) continue;
  for (const m of stripJsComments(text).matchAll(/#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)) {
    const h = normHex(m[0]);
    addTo(hexToScripts, h, rel);
    bump(scriptHexCount, rel);
  }
}

const literalRecords = sortedCounts(litTotal).map(([hex, count]) => {
  const onPalette = tokenValueSet.has(hex);
  const near = onPalette ? null : nearestToken(hex);
  const files = litFiles.get(hex) || new Set();
  return {
    hex,
    occurrences: count,
    files: files.size,
    onPalette,
    nearMissOf: !onPalette && near && near.distance <= NEAR_MISS ? near.token : null,
    nearMissDistance: !onPalette && near && near.distance <= NEAR_MISS ? near.distance : null,
    tokenNames: onPalette ? [...new Set([...(sfTokenHexes.get(hex) || []), ...(prTokenHexes.get(hex) || [])])].sort() : [],
    emittedByScripts: [...(hexToScripts.get(hex) || [])].sort(),
    contexts: Object.fromEntries(
      Object.entries(litByContext).filter(([, m]) => m.has(hex)).map(([k, m]) => [k, m.get(hex)])
    ),
  };
});

const onPaletteLiterals = literalRecords.filter((r) => r.onPalette);
const offPaletteLiterals = literalRecords.filter((r) => !r.onPalette);
const nearMisses = offPaletteLiterals.filter((r) => r.nearMissOf);
const sum = (arr, f) => arr.reduce((s, x) => s + f(x), 0);

/* ---- webfonts -------------------------------------------------------------- */

// A shipped woff2 nobody @font-faces is weight in the repo the reader never downloads.
// Matched on basename (@font-face src paths are written relative), in ONE pass over the
// candidate files — a per-font pass re-read the tree 24 times and cost 15 seconds.
const woffFiles = storefrontFiles.filter((r) => r.startsWith('assets/fonts/') && r.endsWith('.woff2'));
const woffRefs = new Map(woffFiles.map((r) => [path.basename(r), new Set()]));
for (const f of storefrontFiles) {
  if (f.startsWith('docs/') || f.startsWith('assets/fonts/')) continue;
  if (!REF_EXT.has(path.extname(f).toLowerCase())) continue;
  const text = read(REPO, f);
  if (text == null || !text.includes('.woff2')) continue;
  for (const [base, set] of woffRefs) if (text.includes(base)) set.add(f);
}
const webfonts = woffFiles.map((r) => {
  let bytes = 0;
  try { bytes = fs.statSync(path.join(REPO, r)).size; } catch { /* unreadable */ }
  const refs = [...woffRefs.get(path.basename(r))].sort();
  return { path: r, bytes, referencedBy: refs.length, referrers: refs.slice(0, 3), unused: refs.length === 0 };
});

/* ---- assemble -------------------------------------------------------------- */

const asOf = newestCommitISO(REPO);
const manifestSf = path.join(REPO, 'data/muntin.tokens.json');
const manifestPr = path.join(PRODUCT, 'packages/ui/muntin.tokens.json');
const hashSf = sha256(manifestSf);
const hashPr = sha256(manifestPr);

const tokensSyncGate = 'scripts/check-tokens-sync.mjs';

const vizFamilies = [...new Set([...vizDefined, ...vizFigureCount.keys()])]
  .filter((k) => k !== '(no viz-* kind)' && k !== 'viz-' && !NON_FAMILY.has(k))
  .sort()
  .map((kind) => ({
    kind,
    figures: vizFigureCount.get(kind) || 0,
    pages: (vizFigurePages.get(kind) || new Set()).size,
    classOccurrences: vizClassOccurrences.get(kind) || 0,
    definedInCss: vizDefined.has(kind),
    status:
      !vizDefined.has(kind) ? 'used-but-undefined'
      : (vizFigureCount.get(kind) || 0) === 0 ? 'defined-but-unused'
      : 'live',
  }))
  .sort((a, b) => b.figures - a.figures || (a.kind < b.kind ? -1 : 1));

const brandByDir = {};
for (const a of brandAssets) {
  const d = (brandByDir[a.dir] ||= { files: 0, bytes: 0, referenced: 0, generatedDeclared: 0, buildInputSibling: 0, docsOnly: 0, orphans: 0, formats: {} });
  d.files++; d.bytes += a.bytes;
  if (a.role === 'referenced') d.referenced++;
  else if (a.role === 'generated-declared') d.generatedDeclared++;
  else if (a.role === 'build-input-sibling') d.buildInputSibling++;
  else if (a.role === 'docs-only') d.docsOnly++;
  else d.orphans++;
  d.formats[a.ext] = (d.formats[a.ext] || 0) + 1;
}
const brandFormats = {};
for (const a of brandAssets) brandFormats[a.ext] = (brandFormats[a.ext] || 0) + 1;

const authoredCss = cssFileRecords.filter((f) => f.repo === 'storefront' && !f.generated);

/* ---- top 10 sources of visual inconsistency, ranked by measured volume ------ */

const topLiteralProps = sortedCounts(litProps).slice(0, 8).map(([p, n]) => `${p} (${n})`);
const inconsistencies = [
  {
    rank: 0,
    id: 'inline-token-redeclaration',
    what: 'The token palette is re-declared inside a per-page <style> block instead of being inherited from one stylesheet',
    volume: pagesWithTokenRedeclare.size,
    unit: 'pages',
    evidence: `${styleBlockCount} <style> blocks across ${pagesWithStyleBlock.size} pages; ${sum(properties, (p) => p.storefront?.htmlPagesDeclaringIt || 0)} token declarations live in HTML`,
    consequence: 'changing one brand colour requires rebuilding and redeploying every page, so the palette can only move at the speed of a full site rebuild',
  },
  {
    rank: 0,
    id: 'hardcoded-on-palette-hex',
    what: 'Raw hex literals that DO equal a token value — right colour, wrong mechanism',
    volume: sum(onPaletteLiterals, (r) => r.occurrences),
    unit: 'occurrences',
    evidence: `${onPaletteLiterals.length} distinct hexes; carried by ${topLiteralProps.slice(0, 4).join(', ')}`,
    consequence: 'a token edit silently leaves these behind, so the palette drifts apart one theme change at a time',
  },
  {
    rank: 0,
    id: 'off-palette-hex',
    what: 'Raw hex literals that match NO token in either repo — genuinely off-system colour',
    volume: sum(offPaletteLiterals, (r) => r.occurrences),
    unit: 'occurrences',
    evidence: `${offPaletteLiterals.length} distinct hexes across ${new Set(offPaletteLiterals.flatMap((r) => [...(litFiles.get(r.hex) || [])])).size} files`,
    consequence: 'the real size of the palette is this many colours, not the token count — any redesign that re-pigments only the tokens will leave these standing',
  },
  {
    rank: 0,
    id: 'near-miss-hex',
    what: 'Off-palette hexes within ' + NEAR_MISS + ' RGB of a real token — drift no eye can catch',
    volume: sum(nearMisses, (r) => r.occurrences),
    unit: 'occurrences',
    evidence: nearMisses.slice(0, 5).map((r) => `${r.hex}~${r.nearMissOf} (d=${r.nearMissDistance}, ${r.occurrences}x)`).join('; ') || 'none',
    consequence: 'these look correct in review and never get fixed, so they survive every redesign',
  },
  {
    rank: 0,
    id: 'token-multivalue',
    what: 'Tokens defined with more than one value across the storefront (theme flips plus genuine forks)',
    volume: properties.filter((p) => (p.storefront?.distinctValues || 0) > 1).length,
    unit: 'tokens',
    evidence: properties.filter((p) => (p.storefront?.distinctValues || 0) > 2).slice(0, 5).map((p) => `${p.name} (${p.storefront.distinctValues} values)`).join('; '),
    consequence: 'a token with N values is N tokens wearing one name — nobody can predict what --x resolves to without knowing the page',
  },
  {
    rank: 0,
    id: 'orphan-brand-assets',
    what: 'Files under brand/ that nothing references, no manifest declares, and no referenced sibling explains',
    volume: brandAssets.filter((a) => a.orphan).length,
    unit: 'files',
    evidence: `${brandAssets.length} brand files; ${brandAssets.filter((a) => a.role === 'referenced').length} referenced, ${brandAssets.filter((a) => a.role === 'generated-declared').length} declared in brand/og/cards.json, ${brandAssets.filter((a) => a.role === 'build-input-sibling').length} print masters`,
    consequence: 'brand/ cannot serve as the source of truth for what the brand looks like while this share of it is unreachable',
  },
  {
    rank: 0,
    id: 'figures-outside-the-vocabulary',
    what: 'Figure elements carrying neither corpus wrapper class, so no graphics gate can see them',
    volume: figureElementsTotal - figureTotal,
    unit: 'figures',
    evidence: `${figureElementsTotal} <figure> on the site, ${figureTotal} in the vocabulary; top outside classes: ${sortedCounts(nonWrapperFigureClasses).slice(0, 4).map(([c, n]) => `${c} (${n})`).join('; ')}`,
    consequence: 'check-article-graphics enforces nine quality rules over a minority of the site’s figures; the rest are ungoverned',
  },
  {
    rank: 0,
    id: 'font-stack-variants',
    what: 'Distinct font-family stacks in use where the system declares three token stacks',
    volume: fontFamilies.size,
    unit: 'distinct stacks',
    evidence: sortedCounts(fontFamilies).filter(([v]) => !v.startsWith('var(')).slice(0, 4).map(([v, n]) => `${v} (${n})`).join('; '),
    consequence: 'every non-var() stack is a place a font change will not reach',
  },
  {
    rank: 0,
    id: 'font-size-literals',
    what: 'Distinct font-size values in use — there is no type scale, only a list',
    volume: fontSizes.size,
    unit: 'distinct values',
    evidence: `units: ${sortedCounts(fontSizeUnits).map(([u, n]) => `${u} ${n}`).join(', ')}`,
    consequence: 'a type scale cannot be enforced or changed globally because no token names any step of it',
  },
  {
    rank: 0,
    id: 'generated-css-duplication',
    what: 'Shipped CSS that is a generated copy of assets/site.css',
    volume: cssFileRecords.filter((f) => f.generated).reduce((s, f) => s + f.lines, 0),
    unit: 'lines',
    evidence: cssFileRecords.filter((f) => f.generated).map((f) => `${f.path} (${f.lines}L)`).join('; '),
    consequence: 'every measurement of the stylesheet counts the same rule up to twice; edits made in a shell are silently reverted by the next build',
  },
  {
    rank: 0,
    id: 'viz-family-sprawl',
    what: 'viz-* families defined in CSS but carrying zero figures, or used in HTML with no CSS rule',
    volume: vizFamilies.filter((f) => f.status !== 'live').length,
    unit: 'families',
    evidence: vizFamilies.filter((f) => f.status !== 'live').map((f) => `${f.kind} (${f.status})`).join('; '),
    consequence: 'the documented graphic vocabulary is larger than the one in use, so authors pick from a menu half of which is untested',
  },
  {
    rank: 0,
    id: 'copy-parity-ungated',
    what: 'Product microcopy namespaces with no EN/ES parity gate',
    volume: namespaceParity.filter((n) => !n.gateEnforced).length,
    unit: 'namespaces',
    evidence: `gate covers ${gatedNs.join(', ') || 'nothing'}; ${sum(namespaceParity.filter((n) => !n.gateEnforced), (n) => n.missingFromEs)} EN keys have no ES mirror outside the gated namespaces`,
    consequence: 'the Spanish surface can silently fall behind everywhere the gate is not looking',
  },
].sort((a, b) => b.volume - a.volume).map((x, i) => ({ ...x, rank: i + 1 }));

const inventory = {
  _doc:
    'The Design BOM — every CSS custom property, colour literal, type value, viz-* family, ' +
    'brand asset and copy key MEASURED across both Muntin repos. Generated by ' +
    'scripts/build-design-inventory.mjs; never edit by hand — re-run the generator. ' +
    'NOT a gate: --check asserts the file matches the tree, not that the tree is correct. ' +
    'Do not wire into check-all.mjs.',
  generator: 'scripts/build-design-inventory.mjs',
  asOf,
  repos: {
    storefront: { root: 'potentially-profitable', filesWalked: storefrontFiles.length, htmlPages: pages.length, cssFiles: storefrontCss.length },
    product: {
      root: 'Muntin-Invoice-Decoder',
      present: productPresent,
      filesWalked: productFiles.length,
      cssFiles: productCss.length,
      sourceFilesScanned: productSourceFilesScanned,
    },
  },
  scope: {
    skippedDirectories: SKIP,
    htmlRootsSkipped: SKIP_HTML,
    generatedCss: [...GENERATED_CSS].sort(),
    colorLiteralContexts: {
      cssFile: 'declarations in .css files in either repo',
      inlineStyleBlock: 'declarations inside <style> blocks in storefront HTML',
      styleAttr: 'declarations inside style="" attributes in storefront HTML',
      svgAttr: 'fill/stroke/stop-color/flood-color/lighting-color attributes on inline SVG',
      productSource: 'six-digit hexes in product .ts/.tsx/.js/.mjs source',
    },
    notCounted: 'hex-shaped strings outside a colour position (href="#faq", id="#a1b2c3", url(#grad)) — 57,824 raw regex hits across the HTML, of which only the counted contexts are colour',
  },

  tokens: {
    manifest: {
      storefront: { path: 'data/muntin.tokens.json', sha256: hashSf },
      product: { path: 'packages/ui/muntin.tokens.json', sha256: hashPr },
      identical: hashSf != null && hashSf === hashPr,
      lockedBy: storefrontFiles.includes(tokensSyncGate) ? tokensSyncGate : null,
      gateWiredIntoCheckAll: wiredInCheckAll.has(tokensSyncGate),
      verdict:
        hashSf != null && hashSf === hashPr
          ? 'VERIFIED — the shared token manifest is byte-identical in both repos and a wired gate re-asserts the site palette against it'
          : 'NOT VERIFIED — the manifests differ or one is missing',
    },
    summary: {
      distinctNames: tokenNames.length,
      inBothByName: properties.filter((p) => p.in === 'both').length,
      storefrontOnly: properties.filter((p) => p.in === 'storefront-only').length,
      productOnly: properties.filter((p) => p.in === 'product-only').length,
      sharedNamesAgreeingOnValue: properties.filter((p) => p.agreeOnPrimaryValue === true).length,
      sharedNamesDisagreeing: properties.filter((p) => p.agreeOnPrimaryValue === false).length,
      storefrontTokensDeclaredInHtmlOnly: properties.filter((p) => p.storefront && p.storefront.cssFiles.length === 0).length,
      tokensWithMultipleValues: properties.filter((p) => (p.storefront?.distinctValues || 0) > 1).length,
      declaredInAuthoredStylesheet: properties.filter((p) => p.storefront?.declaredInStylesheet != null).length,
      stylesheetDisagreesWithMostCommonValue: properties.filter((p) => p.storefront?.stylesheetMatchesPrimary === false).length,
      note:
        'Name overlap UNDERSTATES agreement: the two repos deliberately use different names for the ' +
        'same spine (--teal here, --mun-accent-text there). valueBridge below is the honest measure.',
    },
    valueBridge: {
      storefrontTokenColours: sfTokenHexes.size,
      productTokenColours: prTokenHexes.size,
      sharedColourValues: sharedHexes.length,
      sharedFraction: sfTokenHexes.size ? Number((sharedHexes.length / sfTokenHexes.size).toFixed(4)) : null,
      shared: sharedHexes.map((h) => ({
        hex: h,
        storefrontNames: [...sfTokenHexes.get(h)].sort(),
        productNames: [...prTokenHexes.get(h)].sort(),
      })),
    },
    properties,
    instanceVariables: {
      _doc: 'Per-element custom properties set in style="" — figure geometry, not tokens. Bucketed apart so 3.5k chart bars do not read as a design system.',
      distinct: instanceVars.size,
      total: sum([...instanceVars.values()], (n) => n),
      byName: sortedCounts(instanceVars).map(([name, count]) => ({
        name, count, pages: (instanceVarFiles.get(name) || new Set()).size,
      })),
    },
  },

  typography: {
    webfonts,
    fontFaceBlocks,
    fontFaceFamilies: objFromCounts(fontFaceFamilies),
    fontFamilyStacks: {
      distinct: fontFamilies.size,
      viaToken: sum(sortedCounts(fontFamilies).filter(([v]) => v.startsWith('var(')), ([, n]) => n),
      literal: sum(sortedCounts(fontFamilies).filter(([v]) => !v.startsWith('var(')), ([, n]) => n),
      byStack: sortedCounts(fontFamilies).map(([stack, count]) => ({ stack, count, tokenised: stack.startsWith('var(') })),
    },
    fontSizes: {
      distinct: fontSizes.size,
      total: sum([...fontSizes.values()], (n) => n),
      byUnit: objFromCounts(fontSizeUnits),
      top: sortedCounts(fontSizes).slice(0, 40).map(([value, count]) => ({ value, count })),
    },
    fontWeights: {
      distinct: fontWeights.size,
      byValue: sortedCounts(fontWeights).map(([value, count]) => ({ value, count })),
    },
  },

  color: {
    palette: {
      tokenColourValues: tokenValueSet.size,
      storefrontOnlyValues: [...sfTokenHexes.keys()].filter((h) => !prTokenHexes.has(h)).sort(),
      productOnlyValues: [...prTokenHexes.keys()].filter((h) => !sfTokenHexes.has(h)).sort(),
    },
    literals: {
      _doc:
        'A LITERAL is a hex written directly into a colour-bearing declaration rather than read ' +
        'from a token. onPalette=true means the value equals a token value (right colour, wrong ' +
        'mechanism — a token edit will not reach it). onPalette=false is off-system colour.',
      distinct: literalRecords.length,
      occurrences: sum(literalRecords, (r) => r.occurrences),
      onPalette: { distinct: onPaletteLiterals.length, occurrences: sum(onPaletteLiterals, (r) => r.occurrences) },
      offPalette: { distinct: offPaletteLiterals.length, occurrences: sum(offPaletteLiterals, (r) => r.occurrences) },
      nearMisses: {
        _doc: `Off-palette hexes within ${NEAR_MISS} summed-RGB of a real token. Invisible in review; survives every redesign.`,
        distinct: nearMisses.length,
        occurrences: sum(nearMisses, (r) => r.occurrences),
        rows: nearMisses.slice(0, 40),
      },
      byContext: Object.fromEntries(
        Object.entries(litByContext).map(([k, m]) => [k, { distinct: m.size, occurrences: sum([...m.values()], (n) => n) }])
      ),
      carrierProperties: sortedCounts(litProps).map(([prop, count]) => ({ prop, count })),
      top: literalRecords.slice(0, 60),
      offPaletteTop: offPaletteLiterals.slice(0, 60),
    },
    nonHexColourFunctions: objFromCounts(colorFns),
    authoringLayer: {
      _doc:
        'Which build script contains each off-palette hex. 88% of colour literals are in ' +
        'per-page <style> blocks that generators emit, so this is the edit list: change the ' +
        'script, re-run the builder, and the drift leaves every page it wrote.',
      scriptsScanned: scriptFiles.length,
      scriptsCarryingHex: scriptHexCount.size,
      offPaletteWithKnownAuthor: offPaletteLiterals.filter((r) => r.emittedByScripts.length).length,
      offPaletteOccurrencesWithKnownAuthor: sum(offPaletteLiterals.filter((r) => r.emittedByScripts.length), (r) => r.occurrences),
      kindNote:
        'kind=gate means the file CONTAINS the hex (a check script listing values it polices), ' +
        'not that it emits it. Only kind=builder/runtime files write CSS onto pages.',
      byScript: sortedCounts(scriptHexCount).map(([script, hexLiterals]) => ({
        script,
        kind: /\/check-[^/]*\.mjs$/.test(script) ? 'gate'
          : /\/(build|inject|migrate)-[^/]*\.mjs$/.test(script) ? 'builder'
          : 'runtime',
        hexLiterals,
        offPaletteOccurrencesAttributed: sum(
          offPaletteLiterals.filter((r) => r.emittedByScripts.includes(script)),
          (r) => r.occurrences
        ),
      })).sort((a, b) => b.offPaletteOccurrencesAttributed - a.offPaletteOccurrencesAttributed || b.hexLiterals - a.hexLiterals || (a.script < b.script ? -1 : 1)),
    },
  },

  viz: {
    _doc:
      'A FIGURE is a <figure> carrying the corpus wrapper class (viz-figure or the pre-Phase-1 ' +
      'article-figure), matched with the same regex check-article-graphics.mjs uses. classOccurrences ' +
      'counts every viz-* class token including BEM children, which is why it is much larger.',
    figureElementsOnSite: figureElementsTotal,
    figures: figureTotal,
    figuresOutsideWrapperVocabulary: figureElementsTotal - figureTotal,
    outsideWrapperClasses: sortedCounts(nonWrapperFigureClasses).map(([cls, count]) => ({ class: cls, count })),
    byWrapper: objFromCounts(wrapperCount),
    figuresWithNoVizKind: vizFigureCount.get('(no viz-* kind)') || 0,
    families: vizFamilies,
    familiesLive: vizFamilies.filter((f) => f.status === 'live').length,
    familiesDefinedButUnused: vizFamilies.filter((f) => f.status === 'defined-but-unused').map((f) => f.kind),
    familiesUsedButUndefined: vizFamilies.filter((f) => f.status === 'used-but-undefined').map((f) => f.kind),
  },

  brand: {
    _doc:
      'role: referenced = some file in the repo names this path; generated-declared = not ' +
      'named by path but its slug is declared in brand/og/cards.json, which build-og-cards.mjs ' +
      'interpolates into a filename; build-input-sibling = the print master behind a referenced ' +
      'sibling (og-image.svg under og-image.png); docs-only = named only in internal handoff ' +
      'prose, which never ships; orphan = none of the above. This script EXCLUDES its own ' +
      'output from the reference scan — the first run counted it and every asset came back ' +
      '"referenced exactly once".',
    totals: {
      files: brandAssets.length,
      bytes: sum(brandAssets, (a) => a.bytes),
      referenced: brandAssets.filter((a) => a.role === 'referenced').length,
      generatedDeclared: brandAssets.filter((a) => a.role === 'generated-declared').length,
      buildInputSibling: brandAssets.filter((a) => a.role === 'build-input-sibling').length,
      docsOnly: brandAssets.filter((a) => a.role === 'docs-only').length,
      orphaned: brandAssets.filter((a) => a.orphan).length,
      orphanBytes: sum(brandAssets.filter((a) => a.orphan), (a) => a.bytes),
      orphanFraction: brandAssets.length ? Number((brandAssets.filter((a) => a.orphan).length / brandAssets.length).toFixed(4)) : null,
      cardsDeclaredInManifest: declaredCardSlugs.length,
      cardFilesOnDisk: brandAssets.filter((a) => a.dir === 'brand/og' && /^(png|svg)$/.test(a.ext)).length,
      cardFilesNotDeclared: brandAssets.filter((a) => a.dir === 'brand/og' && /^(png|svg)$/.test(a.ext) && !a.declaredInCardsManifest).length,
    },
    formats: brandFormats,
    byDirectory: Object.fromEntries(Object.entries(brandByDir).sort()),
    mostReferenced: [...brandAssets].sort((a, b) => b.referencedByFiles - a.referencedByFiles).slice(0, 25)
      .map(({ path: p, ext, bytes, referencedByFiles, referencedByPages }) => ({ path: p, ext, bytes, referencedByFiles, referencedByPages })),
    orphans: brandAssets.filter((a) => a.orphan).map(({ path: p, dir, ext, bytes }) => ({ path: p, dir, ext, bytes })),
    assets: brandAssets,
  },

  copy: {
    product: {
      present: copyEnSrc != null,
      en: { path: 'apps/web/lib/copy.ts', keys: enKeys.length, lines: copyEnSrc ? copyEnSrc.split('\n').length : null },
      es: { path: 'apps/web/lib/copy.es.ts', keys: esKeys.length, lines: copyEsSrc ? copyEsSrc.split('\n').length : null },
      parity: {
        sharedKeys: enKeys.filter((k) => esSet.has(k)).length,
        missingFromEs: onlyEn.length,
        missingFromEn: onlyEs.length,
        coverage: enKeys.length ? Number((enKeys.filter((k) => esSet.has(k)).length / enKeys.length).toFixed(4)) : null,
        gate: 'scripts/check-locale-parity.mjs',
        gateScope: gatedNs,
        gateWired: /check-locale-parity\.mjs/.test(productWorkflows),
        note:
          'The gate enforces parity for the namespaces in gateScope ONLY. Every other namespace is ' +
          'measured here but nothing blocks it. coverage is measured over ALL namespaces.',
        namespaces: namespaceParity,
        sampleMissingFromEs: onlyEn.slice(0, 25),
      },
      gates: ['scripts/check-copy-grade.mjs', 'scripts/check-verboten-phrases.mjs', 'scripts/check-locale-parity.mjs']
        .map((g) => ({ gate: g, exists: productFiles.includes(g), wired: new RegExp(path.basename(g).replace('.', '\\.')).test(productWorkflows) })),
    },
    storefrontVoiceCanons: canonEnforcement,
    storefrontCheckScripts: {
      _doc:
        'scripts/check-*.mjs excluding the orchestrator check-all.mjs. check-gate-coverage.mjs ' +
        'additionally excludes ITSELF, which is why its own tally reads one lower than this one.',
      onDisk: storefrontChecks.length,
      wiredIntoCheckAll: storefrontChecks.filter((c) => wiredInCheckAll.has(c)).length,
    },
  },

  css: {
    files: cssFileRecords.sort((a, b) => (a.path < b.path ? -1 : 1)),
    totals: {
      shippedLines: sum(cssFileRecords.filter((f) => f.repo === 'storefront'), (f) => f.lines),
      authoredLines: sum(authoredCss, (f) => f.lines),
      generatedLines: sum(cssFileRecords.filter((f) => f.generated), (f) => f.lines),
      productLines: sum(cssFileRecords.filter((f) => f.repo === 'product'), (f) => f.lines),
    },
    inlineStyle: {
      pagesWithStyleBlock: pagesWithStyleBlock.size,
      styleBlocks: styleBlockCount,
      pagesRedeclaringTokens: pagesWithTokenRedeclare.size,
      styleAttributes: styleAttrCount,
    },
  },

  topInconsistencies: inconsistencies,
};

/* ------------------------------------------------------------------ emit */

const text = JSON.stringify(inventory, null, 2) + '\n';
const outAbs = path.join(REPO, OUT);

if (process.argv.includes('--report')) {
  const t = inventory;
  console.log(`\nDesign BOM — asOf ${t.asOf}\n`);
  console.log(`Tokens: ${t.tokens.summary.distinctNames} names (${t.tokens.summary.inBothByName} in both, ${t.tokens.summary.storefrontOnly} storefront-only, ${t.tokens.summary.productOnly} product-only)`);
  console.log(`Manifest lock: ${t.tokens.manifest.verdict}`);
  console.log(`Value bridge: ${t.tokens.valueBridge.sharedColourValues}/${t.tokens.valueBridge.storefrontTokenColours} storefront token colours also exist in the product`);
  console.log(`Colour literals: ${t.color.literals.occurrences} occurrences, ${t.color.literals.distinct} distinct (${t.color.literals.offPalette.distinct} off-palette, ${t.color.literals.nearMisses.distinct} near-miss)`);
  console.log(`Type: ${t.typography.fontFamilyStacks.distinct} stacks, ${t.typography.fontSizes.distinct} font-sizes, ${t.typography.fontWeights.distinct} weights`);
  console.log(`Figures: ${t.viz.figures} across ${t.viz.familiesLive} live viz-* families`);
  console.log(`Brand: ${t.brand.totals.files} files, ${t.brand.totals.orphaned} orphaned (${Math.round(t.brand.totals.orphanFraction * 100)}%)`);
  console.log(`Copy: ${t.copy.product.en.keys} EN keys, ${t.copy.product.es.keys} ES, ${t.copy.product.parity.missingFromEs} unmirrored\n`);
  console.log('Top 10 sources of visual inconsistency by volume:');
  for (const r of t.topInconsistencies.slice(0, 10)) {
    console.log(`  ${String(r.rank).padStart(2)}. ${String(r.volume).padStart(7)} ${r.unit.padEnd(16)} ${r.what}`);
  }
  console.log('');
}

if (process.argv.includes('--check')) {
  const cur = fs.existsSync(outAbs) ? fs.readFileSync(outAbs, 'utf8') : null;
  if (cur !== text) {
    console.error(`✗ design-inventory: ${OUT} would change. Re-run: node scripts/build-design-inventory.mjs`);
    process.exit(1);
  }
  console.log(`✓ design-inventory: ${OUT} up to date.`);
  process.exit(0);
}

fs.mkdirSync(path.dirname(outAbs), { recursive: true });
fs.writeFileSync(outAbs, text);
console.log(
  `Wrote ${OUT} — ${inventory.tokens.summary.distinctNames} tokens, ` +
  `${inventory.color.literals.distinct} distinct colour literals (${inventory.color.literals.offPalette.distinct} off-palette), ` +
  `${inventory.viz.figures} figures, ${inventory.brand.totals.files} brand assets (${inventory.brand.totals.orphaned} orphaned), ` +
  `${inventory.copy.product.en.keys} copy keys.`
);
