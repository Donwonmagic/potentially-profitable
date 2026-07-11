#!/usr/bin/env node
/**
 * build-cost-index-email-preview.mjs — the GOLDEN RENDER of the monthly
 * dispatch email, committed to the repo so a human (and CI) can read exactly
 * what subscribers would receive before anything sends.
 *
 * Renders costIndexWeeklyEmail (EN + ES, html + text) from the exact insight
 * payload the dispatch workflow POSTs to the Worker (`build-cost-index-dispatch
 * --json`), and writes it under data/email-preview/ (skipped by the page-HTML
 * walkers; ships with the deploy so the render is publicly inspectable).
 *
 * The preview is a pure function of committed data — same tree, same bytes.
 * Two seams differ from a real send, both stated here so the artifact can't
 * over-promise: unsubUrl is the generic endpoint (real sends carry a
 * per-subscriber token) and postUrl points at the latest PUBLISHED dispatch
 * (at send time the workflow points it at the edition it just published).
 *
 *   node scripts/build-cost-index-email-preview.mjs           # write
 *   node scripts/build-cost-index-email-preview.mjs --check   # exit 1 on drift
 *
 * Companion gate: scripts/check-cost-index-email.mjs (content rules — banned
 * techniques, numeric parity, confidence language, quiet-lead determinism).
 * This script is only the sync gate: committed render == recomputed render.
 */

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { costIndexWeeklyEmail } from '../src/lib/templates.js';

const repoRoot  = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR   = path.join(repoRoot, 'data', 'email-preview');
const checkOnly = process.argv.includes('--check');

// Same placeholder the template defaults to — a real send substitutes the
// per-subscriber sha256 token; the preview must never contain a real one.
const UNSUB_PLACEHOLDER = 'https://muntin.digital/sub/unsubscribe';

function latestDispatchUrl() {
  let best = null;
  try {
    for (const e of readdirSync(path.join(repoRoot, 'blog'), { withFileTypes: true })) {
      const m = e.isDirectory() && e.name.match(/^cost-index-week-(\d{4}-\d{2}-\d{2})$/);
      if (m && (!best || m[1] > best)) best = m[1];
    }
  } catch { /* none */ }
  return best ? `https://muntin.digital/blog/cost-index-week-${best}/` : 'https://muntin.digital/cost-index/';
}

export function renderPreview() {
  const raw = execFileSync(process.execPath,
    [path.join(repoRoot, 'scripts', 'build-cost-index-dispatch.mjs'), '--json'],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const insight = JSON.parse(raw);
  const postUrl = latestDispatchUrl();
  const base = { ...insight, unsubUrl: UNSUB_PLACEHOLDER, postUrl };
  const en = costIndexWeeklyEmail(base);
  const es = costIndexWeeklyEmail({ ...base, locale: 'es' });
  const manifest = {
    _doc: 'Golden render of the monthly Cost Index dispatch email. Built by scripts/build-cost-index-email-preview.mjs from the exact payload the dispatch workflow POSTs; sync-gated by its --check and content-gated by scripts/check-cost-index-email.mjs. unsubUrl is the generic endpoint (real sends carry per-subscriber tokens); postUrl is the latest published edition at build time.',
    asOf: insight.asOf,
    sinceDate: insight.sinceDate || null,
    wowState: (insight.wow && insight.wow.state) || null,
    stories: (insight.stories || []).map((s) => s.key),
    actionItems: [...(insight.reprice || []), ...(insight.watch || [])].map((i) => i.key),
    postUrl,
    subjects: { en: en.subject, es: es.subject },
    bytes: { enHtml: Buffer.byteLength(en.html), enText: Buffer.byteLength(en.text), esHtml: Buffer.byteLength(es.html), esText: Buffer.byteLength(es.text) },
  };
  return { insight, en, es, manifest };
}

const FILES = (r) => ([
  ['preview.html',    r.en.html],
  ['preview.txt',     r.en.text],
  ['preview.es.html', r.es.html],
  ['preview.es.txt',  r.es.text],
  ['preview.json',    JSON.stringify(r.manifest, null, 2) + '\n'],
]);

// Import-guard: only run the CLI when executed directly (the content gate
// imports renderPreview()).
const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) {
  const r = renderPreview();
  if (checkOnly) {
    const stale = [];
    for (const [name, content] of FILES(r)) {
      const p = path.join(OUT_DIR, name);
      const committed = existsSync(p) ? readFileSync(p, 'utf8') : null;
      if (committed !== content) stale.push(name);
    }
    if (stale.length) {
      console.error(`✗ email preview is stale (${stale.join(', ')}) — the committed render no longer matches the data.`);
      console.error('Run: node scripts/build-cost-index-email-preview.mjs');
      process.exit(1);
    }
    console.log(`✓ email preview in sync — asOf ${r.manifest.asOf}, ${r.manifest.actionItems.length} action item(s), wow ${r.manifest.wowState}.`);
    process.exit(0);
  }
  mkdirSync(OUT_DIR, { recursive: true });
  let wrote = 0;
  for (const [name, content] of FILES(r)) {
    const p = path.join(OUT_DIR, name);
    const before = existsSync(p) ? readFileSync(p, 'utf8') : null;
    if (before !== content) { writeFileSync(p, content); wrote++; }
  }
  console.log(`email preview: ${wrote ? `wrote ${wrote} file(s)` : 'unchanged'} — asOf ${r.manifest.asOf}, subject (EN): ${r.manifest.subjects.en}`);
}
