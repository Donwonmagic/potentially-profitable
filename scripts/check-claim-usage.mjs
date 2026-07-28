#!/usr/bin/env node
/**
 * Claim-usage gate — the fact registry's own bookkeeping.
 *
 * WHY THIS EXISTS (2026-07-28)
 *
 * `data/sourced-claims.json` is the spine of the fact gate: every number in the
 * library either lives here with a source, is labelled illustrative, or carries
 * an inline <details class="cite"> drawer. Each entry documents `used_in` — per
 * the registry's own schema, "list of article slugs (or page paths) that cite
 * this claim".
 *
 * Nothing validated it. `check-article-graphics.mjs` names the citation-slug
 * registry explicitly under "Not enforced here (intentional gaps)", and in the
 * gap it left, 20 of 78 used_in edges rotted: they pointed at articles that do
 * not exist on disk — slugs renamed during the blog/library split, and articles
 * that were planned and never written.
 *
 * That is not a cosmetic defect. `scripts/build-claims-json.mjs` copies used_in
 * verbatim into `/claims.json`, which is a PUBLIC, crawlable export. So the
 * site was publishing 20 false statements about where its own claims are cited
 * — inside the very artifact whose job is to prove it does not make things up.
 *
 * WHAT THIS ENFORCES
 *
 *   ERROR — a used_in entry that resolves to nothing on disk. Unambiguous rot;
 *           this is the failure that actually happened.
 *   WARN  — a used_in entry that resolves, but whose page does not contain the
 *           claim's source_url. Weaker evidence: a page may legitimately cite a
 *           claim without rendering its URL (a claim-id reference, a shortened
 *           or redirected link, an ES translation citing the EN source). Warn,
 *           never fail, or the gate would punish correct citations.
 *   WARN  — a page that RENDERS a claim's source_url but is not listed in that
 *           claim's used_in. The inverse rot: an ES translation ships citing
 *           the same sources as its EN original and nobody updates the registry.
 *           79 such citations existed when this gate landed. Warn rather than
 *           fail, because a page may render a URL incidentally (a related-links
 *           rail, a quoted example) without that being a citation.
 *   INFO  — a claim with an empty used_in. Registered but not currently cited.
 *           Legitimate for a claim awaiting use and for operator-bio facts that
 *           are referenced in prose rather than per-article, so this is reported
 *           and never enforced.
 *
 * A slug resolves if it is found under any of ROOTS, as either a path or a
 * directory containing index.html — matching how used_in is actually written
 * (bare slugs like "reservation-conversion-guide", and full paths like
 * "learn/research/fittss-law").
 *
 * Usage:
 *   node scripts/check-claim-usage.mjs
 *   node scripts/check-claim-usage.mjs --self-test
 *   node scripts/check-claim-usage.mjs --warn     (never exit non-zero)
 *
 * Exit codes:
 *   0 — every used_in entry resolves.
 *   1 — at least one entry points at nothing.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');

const args = new Set(process.argv.slice(2));
const warnOnly = args.has('--warn');

const REGISTRY = 'data/sourced-claims.json';
const GROUPS = ['claims', 'operator_experience_claims'];

// Where a used_in value may live. Bare slugs are resolved against the article
// roots; full paths ("learn/research/x") resolve via the empty prefix.
export const ROOTS = ['', 'library/', 'blog/', 'es/library/', 'es/blog/', 'learn/research/'];

export function resolveUsedIn(value, exists = (p) => fs.existsSync(path.join(REPO, p))) {
  const slug = String(value).replace(/^\/+|\/+$/g, '');
  if (!slug) return null;
  for (const root of ROOTS) {
    for (const candidate of [root + slug, `${root}${slug}/index.html`]) {
      if (exists(candidate)) return candidate;
    }
  }
  return null;
}

function pageHtml(resolved) {
  const abs = path.join(REPO, resolved);
  const file = abs.endsWith('.html') ? abs : path.join(abs, 'index.html');
  try { return fs.readFileSync(file, 'utf8'); } catch { return ''; }
}

function bareUrl(u) {
  return String(u || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function selfTest() {
  const fake = new Set(['library/foo/index.html', 'learn/research/bar', 'blog/baz/index.html']);
  const exists = (p) => fake.has(p);
  const cases = [
    ['foo', 'library/foo/index.html', 'bare slug resolves under library/'],
    ['baz', 'blog/baz/index.html', 'bare slug resolves under blog/'],
    ['learn/research/bar', 'learn/research/bar', 'full path resolves via empty root'],
    ['/foo/', 'library/foo/index.html', 'leading and trailing slashes tolerated'],
    ['nope', null, 'unknown slug resolves to null'],
    ['', null, 'empty value resolves to null'],
  ];
  let pass = 0;
  for (const [input, expected, why] of cases) {
    const got = resolveUsedIn(input, exists);
    if (got !== expected) {
      console.error(`✗ self-test: ${why} — expected ${expected}, got ${got}`);
      process.exit(2);
    }
    pass++;
  }
  if (bareUrl('https://example.com/x/') !== 'example.com/x') {
    console.error('✗ self-test: bareUrl normalisation');
    process.exit(2);
  }
  pass++;
  console.log(`check-claim-usage --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

if (args.has('--self-test')) selfTest();

const registry = JSON.parse(fs.readFileSync(path.join(REPO, REGISTRY), 'utf8'));

// Every article body, indexed once, so the bidirectional check is one pass.
const ARTICLE_ROOTS = ['library', 'blog', 'es/library', 'es/blog', 'learn/research'];
const articles = [];
for (const root of ARTICLE_ROOTS) {
  const dir = path.join(REPO, root);
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    const file = path.join(dir, name, 'index.html');
    if (!fs.existsSync(file)) continue;
    articles.push({
      // match the registry's existing convention: bare slug for EN library/blog,
      // full path for everything else.
      ref: root === 'library' || root === 'blog' ? name : `${root}/${name}`,
      bare: name,
      slug: `${root}/${name}`,
      html: fs.readFileSync(file, 'utf8'),
    });
  }
}

const errors = [];
const warnings = [];
const undocumented = [];
const uncited = [];
let edges = 0;

for (const group of GROUPS) {
  for (const [id, entry] of Object.entries(registry[group] || {})) {
    if (id.startsWith('_') || !entry || typeof entry !== 'object') continue;
    const used = Array.isArray(entry.used_in) ? entry.used_in : [];
    if (!used.length) { uncited.push(id); continue; }
    for (const value of used) {
      edges++;
      const resolved = resolveUsedIn(value);
      if (!resolved) {
        errors.push(`${id}: used_in "${value}" resolves to no page on disk`);
        continue;
      }
      const url = bareUrl(entry.source_url);
      if (url && !pageHtml(resolved).includes(url)) {
        warnings.push(`${id}: "${value}" exists but does not render ${url}`);
      }
    }
    // Inverse: pages that cite this claim's source but are not declared.
    const url = bareUrl(entry.source_url);
    if (url) {
      const declared = new Set(used.map((u) => String(u).replace(/^\/+|\/+$/g, '')));
      for (const a of articles) {
        if (!a.html.includes(url)) continue;
        if (declared.has(a.bare) || declared.has(a.slug)) continue;
        undocumented.push(`${id}: ${a.slug} renders ${url} but is not in used_in`);
      }
    }
  }
}

for (const w of warnings) console.error(`  warn  ${w}`);
if (warnings.length) {
  console.error(`check-claim-usage: ${warnings.length} warning(s) — a page may cite a claim without rendering its URL; verify before editing.\n`);
}
for (const u of undocumented) console.error(`  warn  ${u}`);
if (undocumented.length) {
  console.error(`check-claim-usage: ${undocumented.length} undocumented citation(s) — a page cites the source but the registry does not record it. Add the page to that claim's used_in.\n`);
}
if (uncited.length) {
  console.log(`check-claim-usage: ${uncited.length} claim(s) registered but not cited anywhere — ${uncited.join(', ')}`);
}

if (!errors.length) {
  console.log(`check-claim-usage: ${edges} used_in edge(s) across the registry all resolve. 0 violations.`);
  process.exit(0);
}

console.error(`\ncheck-claim-usage: ${errors.length} used_in edge(s) point at nothing:\n`);
for (const e of errors) console.error(`  ✗ ${e}`);
console.error(`
These are published verbatim in /claims.json, so a broken edge is a false public
statement about where a claim is cited. Fix by pointing the entry at the article
that actually cites the claim's source, or by removing the entry if no article
does. Do NOT guess from slug similarity — check which page renders the source URL.`);
process.exit(warnOnly ? 0 : 1);
