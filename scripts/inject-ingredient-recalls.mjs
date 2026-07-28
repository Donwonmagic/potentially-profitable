#!/usr/bin/env node
/**
 * inject-ingredient-recalls.mjs — adds the "Food-safety recall history" section (Phase 2, spec §4)
 * into every committed cost-index/<slug>/ ingredient page (EN + ES) WITHOUT a full rebuild. The
 * ingredient pages run AHEAD of the in-container engine (nav + JSON-LD), so a regenerate would regress
 * them; this injector is additive + idempotent — each page carries an `ingredient-recalls` sentinel in
 * <body> and an `ingredient-recalls-css` sentinel in its <head> <style>; a re-run strips and rewrites
 * both. Ingredients with no recall in the openFDA window get the graceful-absence variant, so EVERY
 * page gets a section. The rendered HTML matches what the engine mirror (increment 2b) will emit.
 *
 *   node scripts/inject-ingredient-recalls.mjs           # write
 *   node scripts/inject-ingredient-recalls.mjs --check    # dry-run; exit 1 if any page is out of sync
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { injectRecall } from './lib/recall-roster.mjs';

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');
const rd = (p) => { try { return JSON.parse(fs.readFileSync(path.join(repo, p), 'utf8')); } catch { return null; } };

const INDEX = ((rd('cost-index/food-recalls-by-ingredient.json') || {}).index) || {};

// The insertion logic lives in lib/recall-roster.mjs (injectRecall) — the SAME code path the engine
// mirror uses in build-cost-index-pages.mjs — so a committed injected page and a from-scratch
// regenerate are byte-identical, and both --checks stay green.
function processPage(file, slug, es) {
  const before = fs.readFileSync(file, 'utf8');
  const html = injectRecall(before, slug, INDEX, es);
  if (!html.includes('ingredient-recalls:start')) return { status: html === before ? 'no-anchor' : 'injected', changed: html !== before };
  const changed = html !== before;
  if (changed && !CHECK) fs.writeFileSync(file, html);
  return { status: 'injected', changed };
}

// every existing EN ingredient page dir (+ its ES mirror when present)
function ingredientSlugs() {
  const dir = path.join(repo, 'cost-index');
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(dir, d.name, 'index.html')))
    .map((d) => d.name)
    .filter((slug) => slug !== 'events' && slug !== 'weekly'); // non-ingredient subtrees
}

let injected = 0, changed = 0, withRecalls = 0, skipped = [];
for (const slug of ingredientSlugs()) {
  for (const [dir, es] of [['cost-index', false], ['es/cost-index', true]]) {
    const file = path.join(repo, dir, slug, 'index.html');
    if (!fs.existsSync(file)) { if (!es) skipped.push(`${slug} (en): missing`); continue; } // ES mirror may not exist yet
    const r = processPage(file, slug, es);
    if (r.status === 'injected') { injected++; if (!es && INDEX[slug]) withRecalls++; }
    else skipped.push(`${slug} (${es ? 'es' : 'en'}): ${r.status}`);
    if (r.changed) changed++;
  }
}

if (skipped.length) {
  console.error(`ingredient-recalls inject — ${skipped.length} page(s) had no injection point:`);
  for (const s of skipped.slice(0, 20)) console.error('  - ' + s);
}
if (CHECK) {
  if (changed || skipped.some((s) => !/missing/.test(s))) { console.error(`✗ ingredient-recalls: ${changed} page(s) out of sync — run: node scripts/inject-ingredient-recalls.mjs`); process.exit(1); }
  console.log(`✓ ingredient-recalls: all ingredient pages in sync (${injected} sections, ${withRecalls} with a recall record).`);
} else {
  console.log(`ingredient-recalls: injected ${injected} section(s) across EN+ES, ${changed} file(s) changed (${withRecalls} EN pages carry a recall record).`);
}
