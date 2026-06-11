#!/usr/bin/env node
/**
 * Cohesion guard — every HTML page that links to a productized
 * service must use the canonical price for that service.
 *
 * The launch plan productizes four (soon five) paid services with
 * fixed prices: $499 audit, $1,500 menu drop-in, $249 menu polish,
 * $99/mo Care Plan Light, $225/mo Standard Care. Each price appears
 * in dozens of places across the site — service pages, /services/
 * index, /terms/, /window/, breadcrumbs, JSON-LD, footer mentions,
 * blog post inline references, Care-Plan upsells, audit credit
 * language, etc. Drift here is silent and embarrassing: someone
 * updates one page when a price moves, the others quietly disagree
 * for months until a customer asks why.
 *
 * Single source of truth: data/services-pricing.json. To change a
 * price, edit ONE line there; this guard then surfaces every page
 * still on the old number. The fix is to grep + replace; this script
 * deliberately does NOT auto-rewrite, since the surrounding prose
 * varies (some pages say "$499 audit", others "$499 paid audit",
 * others use the price in a sentence with adjacent numbers).
 *
 * What the check does:
 *
 *   For each service, find every HTML page that LINKS to its page
 *   (href contains the service slug, e.g. /services/audit/) AND
 *   verify the canonical price string appears in the same file.
 *   A page that links to /services/audit/ but never mentions $499
 *   is suspicious — either it should mention the price (drift), or
 *   the link is leftover from a removed mention (cleanup).
 *
 * Conservative scope: this only flags MISSING prices on linking
 * pages, not WRONG prices. A wrong price would require fuzzy regex
 * around each link to know which slug-context the price belonged
 * to, and the false-positive risk is high. Missing-price detection
 * is enough to catch drift early — once a price has drifted, the
 * canonical mention disappears from one of the linkers, and this
 * guard fires.
 *
 * Allowlisted contexts (won't be flagged for missing price):
 *   - The service's own page (it sets the canonical price)
 *   - /admin/, /brand/og/preview.html — internal/OG surfaces
 *   - llms.txt, sitemap.xml, RSS — non-marketing surfaces
 *   - The nav/footer partials (would over-flag every page)
 *   - Breadcrumbs that link to the service via a short label
 *
 * Usage:
 *   node scripts/check-pricing-consistency.mjs
 *   node scripts/check-pricing-consistency.mjs --check  # alias
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const PRICING = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data', 'services-pricing.json'), 'utf8')
);
const SERVICES = PRICING.services;

// Services sunset (Phase 9, 2026-06-11): the productized-services
// business is retired — data/services-pricing.json stays as the
// historical price record (stamped _retired). With the service pages
// gone there is nothing to keep consistent; pass with a notice so
// the gate self-revives if a service page ever reappears.
const anyServicePageExists = SERVICES.some((svc) =>
  svc.page && !svc.page.includes('#') &&
  fs.existsSync(path.join(repoRoot, svc.page.replace(/^\//, ''), 'index.html')));
if (PRICING._retired && !anyServicePageExists) {
  console.log('check-pricing-consistency: services retired (data/services-pricing.json#_retired) and no service pages on disk — skipped.');
  process.exit(0);
}

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts', 'data',
]);

// File-level allowlist. Pages here can link to a service without
// having to repeat its price (because they're either the service
// page itself, an admin tool, an internal preview, or a content-
// agnostic surface like the sitemap).
const FILE_ALLOWLIST = new Set([
  'admin/window/index.html',
  'admin/kpis/index.html',
  'admin/submissions/index.html',
  'es/admin/window/index.html',
  'es/admin/kpis/index.html',
  'brand/og/preview.html',
  'sitemap.xml',
]);

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || SKIP_DIRS.has(e.name)) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

const issues = [];
let scanned = 0;
let linkers  = 0;

for (const file of listHtml(repoRoot)) {
  scanned++;
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  if (FILE_ALLOWLIST.has(rel)) continue;
  const src = fs.readFileSync(file, 'utf8');

  for (const svc of SERVICES) {
    // Match the service's own page or its ES counterpart.
    const isOwnPage = (rel === svc.page.replace(/^\//, '').replace(/\/$/, '/index.html'))
                   || (rel === svc.es_page.replace(/^\//, '').replace(/\/$/, '/index.html'));
    if (isOwnPage) continue;

    // Skip services whose `page` is a fragment-link (no standalone page yet).
    if (svc.page.includes('#')) continue;

    // Does this page LINK to the service?
    const linksToService = src.includes(`href="${svc.page}"`)
                        || src.includes(`href="${svc.es_page}"`);
    if (!linksToService) continue;

    // It links — does it mention any accepted form of the price?
    const variants = svc.price_variants && svc.price_variants.length ? svc.price_variants : [svc.price];
    const mentionsPrice = variants.some((v) => src.includes(v));

    if (!mentionsPrice) {
      issues.push(`${rel}: links to ${svc.page} (${svc.name}) but never mentions canonical price (${variants.join(' / ')})`);
    } else {
      linkers++;
    }
  }
}

// Warn-only during initial rollout: surface every drift on each
// run so the urgency builds, but don't fail CI yet — there's a small
// backlog (~11 pages) of inline service links that don't carry the
// price by current convention. Promote to fail-CI in a follow-up
// sprint once the backlog is worked off.
const STRICT = process.argv.includes('--strict');

if (issues.length) {
  const tag = STRICT ? '✗' : '⚠';
  const heading = STRICT
    ? `Pricing consistency: ${issues.length} drift(s) across ${scanned} HTML page(s):`
    : `Pricing consistency (warning): ${issues.length} drift(s) across ${scanned} HTML page(s):`;
  console.error(heading + '\n');
  for (const i of issues.slice(0, 25)) console.error(`  ${tag} ${i}`);
  if (issues.length > 25) console.error(`  …and ${issues.length - 25} more`);
  console.error(`\nFix: either update the page to use the canonical price from data/services-pricing.json,`);
  console.error(`     or remove the link if the page no longer needs to reference the service.`);
  console.error(STRICT
    ? ''
    : `(warn-only during rollout — pass --strict to fail CI)`);
  if (STRICT) process.exit(1);
} else {
  console.log(`Pricing consistency: ${scanned} HTML page(s) scanned; ${linkers} service link(s) carry the canonical price.`);
}
