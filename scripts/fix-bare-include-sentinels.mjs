#!/usr/bin/env node
/**
 * One-shot fix-up for pages that were created from a fresh template
 * and shipped with bare include sentinels (`<!-- nav:start -->
 * <!-- nav:end -->` and the matching footer pair) without ever
 * receiving the canonical nav + footer content.
 *
 * The companion guard (scripts/check-include-coverage.mjs) flags this
 * regression class. The main sync-includes.mjs uses tighter regexes
 * (anchored on <header class="nav" id="nav">…</header> and
 * <footer>…</footer>) that don't recognize the bare sentinels — by
 * design, since broadening them would also pull in an unrelated
 * Turnstile-duplication issue on 417 other pages. This script handles
 * the 9 affected pages directly without modifying sync-includes.
 *
 * Idempotent: matches only the bare-sentinel form. Pages that have
 * already been fixed (canonical nav/footer + no remaining sentinels)
 * are no-ops on re-run.
 *
 * Usage:
 *   node scripts/fix-bare-include-sentinels.mjs           # rewrite in place
 *   node scripts/fix-bare-include-sentinels.mjs --check   # exit 1 if any change
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot   = path.resolve(path.dirname(__filename), '..');
const checkOnly  = process.argv.includes('--check');

const LOCALES = ['en', 'es'];
const NON_DEFAULT_LOCALES = LOCALES.filter((l) => l !== 'en');

const NAV_SENTINEL_RE    = /<!-- nav:start -->\s*<!-- nav:end -->/;
const FOOTER_SENTINEL_RE = /<!-- footer:start -->\s*<!-- footer:end -->/;

const navTemplates    = {};
const footerTemplates = {};
for (const locale of LOCALES) {
  const dir = locale === 'en' ? '_includes' : path.join('_includes', locale);
  navTemplates[locale]    = fs.readFileSync(path.join(repoRoot, dir, 'nav.html'),    'utf8').trimEnd();
  footerTemplates[locale] = fs.readFileSync(path.join(repoRoot, dir, 'footer.html'), 'utf8').trimEnd();
}

const i18nDicts = { en: {} };
for (const locale of NON_DEFAULT_LOCALES) {
  const p = path.join(repoRoot, '_includes', `i18n.${locale}.json`);
  i18nDicts[locale] = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

const toPosix = (p) => p.split(path.sep).join('/');

function localeForPath(rel) {
  const posix = toPosix(rel);
  for (const l of NON_DEFAULT_LOCALES) {
    if (posix === `${l}/index.html` || posix.startsWith(`${l}/`)) return l;
  }
  return 'en';
}

function localeHomeUrl(locale) { return locale === 'en' ? '/' : `/${locale}/`; }

function counterpartUrl(rel, pageLocale) {
  const posix = toPosix(rel);
  const pretty = posix.endsWith('/index.html')
    ? '/' + posix.slice(0, -'index.html'.length)
    : posix === 'index.html' ? '/' : '/' + posix;
  if (pageLocale === 'en') {
    const other = NON_DEFAULT_LOCALES[0];
    return pretty === '/' ? `/${other}/` : `/${other}${pretty}`;
  }
  const stripped = pretty.replace(new RegExp(`^/${pageLocale}(/|$)`), '/');
  return stripped || '/';
}

function renderNav(rel, locale) {
  return navTemplates[locale]
    .replaceAll('{{LOGO_HREF}}',   localeHomeUrl(locale))
    .replaceAll('{{LOCALE_HOME}}', localeHomeUrl(locale))
    .replaceAll('{{ALT_URL}}',     counterpartUrl(rel, locale))
    .replaceAll('{{I18N_JSON}}',   JSON.stringify(i18nDicts[locale]));
}

function renderFooter(rel, locale) {
  return footerTemplates[locale]
    .replaceAll('{{LOCALE_HOME}}', localeHomeUrl(locale))
    .replaceAll('{{ALT_URL}}',     counterpartUrl(rel, locale));
}

function listHtml(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'dist'
        || e.name === '_includes' || e.name === 'src' || e.name === 'scripts'
        || e.name === 'assets' || e.name === 'docs' || e.name === 'brand'
        || e.name === '.wrangler') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) listHtml(full, out);
    else if (e.isFile() && e.name.endsWith('.html')) out.push(full);
  }
  return out;
}

let changed = 0;
const changedFiles = [];

for (const file of listHtml(repoRoot)) {
  const rel    = path.relative(repoRoot, file);
  const locale = localeForPath(rel);
  const src    = fs.readFileSync(file, 'utf8');

  let next = src;
  if (NAV_SENTINEL_RE.test(next))    next = next.replace(NAV_SENTINEL_RE,    renderNav(rel, locale));
  if (FOOTER_SENTINEL_RE.test(next)) next = next.replace(FOOTER_SENTINEL_RE, renderFooter(rel, locale));

  if (next !== src) {
    changed++;
    changedFiles.push(rel);
    if (!checkOnly) fs.writeFileSync(file, next);
  }
}

if (checkOnly && changed > 0) {
  console.error(`fix-bare-include-sentinels: ${changed} file(s) would change:`);
  for (const f of changedFiles) console.error(`  ${f}`);
  process.exit(1);
}

console.log(`fix-bare-include-sentinels: ${changed} file(s) ${checkOnly ? 'would change' : 'updated'}.`);
