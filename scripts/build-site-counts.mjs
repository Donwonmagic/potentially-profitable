#!/usr/bin/env node
// Rebuild data/site-counts.json from the filesystem.
//
// One source of truth for the small numbers that appear in nav, footer,
// and library copy ("9 free tools", "116-term glossary", "6 topics").
// scripts/inject-site-counts.mjs reads this JSON and stamps the values
// into <!-- count:KEY -->VALUE<!-- /count --> sentinels site-wide.
//
//   node scripts/build-site-counts.mjs           # rewrites data/site-counts.json
//   node scripts/build-site-counts.mjs --check   # exits non-zero if the JSON would change
//
// Counting rules (kept here so they're greppable):
//   tools.live      — entries in data/tools.json with status=live
//   tools.coming    — entries in data/tools.json roadmap[]
//   glossary.terms  — directories under glossary/ that contain index.html
//   topics          — directories under learn/topics/ that contain index.html
//   articles        — directories under blog/ (excluding /drafts/) with index.html
//
// data/tools.json is the source of truth for tool counts (added in
// Phase 2). Falls back to scanning tools/index.html if the JSON is
// missing — keeps the script forgiving while the new pipeline rolls in.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

function countDirs(rel, { skip = new Set(), require = 'index.html' } = {}) {
  const dir = path.join(REPO, rel);
  if (!fs.existsSync(dir)) return 0;
  let n = 0;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    if (entry.name.startsWith('.') || entry.name.startsWith('_')) continue;
    if (skip.has(entry.name)) continue;
    if (require && !fs.existsSync(path.join(dir, entry.name, require))) continue;
    n++;
  }
  return n;
}

function readToolsJson() {
  const fp = path.join(REPO, 'data', 'tools.json');
  if (!fs.existsSync(fp)) return null;
  try { return JSON.parse(fs.readFileSync(fp, 'utf8')); } catch { return null; }
}

function countToolsFromJson(toolsJson) {
  const live   = Object.values(toolsJson.tools || {}).filter((t) => t.status === 'live').length;
  const coming = Array.isArray(toolsJson.roadmap) ? toolsJson.roadmap.length : 0;
  return { live, coming };
}

function countToolsFromHtmlFallback() {
  // Pre-Phase-2 fallback. Matches "tool-card ... live" in any class
  // attribute order — covers both the legacy "tool-card live" and the
  // Phase-2 "tool-card tool-card--compact live" rendering.
  const html = fs.readFileSync(path.join(REPO, 'tools', 'index.html'), 'utf8');
  const re = /class="tool-card[^"]*\blive\b/g;
  const matches = html.match(re);
  const live = matches ? matches.length : 0;
  const totalDirs = countDirs('tools');
  return { live, coming: Math.max(0, totalDirs - live) };
}

const toolsJson = readToolsJson();
const toolCounts = toolsJson ? countToolsFromJson(toolsJson) : countToolsFromHtmlFallback();
const counts = {
  _doc: 'Single source of truth for the counts that appear in nav, footer, and library copy. Built by scripts/build-site-counts.mjs from the filesystem; injected into HTML by scripts/inject-site-counts.mjs via <!-- count:KEY -->VALUE<!-- /count --> sentinels.',
  tools: {
    live:   toolCounts.live,
    coming: toolCounts.coming,
  },
  glossary: {
    terms: countDirs('glossary'),
  },
  topics:   countDirs('learn/topics'),
  // Phase 7 split: total articles = /blog/ (timely) + /library/ (evergreen).
  // The library-only count subtracts /library/menu-design-*/ (collection
  // landings, not articles) — only article-shaped /library/<slug>/ folders
  // count toward articles.library.
  articles: countDirs('blog', { skip: new Set(['drafts']) })
          + countDirs('library', { skip: new Set(['menu-design-cuisines', 'menu-design-themes']) }),
  updated:  new Date().toISOString().slice(0, 10),
};

const target = path.join(REPO, 'data', 'site-counts.json');
const next   = JSON.stringify(counts, null, 2) + '\n';
const prev   = fs.existsSync(target) ? fs.readFileSync(target, 'utf8') : '';

// Diff ignoring the `updated` field — it's the timestamp of the last
// rebuild and would otherwise force a daily change. The `--check` mode
// fails only when the substantive numbers drift.
function withoutUpdated(jsonText) {
  try {
    const obj = JSON.parse(jsonText);
    delete obj.updated;
    return JSON.stringify(obj);
  } catch { return jsonText; }
}

const driftedNumbers = withoutUpdated(prev) !== withoutUpdated(next);

if (checkOnly) {
  if (driftedNumbers) {
    console.error('site-counts.json is stale. Run: node scripts/build-site-counts.mjs');
    process.exit(1);
  }
  console.log('site-counts.json is up to date.');
  process.exit(0);
}

fs.writeFileSync(target, next);
console.log('wrote data/site-counts.json:');
for (const line of JSON.stringify(counts, null, 2).split('\n')) console.log('  ' + line);
