#!/usr/bin/env node
/**
 * Phase I.6 (Cross-device usability) — guard against unwrapped
 * tables that can push the page wide on phones.
 *
 * Scans `tools/**\/index.html`, `security/**\/index.html`,
 * `blog/**\/index.html`, `learn/**\/index.html` (and ES counterparts)
 * for `<table` opening tags. For each, asserts the nearest enclosing
 * element either:
 *
 *   1. carries a known scroll-wrapper class
 *      (`table-scroll`, `mc-table-wrap`, `me-grid-wrap`, `pb-grid`,
 *      `pc-grid`, `bs-contrast-scroll`, `mm-tech-tier-table-wrap`), OR
 *   2. the table itself carries a class with an explicit responsive
 *      stack rule (`security-audit`, `mm-safety`), OR
 *   3. the table has `role="presentation"` (layout table; rare).
 *
 *   node scripts/check-table-scroll-wrap.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const WRAPPER_CLASSES = new Set([
  'table-scroll',
  'mc-table-wrap',
  'me-grid-wrap',
  'pb-grid',
  'pc-grid',
  'bs-contrast-scroll',
  'mm-tech-tier-table-wrap',
  'compare-table-wrap',
]);

// Tables whose own class declares a responsive stacking pattern.
const STACKED_TABLE_CLASSES = new Set([
  'security-audit',
  'mm-safety',
  'me-table',
]);

function listHtmlFiles() {
  const out = [];
  const roots = ['tools', 'security', 'blog', 'learn',
                 'es/tools', 'es/security', 'es/blog', 'es/learn'];
  for (const r of roots) {
    walk(path.join(repoRoot, r), out);
  }
  return out;
}

function walk(dir, out) {
  if (!fs.existsSync(dir)) return;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (ent.isFile() && p.endsWith('.html')) out.push(p);
  }
}

function offsetToLine(html, offset) {
  return html.slice(0, offset).split('\n').length;
}

// Return ranges [start, end) covered by <script> blocks so we can
// skip tables inside JS string templates (print-output HTML, etc.).
function scriptRanges(html) {
  const ranges = [];
  const re = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
  let m;
  while ((m = re.exec(html))) ranges.push([m.index, m.index + m[0].length]);
  return ranges;
}

function findTables(html) {
  const tables = [];
  const skip = scriptRanges(html);
  const re = /<table\b([^>]*)>/g;
  let m;
  while ((m = re.exec(html))) {
    const off = m.index;
    if (skip.some(([a, b]) => off >= a && off < b)) continue;
    const attrs = m[1];
    const classMatch = /class\s*=\s*["']([^"']+)["']/.exec(attrs);
    const roleMatch = /role\s*=\s*["']([^"']+)["']/.exec(attrs);
    tables.push({
      offset: off,
      classes: classMatch ? classMatch[1].split(/\s+/) : [],
      role: roleMatch ? roleMatch[1] : null,
    });
  }
  return tables;
}

// Find the nearest enclosing element's class attribute by walking
// backward from `offset` through the HTML, tracking element nesting.
function nearestParentClass(html, offset) {
  // Look back up to 4KB for the parent open tag.
  const window = html.slice(Math.max(0, offset - 4096), offset);
  // Find the last unclosed element open tag.
  // Simple strategy: gather all open and close tags in the window;
  // walk backward from end, tracking nesting.
  const tagRe = /<\/?([a-z][a-z0-9-]*)\b([^>]*)>/gi;
  const tags = [];
  let m;
  while ((m = tagRe.exec(window))) {
    tags.push({ raw: m[0], name: m[1].toLowerCase(), attrs: m[2], closing: m[0].startsWith('</') });
  }
  // Walk backward, tracking depth.
  let depth = 0;
  for (let i = tags.length - 1; i >= 0; i--) {
    const t = tags[i];
    if (t.name === 'br' || t.name === 'meta' || t.name === 'link' || t.name === 'img' || t.name === 'input') continue;
    if (t.closing) depth++;
    else {
      if (depth === 0) {
        const cm = /class\s*=\s*["']([^"']+)["']/.exec(t.attrs);
        return cm ? cm[1].split(/\s+/) : [];
      }
      depth--;
    }
  }
  return [];
}

function main() {
  const files = listHtmlFiles();
  let violations = 0;

  for (const file of files) {
    const html = fs.readFileSync(file, 'utf8');
    const tables = findTables(html);
    for (const t of tables) {
      // Skip layout-presentation tables.
      if (t.role === 'presentation') continue;
      // Skip tables whose own class declares a stacked-mobile pattern.
      if (t.classes.some((c) => STACKED_TABLE_CLASSES.has(c))) continue;
      // Check parent classes for a wrapper.
      const parentClasses = nearestParentClass(html, t.offset);
      if (parentClasses.some((c) => WRAPPER_CLASSES.has(c))) continue;
      // Violation.
      const line = offsetToLine(html, t.offset);
      const rel = path.relative(repoRoot, file);
      const cls = t.classes.length ? `class="${t.classes.join(' ')}"` : '(no class)';
      console.error(`${rel}:${line}  <table ${cls}> not inside a known scroll wrapper`);
      violations++;
    }
  }

  if (violations > 0) {
    console.error(`Table-scroll-wrap: ${violations} violation(s) across ${files.length} HTML file(s).`);
    process.exit(1);
  }
  console.log(`Table-scroll-wrap: ${files.length} HTML file(s) scanned; every <table> is inside a known scroll wrapper or has a CSS-only stacking pattern.`);
}

main();
