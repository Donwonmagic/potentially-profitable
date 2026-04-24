#!/usr/bin/env node
// Drift guard for the design system documented in docs/design-system.md.
//
// Scans tool pages under /tools/* for inline <style> blocks that bypass
// the tokens. A failing pattern is one that:
//   - Uses border-radius with a raw px value other than 999px or 50%
//     (the token set is --r-sm 8 / --r-input 12 / --r-md 14 / --r-lg 22).
//   - Uses box-shadow with a raw rgba(...) instead of --elev-1/2/3 or
//     --ring-focus.
//   - Uses a hex color that's not in the documented allowlist.
//
// Margin Math, Brand Suite, and the Restaurant Audit are explicitly
// excluded — their inline CSS is a deferred follow-up.
//
// Run: node scripts/check-css-drift.mjs
// Exit 0 if clean; non-zero if drift detected.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(fileURLToPath(import.meta.url), '..', '..');
const TOOLS_DIR = join(REPO, 'tools');

// Pages that opt out of the guard. Each one is a bespoke tool
// whose unique component vocabulary (calculator states, palette
// previews, audit result tree) needs its own careful pass. As
// tools tokenize, they graduate off this list.
//
// Graduated in the bespoke-tool migration sprint:
//   tools/gbp-grader/index.html  — full tokenization
//   tools/margin-math/index.html — full tokenization (calculator
//     panel tints + waterfall colors allowlisted with intent)
//   tools/brand-suite/index.html — full tokenization
//
// Restaurant Audit (4,662 lines of inline CSS) got a selective
// sweep — top-frequency hex (rust, teal, status family, cream,
// teal-tint) was tokenized, dropping ~70 hex occurrences. The
// audit's bespoke earthtone palette (E6DFCE, EFC4AA, etc.) is
// intentional design vocabulary; full migration is a future pass.
const EXCLUSIONS = new Set([
  'tools/audits/restaurant/index.html',
]);

// Hex colors we tolerate inside tool inline CSS.
// Brand colors live as CSS vars; status colors are reused across tools.
const ALLOWED_HEX = new Set([
  // Inline indicator green (small pass marks across most tools)
  '#1f9d55', '#1F9D55',
  // Status warn family (text + fill) — also covered by --status-* tokens
  // but raw hex is allowed inside tools to avoid a token-vs-hex flip-flop.
  '#8A6018', '#8a6018', '#C28B2E', '#c28b2e', '#e6f4ec', '#E6F4EC',
  // Margin Math calculator vocabulary — tightly coupled to the
  // calculator UI; not promoted to global tokens because they're
  // single-use. Allowlisted with intent.
  '#B89A6E', // waterfall "food cost" segment (warm beige)
  '#FCE4D4', // softer warn band tint
  '#FCFAF4', // calculator panel "good" tint
  '#FCF7F3', // calculator panel "warn" tint
  '#FAFBF9', // calculator panel "ok" tint
  '#F8FBFB', // calculator panel "info" tint
]);

// Radii allowed as raw px — full pill (999) and circle (50%) only.
function isAllowedRadius(value) {
  const v = value.trim();
  if (v === '999px' || v === '50%' || v === '0' || v === '0px') return true;
  // Tokens are fine
  if (v.startsWith('var(')) return true;
  return false;
}

function walkHtml(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) {
      walkHtml(full, out);
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

function extractInlineStyles(html) {
  // Concatenates all <style>...</style> blocks (skipping the
  // 1-line FOUC guard which is universally allowed). Content inside
  // @media print { ... } is also stripped — print stylesheets
  // legitimately use pure-grey hex (#000, #555, #ddd) and tiny
  // radii for paper output, and applying the screen design tokens
  // would render incorrectly on monochrome printers.
  const blocks = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) {
    const body = m[1];
    if (/^\s*\.breadcrumb\s*\{/.test(body) && body.length < 120) continue;
    blocks.push(stripMediaPrint(body));
  }
  return blocks.join('\n');
}

// Remove balanced `@media print { ... }` blocks, including nested
// braces. Returns the surrounding CSS untouched.
function stripMediaPrint(css) {
  let out = '';
  let i = 0;
  while (i < css.length) {
    const idx = css.indexOf('@media', i);
    if (idx < 0) { out += css.slice(i); break; }
    // Check whether this @media is a print rule
    const decl = css.slice(idx, idx + 60);
    if (!/print/.test(decl)) {
      // Not a print rule — keep going past the @media keyword
      out += css.slice(i, idx + 6);
      i = idx + 6;
      continue;
    }
    out += css.slice(i, idx);
    // Find the opening brace
    const open = css.indexOf('{', idx);
    if (open < 0) break;
    let depth = 1;
    let j = open + 1;
    while (j < css.length && depth > 0) {
      if (css[j] === '{') depth++;
      else if (css[j] === '}') depth--;
      j++;
    }
    i = j; // skip past the closing brace
  }
  return out;
}

function scan(file) {
  const html = readFileSync(file, 'utf8');
  const css = extractInlineStyles(html);
  if (!css.trim()) return [];

  const issues = [];

  // 1) Raw border-radius px values. Terminate on `;` OR `}` —
  // the last declaration in a CSS block legitimately omits the
  // trailing `;`, and without `}` as a stop the regex would slurp
  // the next rule's value into this one.
  for (const m of css.matchAll(/border-radius\s*:\s*([^;}]+)[;}]/g)) {
    const value = m[1];
    const parts = value.trim().split(/\s+/);
    for (const p of parts) {
      if (/^\d+(\.\d+)?px$/.test(p) && !isAllowedRadius(p)) {
        issues.push(`raw border-radius: ${p} (use --r-sm/--r-input/--r-md/--r-lg)`);
      }
    }
  }

  // 2) Raw rgba box-shadow
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;}]+)[;}]/g)) {
    const value = m[1];
    if (/rgba?\(/.test(value) && !/var\(--(elev|ring)/.test(value)) {
      issues.push(`raw box-shadow with rgba (use --elev-1/2/3 or --ring-focus): ${value.slice(0, 60).trim()}`);
    }
  }

  // 3) Non-allowlisted hex colors
  for (const m of css.matchAll(/#[0-9a-fA-F]{3,8}\b/g)) {
    const hex = m[0];
    if (!ALLOWED_HEX.has(hex)) {
      issues.push(`hex color ${hex} (use a token from docs/design-system.md or extend ALLOWED_HEX in this script)`);
    }
  }

  return issues;
}

let totalIssues = 0;
const files = walkHtml(TOOLS_DIR);
for (const f of files) {
  const rel = relative(REPO, f);
  if (EXCLUSIONS.has(rel)) continue;
  const issues = scan(f);
  if (issues.length) {
    console.error(`\n${rel}`);
    for (const i of issues) console.error(`  - ${i}`);
    totalIssues += issues.length;
  }
}

if (totalIssues) {
  console.error(`\n${totalIssues} drift issue(s) found. See docs/design-system.md.`);
  process.exit(1);
}
console.log('CSS drift guard: clean.');
