#!/usr/bin/env node
/**
 * Phase G.4 (Growth) — assert every glossary term page has the
 * structural pieces that make the glossary useful as a hub:
 *
 *   1. A term-example block (<p class="term-example">), OR
 *      the term is on the warn-pass list (no curated example yet).
 *   2. ≥1 link to a tool page (a <a href="/tools/...">) — i.e. the
 *      term is wired into the "Used in tools" footer.
 *
 * The check passes silently when both hold; warns on the
 * term-example side (the curated registry only covers high-volume
 * terms today) and fails on the tool-link side (a glossary term
 * with no tool link is a hub gap that should always be addressable).
 *
 *   node scripts/check-glossary-hub.mjs --check
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const CATEGORY_SLUGS = new Set([
  'basics', 'brand-design', 'conversions', 'data-literacy',
  'findability', 'mobile', 'restaurant-numbers', 'subtypes', 'trust',
]);

function termFiles(rootDir) {
  const out = [];
  if (!fs.existsSync(rootDir)) return out;
  for (const e of fs.readdirSync(rootDir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    if (CATEGORY_SLUGS.has(e.name)) continue;
    if (e.name === 'sitemap') continue;
    const f = path.join(rootDir, e.name, 'index.html');
    if (fs.existsSync(f)) out.push({ slug: e.name, file: f });
  }
  return out;
}

const failures = [];
const noExample = [];
let scanned = 0;

for (const root of [['en', 'glossary'], ['es', 'es/glossary']]) {
  const [locale, dir] = root;
  for (const { slug, file } of termFiles(path.join(repoRoot, dir))) {
    scanned++;
    const src = fs.readFileSync(file, 'utf8');
    const hasExample = /<p\s+class="term-example"/.test(src);
    const localeLinkPrefix = locale === 'es' ? '/es/tools/' : '/tools/';
    // Match /tools/<slug>/ AND nested /tools/audits/<slug>/. Each
    // segment is [a-z0-9-]+, then optional anchor.
    const toolLinkRe = new RegExp(`href="${localeLinkPrefix.replace(/\//g, '\\/')}[a-z0-9/-]+\\/(?:#[a-z0-9-]+)?"`);
    const hasToolLink = toolLinkRe.test(src);
    if (!hasExample) noExample.push(`${locale}/${slug}`);
    if (!hasToolLink) failures.push(`${path.relative(repoRoot, file)}: no /tools/<slug>/ link present (the wire-glossary-knit Used-in-tools rail is missing or empty)`);
  }
}

if (noExample.length) {
  console.log(`Glossary hub: ${noExample.length} term(s) without a curated term-example (warning):`);
  for (const n of noExample.slice(0, 8)) console.log('  · ' + n);
  if (noExample.length > 8) console.log(`  … and ${noExample.length - 8} more — extend data/glossary-term-examples.json`);
}

// Tool-link presence is a soft signal — many terms (operations
// concepts, brand design, UX patterns) genuinely don't have a
// tool that exercises them. Promote to hard fail only for terms
// that have a curated term-example AND no tool link — those are
// real hub gaps. Pure-concept terms are exempted.
const hardFailures = failures.filter((f) => {
  const slug = f.match(/glossary\/([a-z0-9-]+)\//)?.[1];
  if (!slug) return false;
  // If the term has a curated example, it's "real enough" to
  // require a tool link.
  return hasCuratedExample(slug);
});

function hasCuratedExample(slug) {
  try {
    const reg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/glossary-term-examples.json'), 'utf8'));
    return Object.prototype.hasOwnProperty.call(reg.examples || {}, slug);
  } catch (_) { return false; }
}

if (failures.length) {
  console.log(`Glossary hub: ${failures.length} term page(s) without a tool link (warning).`);
  for (const f of failures.slice(0, 5)) console.log('  · ' + f);
  if (failures.length > 5) console.log(`  … and ${failures.length - 5} more`);
}
if (hardFailures.length) {
  console.error(`Glossary hub: ${hardFailures.length} curated term(s) missing a tool link (hard fail):`);
  for (const f of hardFailures) console.error('  ✗ ' + f);
  process.exit(1);
}
console.log(`Glossary hub: ${scanned} term page(s) scanned; ${failures.length} warning(s).`);
