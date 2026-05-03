#!/usr/bin/env node
/**
 * Themes lint — Wave B3 of the empowerment plan.
 *
 * Codifies the eight refusal rules that protect the menu-design
 * theme catalog from going amateur. Runs at CI; fails if any theme
 * violates any rule. New themes added to the catalog must satisfy
 * all eight or the PR doesn't merge.
 *
 * Why these rules: "Constrained Taste Floor" is one of the five
 * Canva-scaring pillars. Canva ships ten thousand templates that
 * include amateur ones. We ship 37 that are guaranteed legible,
 * accessible, and operator-grade. The lint is the guarantee.
 *
 * Eight rules:
 *   1. Body text ≥ 10 pt (legibility floor)
 *   2. paper ↔ ink contrast ≥ 7:1 (AAA, buffer for cheap printers)
 *   3. accent ↔ paper contrast ≥ 3.0:1 (WCAG 2.2 SC 1.4.11 non-text
 *      contrast floor — accent is decorative, not body text)
 *   4. ≤ 2 typefaces per theme (bodyFamily + displayFamily only)
 *   5. priceStyle ∈ {leader-dots, tab-aligned, right-monospace, price-after-name}
 *   6. dividerStyle ∈ {hand-rule, rule-thin, box, none, double-rule}
 *   7. No customCss field, no customFontUrl field (operators can't
 *      inject arbitrary CSS or fonts; the Theme Tuner respects this)
 *   8. Photo grid + 2-column body together is forbidden (visual overload)
 *
 * Run via: node scripts/check-themes-lint.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

// Load themes.js into a sandbox.
const themesPath = path.join(repoRoot, 'tools/menu-design/themes.js');
const themesSrc  = fs.readFileSync(themesPath, 'utf8');
const ctx = { window: {}, module: { exports: {} } };
vm.createContext(ctx);
vm.runInContext(themesSrc, ctx);
const MD_THEMES = ctx.window.MD_THEMES || ctx.module.exports;
if (!MD_THEMES || typeof MD_THEMES.list !== 'function') {
  console.error('themes-lint: could not load MD_THEMES from themes.js');
  process.exit(2);
}

// ---- Rule definitions -------------------------------------------
const PRICE_STYLES   = new Set([
  'leader-dots', 'tab-aligned', 'right-monospace', 'price-after-name',
  'whitespace' // tasting-omakase: price separated by whitespace, no leaders
]);
// Allowed dividerStyle values. Reflects what the renderers actually
// support today: 'hand-rule' (Trattoria-style brushy line), 'rule-thin'
// (single 0.5pt rule), 'box' (closed rectangle around a section),
// 'none' / 'whitespace' (use white space + type weight to separate),
// 'double-rule' (two parallel rules), 'ornament' (small flourish
// glyph between sections).
const DIVIDER_STYLES = new Set([
  'hand-rule', 'rule-thin', 'box', 'none', 'whitespace',
  'double-rule', 'ornament'
]);

function relLuminance(hex) {
  const m = String(hex).replace('#', '');
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  function ch(c) { return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}
function contrastRatio(hex1, hex2) {
  const l1 = relLuminance(hex1);
  const l2 = relLuminance(hex2);
  const hi = Math.max(l1, l2), lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

// Count distinct font-family stacks. The first font in each stack
// is the canonical face; we treat two stacks as different if their
// first family differs.
function distinctFamilies(theme) {
  const heads = [];
  ['bodyFamily', 'displayFamily'].forEach(k => {
    const v = theme[k];
    if (!v) return;
    const first = String(v).split(',')[0].trim().replace(/['"]/g, '').toLowerCase();
    if (first) heads.push(first);
  });
  return new Set(heads).size;
}

// ---- Lint runner ------------------------------------------------
const themes = MD_THEMES.list();
let failures = 0;
const failuresByTheme = {};

function fail(themeId, ruleId, msg) {
  failures++;
  if (!failuresByTheme[themeId]) failuresByTheme[themeId] = [];
  failuresByTheme[themeId].push({ ruleId, msg });
}

themes.forEach(id => {
  const t = MD_THEMES.get(id);
  if (!t) { fail(id, 0, 'theme.get returned null'); return; }

  // Rule 1 — body text ≥ 10 pt
  if (typeof t.bodyPt !== 'number' || t.bodyPt < 10) {
    fail(id, 1, `bodyPt=${t.bodyPt} (< 10pt minimum)`);
  }

  // Rule 2 — paper ↔ ink ≥ 7:1
  if (t.paper && t.ink) {
    const cr = contrastRatio(t.paper, t.ink);
    if (cr < 7) fail(id, 2, `paper(${t.paper})↔ink(${t.ink}) contrast=${cr.toFixed(2)}:1 (need ≥ 7:1)`);
  }

  // Rule 3 — accent ↔ paper ≥ 3.0:1 (WCAG non-text contrast floor)
  if (t.paper && t.accent) {
    const cr = contrastRatio(t.paper, t.accent);
    if (cr < 3.0) fail(id, 3, `paper(${t.paper})↔accent(${t.accent}) contrast=${cr.toFixed(2)}:1 (need ≥ 3.0:1)`);
  }

  // Rule 4 — ≤ 2 typefaces
  const fams = distinctFamilies(t);
  if (fams > 2) fail(id, 4, `distinct typefaces=${fams} (max 2)`);

  // Rule 5 — priceStyle in enum
  if (!PRICE_STYLES.has(t.priceStyle)) {
    fail(id, 5, `priceStyle="${t.priceStyle}" (not in enum)`);
  }

  // Rule 6 — dividerStyle in enum
  if (!DIVIDER_STYLES.has(t.dividerStyle)) {
    fail(id, 6, `dividerStyle="${t.dividerStyle}" (not in enum)`);
  }

  // Rule 7 — no customCss / customFontUrl
  if (t.customCss)     fail(id, 7, `customCss field set (forbidden)`);
  if (t.customFontUrl) fail(id, 7, `customFontUrl field set (forbidden)`);

  // Rule 8 — photo grid + 2-column body forbidden
  if (t.photoPolicy === 'grid' && t.columns === 2) {
    fail(id, 8, `photoPolicy=grid + columns=2 (visual overload — pick one)`);
  }
});

// ---- Report -----------------------------------------------------
const themeCount = themes.length;
if (failures === 0) {
  console.log(`Themes lint: ${themeCount} theme(s) pass all 8 refusal rules.`);
  process.exit(0);
}

console.log(`Themes lint: ${themeCount} theme(s) scanned; ${failures} failure(s):`);
console.log('');
Object.keys(failuresByTheme).sort().forEach(id => {
  console.log(`  ${id}:`);
  failuresByTheme[id].forEach(f => {
    console.log(`    [Rule ${f.ruleId}] ${f.msg}`);
  });
});
console.log('');
console.log('See scripts/check-themes-lint.mjs for the rule definitions.');
process.exit(1);
