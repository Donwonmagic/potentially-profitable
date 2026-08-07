#!/usr/bin/env node
/**
 * Surface-disposition gate — the manifest is a decision, this makes it a fact.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * data/surface-disposition.json says what each of the 1,327 routable pages is
 * for under the closed-month doctrine (ADR-025). A manifest nobody enforces is
 * prose in JSON clothing — and this company has measured what that is worth: a
 * 26% close rate, with zero closures ever coming from anyone working a list.
 *
 * So the disposition gets teeth. Four assertions, each mechanical:
 *
 *   1. COVERAGE   — every route in data/surface-inventory.json has a disposition.
 *                   A page cannot slip into the corpus without one, which is the
 *                   same lesson check-gate-coverage and check-idem-coverage
 *                   already taught: there is no third state.
 *   2. DELETED    — nothing dispositioned `delete` still exists on disk.
 *   3. NOINDEXED  — every `freeze-noindex` page actually carries a noindex robots
 *                   directive. This is where the real work is, and where this
 *                   gate fails today.
 *   4. INDEXED    — every `keep` page that is not runtime machinery is indexable.
 *                   The audit file cannot be hidden from the reviewer reading it.
 *
 * STATUS: FAILS TODAY, AND MUST NOT BE WIRED UNTIL IT PASSES.
 *
 * check-all.mjs runs inside the Cloudflare deploy build.command, so wiring a
 * red gate makes every deploy red and teaches everyone to ignore the deploy —
 * the exact disease this repo already diagnosed (see check-gate-coverage.mjs
 * header, and check-queue.mjs's UNWIRED entry). It is listed in
 * check-gate-coverage.mjs#UNWIRED with a date, its status, and this reason.
 * Fix the violations first (queue Q-061), then wire it, then delete that entry.
 *
 * Usage:
 *   node scripts/check-surface-disposition.mjs
 *   node scripts/check-surface-disposition.mjs --summary   (counts only, exit 0)
 *
 * Exit codes:
 *   0 — every assertion holds.
 *   1 — at least one does not.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));

const NOINDEX = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i;

export function assertions(disp, inventoryRoutes, exists, robotsNoindex) {
  const fails = [];
  const byRoute = new Map(disp.pages.map((p) => [p.route, p]));

  // 1. coverage
  for (const r of inventoryRoutes) {
    if (!byRoute.has(r)) fails.push({ check: 'coverage', route: r, msg: 'routable page with no disposition — rebuild data/surface-disposition.json' });
  }
  for (const p of disp.pages) {
    if (!inventoryRoutes.has(p.route)) fails.push({ check: 'coverage', route: p.route, msg: 'disposition for a route that no longer exists — the manifest outlived the page' });
  }

  for (const p of disp.pages) {
    // 2. deleted means gone
    if (p.disposition === 'delete' && exists(p.filePath)) {
      fails.push({ check: 'deleted', route: p.route, msg: `dispositioned delete but ${p.filePath} is still on disk (redirect to ${p.redirectTo})` });
    }
    // 3. freeze-noindex means noindex
    if (p.disposition === 'freeze-noindex' && exists(p.filePath) && !robotsNoindex(p.filePath)) {
      fails.push({ check: 'noindexed', route: p.route, msg: `dispositioned freeze-noindex (${p.rule}) but still indexable — ${p.reason}` });
    }
    // 4. keep means reachable by a reviewer
    if (p.disposition === 'keep' && p.rule !== 'R0-runtime' && exists(p.filePath) && robotsNoindex(p.filePath)) {
      fails.push({ check: 'indexed', route: p.route, msg: `dispositioned keep (${p.rule}) — part of the public audit file — but carries noindex` });
    }
  }
  return fails;
}

function main() {
  const disp = read('data/surface-disposition.json');
  const inv = read('data/surface-inventory.json');
  if (disp._asOf !== inv._asOf) {
    console.error(`✗ surface-disposition is stale: asOf ${disp._asOf} vs inventory ${inv._asOf}. Run: node scripts/build-surface-disposition.mjs`);
    process.exit(1);
  }
  const routes = new Set(inv.pages.map((p) => p.route));
  const cache = new Map();
  const abs = (fp) => path.join(REPO, fp);
  const exists = (fp) => fs.existsSync(abs(fp));
  const robotsNoindex = (fp) => {
    if (!cache.has(fp)) cache.set(fp, NOINDEX.test(fs.readFileSync(abs(fp), 'utf8')));
    return cache.get(fp);
  };

  const fails = assertions(disp, routes, exists, robotsNoindex);
  const byCheck = fails.reduce((a, f) => { a[f.check] = (a[f.check] || 0) + 1; return a; }, {});

  if (process.argv.includes('--summary')) {
    console.log(`surface-disposition: ${disp.summary.pages} pages · ${fails.length} violations`, byCheck);
    return;
  }
  if (!fails.length) {
    console.log(`✓ surface-disposition — ${disp.summary.pages} pages, every disposition holds`);
    return;
  }
  console.error(`✗ surface-disposition — ${fails.length} violations`, byCheck);
  for (const f of fails.slice(0, 40)) console.error(`  [${f.check}] ${f.route} — ${f.msg}`);
  if (fails.length > 40) console.error(`  … and ${fails.length - 40} more`);
  process.exit(1);
}

if (process.argv[1] === __filename) main();
