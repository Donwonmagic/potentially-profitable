#!/usr/bin/env node
// Sync the canonical nav + footer from _includes/ into every HTML page.
//
// Single source of truth lives in _includes/nav.html and _includes/footer.html.
// This script finds the nav block and the site footer block in every .html
// file under the repo and replaces them with the partial content. Run after
// editing either partial, and during the deploy build so a stale page can't
// ship.
//
// Zero dependencies. POSIX Node only.
//
//   node scripts/sync-includes.mjs           # rewrites all pages in place
//   node scripts/sync-includes.mjs --check   # exits non-zero if anything would change

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const SKIP_DIRS = new Set([
  '_includes', 'node_modules', '.git', '.github', 'dist', '.wrangler',
  'docs', 'src', 'brand', 'assets', 'scripts'
]);

// Locales the site ships. English is the default and lives at the repo
// root; non-default locales live under a top-level directory matching
// their code (e.g. es/about/index.html). Adding a locale is a matter of
// (1) creating _includes/<code>/nav.html + footer.html, (2) starting to
// populate <code>/... pages, and (3) appending the code here.
const LOCALES = ['en', 'es'];
const NON_DEFAULT_LOCALES = LOCALES.filter((l) => l !== 'en');

// The nav is shared across every page — sync it everywhere.
// The footer's "Free tools" column diverges on the tool-utility pages
// (/tools/compare/, /tools/speed-test/, etc.) which cross-link inside
// the tool ecosystem. Nav sync on these pages is still safe; footer
// sync is not. The self-selecting signal: main-funnel pages render the
// "Library" column with id="foot-learn"; tool-utility pages render a
// "Free tools" column with id="foot-tools" instead. Pages whose
// existing footer matches id="foot-learn" get the canonical footer
// synced; anything else (tool-utility footers, custom variants) is
// left alone.
const FOOTER_MAIN_FUNNEL_MARKER = 'id="foot-learn"';

// The nav block: <header class="nav" id="nav">...</header>.
// Single occurrence per page; anchored by the unique id.
const NAV_RE = /<header class="nav" id="nav">[\s\S]*?<\/header>/;

// The site footer: <footer> that contains <div class="foot-grid">,
// plus any trailing canonical script tags (first-touch, save-next-time,
// share-hydrate) that ship together with the footer template. Capturing
// the trailing scripts as part of the same block keeps re-syncs strictly
// idempotent — without them, each sync APPENDED another copy of the
// scripts onto the page, since the footer-internal regex couldn't reach
// them. Matching them as a (\s*<script ...>)* tail soaks up any duplicate
// copies introduced by prior buggy syncs and replaces the whole tail
// with the canonical version.
//
// The same applies to the Cloudflare Turnstile block at the end of
// footer.html (an HTML comment + a gated <script>). Without capturing
// it here, the original `<script src="https://…/turnstile/v0/api.js">`
// from the pre-Phase-3B unconditional load survived alongside the new
// gated loader on every sync — 417 pages were loading Turnstile twice
// and triggering a console warning on every dev/CI page load. Matching
// any trailing comment OR script that mentions "Turnstile" /
// "challenges.cloudflare" lets sync-includes replace the whole tail
// with whatever the partial currently emits, dedupping in one pass.
//
// Discriminator (foot-grid) keeps us from touching <footer> inside an
// article body (e.g. a blog byline footer), if one ever shows up.
const FOOTER_RE = /<footer>[\s\S]*?<div class="foot-grid">[\s\S]*?<\/footer>(?:\s*<script\s+src="\/assets\/js\/(?:first-touch|save-next-time|share-hydrate)\.js"\s+defer><\/script>)*(?:\s*(?:<!--[\s\S]*?(?:Turnstile|challenges\.cloudflare)[\s\S]*?-->|<script\b[^>]*>[\s\S]*?(?:Turnstile|challenges\.cloudflare)[\s\S]*?<\/script>|<script\s+src="https:\/\/challenges\.cloudflare\.com\/turnstile\/v0\/api\.js"[^>]*><\/script>))*/;

// Load one nav + footer partial per locale. English partials live at
// _includes/nav.html + _includes/footer.html (unchanged for backward
// compat); every other locale lives under _includes/<code>/. A missing
// non-default partial throws loudly at build start rather than silently
// stamping English into ES pages.
const navTemplates    = {};
const footerTemplates = {};
for (const locale of LOCALES) {
  const dir = locale === 'en' ? '_includes' : path.join('_includes', locale);
  navTemplates[locale]    = fs.readFileSync(path.join(repoRoot, dir, 'nav.html'),    'utf8').trimEnd();
  footerTemplates[locale] = fs.readFileSync(path.join(repoRoot, dir, 'footer.html'), 'utf8').trimEnd();
}

// Back-compat aliases: some scripts may still reference the singular
// names. Point them at the English partial (the historical default).
const navTemplate    = navTemplates.en;
const footerTemplate = footerTemplates.en;

// Per-locale JSON dictionaries for strings that are emitted by JS at
// runtime (nav toggle aria-labels, form validation messages, the audio
// player UI). English pages get an empty object — site.js falls back
// to the English literals baked into the code. Non-default locales
// get a minified JSON blob stamped into the nav partial via
// {{I18N_JSON}} so it's available to site.js without a separate
// network request.
const i18nDicts = { en: {} };
for (const locale of NON_DEFAULT_LOCALES) {
  const p = path.join(repoRoot, '_includes', `i18n.${locale}.json`);
  if (fs.existsSync(p)) {
    // Re-serialize via JSON.parse+JSON.stringify so a malformed
    // dictionary fails the build here rather than at runtime.
    i18nDicts[locale] = JSON.parse(fs.readFileSync(p, 'utf8'));
  } else {
    i18nDicts[locale] = {};
  }
}

function collectHtml(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('.')) continue;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      collectHtml(path.join(dir, entry.name), out);
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      out.push(path.join(dir, entry.name));
    }
  }
  return out;
}

// Normalize a POSIX-style path for the locale logic below. sync-includes
// runs on Linux (Cloudflare build containers + dev Macs), but guard
// against Windows backslashes anyway — cheap insurance.
function toPosix(p) { return p.split(path.sep).join('/'); }

// Detect which locale a page lives under purely from its path. English
// is the default — everything not under a known locale prefix counts
// as English, which keeps legacy pages working without rewrites.
function localeForPath(relPath) {
  const posix = toPosix(relPath);
  for (const l of NON_DEFAULT_LOCALES) {
    if (posix === `${l}/index.html` || posix.startsWith(`${l}/`)) return l;
  }
  return 'en';
}

// For a given page, compute its counterpart URL in the "other" locale
// so the language switcher can link to it. Today there are only two
// locales, so "other" is unambiguous. When a third locale lands, the
// switcher markup in the partials will need to iterate LOCALES instead
// and this helper will return a map rather than a single URL.
//
// Missing-counterpart fallback: blog translation lives in a sibling
// repo and its per-post mirrors haven't merged into this repo yet.
// Rather than 0kb the user when they click 'Ver en español' from a
// specific post, the switcher falls back to the Spanish blog landing
// (/es/blog/) when the per-post counterpart is missing — they still
// land on the Spanish blog surface and the js-lang-switch cookie
// write carries their language preference to every subsequent page.
// When the sibling repo lands the per-post Spanish HTML, the check
// below flips to true and the switcher points at the exact post.
function counterpartUrl(relPath, pageLocale) {
  const posix = toPosix(relPath);
  // Strip an index.html suffix so the URL is the directory form users see.
  const pretty = posix.endsWith('/index.html')
    ? '/' + posix.slice(0, -'index.html'.length)
    : posix === 'index.html'
      ? '/'
      : '/' + posix;
  let url;
  let targetRel;
  if (pageLocale === 'en') {
    // EN page → point to /<otherLocale>/... counterpart.
    const other = NON_DEFAULT_LOCALES[0];
    url = pretty === '/' ? `/${other}/` : `/${other}${pretty}`;
    targetRel = pretty === '/' ? `${other}/index.html` : `${other}${pretty}index.html`;
  } else {
    // Non-default locale → strip the leading /<locale>/ and land at EN.
    const stripped = pretty.replace(new RegExp(`^/${pageLocale}(/|$)`), '/');
    url = stripped || '/';
    targetRel = url === '/' ? 'index.html' : url.slice(1) + 'index.html';
  }
  // Missing-counterpart fallback: specifically for blog posts (where
  // the sibling translation repo owns the content), route to the
  // locale's blog landing instead of 0kb-ing the user. For any other
  // missing counterpart, keep the raw URL — hreflang alternates still
  // want the canonical path even if the page is transiently down.
  const targetAbs = path.join(repoRoot, targetRel);
  const isBlogPost = /\bblog\//.test(posix) && !posix.endsWith('blog/index.html') && posix !== 'blog/index.html';
  if (isBlogPost && !fs.existsSync(targetAbs)) {
    return pageLocale === 'en' ? `/${NON_DEFAULT_LOCALES[0]}/blog/` : '/blog/';
  }
  return url;
}

// The locale's "home" URL used for the logo link on every page except
// the locale's own index. EN home is "/"; ES home is "/es/". This keeps
// "click the logo" predictable regardless of language.
function localeHomeUrl(locale) {
  return locale === 'en' ? '/' : `/${locale}/`;
}

// The set of files that are the locale's own index page — the logo
// anchor on those keeps its historical "#main" smooth-scroll behavior
// (no full-page reload).
const LOCALE_INDEX_PATHS = new Set(
  LOCALES.map((l) => l === 'en' ? 'index.html' : `${l}/index.html`)
);

function renderNav(relPath, locale) {
  const tpl = navTemplates[locale];
  const logoHref = LOCALE_INDEX_PATHS.has(toPosix(relPath)) ? '#main' : localeHomeUrl(locale);
  return tpl
    .replaceAll('{{LOGO_HREF}}',    logoHref)
    .replaceAll('{{LOCALE_HOME}}',  localeHomeUrl(locale))
    .replaceAll('{{ALT_URL}}',      counterpartUrl(relPath, locale))
    .replaceAll('{{I18N_JSON}}',    JSON.stringify(i18nDicts[locale]));
}

function renderFooter(relPath, locale) {
  const tpl = footerTemplates[locale];
  return tpl
    .replaceAll('{{LOCALE_HOME}}', localeHomeUrl(locale))
    .replaceAll('{{ALT_URL}}',     counterpartUrl(relPath, locale));
}

let changed = 0;
let skipped = 0;
let footerSkipped = 0;
const problems = [];

for (const file of collectHtml(repoRoot)) {
  const rel     = path.relative(repoRoot, file);
  const locale  = localeForPath(rel);
  const src     = fs.readFileSync(file, 'utf8');

  const hasNav    = NAV_RE.test(src);
  const hasFooter = FOOTER_RE.test(src);
  if (!hasNav && !hasFooter) { skipped++; continue; }

  // Only sync the footer if this page is using the canonical main-funnel
  // footer. Tool-utility pages carry a different "Free tools" column and
  // are detected by the absence of the canonical marker.
  const footerIsCanonical = hasFooter && src.match(FOOTER_RE)[0].includes(FOOTER_MAIN_FUNNEL_MARKER);

  let next = src;
  if (hasNav)             next = next.replace(NAV_RE, renderNav(rel, locale));
  if (footerIsCanonical)  next = next.replace(FOOTER_RE, renderFooter(rel, locale));
  if (hasFooter && !footerIsCanonical) footerSkipped++;

  if (!hasNav || !hasFooter) {
    problems.push(`${rel}: missing ${!hasNav ? 'nav' : ''}${!hasNav && !hasFooter ? ' and ' : ''}${!hasFooter ? 'footer' : ''}`);
  }

  if (next !== src) {
    if (!checkOnly) fs.writeFileSync(file, next);
    changed++;
    console.log(`${checkOnly ? 'would update' : 'updated'}: ${rel}`);
  }
}

if (problems.length) {
  console.warn('\nwarnings:');
  for (const p of problems) console.warn(`  ${p}`);
}

console.log(`\n${checkOnly ? 'would update' : 'updated'} ${changed} file(s), skipped ${skipped} (no nav/footer), ${footerSkipped} tool-utility footer(s) preserved.`);

if (checkOnly && changed > 0) process.exit(1);
