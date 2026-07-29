#!/usr/bin/env node
/**
 * check-document-structure.mjs — one document per page.
 *
 * Found 2026-07-28 while chasing an axe `region` / duplicate-`contentinfo`
 * failure on /sheets/waste-log/: sixteen built sheet pages ship TWO complete
 * document endings. The file reads:
 *
 *   …<script src="/assets/js/glossary.js" defer></script>
 *   </body>
 *   </html>
 *    + (Math.round(v * 100) / 100).toFixed(2); }      <-- orphaned JS, unwrapped
 *   …more markup, a SECOND <footer>, more scripts…
 *   </body>
 *   </html>
 *
 * A <script> block was split in half: everything after the premature
 * </body></html> spills into the document as text/markup. The browser closes
 * the document at the first </html> and then hoists the remainder back into
 * <body>, so the rendered DOM ends up with:
 *
 *   - TWO top-level <footer> elements  -> duplicate `contentinfo` landmark
 *   - six blocks (mm-actions, mm-save, sheet-keyboard-hint, 2x mm-card,
 *     sheet-knit) sitting OUTSIDE <main> -> axe `region` violations
 *
 * Verified in the real DOM, not inferred from the source: body children on
 * waste-log are
 *   … MAIN FOOTER SCRIPT×6 DIV.mm-actions DIV.mm-save P.sheet-keyboard-hint
 *     ARTICLE.mm-card ARTICLE.mm-card SECTION.sheet-knit P FOOTER SCRIPT×6
 *
 * This guard makes that class of corruption loud. It counts </body> and
 * </html> with <script>/<style> BODIES MASKED OUT first — the sheets' export
 * feature legitimately builds an HTML document inside JS, and those string
 * literals are not page structure. (Counting them naively reports
 * tools/plate-cost/ as broken when it is fine.)
 *
 * The sixteen already-corrupt pages are waived with a dated note so this gate
 * can land green and still block NEW corruption. Removing a slug from
 * KNOWN_BROKEN once its page is repaired is the intended cleanup path.
 *
 *   node scripts/check-document-structure.mjs
 *   node scripts/check-document-structure.mjs --check   # alias
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// Pre-existing corruption, measured 2026-07-28. These pages already ship a
// duplicated document tail; the repair (finding the injector that splits the
// inline sheet script) is tracked separately. Do NOT add to this list to make
// a new failure go away — fix the page.
const KNOWN_BROKEN = new Set([
  'sheets/daily-sales-recap/index.html',
  'sheets/daypart-traffic-map/index.html',
  'sheets/monthly-pnl-snapshot/index.html',
  'sheets/recipe-cost-card/index.html',
  'sheets/reservation-no-show-log/index.html',
  'sheets/third-party-channel-pnl/index.html',
  'sheets/waste-log/index.html',
  'sheets/weekly-prime-cost-worksheet/index.html',
  'es/sheets/daily-sales-recap/index.html',
  'es/sheets/daypart-traffic-map/index.html',
  'es/sheets/monthly-pnl-snapshot/index.html',
  'es/sheets/recipe-cost-card/index.html',
  'es/sheets/reservation-no-show-log/index.html',
  'es/sheets/third-party-channel-pnl/index.html',
  'es/sheets/waste-log/index.html',
  'es/sheets/weekly-prime-cost-worksheet/index.html',
]);

const SKIP_DIRS = new Set(['node_modules', '.git', '.wrangler', 'dist', 'docs', 'scripts', 'src', 'tests', 'brand']);

function collect(dir, out = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e.name)) continue;
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) collect(fp, out);
    else if (e.name.endsWith('.html')) out.push(fp);
  }
  return out;
}

// Mask script/style BODIES: a page may legitimately contain "</body></html>"
// inside JS that builds an export document. Only real page structure counts.
function maskEmbedded(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, (m) => ' '.repeat(m.length))
    .replace(/<style\b[\s\S]*?<\/style>/gi, (m) => ' '.repeat(m.length));
}

const problems = [];
const waivedStillBroken = [];

for (const file of collect(repoRoot)) {
  const rel = path.relative(repoRoot, file).split(path.sep).join('/');
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch { continue; }
  const masked = maskEmbedded(html);
  const bodies = (masked.match(/<\/body>/gi) || []).length;
  const htmls = (masked.match(/<\/html>/gi) || []).length;
  if (bodies <= 1 && htmls <= 1) continue;
  if (KNOWN_BROKEN.has(rel)) { waivedStillBroken.push(rel); continue; }
  problems.push(`${rel}: ${bodies} </body> + ${htmls} </html> — content after the document end is hoisted into <body>, duplicating landmarks`);
}

if (problems.length) {
  console.error(`✗ Document structure: ${problems.length} page(s) ship more than one document:`);
  for (const p of problems) console.error(`  - ${p}`);
  console.error('  A page must have exactly one </body> and one </html> outside <script>/<style>.');
  process.exit(1);
}

const stale = [...KNOWN_BROKEN].filter((k) => !waivedStillBroken.includes(k));
if (stale.length) {
  console.log(`document structure: OK — ${waivedStillBroken.length} known-broken page(s) waived; ${stale.length} waiver(s) now stale and can be removed from KNOWN_BROKEN.`);
} else {
  console.log(`document structure: OK — one document per page (${waivedStillBroken.length} known-broken page(s) still waived, tracked for repair).`);
}
