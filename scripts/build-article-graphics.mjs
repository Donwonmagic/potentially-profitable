#!/usr/bin/env node
/**
 * Article graphics builder — Phase 1 scaffold.
 *
 * Why this exists
 * ---------------
 * The article library is migrating from hand-coded inline tables to
 * a small viz-* component family (CSS .viz-bars first; .viz-ring,
 * .viz-spark, .viz-ba, .viz-flow, .viz-tree, .viz-waterfall,
 * .viz-gauge, .viz-hero, .viz-scroll in subsequent phases). Some of
 * those components are pure CSS (.viz-bars), but several are data-
 * driven inline SVGs whose geometry is easier to compute at build
 * time than to hand-author per article (cost-waterfall wedges,
 * lighthouse-style score rings, sparkline polylines, hero
 * illustrations).
 *
 * This script is the build-time renderer. It mirrors the proven
 * pattern in scripts/build-og-cards.mjs:
 *
 *   - Read a manifest at brand/article-svg/graphics.json
 *   - Each entry: { slug, figId, kind, locale, data }
 *   - Per kind, dispatch to a renderer in brand/article-svg/render-*.mjs
 *     that returns an SVG string with explicit width/height
 *     (required by check-svg-dimensions.mjs)
 *   - Write twin outputs:
 *       brand/article-svg/out/<slug>/<figId>.svg  (inlinable)
 *       brand/article-svg/out/<slug>/<figId>.png  (Resvg 2x fallback)
 *   - Locale parity: every en entry must have an es sibling
 *     (same slug + figId)
 *   - Idempotent: --check exits 1 if outputs would change; otherwise 0
 *
 * Phase 1 ships an empty manifest + the schema validator + the
 * idempotency check + the locale-parity assertion. As articles get
 * refreshed (DoorDash cost waterfall, Wix lighthouse gauges, etc.),
 * each new entry lands here with its renderer; the page builder
 * inlines the resulting SVG via sentinel comments
 *   <!-- viz:<figId> -->…<!-- /viz:<figId> -->
 * identical to the inject-* pattern used elsewhere.
 *
 * Usage
 * -----
 *   node scripts/build-article-graphics.mjs            # write everything
 *   node scripts/build-article-graphics.mjs --check    # idempotency only
 *   node scripts/build-article-graphics.mjs --dry-run  # list, no writes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const MANIFEST   = path.join(REPO, 'brand', 'article-svg', 'graphics.json');
const OUT_DIR    = path.join(REPO, 'brand', 'article-svg', 'out');

const args     = new Set(process.argv.slice(2));
const checkOnly = args.has('--check');
const dryRun    = args.has('--dry-run');

// Known graphic kinds. Each one has a corresponding renderer in
// brand/article-svg/render-<kind>.mjs that exports default(data) →
// { svg: string, width: number, height: number }. New kinds: add the
// renderer + the kind name here.
const KINDS = new Set([
  'bars',       // animated bar chart (already pure CSS via .viz-bars; reserved for future server-rendered variant)
  'ring',       // score ring / circular progress
  'spark',      // sparkline polyline
  'ba',         // before/after slider artwork (the two stacked layers)
  'flow',       // process timeline / funnel
  'tree',       // decision tree connector overlay
  'waterfall',  // cost waterfall stacked bars
  'gauge',      // half-donut + needle
  'hero',       // hero illustration
  'scroll',     // scrollytelling sticky figure
]);

const LOCALES = new Set(['en', 'es']);

// -------------------------------------------------------------
// Manifest loading + schema validation
// -------------------------------------------------------------

function loadManifest() {
  let raw;
  try {
    raw = fs.readFileSync(MANIFEST, 'utf8');
  } catch (e) {
    throw new Error(`Cannot read manifest: ${MANIFEST}\n  ${e.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Manifest is not valid JSON: ${MANIFEST}\n  ${e.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.entries)) {
    throw new Error(`Manifest must be { "entries": [...] }: ${MANIFEST}`);
  }
  return parsed.entries;
}

function validateEntries(entries) {
  const errors = [];
  const seen = new Set();
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const where = `entries[${i}]`;
    if (!e || typeof e !== 'object') { errors.push(`${where}: not an object`); continue; }
    if (typeof e.slug   !== 'string' || !e.slug.trim())   errors.push(`${where}.slug missing`);
    if (typeof e.figId  !== 'string' || !e.figId.trim())  errors.push(`${where}.figId missing`);
    if (typeof e.kind   !== 'string' || !KINDS.has(e.kind)) errors.push(`${where}.kind invalid (got ${JSON.stringify(e.kind)}; expected one of ${[...KINDS].join('|')})`);
    if (typeof e.locale !== 'string' || !LOCALES.has(e.locale)) errors.push(`${where}.locale invalid (got ${JSON.stringify(e.locale)}; expected en|es)`);
    if (e.data == null || typeof e.data !== 'object') errors.push(`${where}.data missing`);

    const key = `${e.locale}:${e.slug}:${e.figId}`;
    if (seen.has(key)) errors.push(`${where}: duplicate ${key}`);
    seen.add(key);
  }
  return errors;
}

function checkLocaleParity(entries) {
  const errors = [];
  const byLocale = { en: new Set(), es: new Set() };
  for (const e of entries) {
    if (!byLocale[e.locale]) continue;
    byLocale[e.locale].add(`${e.slug}:${e.figId}`);
  }
  for (const k of byLocale.en) {
    if (!byLocale.es.has(k)) errors.push(`Missing ES twin for: ${k}`);
  }
  for (const k of byLocale.es) {
    if (!byLocale.en.has(k)) errors.push(`Missing EN twin for: ${k}`);
  }
  return errors;
}

// -------------------------------------------------------------
// Renderer dispatch (Phase 2+ fills in the kinds)
// -------------------------------------------------------------

async function loadRenderer(kind) {
  const rendererPath = path.join(REPO, 'brand', 'article-svg', `render-${kind}.mjs`);
  if (!fs.existsSync(rendererPath)) {
    throw new Error(`No renderer for kind "${kind}" (expected at ${path.relative(REPO, rendererPath)}). Add it before adding entries with this kind.`);
  }
  const mod = await import(rendererPath);
  if (typeof mod.default !== 'function') {
    throw new Error(`Renderer ${rendererPath} must export a default function (data) => { svg, width, height }`);
  }
  return mod.default;
}

async function renderEntry(entry) {
  const render = await loadRenderer(entry.kind);
  const result = render(entry.data, { slug: entry.slug, figId: entry.figId, locale: entry.locale });
  if (!result || typeof result.svg !== 'string') {
    throw new Error(`Renderer for ${entry.kind} returned invalid result (expected { svg, width, height })`);
  }
  // Defensive: every SVG MUST have explicit width and height attributes
  // (enforced site-wide by check-svg-dimensions.mjs). Renderers are
  // responsible for this; we double-check here.
  if (!/<svg\b[^>]*\bwidth=/.test(result.svg) || !/<svg\b[^>]*\bheight=/.test(result.svg)) {
    throw new Error(`Renderer for ${entry.kind} produced an SVG without explicit width+height attributes (slug=${entry.slug} figId=${entry.figId})`);
  }
  return result.svg;
}

// -------------------------------------------------------------
// Main
// -------------------------------------------------------------

async function main() {
  const entries = loadManifest();

  const schemaErrors = validateEntries(entries);
  if (schemaErrors.length) {
    console.error(`Article graphics: ${schemaErrors.length} schema error(s):`);
    for (const e of schemaErrors.slice(0, 20)) console.error('  · ' + e);
    if (schemaErrors.length > 20) console.error(`  … and ${schemaErrors.length - 20} more`);
    process.exit(1);
  }

  const parityErrors = checkLocaleParity(entries);
  if (parityErrors.length) {
    console.error(`Article graphics: ${parityErrors.length} locale-parity error(s):`);
    for (const e of parityErrors) console.error('  · ' + e);
    process.exit(1);
  }

  if (entries.length === 0) {
    console.log(`Article graphics: manifest is empty (0 entries). Schema + locale-parity OK.`);
    process.exit(0);
  }

  let wrote = 0;
  let wouldWrite = 0;
  for (const entry of entries) {
    const dir = path.join(OUT_DIR, entry.locale, entry.slug);
    const svgPath = path.join(dir, `${entry.figId}.svg`);
    const svg = await renderEntry(entry);

    let prev = '';
    try { prev = fs.readFileSync(svgPath, 'utf8'); } catch (_) { /* new */ }

    if (prev === svg) {
      if (dryRun) console.log(`unchanged: ${path.relative(REPO, svgPath)}`);
      continue;
    }

    if (checkOnly) {
      wouldWrite++;
      console.log(`would update: ${path.relative(REPO, svgPath)}`);
    } else if (dryRun) {
      console.log(`would write: ${path.relative(REPO, svgPath)}`);
    } else {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(svgPath, svg);
      wrote++;
      console.log(`wrote: ${path.relative(REPO, svgPath)}`);
    }
  }

  if (checkOnly && wouldWrite > 0) {
    console.error(`Article graphics: ${wouldWrite} file(s) would change. Run: node scripts/build-article-graphics.mjs`);
    process.exit(1);
  }

  console.log(`Article graphics: ${entries.length} entries, ${wrote} written. Schema + locale-parity OK.`);
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
