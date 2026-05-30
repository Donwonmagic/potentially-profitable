#!/usr/bin/env node
/**
 * Phase 4 perf — kill the blue link-color flash.
 *
 * Inline critical CSS in every HTML page covers tokens, body baseline,
 * .container, .skip-link, and nav min-height — but NOT link color.
 * Without an `a{color:inherit}` rule, every <a> tag in the unstyled
 * pre-shell render uses the browser default link color (#0000EE blue).
 * Inline SVGs that use `stroke="currentColor"` inherit that blue,
 * producing a visible blue-icon flash before site-core.css applies.
 *
 * Most visible: the envelope SVG inside the "Email Don" CTA in the nav
 * (mobile + desktop). Reported May 2026 as "blue icons flash on screen."
 *
 * This script appends `a{color:inherit}` to the critical-CSS block on
 * every HTML page that has one. Idempotent — re-runs are no-ops.
 *
 * Run after page generators emit new pages and before
 * inject-css-cache-bust.
 *
 *   node scripts/inject-critical-link-color.mjs
 *   node scripts/inject-critical-link-color.mjs --check   # exit 1 if any page would change
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const REPO       = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '.git', 'node_modules', '.wrangler', 'dist', 'docs',
]);

function walk(dir, out = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, out);
    else if (ent.isFile() && full.endsWith('.html')) out.push(full);
  }
  return out;
}

// Critical-CSS rules. Inserted right before `header.nav{min-height:64px}`
// (the existing tail of every page's inline <style>). All three together
// guarantee that the visible above-the-fold UI — body color, link color,
// and the .btn / .btn-primary nav CTA — is correctly shaped at first
// paint, regardless of whether site-core.css's preload+swap fires
// quickly or at all (Opera private-mode and aggressive ad blockers
// have been observed dropping the swap).
const RULES = [
  // <a> color inheritance — kills the brief blue-link flash on inline
  // SVGs that use stroke=currentColor (envelope, search, hamburger).
  'a{color:inherit}',
  // .btn base — the pill shape, padding, inline-flex layout, and
  // text-decoration:none. Without this, an <a class="btn"> renders as
  // a default underlined link and stacks its inline SVG below the text.
  '.btn{display:inline-flex;align-items:center;gap:10px;padding:15px 26px;border-radius:999px;font-weight:500;font-size:15px;text-decoration:none;white-space:nowrap;cursor:pointer}',
  // .btn-primary — filled ink + cream variant used by Email Don and
  // Run free audit. Background+color only; hover/focus styling lives
  // in site-core.css (cosmetic, not load-blocking).
  '.btn-primary{background:var(--ink);color:var(--cream)}',
  // .btn-ghost — outlined variant used by See pricing and other
  // secondary actions. --line-dark isn't declared in critical CSS so
  // hardcode the value here (#D7DAE0 = the current --line-dark token).
  '.btn-ghost{background:transparent;color:var(--ink);border:1px solid #D7DAE0}',
];
const SENTINEL = '/* injected by inject-critical-link-color.mjs */';

// Block to inject. The sentinel comment lets us match-and-replace any
// older partial injection (legacy `a{color:inherit}\nheader.nav` shape)
// with the full block, so re-runs reconcile shapes from previous deploys.
const BLOCK = SENTINEL + '\n' + RULES.join('\n') + '\n';

let touched = 0, scanned = 0;
const files = walk(REPO);
const ANCHOR = 'header.nav{min-height:64px}';
const LEGACY_LINE = 'a{color:inherit}';

for (const f of files) {
  scanned++;
  let html = fs.readFileSync(f, 'utf8');

  // Only operate on pages that already carry the critical-CSS block.
  if (!html.includes('Critical CSS — prevents flash')) continue;
  if (!html.includes(ANCHOR)) continue;

  // If the new sentinel + block is already in place, no-op.
  if (html.includes(SENTINEL) && RULES.every((r) => html.includes(r))) continue;

  // Strip the legacy `a{color:inherit}\n` line (if present) so we don't
  // leave a stale duplicate when re-inserting the full block.
  let next = html.replace(LEGACY_LINE + '\n', '');
  // Also strip any prior version of the new block (sentinel + rules).
  next = next.replace(
    new RegExp('\\s*' + SENTINEL.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + '[\\s\\S]*?(?=' + ANCHOR.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\$&') + ')', 'g'),
    ''
  );

  // Insert the canonical block right before the anchor.
  next = next.replace(ANCHOR, BLOCK + ANCHOR);

  if (next !== html) {
    if (!checkOnly) fs.writeFileSync(f, next);
    touched++;
  }
}

console.log(
  `${checkOnly ? 'would touch' : 'touched'} ${touched} of ${scanned} HTML file(s) ` +
  `(critical-CSS block: link-color + .btn shape)`
);
if (checkOnly && touched > 0) process.exit(1);
process.exit(0);
