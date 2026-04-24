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

// Pages that opt out of the guard for now. Each one is a known
// follow-up tracked in docs/design-system.md. The four below are
// the bespoke tools — they each carry enough of their own
// vocabulary (calculator states, palette previews, grader colors,
// audit result tree) that a careful migration is its own pass.
const EXCLUSIONS = new Set([
  'tools/margin-math/index.html',
  'tools/brand-suite/index.html',
  'tools/audits/restaurant/index.html',
  'tools/gbp-grader/index.html',
]);

// Hex colors we tolerate inside tool inline CSS.
// Brand colors live as CSS vars; status colors are reused across tools.
const ALLOWED_HEX = new Set([
  '#1f9d55', // good (also seen as #1F9D55)
  '#1F9D55',
  '#8A6018', // warn text
  '#8a6018',
  '#C28B2E', // warn fill
  '#c28b2e',
  '#e6f4ec', // good chip background
  '#E6F4EC',
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
  // 1-line FOUC guard which is universally allowed).
  const blocks = [];
  const re = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let m;
  while ((m = re.exec(html))) {
    const body = m[1];
    if (/^\s*\.breadcrumb\s*\{/.test(body) && body.length < 120) continue;
    blocks.push(body);
  }
  return blocks.join('\n');
}

function scan(file) {
  const html = readFileSync(file, 'utf8');
  const css = extractInlineStyles(html);
  if (!css.trim()) return [];

  const issues = [];

  // 1) Raw border-radius px values
  for (const m of css.matchAll(/border-radius\s*:\s*([^;]+);/g)) {
    const value = m[1];
    // multi-value (e.g. "8px 8px 0 0") — split and check each
    const parts = value.trim().split(/\s+/);
    for (const p of parts) {
      if (/^\d+(\.\d+)?px$/.test(p) && !isAllowedRadius(p)) {
        issues.push(`raw border-radius: ${p} (use --r-sm/--r-input/--r-md/--r-lg)`);
      }
    }
  }

  // 2) Raw rgba box-shadow
  for (const m of css.matchAll(/box-shadow\s*:\s*([^;]+);/g)) {
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
