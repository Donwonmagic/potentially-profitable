#!/usr/bin/env node
/**
 * One-off (2026-06-06): fix self-slug language-toggle hrefs on library
 * pages whose EN and ES slugs differ.
 *
 * Bug: build-library.mjs emitted the page's OWN slug under the OTHER
 * locale's root in the three language-toggle anchors. The
 * .js-lang-switch handler in assets/site.js only writes a locale cookie
 * — it does NOT rewrite the URL — so the href IS the navigation. For
 * divergent-slug pairs the toggle therefore 404s:
 *   - ES page -> EN toggle: href="/library/<es-slug>/"  (no such EN page)
 *   - EN page -> ES toggle: href="/es/library/<en-slug>/" (no such ES page)
 *
 * Fix (deterministic, from data/i18n-slug-map.json's library map only):
 *   - On es/library/<es>/index.html, rewrite href="/library/<es>/"
 *       -> href="/library/<en>/"      (reverse-lookup en from es)
 *   - On library/<en>/index.html,    rewrite href="/es/library/<en>/"
 *       -> href="/es/library/<es>/"
 * Only exact self-slug matches inside .js-lang-switch anchors are
 * touched. Same-slug pairs are skipped (their toggles are already
 * correct). build-library.mjs regenerates these toggles from the slug
 * map and is NOT idempotency-checked in check-all, so a targeted fix is
 * safe.
 *
 *   node scripts/fix-library-lang-toggles.mjs          # rewrite
 *   node scripts/fix-library-lang-toggles.mjs --check  # exit 1 on any pending change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const map = JSON.parse(
  fs.readFileSync(path.join(repoRoot, 'data', 'i18n-slug-map.json'), 'utf8')
).library || {};

let totalAnchors = 0;
let filesChanged = 0;
const report = [];

// Replace href="<from>" with href="<to>" ONLY when the anchor also
// carries class containing js-lang-switch. We match the whole anchor
// open tag so we never rewrite a body link that happens to share the
// path. The self-slug href appears verbatim in the toggle anchors.
function rewriteToggleHref(src, fromHref, toHref) {
  let count = 0;
  // Match <a ...>...</a> open tags only (up to the first >). Require the
  // exact href and the js-lang-switch class somewhere in the same tag.
  const anchorRe = /<a\b[^>]*>/gi;
  const next = src.replace(anchorRe, (tag) => {
    if (!/\bjs-lang-switch\b/.test(tag)) return tag;
    if (!tag.includes(`href="${fromHref}"`)) return tag;
    count++;
    return tag.replace(`href="${fromHref}"`, `href="${toHref}"`);
  });
  return { next, count };
}

for (const [enSlug, esSlug] of Object.entries(map)) {
  if (enSlug === esSlug) continue; // same-slug pairs already correct

  // --- ES page: EN toggle href /library/<es>/ -> /library/<en>/ ---
  {
    const file = path.join(repoRoot, 'es', 'library', esSlug, 'index.html');
    if (fs.existsSync(file)) {
      const src = fs.readFileSync(file, 'utf8');
      const { next, count } = rewriteToggleHref(src, `/library/${esSlug}/`, `/library/${enSlug}/`);
      if (count > 0) {
        if (!checkOnly) fs.writeFileSync(file, next);
        totalAnchors += count;
        filesChanged++;
        report.push(`es/library/${esSlug}/index.html: ${count} anchor(s) -> /library/${enSlug}/`);
      }
    }
  }

  // --- EN page: ES toggle href /es/library/<en>/ -> /es/library/<es>/ ---
  {
    const file = path.join(repoRoot, 'library', enSlug, 'index.html');
    if (fs.existsSync(file)) {
      const src = fs.readFileSync(file, 'utf8');
      const { next, count } = rewriteToggleHref(src, `/es/library/${enSlug}/`, `/es/library/${esSlug}/`);
      if (count > 0) {
        if (!checkOnly) fs.writeFileSync(file, next);
        totalAnchors += count;
        filesChanged++;
        report.push(`library/${enSlug}/index.html: ${count} anchor(s) -> /es/library/${esSlug}/`);
      }
    }
  }
}

for (const r of report) console.log((checkOnly ? 'would fix: ' : 'fixed: ') + r);
console.log(`\n${checkOnly ? 'would fix' : 'fixed'} ${totalAnchors} toggle anchor(s) across ${filesChanged} file(s).`);
if (checkOnly && totalAnchors > 0) process.exit(1);
