#!/usr/bin/env node
/**
 * Themes metadata check (Wave C14).
 *
 * Asserts every theme in tools/menu-design/themes.js has a matching
 * entry in tools/menu-design/data/theme-credits.js with all four
 * required fields: reviewedBy, inspiredBy[], dateAdded (ISO),
 * story (≥ 60 chars).
 *
 * The themes-lint gate (check-themes-lint.mjs) protects the taste
 * floor. THIS gate protects the audit trail — every theme has a
 * named reviewer + a named inspiration + a date. New themes added
 * to themes.js without a credits entry fail CI.
 *
 * Run: node scripts/check-themes-metadata.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

function loadModule(rel) {
  const src = fs.readFileSync(path.join(repoRoot, rel), 'utf8');
  const ctx = { window: {}, module: { exports: {} } };
  vm.createContext(ctx);
  vm.runInContext(src, ctx);
  return ctx.window;
}

const win = loadModule('tools/menu-design/themes.js');
loadModule('tools/menu-design/data/theme-credits.js'); // attaches MD_THEME_CREDITS to a fresh ctx
// Reload credits in the same ctx as themes so we share window.
const sharedCtx = { window: {}, module: { exports: {} } };
vm.createContext(sharedCtx);
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'tools/menu-design/themes.js'), 'utf8'), sharedCtx);
vm.runInContext(fs.readFileSync(path.join(repoRoot, 'tools/menu-design/data/theme-credits.js'), 'utf8'), sharedCtx);

const MD_THEMES = sharedCtx.window.MD_THEMES;
const MD_THEME_CREDITS = sharedCtx.window.MD_THEME_CREDITS;

if (!MD_THEMES || !MD_THEME_CREDITS) {
  console.error('themes-metadata: failed to load themes or credits modules');
  process.exit(2);
}

const themeIds = MD_THEMES.list();
const creditIds = MD_THEME_CREDITS.list();
let failures = 0;
const failuresByTheme = {};

function fail(themeId, msg) {
  failures++;
  if (!failuresByTheme[themeId]) failuresByTheme[themeId] = [];
  failuresByTheme[themeId].push(msg);
}

// Every theme must have credits.
themeIds.forEach(id => {
  const c = MD_THEME_CREDITS.get(id);
  if (!c) {
    fail(id, 'no entry in theme-credits.js');
    return;
  }
  if (typeof c.reviewedBy !== 'string' || c.reviewedBy.trim().length < 3) {
    fail(id, `reviewedBy missing or too short`);
  }
  if (!Array.isArray(c.inspiredBy) || c.inspiredBy.length === 0) {
    fail(id, `inspiredBy must be a non-empty array`);
  } else {
    c.inspiredBy.forEach((s, idx) => {
      if (typeof s !== 'string' || s.length < 8) {
        fail(id, `inspiredBy[${idx}] too short or non-string`);
      }
    });
  }
  if (typeof c.dateAdded !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(c.dateAdded)) {
    fail(id, `dateAdded "${c.dateAdded}" is not ISO yyyy-mm-dd`);
  } else {
    const d = new Date(c.dateAdded);
    if (isNaN(d.getTime())) {
      fail(id, `dateAdded "${c.dateAdded}" is not a valid date`);
    } else if (d > new Date()) {
      fail(id, `dateAdded "${c.dateAdded}" is in the future`);
    }
  }
  if (typeof c.story !== 'string' || c.story.length < 60) {
    fail(id, `story must be ≥ 60 chars (got ${c.story ? c.story.length : 0})`);
  }
});

// Reverse check: no orphan credits without a theme.
creditIds.forEach(id => {
  if (themeIds.indexOf(id) < 0) {
    fail(id, 'credits entry exists but no theme with this id in themes.js');
  }
});

const themeCount = themeIds.length;
if (failures === 0) {
  console.log(`Themes metadata: ${themeCount} theme(s) all carry reviewedBy + inspiredBy + dateAdded + story.`);
  process.exit(0);
}

console.log(`Themes metadata: ${themeCount} theme(s) scanned; ${failures} failure(s):`);
console.log('');
Object.keys(failuresByTheme).sort().forEach(id => {
  console.log(`  ${id}:`);
  failuresByTheme[id].forEach(m => console.log(`    ${m}`));
});
console.log('');
console.log('Each theme must have an entry in tools/menu-design/data/theme-credits.js');
console.log('with reviewedBy (≥3 chars), inspiredBy (non-empty string array),');
console.log('dateAdded (yyyy-mm-dd), and story (≥60 chars).');
process.exit(1);
