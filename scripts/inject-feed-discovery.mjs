#!/usr/bin/env node
/**
 * Heartbeat (SEO) — inject <head> feed-discovery <link> tags sitewide.
 *
 * The RSS / JSON feeds already exist (feed.xml, es/feed.xml, feed-llm.json)
 * but were reachable only via a footer <a href="/feed.xml"> — which feed
 * readers and crawlers that key on <head> discovery never auto-find. This
 * adds the standard discovery links so NetNewsWire/Feedly/Edge-reader and
 * AI-search agents can subscribe, and so search engines pick up a fresh-feed
 * recrawl signal.
 *
 * Idempotent + sentinel-wrapped: a re-run replaces the block in place, so the
 * output is stable (safe to chain into the weekly dispatch / a deploy build).
 * EN pages advertise RSS + the JSON/LLM feed; ES pages advertise the ES RSS
 * feed only (there is no es/feed-llm.json). noindex and non-routable paths are
 * skipped to match the sitemap's index set.
 *
 *   node scripts/inject-feed-discovery.mjs           # rewrite in place
 *   node scripts/inject-feed-discovery.mjs --check   # exit 1 if any page is stale
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const START = '<!-- feed-discovery:start (injected by inject-feed-discovery.mjs) -->';
const END   = '<!-- /feed-discovery:end -->';

const EXCLUDE_DIRS = new Set([
  'node_modules', '.git', '.github', 'dist', '.wrangler', 'docs',
  'brand', 'assets', '_includes', 'scripts', 'src', 'data',
  'admin', 'sign-in', 'workbench', 'account', 'sub', 'drafts',
]);

function* walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.has(e.name) || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(full);
    else if (e.isFile() && e.name === 'index.html') yield full;
  }
}

function block(isEs) {
  const rss = isEs
    ? '    <link rel="alternate" type="application/rss+xml" title="Muntin Digital — RSS (ES)" href="/es/feed.xml">'
    : '    <link rel="alternate" type="application/rss+xml" title="Muntin Digital — RSS" href="/feed.xml">';
  const json = isEs
    ? null
    : '    <link rel="alternate" type="application/feed+json" title="Muntin Digital — JSON / LLM feed" href="/feed-llm.json">';
  return ['    ' + START, rss, json, '    ' + END].filter(Boolean).join('\n');
}

let changed = 0;
const stale = [];

for (const full of walk(repoRoot)) {
  const src = fs.readFileSync(full, 'utf8');
  if (/<meta\s+name="robots"[^>]*noindex/i.test(src)) continue;
  if (!/<\/head>/i.test(src)) continue;

  const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
  const isEs = rel === 'es/index.html' || rel.startsWith('es/');
  const desired = block(isEs);

  let next;
  const existing = new RegExp(`\\s*${escapeRe(START)}[\\s\\S]*?${escapeRe(END)}`);
  if (existing.test(src)) {
    next = src.replace(existing, '\n' + desired);
  } else {
    // Anchor before the first hreflang alternate link if present (keeps the
    // discovery links beside the other <link rel="alternate"> tags), else
    // immediately before </head>.
    const anchor = src.match(/[ \t]*<link rel="alternate" hreflang=/i);
    if (anchor) {
      next = src.slice(0, anchor.index) + desired + '\n' + src.slice(anchor.index);
    } else {
      next = src.replace(/([ \t]*)<\/head>/i, `${desired}\n$1</head>`);
    }
  }

  if (next !== src) {
    if (checkOnly) stale.push(rel);
    else fs.writeFileSync(full, next);
    changed++;
  }
}

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

if (checkOnly && stale.length) {
  console.error(`feed-discovery: ${stale.length} page(s) missing/stale discovery links, e.g. ${stale.slice(0, 5).join(', ')}`);
  process.exit(1);
}
console.log(`feed-discovery: ${checkOnly ? 'all pages current' : `${changed} page(s) updated`}.`);
