#!/usr/bin/env node
// Term-link integrity check for the Open the Doors bootcamp.
//
// The Method's tenet 4 ("one vocabulary, owned") makes every glossary
// term-link a contract: when a lesson says <a class="term-link"
// href="/glossary/menu-engineering/">menu engineering</a>, the
// /glossary/menu-engineering/ directory must exist. This script walks
// every term-link href under /course/ (EN+ES) and verifies the
// linked directory has an index.html.
//
// Why this matters: term-links accumulate across lessons; a glossary
// entry can be renamed or moved; nothing automatically follows it.
// One quarter of dead links costs the operator trust and breaks the
// learn-the-vocabulary tenet.
//
// Runs in two modes:
//   node scripts/check-course-term-links.mjs          # report + exit 0
//   node scripts/check-course-term-links.mjs --check  # exit 1 if any broken
//
// Scope: /course/ + /es/course/ recursively. Includes both internal
// /glossary/<slug>/ and /es/glossary/<slug>/ paths. External links
// (https://...) are ignored — the script is about glossary contract,
// not link-rot in general.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkMode  = process.argv.includes('--check');

const EN_ROOT = path.join(repoRoot, 'course');
const ES_ROOT = path.join(repoRoot, 'es', 'course');

function collectHtml(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectHtml(full, out);
    else if (entry.isFile() && entry.name === 'index.html') out.push(full);
  }
  return out;
}

function termLinks(html) {
  const links = [];
  // Match <a ... class="term-link" ... href="..."> in either attribute order.
  const re = /<a\b[^>]*\bclass="[^"]*\bterm-link\b[^"]*"[^>]*>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const tag = m[0];
    const hrefM = tag.match(/\bhref="([^"]+)"/);
    if (hrefM) links.push(hrefM[1]);
  }
  return links;
}

function isInternal(href) {
  return href.startsWith('/');
}

function isGlossaryHref(href) {
  return /^\/(?:es\/)?glossary\/[^/]+\/?$/.test(href);
}

function glossaryPath(href) {
  // Strip leading slash; allow optional trailing slash.
  return href.replace(/^\//, '').replace(/\/$/, '') + '/index.html';
}

const allFiles = [...collectHtml(EN_ROOT), ...collectHtml(ES_ROOT)];
const broken = [];
const nonGlossaryTermLinks = [];
const checked = new Map();

for (const file of allFiles) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  const html = fs.readFileSync(file, 'utf8');
  const links = termLinks(html);
  for (const href of links) {
    if (!isInternal(href)) {
      // Term-links to external URLs (e.g., the Wikipedia article on
      // a concept) are allowed by convention but they bypass the
      // glossary contract. Track separately as a soft signal.
      nonGlossaryTermLinks.push({ file: rel, href });
      continue;
    }
    if (!isGlossaryHref(href)) {
      // An internal term-link that doesn't point at /glossary/ is
      // suspicious — flag it.
      nonGlossaryTermLinks.push({ file: rel, href });
      continue;
    }
    const targetRel = glossaryPath(href);
    let exists;
    if (checked.has(targetRel)) exists = checked.get(targetRel);
    else {
      exists = fs.existsSync(path.join(repoRoot, targetRel));
      checked.set(targetRel, exists);
    }
    if (!exists) broken.push({ file: rel, href, target: targetRel });
  }
}

let hadFindings = false;

if (broken.length) {
  hadFindings = true;
  console.log(`\n[course-term-links] BROKEN — ${broken.length} term-link href(s) point at a glossary directory that does not exist:`);
  // Group by target so the same broken term across many lessons reads as one finding.
  const byTarget = new Map();
  for (const b of broken) {
    if (!byTarget.has(b.href)) byTarget.set(b.href, []);
    byTarget.get(b.href).push(b.file);
  }
  for (const [href, files] of byTarget) {
    console.log(`  ${href}  →  missing ${files.length === 1 ? 'in:' : 'in ' + files.length + ' lesson(s):'}`);
    for (const f of files.slice(0, 5)) console.log(`    ${f}`);
    if (files.length > 5) console.log(`    … and ${files.length - 5} more`);
  }
}

if (nonGlossaryTermLinks.length) {
  console.log(`\n[course-term-links] NOTE — ${nonGlossaryTermLinks.length} term-link(s) point outside /glossary/ (allowed, but the glossary contract doesn't cover them):`);
  for (const n of nonGlossaryTermLinks.slice(0, 10)) console.log(`  ${n.file}  →  ${n.href}`);
  if (nonGlossaryTermLinks.length > 10) console.log(`  … and ${nonGlossaryTermLinks.length - 10} more`);
}

const totalChecked = checked.size;
const okCount = [...checked.values()].filter(Boolean).length;

console.log(`\n[course-term-links] Scanned ${allFiles.length} course page(s). ${totalChecked} unique glossary target(s); ${okCount} resolve.`);

if (!broken.length) {
  console.log('[course-term-links] OK — every glossary term-link resolves.');
  process.exit(0);
} else if (checkMode) {
  console.log('\n[course-term-links] FAIL — broken term-link(s) detected (exit 1 in --check mode).');
  process.exit(1);
} else {
  console.log('\n[course-term-links] WARN — broken term-link(s) detected (exit 0 outside --check mode).');
  process.exit(0);
}
