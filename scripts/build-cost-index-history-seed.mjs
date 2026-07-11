#!/usr/bin/env node
/**
 * build-cost-index-history-seed.mjs — compact browser seed of the deep wholesale
 * history, for the Cost Index "then-vs-now" comparison (owner Δ% vs market Δ%).
 *
 * GENERATED. Reads data/cost-index-history.json (the deep, fact-gated backfill on
 * the same valueCents scale as the live level) and writes data/cost-index-history.js,
 * a same-origin <script> that sets window.MUNTIN_COST_INDEX_HISTORY. The tool loads
 * it after data/cost-index.js and degrades gracefully when it is absent (the
 * comparison falls back to each ingredient's short weekly spark).
 *
 * Only ingredients that ALSO exist in the live seed (data/cost-index.js) are
 * emitted — a longer series for a retired key would be dead weight. Each series is
 * a compact [dateISO, cents] tuple list, ascending by date, finite cents only.
 *
 *   node scripts/build-cost-index-history-seed.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const require    = createRequire(import.meta.url);

const DRY = process.argv.includes('--dry');
const OUT = path.join(repoRoot, 'data/cost-index-history.js');

const histDoc = JSON.parse(fs.readFileSync(path.join(repoRoot, 'data/cost-index-history.json'), 'utf8'));
const hist = histDoc.ingredients || {};

// Live ingredient keys — only seed history for keys the tool can actually render.
const liveMod = require(path.join(repoRoot, 'data/cost-index.js'));
const liveArr = Array.isArray(liveMod) ? liveMod : (liveMod.ingredients || []);
const liveKeys = new Set(liveArr.map((i) => i.key));

const out = {};
let kept = 0, points = 0;
for (const key of Object.keys(hist)) {
  if (!liveKeys.has(key)) continue;
  const series = (hist[key] || [])
    .filter((p) => p && typeof p.valueCents === 'number' && isFinite(p.valueCents) && p.valueCents > 0 && p.date)
    .map((p) => [String(p.date), Math.round(p.valueCents)])
    .sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  if (series.length < 2) continue;            // a single point can't anchor a comparison
  out[key] = series;
  kept++; points += series.length;
}

const banner = `/**
 * Cost Index — deep wholesale history (browser seed). GENERATED — do not edit by hand.
 *
 * Written by scripts/build-cost-index-history-seed.mjs from the fact-gated
 * data/cost-index-history.json (same valueCents scale as the live level). Sets
 * window.MUNTIN_COST_INDEX_HISTORY = { key: [[dateISO, cents], ...] }; loaded
 * same-origin so the tool stays no-fetch. Feeds the then-vs-now comparison
 * (owner price change vs market change over the same window). Absent → the tool
 * falls back to each ingredient's short weekly spark, so this is purely additive.
 */
`;
const body = `(function (root) {
  'use strict';
  var H = ${JSON.stringify(out)};
  if (typeof module !== 'undefined' && module.exports) module.exports = H;
  if (typeof self !== 'undefined') self.MUNTIN_COST_INDEX_HISTORY = H;
  if (root) root.MUNTIN_COST_INDEX_HISTORY = H;
})(typeof window !== 'undefined' ? window : (typeof self !== 'undefined' ? self : null));
`;

if (!DRY) fs.writeFileSync(OUT, banner + body);
const bytes = Buffer.byteLength(banner + body);
console.log(`build-cost-index-history-seed: ${kept} ingredient(s), ${points} points, ${(bytes / 1024).toFixed(1)} KB → data/cost-index-history.js${DRY ? ' (dry-run)' : ''}.`);

// Per-item SHARDS — one tiny same-origin <script> per ingredient (data/ci-history/<key>.js)
// that MERGES its own series into window.MUNTIN_COST_INDEX_HISTORY without clobbering the
// map. Vendor Benchmark loads only the picked item's shard (a few KB) instead of the whole
// ~1.6 MB monolith; the monolith above stays for the Cost Index pages and as a fallback.
// Same data, split by key — verified below that each shard round-trips to the monolith entry.
const shardDir = path.join(repoRoot, 'data/ci-history');
if (!DRY) {
  fs.mkdirSync(shardDir, { recursive: true });
  for (const f of fs.readdirSync(shardDir)) { // drop stale shards for keys no longer emitted
    if (f.endsWith('.js') && !Object.prototype.hasOwnProperty.call(out, f.slice(0, -3))) {
      fs.unlinkSync(path.join(shardDir, f));
    }
  }
}
let shardBytes = 0, shardCount = 0;
for (const key of Object.keys(out)) {
  if (!/^[a-z0-9-]+$/.test(key)) { console.error(`build-cost-index-history-seed: unsafe shard key '${key}' — refusing.`); process.exit(1); }
  const shard = `(function(root){if(!root)return;var H=root.MUNTIN_COST_INDEX_HISTORY=(root.MUNTIN_COST_INDEX_HISTORY||{});H[${JSON.stringify(key)}]=${JSON.stringify(out[key])};})(typeof window!=='undefined'?window:(typeof self!=='undefined'?self:null));\n`;
  shardBytes += Buffer.byteLength(shard); shardCount++;
  if (!DRY) fs.writeFileSync(path.join(shardDir, `${key}.js`), shard);
}
console.log(`  + ${shardCount} per-item shard(s) → data/ci-history/ (${(shardBytes / 1024).toFixed(1)} KB total, ~${(shardBytes / Math.max(1, shardCount) / 1024).toFixed(1)} KB each)${DRY ? ' (dry-run)' : ''}.`);
