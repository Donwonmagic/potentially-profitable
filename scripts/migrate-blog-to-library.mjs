#!/usr/bin/env node
// Phase 7 — one-shot migration: move evergreen blog posts into /library/.
//
// What it does, per entry in MIGRATIONS:
//   1. git mv <source>/ <target>/  (audio files come along)
//   2. Rewrite the moved index.html:
//        - canonical / og:url / JSON-LD @id / url / mainEntityOfPage
//        - AudioObject contentUrl
//        - in-body /blog/<old>/ self-references → /library/<new>/
//        - breadcrumb label: "Blog" → "Library"
//   3. Re-key data files (article-audio.json, library-tags.json,
//      post-end-cta.json) so the new slug owns what the old one had.
//
// Merges are intentionally NOT handled here — those need content
// combination, which is Wave 5 work. The 7 merge-source posts stay in
// /blog/ until Wave 5 deletes them, with the Wave-1 _redirects already
// pointing at their (yet-to-exist) merged library targets.
//
// Usage:
//   node scripts/migrate-blog-to-library.mjs --locale en --dry-run
//   node scripts/migrate-blog-to-library.mjs --locale en --apply
//   node scripts/migrate-blog-to-library.mjs --locale es --apply

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');

const SITE = 'https://muntin.digital';

const args = new Set(process.argv.slice(2));
const dryRun = !args.has('--apply');
const localeArg = process.argv.find(a => a.startsWith('--locale='))?.slice(9)
  || (args.has('--locale') ? process.argv[process.argv.indexOf('--locale') + 1] : 'en');

// Migration roster — Wave 4. Merges are excluded (deferred to Wave 5).
const EN_MIGRATIONS = [
  // Kept-slug moves
  { from: 'can-chatgpt-write-your-restaurant-website',                       to: 'can-chatgpt-write-your-restaurant-website',                  type: 'kept' },
  { from: 'does-my-restaurant-need-a-website',                               to: 'does-my-restaurant-need-a-website',                          type: 'kept' },
  { from: 'how-to-get-cited-in-google-ai-overviews-restaurant',              to: 'how-to-get-cited-in-google-ai-overviews-restaurant',         type: 'kept' },
  { from: 'how-to-get-more-google-reviews-for-your-restaurant',              to: 'how-to-get-more-google-reviews-for-your-restaurant',         type: 'kept' },
  { from: 'how-to-raise-restaurant-menu-prices-without-losing-reservations', to: 'how-to-raise-restaurant-menu-prices-without-losing-reservations', type: 'kept' },
  { from: 'how-to-read-restaurant-google-search-console',                    to: 'how-to-read-restaurant-google-search-console',               type: 'kept' },
  { from: 'how-to-set-up-google-business-profile-for-your-restaurant',       to: 'how-to-set-up-google-business-profile-for-your-restaurant',  type: 'kept' },
  { from: 'how-to-tell-if-a-restaurant-tool-is-safe',                        to: 'how-to-tell-if-a-restaurant-tool-is-safe',                   type: 'kept' },
  { from: 'my-restaurant-isnt-on-google-maps-10-minute-diagnostic',          to: 'my-restaurant-isnt-on-google-maps-10-minute-diagnostic',     type: 'kept' },
  { from: 'restaurant-photo-spec-sheet',                                     to: 'restaurant-photo-spec-sheet',                                type: 'kept' },
  { from: 'toast-vs-square-vs-clover-for-restaurants',                       to: 'toast-vs-square-vs-clover-for-restaurants',                  type: 'kept' },
  { from: 'what-should-be-on-a-restaurant-website',                          to: 'what-should-be-on-a-restaurant-website',                     type: 'kept' },
  { from: 'when-to-rebuild-your-restaurant-website',                         to: 'when-to-rebuild-your-restaurant-website',                    type: 'kept' },
  { from: 'wix-vs-custom-for-restaurants',                                   to: 'wix-vs-custom-for-restaurants',                              type: 'kept' },
  // Rename moves (de-timed)
  { from: 'how-much-does-a-custom-restaurant-website-cost-in-2026',          to: 'custom-restaurant-website-pricing',                          type: 'rename' },
  { from: 'uber-eats-vs-doordash-vs-grubhub-restaurant-math-2026',           to: 'third-party-delivery-comparison',                            type: 'rename' },
  { from: 'service-charges-vs-tipping-restaurant-operator-math-2026',        to: 'service-charge-vs-tipping-model',                            type: 'rename' },
  { from: 'how-to-respond-to-google-reviews-restaurant-playbook-2026',       to: 'google-review-response-playbook',                            type: 'rename' },
  { from: 'loyalty-programs-for-independent-restaurants-what-works-2026',    to: 'loyalty-program-roi',                                        type: 'rename' },
  { from: 'should-your-restaurant-have-an-app-in-2026',                      to: 'restaurant-app-decision',                                    type: 'rename' },
  { from: 'google-ai-mode-reservation-booking-restaurant-2026',              to: 'ai-mode-reservation-strategy',                               type: 'rename' },
];

// Wave 4b — ES native-slug moves. Both groups preserve the ES slug
// in the move; ES slug de-timing (stripping -2026 suffixes) is a
// content/translation decision deferred until review.
// Group A: kept-slug ES posts where the EN counterpart was also a
//          kept-slug move (e.g. EN how-to-tell-... ↔ ES como-saber-...).
// Group B: ES posts where the EN counterpart was a de-timed rename,
//          but the ES slug remains as-is. Pairing: EN library/<new-en>
//          ↔ ES library/<es-slug-with-2026>. Visual inconsistency
//          accepted; ES URLs preserve SEO identity.
// Merges are not included; ES merge targets are content decisions
// deferred to Wave 5.
const ES_MIGRATIONS = [
  // Group A
  { from: 'como-hacer-sitio-web-para-mi-restaurante',                  to: 'como-hacer-sitio-web-para-mi-restaurante',                  type: 'kept' },
  { from: 'como-lograr-que-google-cite-tu-restaurante-en-ai-overview', to: 'como-lograr-que-google-cite-tu-restaurante-en-ai-overview', type: 'kept' },
  { from: 'como-leer-google-search-console-de-tu-restaurante',         to: 'como-leer-google-search-console-de-tu-restaurante',         type: 'kept' },
  { from: 'como-saber-si-una-herramienta-de-restaurante-es-segura',    to: 'como-saber-si-una-herramienta-de-restaurante-es-segura',    type: 'kept' },
  { from: 'cuando-rehacer-tu-sitio-web-de-restaurante',                to: 'cuando-rehacer-tu-sitio-web-de-restaurante',                type: 'kept' },
  { from: 'especificaciones-de-fotos-para-restaurantes',               to: 'especificaciones-de-fotos-para-restaurantes',               type: 'kept' },
  { from: 'mi-restaurante-no-aparece-en-google-maps',                  to: 'mi-restaurante-no-aparece-en-google-maps',                  type: 'kept' },
  // Group B (ES of EN-renamed posts; ES slug preserved as-is)
  { from: 'cuanto-cuesta-una-pagina-web-para-restaurante-2026',                        to: 'cuanto-cuesta-una-pagina-web-para-restaurante-2026',                        type: 'kept' },
  { from: 'uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026',            to: 'uber-eats-vs-doordash-vs-grubhub-cuentas-para-restaurante-2026',            type: 'kept' },
  { from: 'cargos-por-servicio-vs-propina-cuentas-para-operador-restaurante-2026',     to: 'cargos-por-servicio-vs-propina-cuentas-para-operador-restaurante-2026',     type: 'kept' },
  { from: 'como-responder-resenas-google-restaurante-playbook-2026',                   to: 'como-responder-resenas-google-restaurante-playbook-2026',                   type: 'kept' },
  { from: 'programas-de-lealtad-para-restaurantes-independientes-2026',                to: 'programas-de-lealtad-para-restaurantes-independientes-2026',                type: 'kept' },
  { from: 'reserva-en-google-ai-mode-restaurante-2026',                                to: 'reserva-en-google-ai-mode-restaurante-2026',                                type: 'kept' },
];

const MIGRATIONS = localeArg === 'es' ? ES_MIGRATIONS : EN_MIGRATIONS;
const sourceDir  = localeArg === 'es' ? 'es/blog' : 'blog';
const targetDir  = localeArg === 'es' ? 'es/library' : 'library';
const urlPrefixOld = `${SITE}${localeArg === 'es' ? '/es' : ''}/blog/`;
const urlPrefixNew = `${SITE}${localeArg === 'es' ? '/es' : ''}/library/`;
const pathPrefixOld = `${localeArg === 'es' ? '/es' : ''}/blog/`;
const pathPrefixNew = `${localeArg === 'es' ? '/es' : ''}/library/`;

function rewriteHtml(html, { from, to }) {
  let out = html;
  let count = 0;

  // 1. Absolute URLs — canonical, og:url, JSON-LD @id, url,
  //    mainEntityOfPage, AudioObject contentUrl, hreflang self-link.
  const absOld = `${urlPrefixOld}${from}/`;
  const absNew = `${urlPrefixNew}${to}/`;
  const before1 = out.length;
  out = out.split(absOld).join(absNew);
  if (out.length !== before1) count += (before1 - out.length === 0 ? 0 : Math.abs(before1 - out.length));

  // Count occurrences via regex tally for the report.
  const occAbs = (html.match(new RegExp(escapeRegex(absOld), 'g')) || []).length;

  // 2. Self-referential absolute URL without trailing slash
  //    (e.g., "url": ".../slug" without /).
  const absOldNoSlash = `${urlPrefixOld}${from}`;
  const absNewNoSlash = `${urlPrefixNew}${to}`;
  // Only replace when not followed by /, to avoid double-replacing the
  // already-handled trailing-slash case.
  const re2 = new RegExp(escapeRegex(absOldNoSlash) + '(?!/)', 'g');
  const occAbsNoSlash = (out.match(re2) || []).length;
  out = out.replace(re2, absNewNoSlash);

  // 3. Path-only self-references (href="/blog/<old>/...")
  const pathOld = `${pathPrefixOld}${from}/`;
  const pathNew = `${pathPrefixNew}${to}/`;
  const occPath = (out.match(new RegExp(escapeRegex(pathOld), 'g')) || []).length;
  out = out.split(pathOld).join(pathNew);

  // 4. Breadcrumb label — only on the library side. The exact pattern
  //    is the visual breadcrumb link to /blog/ with label "Blog".
  //    Footer link to /blog/ stays untouched (intentional: it's a site
  //    nav element pointing AT the blog, not a per-post breadcrumb).
  const bcOld = '<a href="/blog/">Blog</a>';
  const bcNew = '<a href="/library/">Library</a>';
  // ES breadcrumb uses Spanish label.
  const esBcOld = '<a href="/es/blog/">Blog</a>';
  const esBcNew = '<a href="/es/library/">Biblioteca</a>';
  let occBc = 0;
  if (out.includes(bcOld)) {
    occBc += (out.match(new RegExp(escapeRegex(bcOld), 'g')) || []).length;
    out = out.split(bcOld).join(bcNew);
  }
  if (out.includes(esBcOld)) {
    occBc += (out.match(new RegExp(escapeRegex(esBcOld), 'g')) || []).length;
    out = out.split(esBcOld).join(esBcNew);
  }

  return { html: out, stats: { absUrl: occAbs, absUrlNoSlash: occAbsNoSlash, pathOnly: occPath, breadcrumb: occBc } };
}

function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function gitMv(src, dst) {
  if (dryRun) {
    console.log(`  [dry] git mv ${src} ${dst}`);
    return;
  }
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  execSync(`git mv "${src}" "${dst}"`, { cwd: repoRoot, stdio: 'pipe' });
}

function updateAudioManifest(migrations) {
  const file = path.join(repoRoot, 'data/article-audio.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const srcKey = localeArg === 'es' ? 'es-blog' : 'blog';
  const dstKey = localeArg === 'es' ? 'es-library' : 'library';
  if (!json[srcKey]) return { moved: 0, missing: [] };
  if (!json[dstKey]) json[dstKey] = {};
  let moved = 0;
  const missing = [];
  for (const m of migrations) {
    if (json[srcKey][m.from]) {
      json[dstKey][m.to] = json[srcKey][m.from];
      delete json[srcKey][m.from];
      moved++;
    } else {
      missing.push(m.from);
    }
  }
  if (!dryRun) {
    // Preserve formatting: re-stringify with 2-space indent, trailing newline.
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  }
  return { moved, missing };
}

function updateLibraryTags(migrations) {
  const file = path.join(repoRoot, 'data/library-tags.json');
  if (!fs.existsSync(file)) return { moved: 0 };
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!json.blog_posts) return { moved: 0 };
  let moved = 0;
  for (const m of migrations) {
    // Only EN library-tags exists; ES tags are derived elsewhere.
    if (localeArg !== 'en') continue;
    if (json.blog_posts[m.from]) {
      json.blog_posts[m.to] = json.blog_posts[m.from];
      // Add a flag so /learn/topics/ aggregators can distinguish
      // library entries (no date stamp on display) from blog entries.
      if (!json.blog_posts[m.to].namespace) {
        json.blog_posts[m.to].namespace = 'library';
      }
      if (m.from !== m.to) delete json.blog_posts[m.from];
      moved++;
    }
  }
  if (!dryRun) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  }
  return { moved };
}

function updatePostEndCta(migrations) {
  // Schema: data/post-end-cta.json keys CTA entries by raw slug. For
  // renamed posts the key needs updating; kept-slug posts need no edit.
  // (The inject script already prefers library/ over blog/ for the post
  // location, so URLs come out right at render time regardless.)
  const file = path.join(repoRoot, 'data/post-end-cta.json');
  if (!fs.existsSync(file)) return { renamed: 0 };
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!json.posts) return { renamed: 0 };
  let renamed = 0;
  for (const m of migrations) {
    if (m.from === m.to) continue; // kept-slug: no key change
    if (json.posts[m.from]) {
      json.posts[m.to] = json.posts[m.from];
      delete json.posts[m.from];
      renamed++;
    }
  }
  if (!dryRun && renamed > 0) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  }
  return { renamed };
}

function updateI18nSlugMap(migrations) {
  if (localeArg !== 'en') return { moved: 0 };
  const file = path.join(repoRoot, 'data/i18n-slug-map.json');
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  // Add a 'library' namespace mirroring 'blog'. Move EN→ES mappings
  // for posts that have moved out of /blog/.
  if (!json.library) json.library = {};
  let moved = 0;
  for (const m of migrations) {
    if (json.blog && json.blog[m.from]) {
      json.library[m.to] = json.blog[m.from];
      delete json.blog[m.from];
      moved++;
    }
  }
  if (!dryRun && moved > 0) {
    fs.writeFileSync(file, JSON.stringify(json, null, 2) + '\n');
  }
  return { moved };
}

function rewriteCrossReferences(migrations) {
  // After per-post moves, scan the whole repo for /blog/<old>/ → /library/<new>/
  // to eliminate 301-hops on internal links. Touches .html / .json / .xml / .txt
  // outside scripts/, .git/, node_modules/, dist/.
  //
  // For EN runs: path patterns use a negative lookbehind so the literal
  // "/blog/foo/" inside "/es/blog/foo/" does NOT match — ES paths have
  // their own (different) slug mapping and must not be rewritten by the
  // EN pass. Absolute URLs already namespace-themselves via the protocol
  // prefix so they can use plain substring replacement.
  const SKIP_DIRS = new Set(['.git', 'node_modules', 'dist', '.wrangler', '.venv', '__pycache__']);
  // Build replacement table once. Path replacements are regex with
  // anchor; absolute-URL replacements are plain string.
  const pathReplacements = [];
  const stringReplacements = [];
  for (const m of migrations) {
    if (localeArg === 'es') {
      // ES: path pattern is /es/blog/<old>/ — already specific enough,
      // plain substring is fine.
      stringReplacements.push([`${pathPrefixOld}${m.from}/`, `${pathPrefixNew}${m.to}/`]);
    } else {
      // EN: anchor /blog/ so it doesn't match within /es/blog/.
      const re = new RegExp(`(?<!\\/es)\\/blog\\/${escapeRegex(m.from)}\\/`, 'g');
      const repl = `/library/${m.to}/`;
      pathReplacements.push([re, repl]);
    }
    stringReplacements.push([`${urlPrefixOld}${m.from}/`, `${urlPrefixNew}${m.to}/`]);
  }
  let filesTouched = 0;
  let refsRewritten = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.') && entry.name !== '.well-known') continue;
      if (SKIP_DIRS.has(entry.name)) continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!/\.(html|json|xml|txt|jsonc)$/.test(entry.name)) continue;
      if (path.relative(repoRoot, full) === '_redirects') continue;
      let txt = fs.readFileSync(full, 'utf8');
      const before = txt;
      for (const [oldS, newS] of stringReplacements) {
        if (txt.includes(oldS)) {
          const n = txt.split(oldS).length - 1;
          refsRewritten += n;
          txt = txt.split(oldS).join(newS);
        }
      }
      for (const [re, repl] of pathReplacements) {
        const matches = txt.match(re);
        if (matches) {
          refsRewritten += matches.length;
          txt = txt.replace(re, repl);
        }
      }
      if (txt !== before) {
        filesTouched++;
        if (!dryRun) fs.writeFileSync(full, txt);
      }
    }
  };
  walk(repoRoot);
  return { filesTouched, refsRewritten };
}

// ---- main ----
console.log(`\nmigrate-blog-to-library: locale=${localeArg}, mode=${dryRun ? 'DRY-RUN' : 'APPLY'}`);
console.log(`source: ${sourceDir}/  →  target: ${targetDir}/`);
console.log(`migrations: ${MIGRATIONS.length}\n`);

const summary = { moved: 0, skipped: 0, errors: 0, edits: { absUrl: 0, absUrlNoSlash: 0, pathOnly: 0, breadcrumb: 0 } };

for (const m of MIGRATIONS) {
  const src = path.join(repoRoot, sourceDir, m.from);
  const dst = path.join(repoRoot, targetDir, m.to);

  if (!fs.existsSync(src)) {
    console.log(`SKIP ${sourceDir}/${m.from} (does not exist)`);
    summary.skipped++;
    continue;
  }
  if (fs.existsSync(dst)) {
    console.log(`ERROR ${targetDir}/${m.to} already exists — refusing to overwrite`);
    summary.errors++;
    continue;
  }

  // 1. Move directory.
  gitMv(src, dst);

  // 2. Rewrite the moved (or to-be-moved) index.html. In dry-run mode
  //    read from the source path; in apply mode read from destination.
  const indexPath = path.join(dryRun ? src : dst, 'index.html');
  if (!fs.existsSync(indexPath)) {
    console.log(`WARN  no index.html at ${path.relative(repoRoot, indexPath)} — skipping rewrite`);
    summary.moved++;
    continue;
  }
  const original = fs.readFileSync(indexPath, 'utf8');
  const { html: rewritten, stats } = rewriteHtml(original, m);
  summary.edits.absUrl        += stats.absUrl;
  summary.edits.absUrlNoSlash += stats.absUrlNoSlash;
  summary.edits.pathOnly      += stats.pathOnly;
  summary.edits.breadcrumb    += stats.breadcrumb;

  if (!dryRun && rewritten !== original) {
    fs.writeFileSync(indexPath, rewritten);
  }
  const label = m.from === m.to ? m.from : `${m.from} → ${m.to}`;
  console.log(`MOVE  ${label}  [absUrl×${stats.absUrl}, abs-no-slash×${stats.absUrlNoSlash}, path×${stats.pathOnly}, bc×${stats.breadcrumb}]`);
  summary.moved++;
}

console.log(`\nupdating data files…`);
const audioRes = updateAudioManifest(MIGRATIONS);
console.log(`  article-audio.json:  moved ${audioRes.moved} entries${audioRes.missing.length ? `, missing in source: ${audioRes.missing.join(', ')}` : ''}`);
const tagsRes  = updateLibraryTags(MIGRATIONS);
console.log(`  library-tags.json:   moved ${tagsRes.moved} entries`);
const ctaRes   = updatePostEndCta(MIGRATIONS);
console.log(`  post-end-cta.json:   ${ctaRes.renamed} slug keys renamed (kept-slug posts unchanged)`);
const slugMap  = updateI18nSlugMap(MIGRATIONS);
console.log(`  i18n-slug-map.json:  moved ${slugMap.moved} entries`);

console.log(`\nrewriting cross-references across .html/.json/.xml/.txt …`);
const crossRefs = rewriteCrossReferences(MIGRATIONS);
console.log(`  ${crossRefs.refsRewritten} link refs rewritten across ${crossRefs.filesTouched} files`);

console.log(`\nsummary: ${summary.moved} moved, ${summary.skipped} skipped, ${summary.errors} errors`);
console.log(`         edits: absUrl=${summary.edits.absUrl}, abs-no-slash=${summary.edits.absUrlNoSlash}, path=${summary.edits.pathOnly}, breadcrumb=${summary.edits.breadcrumb}`);

if (dryRun) {
  console.log(`\n(dry run — no changes written. Re-run with --apply to commit.)`);
}
