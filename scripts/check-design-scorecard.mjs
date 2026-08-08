#!/usr/bin/env node
/**
 * DESIGN SCORECARD — what the design system actually is, in numbers.
 *
 * WHY THIS EXISTS, AND WHY IT EXISTS TWICE (2026-08-07)
 *
 * A first version of this script was written by an earlier phase and then
 * deleted by a `git clean -fd` while it was still untracked, along with
 * check-contrast-ratios.mjs and check-archetype-conformance.mjs. Nothing about
 * the deletion was design judgement; the tree simply forgot. This rebuild is
 * NOT a guess at what the old one did: `scripts/audit-design-teeth.mjs`
 * survived, and its MUTATIONS registry names every metric it expects and the
 * direction each must move under a deliberate defect. That registry is the
 * specification recovered from the wreck, and this file implements it. If a
 * metric here is renamed, the mutation harness stops finding it and reports
 * NOT-APPLIED — which is the intended coupling, not an accident.
 *
 * WHAT IT MEASURES, AND WHY THE SPLITS ARE THE POINT
 *
 * The headline "off-token colour literals" number is useless undivided. Editing
 * every stylesheet in assets/ reaches roughly 2% of the drift on this site; the
 * rest lives in generated pages, and two of the four homes are invisible to any
 * stylesheet change at all:
 *
 *   color.offTokenCssOnly      assets/*.css — fixable by editing a stylesheet
 *   color.styleBlockLiterals   page <style> blocks — fixable ONLY in the builder
 *   color.svgAttrLiterals      fill=/stroke= presentation attributes — not CSS
 *   color.inlineStyleLiterals  style="" attributes — not CSS
 *
 * The last three are emitted by build scripts. A hand-edit to a generated page
 * is reverted by the next build, so the split is what makes the number
 * actionable: it says which lever moves it.
 *
 * Contrast is FOLDED IN here rather than living in a third script. The company
 * is one founder at 13-26 h/month and is already carrying more instruments than
 * it runs; a WCAG pass over the same parsed stylesheets costs almost nothing
 * once the CSS is in memory, and a separate binary would double the maintenance
 * for no new information. The contrast metrics keep their FLAT names
 * (textAaFailures, focusVisibleGaps, motionGaps, imgMissingDims, imgMissingLazy)
 * and are additionally re-exported under a `measures` key, so
 * SCORED_INSTRUMENTS.contrast in audit-design-teeth.mjs can be repointed at
 * this script by changing one string rather than resurrecting a binary.
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not render. There is no browser in this container, so every number
 * here is a STATIC read of source text. Contrast pairs are derived from
 * co-declared colour/background in one rule plus each colour against the page
 * ground; a pairing produced only by cascade across three sheets is not seen.
 * That limit is stated rather than papered over, because a scorecard that
 * implies a device walk it never took is the same defect it is here to catch.
 *
 * SCOPE — the root list is declared, and every omission says why (CLAUDE.md:
 * "a scanner is only as good as its root list"). See SKIP below.
 *
 * Usage:
 *   node scripts/check-design-scorecard.mjs                  # measure working tree, print
 *   node scripts/check-design-scorecard.mjs --json           # machine-readable
 *   node scripts/check-design-scorecard.mjs --ref <git-ref>  # measure a committed tree
 *   node scripts/check-design-scorecard.mjs --record         # write scorecard + append history
 *   node scripts/check-design-scorecard.mjs --check          # fail on regression vs recorded
 *   node scripts/check-design-scorecard.mjs --self-test      # pin the pure helpers
 *
 * Exit codes:
 *   0 — measured (or --check found no regression)
 *   1 — --check found a regression, or --self-test failed
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const OUT_JSON = path.join('data', 'design-scorecard.json');
/**
 * Telemetry goes under docs/handoff/, NOT data/. `_headers` serves data/*.jsonl
 * under a CC0 wildcard; two internal files were published that way by accident
 * an hour before this was written. An internal time series is not a public
 * dataset and must not inherit a public licence by living in a public folder.
 */
const OUT_HISTORY = path.join('docs', 'handoff', 'telemetry', 'design-scorecard-history.jsonl');

/* ================================================================== *
 * 0. SCOPE
 * ================================================================== */

/** Directories never walked for page HTML, each with the reason it is not reader-facing prose. */
export const SKIP = {
  '.git': 'version control internals, not shipped',
  node_modules: 'third-party dependencies, not authored by this company',
  scripts: 'build tooling — .mjs, and any .html here is a fixture',
  tests: 'test fixtures; a fixture is allowed to be ugly on purpose',
  docs: 'editorial canons and handoff notes, not web-routable',
  src: 'Worker source for /api/*, not a rendered page',
  data: 'JSON manifests; no HTML, and the .jsonl here is licensed CC0 by _headers',
  audio: 'rendered MP3 + narration JSON, no styled surface',
  '_includes': 'HTML partials — measured through the pages that include them, so '
    + 'counting them directly would double-count every nav and footer literal',
};

/** Stylesheets are the design system proper. Everything in assets/ ending .css. */
function stylesheets(root) {
  const dir = path.join(root, 'assets');
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith('.css')).sort()
    .map((f) => path.join('assets', f));
}

function htmlFiles(root) {
  const out = [];
  (function walk(rel) {
    const abs = path.join(root, rel);
    let entries;
    try { entries = fs.readdirSync(abs, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const child = rel ? path.join(rel, e.name) : e.name;
      if (e.isDirectory()) {
        if (!rel && SKIP[e.name]) continue;
        walk(child);
      } else if (e.isFile() && e.name.endsWith('.html')) {
        out.push(child);
      }
    }
  })('');
  return out.sort();
}

/* ================================================================== *
 * 1. PURE CSS HELPERS — exported so --self-test can pin them.
 * ================================================================== */

export function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

/**
 * Flatten a stylesheet into rules, each carrying the at-rule context it sits
 * inside. Deliberately a brace walker rather than a real parser: the site ships
 * no CSS nesting, and a 40-line walker that is obviously correct beats a
 * dependency this repo would then have to keep.
 */
export function parseCss(css) {
  const src = stripComments(css);
  const rules = [];
  const stack = [];
  let buf = '';
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (ch === '{') { stack.push(buf.trim()); buf = ''; continue; }
    if (ch === '}') {
      const head = stack.pop();
      const decls = buf.trim();
      buf = '';
      if (head !== undefined && decls) {
        rules.push({ selector: head, decls, at: stack.filter((s) => s.startsWith('@')) });
      }
      continue;
    }
    buf += ch;
  }
  return rules;
}

/** Split a declaration body into {prop, value}, respecting parens (data: URIs, gradients). */
export function splitDecls(body) {
  const out = [];
  let depth = 0, cur = '';
  for (const ch of body) {
    if (ch === '(') depth++;
    else if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { if (cur.trim()) out.push(cur); cur = ''; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur);
  return out.map((d) => {
    const i = d.indexOf(':');
    if (i === -1) return null;
    return { prop: d.slice(0, i).trim().toLowerCase(), value: d.slice(i + 1).trim() };
  }).filter(Boolean);
}

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const FN_RE = /\b(?:rgba?|hsla?|oklch|oklab|lch|lab)\s*\(/gi;

/** Every colour literal in a value. Named colours are excluded on purpose (see doc). */
export function colourLiterals(value) {
  const out = [];
  for (const m of String(value).matchAll(HEX_RE)) {
    const len = m[0].length - 1;
    if (len === 3 || len === 4 || len === 6 || len === 8) out.push(m[0].toLowerCase());
  }
  for (const m of String(value).matchAll(FN_RE)) out.push(m[0].replace(/\s*\($/, '(').toLowerCase());
  return out;
}

/** Is this declaration a custom-property definition? Those are the spine, not drift. */
export const isTokenDef = (prop) => prop.startsWith('--');

/** A dark-theme context: a prefers-color-scheme:dark media query or a dark theme selector. */
export function isDarkContext(selector, at = []) {
  const hay = [selector, ...at].join(' ');
  return /prefers-color-scheme\s*:\s*dark/i.test(hay)
    || /\[data-theme\s*=\s*["']?dark/i.test(hay)
    || /\.theme-dark\b/.test(hay)
    || /\bhtml\.dark\b/.test(hay);
}

/* -------- colour maths (WCAG 2.x) -------- */

export function parseColour(str) {
  if (!str) return null;
  const s = String(str).trim().toLowerCase();
  const named = { white: [255, 255, 255], black: [0, 0, 0] };
  if (named[s]) return named[s];
  const hex = s.match(/^#([0-9a-f]{3,8})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3 || h.length === 4) h = h.split('').map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    if (h.length === 8 && parseInt(h.slice(6, 8), 16) < 250) return null; // translucent: no honest pair
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  const rgb = s.match(/^rgba?\(([^)]+)\)$/);
  if (rgb) {
    const parts = rgb[1].split(/[,\s/]+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (parts.length >= 4) {
      const a = parseFloat(parts[3]);
      if (Number.isFinite(a) && a < 0.98) return null;
    }
    const v = parts.slice(0, 3).map((p) => p.endsWith('%')
      ? Math.round(parseFloat(p) * 2.55) : Math.round(parseFloat(p)));
    return v.every(Number.isFinite) ? v : null;
  }
  return null; // hsl/oklch resolved only when a token already carries a hex
}

export function relativeLuminance([r, g, b]) {
  const f = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

export function contrastRatio(fg, bg) {
  const a = relativeLuminance(fg), b = relativeLuminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

/** Resolve var(--x) chains against a theme's token table. Depth-capped; cycles yield null. */
export function resolveValue(value, tokens, depth = 0) {
  if (value == null || depth > 8) return null;
  let v = String(value).trim();
  const m = v.match(/^var\(\s*(--[a-z0-9-]+)\s*(?:,\s*([^)]+))?\)$/i);
  if (m) {
    if (Object.prototype.hasOwnProperty.call(tokens, m[1])) return resolveValue(tokens[m[1]], tokens, depth + 1);
    return m[2] ? resolveValue(m[2], tokens, depth + 1) : null;
  }
  return v;
}

/* -------- selector helpers -------- */

/** The rightmost compound of each comma-separated selector — what the rule actually styles. */
export function keyCompounds(selector) {
  return selector.split(',').map((s) => {
    const t = s.trim().replace(/::[a-z-]+/gi, '');
    const parts = t.split(/[\s>+~]+/).filter(Boolean);
    return parts[parts.length - 1] || '';
  }).filter(Boolean);
}

export function classesOf(compound) {
  return [...compound.matchAll(/\.([a-zA-Z0-9_-]+)/g)].map((m) => m[1]);
}

export function bareTagOf(compound) {
  const m = compound.match(/^([a-zA-Z][a-zA-Z0-9]*)/);
  return m ? m[1].toLowerCase() : null;
}

/* ================================================================== *
 * 2. PAGE-SIDE EXTRACTION — exported so --self-test can pin them.
 * ================================================================== */

const STYLE_BLOCK_RE = /<style\b[^>]*>([\s\S]*?)<\/style>/gi;
const STYLE_ATTR_RE = /\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi;
const SVG_PAINT_RE = /\s(?:fill|stroke|stop-color|flood-color|lighting-color)\s*=\s*("([^"]*)"|'([^']*)')/gi;

export function styleBlocks(html) {
  return [...html.matchAll(STYLE_BLOCK_RE)].map((m) => m[1]);
}

export function styleAttrValues(html) {
  return [...html.matchAll(STYLE_ATTR_RE)].map((m) => m[2] ?? m[3] ?? '');
}

export function svgPaintValues(html) {
  return [...html.matchAll(SVG_PAINT_RE)].map((m) => m[2] ?? m[3] ?? '')
    .filter((v) => v && !/^(none|currentcolor|inherit|transparent|url\()/i.test(v.trim()));
}

/**
 * Sentinel integrity. Zero is the bar — a broken sentinel silently breaks the
 * gate that reads it. The autolink CLOSE marker has NO leading slash;
 * build-library.mjs:1938 is authoritative and CLAUDE.md documented a slash that
 * never existed, which would make a gate written from that prose report
 * hundreds of false corruptions on a clean tree.
 */
export function sentinelCorruptions(html) {
  const pairs = [
    [/<!--\s*count:[^>]*?-->/g, /<!--\s*\/count\s*-->/g],
    [/<!--\s*fact:[^>]*?-->/g, /<!--\s*\/fact\s*-->/g],
    [/<!--\s*LIBRARY:autolink:start\s*-->/g, /<!--\s*LIBRARY:autolink:end\s*-->/g],
  ];
  let bad = 0;
  for (const [open, close] of pairs) {
    const o = (html.match(open) || []).length;
    const c = (html.match(close) || []).length;
    bad += Math.abs(o - c);
  }
  return bad;
}

/** Numeric table cells, with the classes that could carry an inherited tabular rule. */
export function numericCells(html) {
  const cells = [];
  const tableRe = /<table\b([^>]*)>([\s\S]*?)<\/table>/gi;
  for (const t of html.matchAll(tableRe)) {
    const tableClasses = new Set(classAttr(t[1]));
    for (const c of t[2].matchAll(/<t([dh])\b([^>]*)>([\s\S]*?)<\/t[dh]>/gi)) {
      const text = c[3].replace(/<[^>]*>/g, '').replace(/&[a-z#0-9]+;/gi, ' ').trim();
      if (!text) continue;
      if (!/\d/.test(text)) continue;
      if (!/^[\s$€£¥+\-–—()%.,0-9/:×x]+$/.test(text)) continue;
      cells.push({ tag: 't' + c[1].toLowerCase(), classes: classAttr(c[2]), tableClasses: [...tableClasses] });
    }
  }
  return cells;
}

function classAttr(attrs) {
  const m = String(attrs).match(/\sclass\s*=\s*("([^"]*)"|'([^']*)')/i);
  return m ? (m[2] ?? m[3] ?? '').split(/\s+/).filter(Boolean) : [];
}

export function imgStats(html) {
  let missingDims = 0, missingLazy = 0, total = 0;
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = m[0];
    total++;
    const hasW = /\swidth\s*=\s*("?\d|'?\d)/i.test(tag);
    const hasH = /\sheight\s*=\s*("?\d|'?\d)/i.test(tag);
    if (!hasW || !hasH) missingDims++;
    if (!/\sloading\s*=\s*("|')?lazy/i.test(tag)) missingLazy++;
  }
  return { total, missingDims, missingLazy };
}

/* ================================================================== *
 * 3. MEASUREMENT
 * ================================================================== */

const LENGTH_RE = /(-?\d*\.?\d+)\s*(px|rem|em|%|vw|vh|ch|pt)\b/gi;
const SPACE_PROPS = /^(padding|margin|gap|row-gap|column-gap)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$/;
const RADIUS_PROPS = /^border(-[a-z]+)?-radius$/;

function normLengths(value) {
  return [...String(value).matchAll(LENGTH_RE)].map((m) => `${parseFloat(m[1])}${m[2].toLowerCase()}`);
}

export function measure(root) {
  const sheets = stylesheets(root);
  const pages = htmlFiles(root);

  // --- accumulators ---
  const colour = { css: 0, styleBlock: 0, svgAttr: 0, inlineStyle: 0 };
  const fontSizeCss = new Set(), fontSizeAll = new Set();
  const spaceCss = new Set(), spaceAll = new Set();
  const radiusAll = new Set(), lineHeightAll = new Set();
  const families = new Set();
  let offScaleFont = 0, offScaleSpace = 0;
  let declsViaVar = 0, declsViaLiteral = 0;
  let tabularDecls = 0;
  let cssBytes = 0;

  const lightTokens = {}, darkTokens = {};
  const lightColourTokens = new Set(), darkColourTokens = new Set();
  const tabularHookClasses = new Set(), tabularHookTags = new Set();
  const colourRules = []; // for contrast
  const backgroundClasses = new Set(); // classes any rule gives a background — see evaluateContrast
  const outlineNone = new Set(), focusVisibleRestored = new Set();
  let motionDecls = 0;
  const motionSheetHasBlanket = new Set();
  const motionBySheet = [];

  const GENERIC_FAMILIES = new Set(['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy',
    'system-ui', 'ui-monospace', 'ui-sans-serif', 'ui-serif', 'inherit', 'initial', 'unset']);

  /* -------- stylesheets -------- */
  for (const rel of sheets) {
    const text = fs.readFileSync(path.join(root, rel), 'utf8');
    cssBytes += Buffer.byteLength(text);
    const rules = parseCss(text);

    // A reduce-blanket in THIS sheet neutralises motion declared in THIS sheet.
    // Attribution is per-sheet on purpose: the 15 archetypes load different
    // combinations of these files, so a blanket in site-article.css does not
    // protect a page that never links it.
    for (const r of rules) {
      if (r.at.some((a) => /prefers-reduced-motion\s*:\s*reduce/i.test(a))
        && /^\*/.test(r.selector.trim())
        && /animation|transition/i.test(r.decls)) motionSheetHasBlanket.add(rel);
    }

    let sheetMotion = 0;
    for (const r of rules) {
      const dark = isDarkContext(r.selector, r.at);
      const decls = splitDecls(r.decls);
      const isRoot = /(^|,)\s*(:root|html|body)\b/.test(r.selector);

      for (const { prop, value } of decls) {
        // --- colour ---
        const lits = colourLiterals(value);
        if (isTokenDef(prop)) {
          const table = dark ? darkTokens : lightTokens;
          if (isRoot || dark) table[prop] = value;
          else if (!(prop in lightTokens)) lightTokens[prop] = value;
          // Theme completeness asks "does every light colour token have a dark
          // counterpart". A token declared inside @media print is exempt by
          // definition: paper has no dark mode, and a dark print ramp would put
          // white type on a black page. sheets.css declares a five-step print ink
          // ramp (--p-paper/--p-ink/--p-mid/--p-line/--p-tint) for the 82
          // worksheets operators actually print, and without this the scorecard
          // read all five as missing-dark and called a correct stylesheet a
          // regression. Excluded here rather than allowlisted by name, so a sixth
          // print step never has to be remembered.
          const printOnly = r.at.some((a) => /\bprint\b/i.test(a));
          if (!printOnly && (lits.length || /^(#|rgb|hsl|oklch|oklab)/i.test(value.trim()))) {
            (dark ? darkColourTokens : lightColourTokens).add(prop);
          }
        } else {
          colour.css += lits.length;
        }

        // --- var vs literal resolution, on the properties the system governs ---
        const governed = prop === 'color' || prop.startsWith('background')
          || prop === 'font-size' || SPACE_PROPS.test(prop) || RADIUS_PROPS.test(prop)
          || prop === 'border-color' || prop.endsWith('-color');
        if (governed && !isTokenDef(prop)) {
          if (/var\(\s*--/.test(value)) declsViaVar++;
          else if (lits.length || LENGTH_RE.test(value)) declsViaLiteral++;
          LENGTH_RE.lastIndex = 0;
        }

        // --- type ---
        if (prop === 'font-size' && !isTokenDef(prop)) {
          const ls = normLengths(value);
          for (const l of ls) { fontSizeCss.add(l); fontSizeAll.add(l); }
          if (!/var\(\s*--/.test(value) && ls.length) offScaleFont++;
        }
        if (prop === 'font-family' || (isTokenDef(prop) && /^--font-/.test(prop))) {
          for (const fam of String(value).split(',')) {
            const f = fam.trim().replace(/^["']|["']$/g, '').toLowerCase();
            if (f && !GENERIC_FAMILIES.has(f) && !/^var\(/.test(f) && !/fallback$/.test(f)) families.add(f);
          }
        }
        if (prop === 'line-height' && !isTokenDef(prop)) {
          const v = String(value).trim();
          if (!/var\(\s*--/.test(v)) lineHeightAll.add(v);
        }

        // --- space + radius ---
        if (SPACE_PROPS.test(prop) && !isTokenDef(prop)) {
          const ls = normLengths(value);
          for (const l of ls) { spaceCss.add(l); spaceAll.add(l); }
          if (!/var\(\s*--/.test(value) && ls.length) offScaleSpace++;
        }
        if (RADIUS_PROPS.test(prop) && !isTokenDef(prop)) {
          for (const l of normLengths(value)) radiusAll.add(l);
        }

        // --- tabular ---
        if ((prop === 'font-variant-numeric' && /tabular-nums/i.test(value))
          || (prop === 'font-feature-settings' && /tnum/i.test(value))) {
          tabularDecls++;
          for (const kc of keyCompounds(r.selector)) {
            if (/::(before|after)/.test(r.selector)) continue;
            for (const c of classesOf(kc)) tabularHookClasses.add(c);
            const tag = bareTagOf(kc);
            if (tag && !classesOf(kc).length) tabularHookTags.add(tag);
          }
        }

        // --- a11y: focus + motion ---
        if (prop === 'outline' && /^(none|0)\b/.test(String(value).trim())) {
          if (!/:focus-visible/.test(r.selector)) {
            for (const s of r.selector.split(',')) outlineNone.add(baseSelector(s));
          }
        }
        if (/:focus-visible/.test(r.selector) && prop === 'outline'
          && !/^(none|0)\b/.test(String(value).trim())) {
          for (const s of r.selector.split(',')) focusVisibleRestored.add(baseSelector(s));
        }
        if ((prop === 'animation' || prop === 'animation-name') && !/^\s*none\b/.test(value)) {
          if (!r.at.some((a) => /prefers-reduced-motion/i.test(a))) { motionDecls++; sheetMotion++; }
        }
      }

      // --- contrast pairs ---
      const colourDecl = decls.find((d) => d.prop === 'color');
      const bgDecl = [...decls].reverse().find((d) => d.prop === 'background-color' || d.prop === 'background');
      const fsDecl = decls.find((d) => d.prop === 'font-size');
      const fwDecl = decls.find((d) => d.prop === 'font-weight');
      if (bgDecl && !/^\s*(none|transparent|inherit|initial|unset)\b/i.test(String(bgDecl.value))) {
        for (const c of classesOf(r.selector)) backgroundClasses.add(c);
      }
      if (colourDecl) {
        colourRules.push({
          sheet: rel, selector: r.selector.slice(0, 120), dark,
          fg: colourDecl.value, bg: bgDecl ? bgDecl.value : null,
          fontSize: fsDecl ? fsDecl.value : null, bold: fwDecl ? /^(bold|[6-9]00)/.test(String(fwDecl.value).trim()) : false,
        });
      }
    }
    motionBySheet.push({ sheet: rel, motionDecls: sheetMotion, blanket: motionSheetHasBlanket.has(rel) });
  }

  /* -------- pages -------- */
  let sentinelBad = 0, imgMissingDims = 0, imgMissingLazy = 0, imgTotal = 0;
  let numericCellsTotal = 0, uncoveredCells = 0;
  let pagesWithStyleBlocks = 0;
  const byTree = {};

  for (const rel of pages) {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    const tree = rel.split(path.sep)[0].replace(/\.html$/, '') || '(root)';
    byTree[tree] ||= { pages: 0, styleBlockLiterals: 0, svgAttrLiterals: 0, inlineStyleLiterals: 0, pagesWithStyle: 0 };
    byTree[tree].pages++;

    const blocks = styleBlocks(html);
    if (blocks.length) { pagesWithStyleBlocks++; byTree[tree].pagesWithStyle++; }
    for (const b of blocks) {
      for (const r of parseCss(b)) {
        for (const { prop, value } of splitDecls(r.decls)) {
          if (!isTokenDef(prop)) {
            const n = colourLiterals(value).length;
            colour.styleBlock += n;
            byTree[tree].styleBlockLiterals += n;
          }
          if (prop === 'font-size') for (const l of normLengths(value)) fontSizeAll.add(l);
          if (SPACE_PROPS.test(prop)) for (const l of normLengths(value)) spaceAll.add(l);
          if (RADIUS_PROPS.test(prop)) for (const l of normLengths(value)) radiusAll.add(l);
          if (prop === 'line-height' && !/var\(\s*--/.test(value)) lineHeightAll.add(String(value).trim());
        }
      }
    }

    for (const v of styleAttrValues(html)) {
      const n = colourLiterals(v).length;
      colour.inlineStyle += n;
      byTree[tree].inlineStyleLiterals += n;
      for (const { prop, value } of splitDecls(v)) {
        if (prop === 'font-size') for (const l of normLengths(value)) fontSizeAll.add(l);
        if (SPACE_PROPS.test(prop)) for (const l of normLengths(value)) spaceAll.add(l);
      }
    }

    for (const v of svgPaintValues(html)) {
      const n = colourLiterals(v).length || (parseColour(v) ? 1 : 0);
      colour.svgAttr += n;
      byTree[tree].svgAttrLiterals += n;
    }

    sentinelBad += sentinelCorruptions(html);

    const im = imgStats(html);
    imgTotal += im.total; imgMissingDims += im.missingDims; imgMissingLazy += im.missingLazy;

    for (const c of numericCells(html)) {
      numericCellsTotal++;
      const covered = c.classes.some((k) => tabularHookClasses.has(k))
        || c.tableClasses.some((k) => tabularHookClasses.has(k))
        || tabularHookTags.has(c.tag) || tabularHookTags.has('table');
      if (!covered) uncoveredCells++;
    }
  }

  /* -------- theme completeness -------- */
  const lightMissingDark = [...lightColourTokens].filter((t) => !darkColourTokens.has(t)).sort();
  const darkOnly = [...darkColourTokens].filter((t) => !lightColourTokens.has(t)).sort();

  /* -------- contrast -------- */
  const contrast = evaluateContrast(colourRules, lightTokens, darkTokens, backgroundClasses);

  /* -------- focus -------- */
  const focusGaps = [...outlineNone].filter((s) => s && !focusVisibleRestored.has(s));

  /* -------- motion -------- */
  const motionGaps = motionBySheet.filter((m) => !m.blanket).reduce((a, m) => a + m.motionDecls, 0);

  const metrics = {
    'color.offTokenLiterals': colour.css + colour.styleBlock + colour.svgAttr + colour.inlineStyle,
    'color.offTokenCssOnly': colour.css,
    'color.styleBlockLiterals': colour.styleBlock,
    'color.svgAttrLiterals': colour.svgAttr,
    'color.inlineStyleLiterals': colour.inlineStyle,

    'type.distinctFontSizeValues': fontSizeAll.size,
    'type.distinctFontSizeValuesCss': fontSizeCss.size,
    'type.offScaleFontSizeDecls': offScaleFont,
    'type.distinctLineHeightValues': lineHeightAll.size,
    'font.distinctFamilies': families.size,

    'space.distinctValues': spaceAll.size,
    'space.distinctValuesCss': spaceCss.size,
    'space.offScaleDecls': offScaleSpace,
    'radius.distinctValues': radiusAll.size,

    'token.declsViaVar': declsViaVar,
    'token.declsViaLiteral': declsViaLiteral,
    'token.resolutionRatePct': declsViaVar + declsViaLiteral
      ? Math.round((declsViaVar / (declsViaVar + declsViaLiteral)) * 1000) / 10 : 0,

    'tabular.declarations': tabularDecls,
    'tabular.numericCells': numericCellsTotal,
    'tabular.uncoveredNumericCells': uncoveredCells,

    'theme.lightColorTokensMissingDark': lightMissingDark.length,
    'theme.darkOnlyColorTokens': darkOnly.length,

    'weight.totalCssBytes': cssBytes,
    'sentinel.corruptions': sentinelBad,

    // contrast + a11y — flat names, matching audit-design-teeth's contrast instrument
    textAaFailures: contrast.failures.length,
    textAaFailuresLight: contrast.failures.filter((f) => !f.dark).length,
    textAaFailuresDark: contrast.failures.filter((f) => f.dark).length,
    textPairsEvaluated: contrast.evaluated,
    textAaFailuresGroundPaired: contrast.advisory.length,
    textGroundPairsEvaluated: contrast.evaluatedGround,
    focusVisibleGaps: focusGaps.length,
    motionGaps,
    imgMissingDims,
    imgMissingLazy,
  };

  return {
    metrics,
    measures: {
      textAaFailures: metrics.textAaFailures,
      textAaFailuresLight: metrics.textAaFailuresLight,
      textAaFailuresDark: metrics.textAaFailuresDark,
      focusVisibleGaps: metrics.focusVisibleGaps,
      motionGaps: metrics.motionGaps,
      imgMissingDims: metrics.imgMissingDims,
      imgMissingLazy: metrics.imgMissingLazy,
    },
    detail: {
      pages: pages.length,
      pagesWithStyleBlocks,
      stylesheets: sheets,
      imgTotal,
      colourByTree: Object.fromEntries(Object.entries(byTree)
        .map(([k, v]) => [k, { ...v, total: v.styleBlockLiterals + v.svgAttrLiterals + v.inlineStyleLiterals }])
        .sort((a, b) => b[1].total - a[1].total)),
      themeLightMissingDark: lightMissingDark.slice(0, 40),
      themeDarkOnly: darkOnly.slice(0, 40),
      worstContrast: contrast.failures.slice(0, 25),
      worstContrastAdvisory: contrast.advisory.slice(0, 15),
      motionBySheet,
      focusGapSelectors: focusGaps.slice(0, 20),
    },
  };
}

function baseSelector(sel) {
  return sel.trim().replace(/:(focus|focus-visible|focus-within|hover|active)\b/g, '').trim();
}

/**
 * WCAG AA over the pairs a static read can honestly form. There are two, and
 * conflating them was the first version's mistake:
 *
 *   (a) SAME-RULE — one rule sets both color and background. Self-contained, so
 *       the pairing is a fact about the stylesheet. This is `textAaFailures`.
 *   (b) GROUND-PAIRED — a rule sets only color, and it is measured against the
 *       theme's page ground. This is a GUESS, and on this codebase a wrong one
 *       often enough to report separately: `.listen-dock-title` is
 *       `color:var(--white)` inside `.listen-dock`, which carries a dark
 *       background from another rule. Pairing it against the light ground
 *       yields 1:1 and a defect that does not exist.
 *
 * Ground-pairing is therefore SUPPRESSED whenever any class in the selector
 * chain is given a background anywhere in the sheets — that is the cheap,
 * checkable signal that the component brings its own ground. What survives is
 * still advisory, and is kept out of the headline number.
 *
 * A pairing that exists only because three sheets cascade at runtime is not
 * evaluated at all. There is no browser here; this is a source read.
 */
export function evaluateContrast(colourRules, lightTokens, darkTokens, backgroundClasses = new Set()) {
  const failures = [];
  const advisory = [];
  let evaluated = 0, evaluatedGround = 0;
  const themeTokens = (dark) => (dark ? { ...lightTokens, ...darkTokens } : lightTokens);
  const ground = (tokens) => {
    for (const t of ['--surface', '--section-base', '--cream', '--bg', '--white']) {
      const v = parseColour(resolveValue(tokens[t], tokens));
      if (v) return v;
    }
    return null;
  };

  for (const r of colourRules) {
    const tokens = themeTokens(r.dark);
    const fg = parseColour(resolveValue(r.fg, tokens));
    if (!fg) continue;

    const sameRule = !!r.bg;
    if (!sameRule && classesOf(r.selector).some((c) => backgroundClasses.has(c))) continue;

    const bg = sameRule ? parseColour(resolveValue(r.bg, tokens)) : ground(tokens);
    if (!bg) continue;

    const px = r.fontSize ? parseFloat((String(r.fontSize).match(/(\d*\.?\d+)\s*px/) || [])[1]) : NaN;
    const large = Number.isFinite(px) && (px >= 24 || (px >= 18.66 && r.bold));
    const need = large ? 3 : 4.5;
    const ratio = contrastRatio(fg, bg);
    const rec = {
      sheet: r.sheet, selector: r.selector, dark: r.dark,
      ratio: Math.round(ratio * 100) / 100, need,
      fg: `rgb(${fg.join(',')})`, bg: `rgb(${bg.join(',')})`,
      pairedWith: sameRule ? 'same-rule background' : 'page ground (advisory)',
    };
    if (sameRule) { evaluated++; if (ratio < need) failures.push(rec); }
    else { evaluatedGround++; if (ratio < need) advisory.push(rec); }
  }
  failures.sort((a, b) => a.ratio - b.ratio);
  advisory.sort((a, b) => a.ratio - b.ratio);
  return { failures, advisory, evaluated, evaluatedGround };
}

/* ================================================================== *
 * 4. DIRECTION + REGRESSION
 * ================================================================== */

/** For each metric, which way is WORSE. Absent = informational, never a regression. */
export const WORSE = {
  'color.offTokenLiterals': 'up', 'color.offTokenCssOnly': 'up', 'color.styleBlockLiterals': 'up',
  'color.svgAttrLiterals': 'up', 'color.inlineStyleLiterals': 'up',
  'type.distinctFontSizeValues': 'up', 'type.distinctFontSizeValuesCss': 'up',
  'type.offScaleFontSizeDecls': 'up', 'type.distinctLineHeightValues': 'up',
  'font.distinctFamilies': 'up',
  'space.distinctValues': 'up', 'space.distinctValuesCss': 'up', 'space.offScaleDecls': 'up',
  'radius.distinctValues': 'up',
  'token.declsViaLiteral': 'up', 'token.resolutionRatePct': 'down',
  // tabular.declarations is REPORTED but deliberately NOT regression-guarded. It counts the
  // MEANS (how many tabular-nums rules exist), and guarding it punishes the win: consolidating
  // eight scattered rules into three that cover more cells reads as a regression. The END is
  // uncoveredNumericCells, guarded below at 0, and it strictly dominates — the hook classes are
  // derived FROM the declarations, so deleting declarations sends every numeric cell to
  // uncovered and trips that guard immediately. 2026-08-08: this fired on 118 → 110 while
  // uncovered went 4 → 0, which is the instrument scoring a real improvement as damage.
  'tabular.uncoveredNumericCells': 'up',
  'theme.lightColorTokensMissingDark': 'up', 'theme.darkOnlyColorTokens': 'up',
  'weight.totalCssBytes': 'up', 'sentinel.corruptions': 'up',
  textAaFailures: 'up', textAaFailuresLight: 'up', textAaFailuresDark: 'up',
  focusVisibleGaps: 'up', motionGaps: 'up', imgMissingDims: 'up', imgMissingLazy: 'up',
};

export function regressions(before, after, worse = WORSE) {
  const out = [];
  for (const [k, dir] of Object.entries(worse)) {
    const b = before?.[k], a = after?.[k];
    if (typeof b !== 'number' || typeof a !== 'number') continue;
    if (dir === 'up' ? a > b : a < b) out.push({ metric: k, before: b, after: a, dir });
  }
  return out;
}

/* ================================================================== *
 * 5. CLI
 * ================================================================== */

function materialise(ref) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'scorecard-'));
  execFileSync('/bin/sh', ['-c',
    `git -C ${JSON.stringify(REPO)} archive ${JSON.stringify(ref)} | tar -x -C ${JSON.stringify(dir)}`,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  return dir;
}

function fmt(n) { return typeof n === 'number' ? n.toLocaleString('en-US') : String(n); }

function report(res, label) {
  const m = res.metrics;
  const L = [];
  L.push(`\nDESIGN SCORECARD — ${label}`);
  L.push('='.repeat(64));
  L.push(`\nCOLOUR — where the drift actually lives (${fmt(m['color.offTokenLiterals'])} off-token literals)`);
  L.push(`  assets/*.css        ${String(fmt(m['color.offTokenCssOnly'])).padStart(8)}   fixable by editing a stylesheet`);
  L.push(`  page <style> blocks ${String(fmt(m['color.styleBlockLiterals'])).padStart(8)}   fixable ONLY in the builder`);
  L.push(`  svg fill=/stroke=   ${String(fmt(m['color.svgAttrLiterals'])).padStart(8)}   invisible to any stylesheet edit`);
  L.push(`  style="" attributes ${String(fmt(m['color.inlineStyleLiterals'])).padStart(8)}   invisible to any stylesheet edit`);
  L.push('\n  by tree (page-side only, worst first):');
  for (const [tree, v] of Object.entries(res.detail.colourByTree).slice(0, 10)) {
    if (!v.total) continue;
    const density = v.pagesWithStyle ? (v.styleBlockLiterals / v.pagesWithStyle).toFixed(0) : '0';
    L.push(`    ${tree.padEnd(14)} ${String(fmt(v.total)).padStart(7)}  (${v.pagesWithStyle} pages with <style>, ${density}/page)`);
  }
  L.push(`\nSCALE`);
  L.push(`  font-size values     ${fmt(m['type.distinctFontSizeValues'])} site-wide / ${fmt(m['type.distinctFontSizeValuesCss'])} in assets`);
  L.push(`  spacing values       ${fmt(m['space.distinctValues'])} site-wide / ${fmt(m['space.distinctValuesCss'])} in assets`);
  L.push(`  radii                ${fmt(m['radius.distinctValues'])}`);
  L.push(`  line-heights         ${fmt(m['type.distinctLineHeightValues'])}`);
  L.push(`  typefaces            ${fmt(m['font.distinctFamilies'])}`);
  L.push(`  off-scale decls      ${fmt(m['type.offScaleFontSizeDecls'])} font-size, ${fmt(m['space.offScaleDecls'])} spacing`);
  L.push(`  resolve via token    ${m['token.resolutionRatePct']}%  (${fmt(m['token.declsViaVar'])} var vs ${fmt(m['token.declsViaLiteral'])} literal)`);
  L.push(`\nTABULAR FIGURES — a CPA runs their eye down these columns`);
  L.push(`  tabular-nums decls   ${fmt(m['tabular.declarations'])}`);
  L.push(`  numeric cells        ${fmt(m['tabular.numericCells'])}`);
  L.push(`  UNCOVERED            ${fmt(m['tabular.uncoveredNumericCells'])}`);
  L.push(`\nTHEME`);
  L.push(`  light tokens w/o dark ${fmt(m['theme.lightColorTokensMissingDark'])}`);
  L.push(`  dark-only tokens      ${fmt(m['theme.darkOnlyColorTokens'])}`);
  L.push(`\nCONTRAST — same-rule pairs (a fact about the stylesheet)`);
  L.push(`  pairs evaluated      ${fmt(m.textPairsEvaluated)}`);
  L.push(`  below AA             ${fmt(m.textAaFailures)}  (light ${fmt(m.textAaFailuresLight)}, dark ${fmt(m.textAaFailuresDark)})`);
  for (const f of res.detail.worstContrast.slice(0, 8)) {
    L.push(`    ${String(f.ratio).padStart(5)}:1 need ${f.need}  ${f.dark ? 'dark ' : 'light'} ${f.sheet} ${f.selector.slice(0, 46)}`);
  }
  L.push(`  advisory (colour vs page ground, component ground unknown — may be false)`);
  L.push(`    ${fmt(m.textAaFailuresGroundPaired)} below AA of ${fmt(m.textGroundPairsEvaluated)} guessed pairs`);
  L.push(`\nA11Y + WEIGHT`);
  L.push(`  focus-visible gaps   ${fmt(m.focusVisibleGaps)}`);
  L.push(`  motion gaps          ${fmt(m.motionGaps)}`);
  L.push(`  img missing dims     ${fmt(m.imgMissingDims)} of ${fmt(res.detail.imgTotal)}`);
  L.push(`  img missing lazy     ${fmt(m.imgMissingLazy)} of ${fmt(res.detail.imgTotal)}`);
  L.push(`  total CSS            ${fmt(m['weight.totalCssBytes'])} bytes across ${res.detail.stylesheets.length} sheets`);
  L.push(`  SENTINEL CORRUPTIONS ${fmt(m['sentinel.corruptions'])}   (the bar is 0)`);
  L.push(`\nscanned ${fmt(res.detail.pages)} pages, ${fmt(res.detail.pagesWithStyleBlocks)} carrying a <style> block\n`);
  return L.join('\n');
}

function selfTest() {
  const t = [];
  const ok = (name, cond) => t.push({ name, pass: !!cond });

  ok('stripComments removes block comments', stripComments('a{/*x*/color:red}') === 'a{color:red}');
  const rules = parseCss('@media (prefers-color-scheme: dark){:root{--a:#111}}\n.b{color:#222}');
  ok('parseCss finds nested rule', rules.some((r) => r.selector === ':root' && r.at.length === 1));
  ok('parseCss finds top-level rule', rules.some((r) => r.selector === '.b' && !r.at.length));
  ok('isDarkContext via media', isDarkContext(':root', ['@media (prefers-color-scheme: dark)']));
  ok('isDarkContext false in light', !isDarkContext(':root', []));
  // Theme completeness must not demand a dark counterpart for a PRINT token.
  {
    const printRules = parseCss('@media print{:root{--p-ink:#000;--p-paper:#fff}}\n:root{--ink:#111}');
    const printCtx = printRules.filter((r) => r.at.some((a) => /\bprint\b/i.test(a)));
    ok('parseCss keeps @media print in the at-stack', printCtx.length === 1);
    ok('print at-stack is distinguishable from a screen :root',
      printRules.filter((r) => !r.at.length && r.selector === ':root').length === 1);
  }
  ok('splitDecls respects parens',
    splitDecls('background:url(a;b);color:red').length === 2);
  ok('colourLiterals finds hex + rgb',
    colourLiterals('color:#bada55;background:rgb(1,2,3)').length === 2);
  ok('colourLiterals ignores 5-char hex', colourLiterals('#12345').length === 0);
  ok('isTokenDef', isTokenDef('--x') && !isTokenDef('color'));
  ok('parseColour hex3', String(parseColour('#fff')) === '255,255,255');
  ok('parseColour rejects translucent rgba', parseColour('rgba(0,0,0,0.2)') === null);
  ok('contrastRatio black/white ~21', Math.abs(contrastRatio([0, 0, 0], [255, 255, 255]) - 21) < 0.01);
  ok('contrastRatio grey pair fails AA', contrastRatio([119, 119, 119], [136, 136, 136]) < 4.5);
  ok('resolveValue chases var chain',
    resolveValue('var(--a)', { '--a': 'var(--b)', '--b': '#123456' }) === '#123456');
  ok('resolveValue uses fallback', resolveValue('var(--nope,#abcdef)', {}) === '#abcdef');
  ok('keyCompounds takes rightmost', keyCompounds('.a .b, .c > .d').join('|') === '.b|.d');
  ok('classesOf', classesOf('.a.b').join('|') === 'a|b');
  ok('bareTagOf', bareTagOf('td.num') === 'td' && bareTagOf('.x') === null);

  // page-side
  ok('styleBlocks extracts', styleBlocks('<style>.a{color:red}</style>')[0] === '.a{color:red}');
  ok('styleAttrValues extracts', styleAttrValues('<p style="color:#bada55">')[0] === 'color:#bada55');
  ok('svgPaintValues extracts', svgPaintValues('<rect fill="#bada55"/>')[0] === '#bada55');
  ok('svgPaintValues skips none/currentColor', svgPaintValues('<rect fill="none" stroke="currentColor"/>').length === 0);
  ok('sentinelCorruptions clean is 0',
    sentinelCorruptions('<!-- count:a -->1<!-- /count -->') === 0);
  ok('sentinelCorruptions catches broken closer',
    sentinelCorruptions('<!-- count:a -->1<!-- count-closed -->') === 1);
  ok('autolink close has NO slash — clean pair is 0',
    sentinelCorruptions('<!-- LIBRARY:autolink:start -->x<!-- LIBRARY:autolink:end -->') === 0);
  ok('autolink: a slashed closer is NOT accepted',
    sentinelCorruptions('<!-- LIBRARY:autolink:start -->x<!-- /LIBRARY:autolink:end -->') === 1);
  ok('numericCells finds a number cell',
    numericCells('<table class="t"><tr><td class="num">1,234</td><td>hello</td></tr></table>').length === 1);
  ok('imgStats counts missing dims',
    imgStats('<img src=a><img src=b width="2" height="3" loading="lazy">').missingDims === 1);
  ok('imgStats counts missing lazy',
    imgStats('<img src=a><img src=b width="2" height="3" loading="lazy">').missingLazy === 1);

  // regression logic
  ok('regressions flags up-is-worse',
    regressions({ 'color.offTokenLiterals': 1 }, { 'color.offTokenLiterals': 2 }).length === 1);
  ok('regressions ignores improvement',
    regressions({ 'color.offTokenLiterals': 2 }, { 'color.offTokenLiterals': 1 }).length === 0);
  // The END metric is guarded; the MEANS metric is not. Both directions asserted, so a future
  // edit that re-adds tabular.declarations to WORSE fails here instead of silently punishing
  // consolidation again.
  ok('regressions flags UNCOVERED cells going up',
    regressions({ 'tabular.uncoveredNumericCells': 0 }, { 'tabular.uncoveredNumericCells': 3 }).length === 1);
  ok('regressions IGNORES tabular declaration count falling (consolidation is not damage)',
    regressions({ 'tabular.declarations': 5 }, { 'tabular.declarations': 4 }).length === 0);
  ok('every WORSE key is a real metric name shape',
    Object.keys(WORSE).every((k) => /^[a-z]/.test(k)));

  const failed = t.filter((x) => !x.pass);
  for (const x of t) console.log(`${x.pass ? '✓' : '✗'} ${x.name}`);
  console.log(`\n${t.length - failed.length}/${t.length} self-tests passed`);
  return failed.length === 0;
}

/**
 * Only run the CLI when invoked directly. Without this guard, `import`ing a
 * helper from here would silently measure 1,327 pages as a side effect — the
 * archetype gate reuses parseCss/classesOf and would have paid that twice.
 */
const RAN_DIRECTLY = process.argv[1] && path.resolve(process.argv[1]) === __filename;
const argv = RAN_DIRECTLY ? process.argv.slice(2) : [];
const has = (f) => argv.includes(f);
const arg = (f, fb = null) => { const i = argv.indexOf(f); return i === -1 ? fb : (argv[i + 1] ?? fb); };

if (RAN_DIRECTLY) {
  if (has('--self-test')) process.exit(selfTest() ? 0 : 1);

  const ref = arg('--ref');
  const root = ref ? materialise(ref) : REPO;
  const label = ref ? `ref ${ref}` : 'working tree';
  const res = measure(root);

  if (has('--json')) {
    console.log(JSON.stringify({ asOf: new Date().toISOString(), label, ...res }, null, 2));
  } else {
    console.log(report(res, label));
  }

  if (has('--record') || has('--baseline') || has('--write-baseline')) {
    const payload = { asOf: new Date().toISOString(), label, metrics: res.metrics, measures: res.measures, detail: res.detail };
    fs.mkdirSync(path.join(REPO, path.dirname(OUT_JSON)), { recursive: true });
    fs.writeFileSync(path.join(REPO, OUT_JSON), JSON.stringify(payload, null, 2) + '\n');
    fs.mkdirSync(path.join(REPO, path.dirname(OUT_HISTORY)), { recursive: true });
    fs.appendFileSync(path.join(REPO, OUT_HISTORY),
      JSON.stringify({ asOf: payload.asOf, label, metrics: res.metrics }) + '\n');
    console.error(`recorded → ${OUT_JSON} and appended → ${OUT_HISTORY}`);
  }

  if (has('--check')) {
    const p = path.join(REPO, OUT_JSON);
    if (!fs.existsSync(p)) { console.error(`✗ no baseline at ${OUT_JSON} — run --record first`); process.exit(1); }
    const base = JSON.parse(fs.readFileSync(p, 'utf8'));
    const regs = regressions(base.metrics, res.metrics);
    if (regs.length) {
      console.error(`\n✗ design scorecard: ${regs.length} regression(s) vs ${base.asOf}\n`);
      for (const r of regs) console.error(`  ${r.metric}: ${fmt(r.before)} → ${fmt(r.after)} (worse is ${r.dir})`);
      console.error('');
      process.exit(1);
    }
    console.error(`✓ design scorecard: no regression vs ${base.asOf}`);
  }
}
