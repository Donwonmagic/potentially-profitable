#!/usr/bin/env node
/**
 * build-surface-inventory.mjs — the Surface BOM. One measured record per routable page.
 *
 * WHY THIS EXISTS (2026-08-07)
 *
 * docs/handoff/every-surface-map.md and fifteen sibling planning documents describe
 * this site in prose. Prose goes stale the moment a builder runs, and nothing in the
 * pipeline can consume it. The 2026-08-07 company audit measured the consequence:
 * prior audits close at 26%, and no closure in company history came from anyone
 * working a document's list. This repo's working architecture is
 * manifest -> injector -> gate, so the inventory is written as a MANIFEST.
 *
 * Everything here is MEASURED from the files on disk. Nothing is asserted by hand.
 * If a page is added, frozen, retired, or rewritten, re-running this script tells the
 * truth about it without anyone editing a list.
 *
 * ROOT LIST (the hard-won lesson — see CLAUDE.md "A scanner is only as good as its
 * root list"). This walks the ENTIRE repo and carries an explicit SKIP_TOP below
 * where every entry states why the tree is not a routable reader-facing page. Three
 * separate gates in this repo shipped bugs in 2026-07 by scanning a narrow subtree;
 * silent scope is the defect, not narrow scope.
 *
 * CHROME IS NOT A LINK. The nav and footer appear on ~1,300 pages, so counting their
 * hrefs makes every page look richly linked and no page look orphaned — the same
 * failure check-claim-usage hit when self-referential footer URLs read as citations.
 * Link counts, CTA targets, word counts, figure counts and the retired-line score are
 * therefore measured on the BODY WITH SITE CHROME REMOVED. The strip is reported per
 * page (`chrome.navStripped` / `chrome.footerStripped`) so a template change that
 * defeats the strip surfaces as data instead of silently inflating every count.
 *
 * DETERMINISM. No wall clock enters the output. `asOf` is the newest commit date in
 * the repo and `lastCommitDaysAgo` is measured against THAT, so --check is stable
 * until a commit lands. The clone in CI is shallow (history begins at
 * `gitHorizonISO`); a page untouched since before the horizon gets
 * `lastCommitISO: null` and `beyondGitHorizon: true` — an honest absence, never a
 * guessed date. The same reasoning build-sitemap.mjs applies to <lastmod>.
 *
 * Output: data/surface-inventory.json
 *
 *   node scripts/build-surface-inventory.mjs             # write the manifest
 *   node scripts/build-surface-inventory.mjs --check     # CI: rebuild & diff (exit 1 on drift)
 *   node scripts/build-surface-inventory.mjs --self-test # unit-test the pure helpers
 *   node scripts/build-surface-inventory.mjs --report    # print the rollups to stdout
 *   node scripts/build-surface-inventory.mjs --no-git    # skip the git pass (nulls the dates)
 *
 * NOT WIRED into check-all.mjs, and deliberately so: HTML changes on nearly every
 * commit, so a --check here would red the deploy until someone reruns it. It belongs
 * in check-idem-coverage's MANUAL registry the day anyone wires it, with who reruns it
 * and when it drifts. Until then it is a measuring instrument, not a gate.
 */

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Reuse the positioning-drift gate's vocabulary and prose extractor so the inventory
// and the gate can never disagree about what "retired-line" means.
import { RETIRED_VOCAB, prose, countRetired, NOINDEX_RE } from './check-positioning-drift.mjs';

const __filename = fileURLToPath(import.meta.url);
const REPO = path.resolve(path.dirname(__filename), '..');
const OUT = path.join(REPO, 'data', 'surface-inventory.json');
const SITE = 'https://muntin.digital';

/* ------------------------------------------------------------------ root list */

/**
 * Top-level trees skipped. Every entry says why it is NOT a routable reader-facing
 * page. Anything not listed here is walked to full depth.
 */
const SKIP_TOP = new Map([
  ['.git', 'version-control internals; no served files'],
  ['node_modules', 'installed dependencies; gitignored, never deployed'],
  ['scripts', 'build/check tooling. Its 31 .html files are sheets-fragments/ — input fragments that build-sheet-pages.mjs inlines into /sheets/ pages, never served on their own'],
  ['_includes', 'shared nav/footer partials injected into pages by sync-includes.mjs; not routable on their own'],
  ['docs', 'editorial canons, ADRs and design prototypes. CLAUDE.md: "not web-routable". Its 3 .html files are a depth prototype, an unpublished draft and a handoff mock'],
  ['data', 'JSON manifests. Its 2 .html files are data/email-preview/ broadcast render fixtures, opened locally, never linked'],
  ['src', 'Cloudflare Worker source (src/lib/*.js); no HTML'],
  ['tests', 'Playwright specs; no served HTML'],
  ['assets', 'CSS/JS/img/audio static assets; contains no HTML'],
  ['audio', 'rendered MP3 tracks; contains no HTML'],
  ['dist', 'build output directory when present; regenerated, never authored'],
]);

const MAX_DEPTH = 8;

/* --------------------------------------------------------------- surface class */

/**
 * Route-root -> surfaceClass. The 11-value taxonomy is deliberately coarse; the raw
 * route root travels alongside it as `surfaceRoot` so nothing is lost to the bucket.
 * `legacy` is STRUCTURAL, not a judgement: unpublished drafts and any route shadowed
 * by a 301 in _redirects.
 */
const CLASS_BY_ROOT = new Map([
  ['library', 'library'],
  ['learn', 'library'],       // topics, checklists, research notes — evergreen reader prose
  ['blog', 'blog'],
  ['glossary', 'glossary'],
  ['sheets', 'sheet'],
  ['tools', 'tool'],
  ['cost-index', 'cost-index'],
  ['open', 'cost-index'],     // the ADR-015 open-data explore surfaces are Cost Index surfaces
  ['ledger', 'product'],
  ['account', 'product'],
  ['sign-in', 'product'],
  ['window', 'product'],
  ['workbench', 'product'],
  ['admin', 'admin'],
  ['brand', 'admin'],         // brand/og/preview.html is an OG-card render harness
  ['trust', 'trust'],
  ['security', 'trust'],
  ['claims', 'trust'],
  ['receipts', 'trust'],
  ['methods', 'trust'],
  ['status', 'trust'],
  ['changelog', 'trust'],
  ['system', 'trust'],
  ['about', 'marketing'],
  ['studio', 'marketing'],
  ['for', 'marketing'],
  ['ai', 'marketing'],
  ['never', 'marketing'],
]);

/** Root-level standalone .html files and their class. */
const CLASS_BY_FILE = new Map([
  ['index.html', 'marketing'],
  ['404.html', 'trust'],
  ['privacy.html', 'trust'],
  ['terms.html', 'trust'],
  ['cookies.html', 'trust'],
  ['accessibility.html', 'trust'],
]);

/* -------------------------------------------------------- retired-line vocabulary */

/**
 * RETIRED_VOCAB (imported) covers the website-build line. These three lists extend it
 * to the rest of the retired local-marketing/brand offering. Kept phrase-specific for
 * the same reason the imported list is: a bare word like "design" or "search" matches
 * half the cost corpus. Scores are reported per category, never summed into a verdict —
 * this script measures, check-positioning-drift.mjs is the gate that judges.
 */
const SEO_VOCAB = [
  'seo', 'search engine optimization', 'keyword research', 'keyword map',
  'backlink', 'backlinks', 'link building', 'serp', 'organic ranking',
  'organic rankings', 'search rankings', 'anchor text', 'title tag',
  'optimización de motores de búsqueda', 'investigación de palabras clave',
  'palabras clave', 'posicionamiento orgánico',
];
const LOCAL_GBP_VOCAB = [
  'google business profile', 'google my business', 'gbp', 'local seo',
  'nap consistency', 'citation building', 'map pack', 'local pack',
  'local listings', 'google maps listing', 'review response', 'google reviews',
  'reputation management', 'perfil de empresa de google', 'seo local',
  'reseñas de google', 'paquete local',
];
const BRAND_DESIGN_VOCAB = [
  'brand identity', 'logo design', 'brand guidelines', 'brand style guide',
  'visual identity', 'moodboard', 'mood board', 'signage design', 'menu design',
  'identidad de marca', 'diseño de logo', 'guía de marca', 'identidad visual',
  'diseño de menú',
];

/* ------------------------------------------------------------ chrome boundaries */

/**
 * The canonical nav/footer boundaries. Mirrors scripts/sync-includes.mjs:104 (NAV_RE)
 * and :138 (FOOTER_RE) — the definitions sync-includes uses to replace the shared
 * partials — but relaxed at the tail so a page whose footer was hand-edited still
 * strips. Deliberately NOT imported: sync-includes does not export them, and a mutating
 * builder is the wrong module to pull into a read-only measurement.
 */
const NAV_STRIP_RE = /(?:<script>\s*\/\* Platform-aware kbd hint(?:(?!<\/script>)[\s\S])*?<\/script>\s*)*<header class="nav" id="nav">[\s\S]*?<\/header>/;
/**
 * The site footer runs from the first NEWLINE-ANCHORED <footer> to end of document.
 * Verified sitewide before it was widened: across all 1,327 pages a newline-anchored
 * <footer> never appears before </main>, so strip-to-EOF cannot eat body prose, and
 * the 16 pages carrying more than one footer element are handled by the same sweep.
 * `<footer>` alone was NOT enough — 656 template-built pages emit
 * `<footer class="site-footer" id="footer">`, and the narrow form silently left the
 * whole footer inside the body on 691 pages, inflating every link and word count there.
 */
const FOOTER_STRIP_RE = /(?<=\n)<footer\b[^>]*>[\s\S]*$/;
/** Breadcrumbs and the language switch are generated navigation, not editorial links. */
const BREADCRUMB_RE = /<nav class="breadcrumb[\s\S]*?<\/nav>/g;
const LANGSWITCH_RE = /<nav class="lang-switch[\s\S]*?<\/nav>/g;

/**
 * CTA destinations: the product, the waitlist, the newsletter, the account funnel.
 *
 * The off-site product hosts are load-bearing and were the first version's blind spot.
 * The in-content Ledger rail links to https://ledger.muntin.digital/ — an ABSOLUTE,
 * cross-host URL, which the internal-link extractor correctly drops. Measuring CTAs off
 * the internal-link list therefore reported the flagship article as having no product CTA
 * when it has one, and undercounted 502 product links sitewide. CTA matching runs over
 * every href in the body, internal and external alike.
 *
 * app.muntin.digital is listed because Muntin-Invoice-Decoder/CLAUDE.md names it as the
 * operator app host; the storefront links to ledger.muntin.digital instead. Both are
 * matched so the inventory measures the split rather than assuming which one is right.
 */
const CTA_RE = /^(?:\/(?:es\/)?ledger(?:\/|$)|\/api\/waitlist|\/api\/subscribe|\/(?:es\/)?sign-in(?:\/|$)|\/(?:es\/)?account(?:\/|$)|https:\/\/(?:app|ledger)\.muntin\.digital)/;

/**
 * The site's analytics beacon: a self-hosted Plausible shim at /assets/p.js, loaded by
 * an inline requestIdleCallback shim inside the `<!-- lazy-load:p -->` sentinel — NOT by
 * a `<script src>` tag. Matching the tag form found the beacon on zero pages; matching
 * the URL anywhere in the document finds it on the 274 that actually carry it.
 */
const ANALYTICS_RE = /\/assets\/p\.js/;
/** The queue shim + init call that the beacon needs to report anything. */
const ANALYTICS_INIT_RE = /plausible\.init\s*\(/;

/* ---------------------------------------------------------------- pure helpers */

/** repo-relative html path -> pretty route. Exported for --self-test. */
export function routeFor(rel) {
  if (rel === 'index.html') return '/';
  if (rel.endsWith('/index.html')) return '/' + rel.slice(0, -'index.html'.length);
  return '/' + rel;
}

/** route -> { lang, surfaceRoot, surfaceClass }. */
export function classify(route) {
  const stripped = route.startsWith('/es/') || route === '/es/' ? route.slice(3) : route;
  const lang = stripped === route ? 'en' : 'es';
  const rest = stripped.replace(/^\//, '');
  if (rest === '' || rest === 'index.html') return { lang, surfaceRoot: '(home)', surfaceClass: 'marketing' };
  if (!rest.includes('/') && rest.endsWith('.html')) {
    return { lang, surfaceRoot: rest, surfaceClass: CLASS_BY_FILE.get(rest) || 'marketing' };
  }
  const root = rest.split('/')[0];
  if (root === 'blog' && rest.startsWith('blog/drafts/')) {
    return { lang, surfaceRoot: 'blog/drafts', surfaceClass: 'legacy' };
  }
  return { lang, surfaceRoot: root, surfaceClass: CLASS_BY_ROOT.get(root) || 'marketing' };
}

/** First capture group of `re`, HTML-entity-decoded and whitespace-collapsed, or null. */
export function pick(html, re) {
  const m = html.match(re);
  return m ? decodeEntities(m[1]).replace(/\s+/g, ' ').trim() : null;
}

export function decodeEntities(s) {
  return String(s)
    .replace(/&mdash;/g, '—').replace(/&ndash;/g, '–')
    .replace(/&nbsp;/g, ' ').replace(/&hellip;/g, '…')
    .replace(/&quot;/g, '"').replace(/&#0?39;|&apos;|&#x27;/gi, "'")
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/** First <h1>'s visible text, or null. Inner markup (spans, autolinks) is stripped. */
export function firstH1(body) {
  const m = body.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i);
  if (!m) return null;
  // prose() substitutes a space for every tag, so "cost</em>," becomes "cost ,".
  // Re-close the gap before punctuation; the h1 is a headline, not a paragraph.
  const t = decodeEntities(prose(m[1])).replace(/\s+/g, ' ').replace(/\s+([,.;:!?%)\]])/g, '$1').trim();
  return t || null;
}

/** Body with site chrome removed. Returns the text plus what the strip actually matched. */
export function stripChrome(html) {
  const bodyAt = html.search(/<body\b/i);
  let body = bodyAt === -1 ? html : html.slice(bodyAt);
  const navStripped = NAV_STRIP_RE.test(body);
  body = body.replace(NAV_STRIP_RE, ' ');
  const footerStripped = FOOTER_STRIP_RE.test(body);
  body = body.replace(FOOTER_STRIP_RE, ' ');
  body = body.replace(BREADCRUMB_RE, ' ').replace(LANGSWITCH_RE, ' ');
  return { body, navStripped, footerStripped };
}

/** Words of visible prose. */
export function wordCount(text) {
  const t = prose(text).trim();
  return t ? t.split(/\s+/).length : 0;
}

/**
 * Every @type in every ld+json block, deduped and sorted, plus the newest dateModified
 * found. Unparseable blocks report '(invalid)' rather than vanishing.
 *
 * dateModified matters more than the git date here. build-sitemap.mjs already learned
 * this: a repo-wide inject pass rewrites every file's git mtime, which flattened ~1,030
 * URLs to one day. The measurement below confirms the hazard is live — every page on
 * this site has a git commit inside the last two weeks. dateModified is the EDITORIAL
 * clock and is the only freshness number worth reading.
 */
export function jsonLdFacts(html) {
  const types = new Set();
  let modified = null;
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let parsed;
    try { parsed = JSON.parse(m[1]); } catch { types.add('(invalid)'); continue; }
    (function walkNode(node) {
      if (Array.isArray(node)) return node.forEach(walkNode);
      if (!node || typeof node !== 'object') return;
      const t = node['@type'];
      if (typeof t === 'string') types.add(t);
      else if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));
      const dm = node.dateModified;
      if (typeof dm === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dm) && (!modified || dm > modified)) modified = dm;
      for (const v of Object.values(node)) if (v && typeof v === 'object') walkNode(v);
    })(parsed);
  }
  return { types: [...types].sort(), dateModified: modified ? modified.slice(0, 10) : null };
}

/** Back-compat shorthand used by the self-test. */
export const jsonLdTypes = (html) => jsonLdFacts(html).types;

/**
 * Internal link targets in a chunk of HTML, normalized to site-absolute paths with
 * query and fragment dropped. External, mailto:, tel:, javascript: and bare-fragment
 * links are excluded — they cannot make a page reachable.
 */
export function internalLinks(chunk, fromRoute) {
  return allLinks(chunk, fromRoute).filter((h) => h.startsWith('/'));
}

/**
 * EVERY href in a chunk, normalized: same-host absolutes collapse to a path, relatives
 * resolve against the page route, query and fragment are dropped, and off-site URLs are
 * kept verbatim so cross-host CTAs stay visible. mailto/tel/javascript/data and bare
 * fragments are dropped — none of them is a destination.
 */
export function allLinks(chunk, fromRoute) {
  const out = [];
  for (const m of chunk.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)) {
    let href = decodeEntities(m[1]).trim();
    if (href.startsWith(SITE)) href = href.slice(SITE.length) || '/';
    if (/^(?:mailto:|tel:|javascript:|data:|#)/i.test(href) || !href) continue;
    if (/^https?:/i.test(href)) { out.push(href.split('#')[0]); continue; }
    if (!href.startsWith('/')) {
      const base = fromRoute.endsWith('/') ? fromRoute : fromRoute.replace(/[^/]*$/, '');
      href = path.posix.normalize(base + href);
    }
    href = href.split('#')[0].split('?')[0];
    if (href) out.push(href);
  }
  return out;
}

/**
 * A link target -> the route it actually serves, or null when nothing on disk answers.
 * `/foo` and `/foo/` and `/foo/index.html` all resolve to the route `/foo/`.
 */
export function resolveTarget(href, routeSet) {
  if (routeSet.has(href)) return href;
  if (routeSet.has(href + '/')) return href + '/';
  if (href.endsWith('/index.html')) {
    const r = href.slice(0, -'index.html'.length);
    if (routeSet.has(r)) return r;
  }
  if (!href.endsWith('/') && routeSet.has(href.replace(/\/?$/, '/'))) return href.replace(/\/?$/, '/');
  return null;
}

/**
 * A link target that is not a page but is not broken either: a dataset, a feed, a
 * download, a form endpoint. Counting these as dead links buried the 106 real ones
 * under 697 false positives on the first run.
 */
const NON_HTML_RE = /(?:^\/api\/)|\.(?:json|jsonl|csv|xml|txt|md|mp3|mp4|pdf|png|jpe?g|svg|webp|avif|ico|zip|ics|woff2?)$/i;
export function isNonHtmlTarget(href) { return NON_HTML_RE.test(href); }

/** robots.txt Disallow prefixes (all user-agent groups pooled — we only ask "is it blocked"). */
export function parseRobotsDisallow(txt) {
  const out = new Set();
  for (const line of String(txt).split('\n')) {
    const m = line.match(/^\s*Disallow:\s*(\S+)\s*$/i);
    if (m) out.add(m[1]);
  }
  return [...out].sort();
}

/** 301/302 source paths from _redirects, so a route shadowed by a redirect is visible. */
export function parseRedirectSources(txt) {
  const out = new Set();
  for (const line of String(txt).split('\n')) {
    if (/^\s*(#|$)/.test(line)) continue;
    const m = line.trim().match(/^(\S+)\s+(\S+)\s+(\d{3})\s*$/);
    if (m && m[3].startsWith('3')) out.add(m[1]);
  }
  return [...out].sort();
}

/** Does any redirect source shadow this route? Wildcards are honoured. */
export function shadowedBy(route, sources) {
  for (const s of sources) {
    if (s.endsWith('*')) { if (route.startsWith(s.slice(0, -1))) return s; }
    else if (s === route) return s;
  }
  return null;
}

/**
 * _redirects rules as [source, destination] pairs, ordered as written — Cloudflare
 * Pages matches first-wins, so order is load-bearing and must be preserved.
 */
export function parseRedirectRules(txt) {
  const out = [];
  for (const line of String(txt).split('\n')) {
    if (/^\s*(#|$)/.test(line)) continue;
    const m = line.trim().match(/^(\S+)\s+(\S+)\s+(\d{3})\s*$/);
    if (m && m[3].startsWith('3')) out.push([m[1], m[2]]);
  }
  return out;
}

/**
 * Follow a link through ONE redirect hop, so a link to a moved page still credits the
 * page it actually reaches. One hop only, deliberately: chains would need cycle
 * detection and this repo's rules are flat. Returns null when no rule matches.
 */
export function redirectOnce(href, rules) {
  for (const [src, dest] of rules) {
    if (src.endsWith('*')) {
      const prefix = src.slice(0, -1);
      if (href.startsWith(prefix)) return dest.replace(':splat', href.slice(prefix.length));
    } else if (src === href) return dest;
  }
  return null;
}

export function daysBetween(aISO, bISO) {
  if (!aISO || !bISO) return null;
  return Math.round((Date.parse(bISO) - Date.parse(aISO)) / 86400000);
}

/* ------------------------------------------------------------------- git dates */

/**
 * One `git log` pass over the whole history -> { path: newestCommitISO }. The clone is
 * shallow in CI, so a file untouched before the horizon simply has no entry; we record
 * null rather than inventing a date.
 */
function gitLastTouched() {
  let raw;
  try {
    raw = execFileSync('git', ['log', '--no-merges', '--pretty=format:C%cI', '--name-only'],
      { cwd: REPO, encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
  } catch {
    return { map: new Map(), horizon: null, newest: null, available: false };
  }
  const map = new Map();
  const dates = [];
  let cur = null;
  for (const line of raw.split('\n')) {
    if (line.startsWith('C') && /^C\d{4}-\d{2}-\d{2}T/.test(line)) { cur = line.slice(1); dates.push(cur); continue; }
    const p = line.trim();
    if (!p || !cur) continue;
    if (!map.has(p)) map.set(p, cur);
  }
  dates.sort();
  return { map, horizon: dates[0] || null, newest: dates[dates.length - 1] || null, available: true };
}

/* ------------------------------------------------------------------------ walk */

export function walkHtml(repo, skip = SKIP_TOP, maxDepth = MAX_DEPTH) {
  const out = [];
  (function rec(dir, depth, rel) {
    if (depth > maxDepth) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    entries.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    for (const e of entries) {
      if (e.name.startsWith('.')) continue;
      const next = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (depth === 0 && skip.has(e.name)) continue;
        rec(path.join(dir, e.name), depth + 1, next);
      } else if (e.name.endsWith('.html')) {
        out.push(next);
      }
    }
  })(repo, 0, '');
  return out.sort();
}

/* ------------------------------------------------------------------------ build */

function build({ useGit = true } = {}) {
  const files = walkHtml(REPO);

  const sitemapXml = readIf(path.join(REPO, 'sitemap.xml'));
  const sitemapRoutes = new Set(
    [...String(sitemapXml).matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)]
      .map((m) => (m[1].startsWith(SITE) ? m[1].slice(SITE.length) || '/' : m[1])));

  const disallow = parseRobotsDisallow(readIf(path.join(REPO, 'robots.txt')));
  const redirectsTxt = readIf(path.join(REPO, '_redirects'));
  const redirectSources = parseRedirectSources(redirectsTxt);
  const redirectRules = parseRedirectRules(redirectsTxt);

  const git = useGit ? gitLastTouched() : { map: new Map(), horizon: null, newest: null, available: false };
  const asOf = git.newest ? git.newest.slice(0, 10) : null;

  // Pass 1 — read and measure every page.
  const records = [];
  const routeSet = new Set();
  for (const rel of files) {
    const route = routeFor(rel);
    routeSet.add(route);
    records.push({ rel, route });
  }

  const byRoute = new Map();
  for (const rec of records) {
    const html = fs.readFileSync(path.join(REPO, rec.rel), 'utf8');
    const { body, navStripped, footerStripped } = stripChrome(html);
    const head = html.slice(0, html.search(/<body\b/i) === -1 ? html.length : html.search(/<body\b/i));
    const { lang: pathLang, surfaceRoot, surfaceClass: baseClass } = classify(rec.route);

    const declaredLang = pick(html, /<html[^>]*\blang=["']([^"']+)["']/i);
    const robots = pick(head, /<meta[^>]+name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    const shadow = shadowedBy(rec.route, redirectSources);

    const every = allLinks(body, rec.route);
    const links = every.filter((h) => h.startsWith('/'));
    const ctaTargets = [...new Set(every.filter((h) => CTA_RE.test(h)))].sort();
    const outboundAll = [...new Set(links)].sort();
    const outboundExternal = [...new Set(every.filter((h) => /^https?:/i.test(h)))].sort();
    // Unrendered template placeholders that shipped to a live page. Four exist sitewide.
    const unrenderedPlaceholders = [...new Set(every.filter((h) => /\{\{|\}\}/.test(h)))].sort();

    const proseText = prose(body);
    const retired = {
      webBuild: countRetired(proseText, RETIRED_VOCAB),
      seo: countRetired(proseText, SEO_VOCAB),
      localGbp: countRetired(proseText, LOCAL_GBP_VOCAB),
      brandDesign: countRetired(proseText, BRAND_DESIGN_VOCAB),
    };

    const dir = path.dirname(path.join(REPO, rec.rel));
    const lastCommitISO = git.map.get(rec.rel) || null;
    const ld = jsonLdFacts(html);
    let audioFiles = [];
    try { audioFiles = fs.readdirSync(dir).filter((f) => f.startsWith('audio')); } catch { /* unreadable dir */ }

    // hreflang counterpart: the alternate whose hreflang is the OTHER locale.
    const alternates = {};
    for (const m of head.matchAll(/<link[^>]+rel=["']alternate["'][^>]*hreflang=["']([^"']+)["'][^>]*href=["']([^"']+)["']/gi)) {
      const href = m[2].startsWith(SITE) ? m[2].slice(SITE.length) || '/' : m[2];
      alternates[m[1]] = href;
    }
    const otherLang = pathLang === 'en' ? 'es' : 'en';
    const counterpartRoute = alternates[otherLang] && alternates[otherLang] !== rec.route ? alternates[otherLang] : null;

    byRoute.set(rec.route, {
      route: rec.route,
      filePath: rec.rel,
      lang: declaredLang ? declaredLang.slice(0, 2) : pathLang,
      langFromPath: pathLang,
      surfaceClass: shadow && baseClass !== 'legacy' ? 'legacy' : baseClass,
      surfaceRoot,
      title: pick(head, /<title>([\s\S]*?)<\/title>/i),
      h1: firstH1(body),
      metaDescription: pick(head, /<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i),
      wordCount: wordCount(body),
      robots,
      indexable: !(robots && NOINDEX_RE.test(`<meta name="robots" content="${robots}"`)),
      robotsTxtDisallowed: disallow.some((d) => rec.route.startsWith(d)),
      inSitemap: sitemapRoutes.has(rec.route),
      canonical: (() => {
        const c = pick(head, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        return c ? (c.startsWith(SITE) ? c.slice(SITE.length) || '/' : c) : null;
      })(),
      canonicalIsSelf: (() => {
        const c = pick(head, /<link[^>]+rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
        if (!c) return null;
        const p = c.startsWith(SITE) ? c.slice(SITE.length) || '/' : c;
        return p === rec.route;
      })(),
      hreflangPairPresent: Boolean(counterpartRoute),
      counterpartRoute,
      counterpartExists: counterpartRoute ? null : null, // filled in pass 2
      jsonLdTypes: ld.types,
      dateModified: ld.dateModified,
      dateModifiedDaysAgo: ld.dateModified && asOf ? daysBetween(ld.dateModified, asOf) : null,
      figureCount: (body.match(/<figure\b/gi) || []).length,
      // Three separate audio facts, deliberately not OR-ed into one boolean. The first
      // run collapsed them and reported "109 pages have audio"; splitting them shows
      // 57 pages with both, 42 rendering the listen UI with no narration JSON beside
      // them, and 10 carrying a script no page offers. A single flag hid all of that.
      hasListenUi: /listen-script:start/.test(html),
      hasAudioScript: audioFiles.some((f) => /^audio(\.[a-z]{2})?\.json$/.test(f)),
      audioTrackCount: audioFiles.filter((f) => f.endsWith('.mp3')).length,
      hasAudio: /listen-script:start/.test(html) || audioFiles.some((f) => /^audio(\.[a-z]{2})?\.json$/.test(f)),
      lastCommitISO,
      lastCommitDaysAgo: lastCommitISO && git.newest ? daysBetween(lastCommitISO, git.newest) : null,
      beyondGitHorizon: git.available ? !lastCommitISO : null,
      inboundInternalLinks: 0,
      inboundViaRedirect: 0,
      outboundInternalLinks: outboundAll.length,
      outboundResolved: 0,
      outboundViaRedirect: 0,
      outboundNonHtml: 0,
      outboundExternalCount: outboundExternal.length,
      outboundBroken: [],
      unrenderedPlaceholders,
      isOrphan: null,
      ctaTargets,
      hasWaitlistForm: /<form[^>]+action=["']\/api\/waitlist["']/.test(html),
      hasSubscribeForm: /<form[^>]+action=["']\/api\/subscribe["']/.test(html),
      hasWaitlistFormInBody: /<form[^>]+action=["']\/api\/waitlist["']/.test(body),
      hasSubscribeFormInBody: /<form[^>]+action=["']\/api\/subscribe["']/.test(body),
      hasAnalytics: ANALYTICS_RE.test(html),
      hasAnalyticsInit: ANALYTICS_INIT_RE.test(html),
      retiredLineScore: retired.webBuild + retired.seo + retired.localGbp + retired.brandDesign,
      retiredLineByCategory: retired,
      shadowedByRedirect: shadow,
      chrome: { navStripped, footerStripped },
      _links: outboundAll, // dropped before emit
    });
  }

  // Pass 2 — link graph, counterpart existence.
  //
  // Four outcomes per target, and conflating them is how the first run reported 1,464
  // "broken" links: a direct hit, a page reached through one 301 hop, a non-HTML
  // endpoint (dataset/feed/form) that was never a page, and a genuinely dead link.
  for (const rec of byRoute.values()) {
    const direct = new Set();
    const viaRedirect = new Set();
    for (const href of rec._links) {
      const target = resolveTarget(href, routeSet);
      if (target) { direct.add(target); continue; }
      if (isNonHtmlTarget(href)) { rec.outboundNonHtml++; continue; }
      const hop = redirectOnce(href, redirectRules);
      const hopped = hop && !/^https?:/i.test(hop) ? resolveTarget(hop.split('#')[0].split('?')[0], routeSet) : null;
      if (hopped) { viaRedirect.add(hopped); continue; }
      rec.outboundBroken.push(href);
    }
    rec.outboundResolved = direct.size;
    rec.outboundViaRedirect = viaRedirect.size;
    for (const t of direct) {
      if (t === rec.route) continue; // a self-link does not make a page reachable
      byRoute.get(t).inboundInternalLinks++;
    }
    for (const t of viaRedirect) {
      if (t === rec.route) continue;
      byRoute.get(t).inboundViaRedirect++;
    }
    rec.outboundBroken = [...new Set(rec.outboundBroken)].sort();
  }
  for (const rec of byRoute.values()) {
    // Orphan = no editorial page links here directly. A redirect hop is tracked
    // separately: it reaches the page, but through a hop, which is a different fact.
    rec.isOrphan = rec.inboundInternalLinks === 0;
    rec.isOrphanEvenViaRedirect = rec.inboundInternalLinks === 0 && rec.inboundViaRedirect === 0;
    if (rec.counterpartRoute) rec.counterpartExists = routeSet.has(rec.counterpartRoute);
    delete rec._links;
  }

  const pages = [...byRoute.values()].sort((a, b) => (a.route < b.route ? -1 : 1));

  // Rollups — computed from the records, so they cannot disagree with them.
  const tally = (fn) => {
    const o = {};
    for (const p of pages) { const k = fn(p); if (k == null) continue; o[k] = (o[k] || 0) + 1; }
    return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)));
  };
  const commitDays = pages.map((p) => p.lastCommitDaysAgo).filter((d) => d != null).sort((a, b) => a - b);
  const q = (arr, f) => (arr.length ? arr[Math.min(arr.length - 1, Math.floor(arr.length * f))] : null);

  const summary = {
    pages: pages.length,
    byLang: tally((p) => p.lang),
    bySurfaceClass: tally((p) => p.surfaceClass),
    bySurfaceRoot: tally((p) => p.surfaceRoot),
    indexable: pages.filter((p) => p.indexable).length,
    noindex: pages.filter((p) => !p.indexable).length,
    inSitemap: pages.filter((p) => p.inSitemap).length,
    indexableNotInSitemap: pages.filter((p) => p.indexable && !p.inSitemap).length,
    inSitemapButNoindex: pages.filter((p) => p.inSitemap && !p.indexable).length,
    orphans: pages.filter((p) => p.isOrphan).length,
    orphansIndexable: pages.filter((p) => p.isOrphan && p.indexable).length,
    orphansEvenViaRedirect: pages.filter((p) => p.isOrphanEvenViaRedirect).length,
    orphansBySurfaceClass: (() => {
      const o = {};
      for (const p of pages) if (p.isOrphan) o[p.surfaceClass] = (o[p.surfaceClass] || 0) + 1;
      return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    })(),
    hreflangPairPresent: pages.filter((p) => p.hreflangPairPresent).length,
    hreflangCounterpartMissing: pages.filter((p) => p.hreflangPairPresent && p.counterpartExists === false).length,
    audio: {
      listenUiAndScript: pages.filter((p) => p.hasListenUi && p.hasAudioScript).length,
      listenUiNoScript: pages.filter((p) => p.hasListenUi && !p.hasAudioScript).length,
      scriptNoListenUi: pages.filter((p) => !p.hasListenUi && p.hasAudioScript).length,
      renderedTracks: pages.reduce((a, p) => a + p.audioTrackCount, 0),
    },
    withAudio: pages.filter((p) => p.hasAudio).length,
    withAnalytics: pages.filter((p) => p.hasAnalytics).length,
    withoutAnalytics: pages.filter((p) => !p.hasAnalytics).length,
    withoutAnalyticsBySurfaceClass: (() => {
      const o = {};
      for (const p of pages) if (!p.hasAnalytics) o[p.surfaceClass] = (o[p.surfaceClass] || 0) + 1;
      return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    })(),
    withWaitlistForm: pages.filter((p) => p.hasWaitlistForm).length,
    withSubscribeForm: pages.filter((p) => p.hasSubscribeForm).length,
    withInContentCta: pages.filter((p) => p.ctaTargets.length > 0).length,
    withoutInContentCta: pages.filter((p) => p.ctaTargets.length === 0).length,
    withoutInContentCtaBySurfaceClass: (() => {
      const o = {};
      for (const p of pages) if (!p.ctaTargets.length) o[p.surfaceClass] = (o[p.surfaceClass] || 0) + 1;
      return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    })(),
    ctaTargetFrequency: (() => {
      const o = {};
      for (const p of pages) for (const t of p.ctaTargets) o[t] = (o[t] || 0) + 1;
      return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    })(),
    pagesWithUnrenderedPlaceholders: pages.filter((p) => p.unrenderedPlaceholders.length).map((p) => p.route),
    shadowedByRedirect: pages.filter((p) => p.shadowedByRedirect).length,
    chromeStripMisses: {
      nav: pages.filter((p) => !p.chrome.navStripped).length,
      footer: pages.filter((p) => !p.chrome.footerStripped).length,
    },
    words: {
      total: pages.reduce((a, p) => a + p.wordCount, 0),
      median: q(pages.map((p) => p.wordCount).sort((a, b) => a - b), 0.5),
      under150: pages.filter((p) => p.wordCount < 150).length,
    },
    figures: {
      total: pages.reduce((a, p) => a + p.figureCount, 0),
      pagesWithNone: pages.filter((p) => p.figureCount === 0).length,
    },
    retiredLine: {
      totalHits: pages.reduce((a, p) => a + p.retiredLineScore, 0),
      pagesOverThreshold3: pages.filter((p) => p.retiredLineScore >= 3).length,
      indexablePagesOverThreshold3: pages.filter((p) => p.retiredLineScore >= 3 && p.indexable).length,
      byCategory: ['webBuild', 'seo', 'localGbp', 'brandDesign'].reduce((o, k) => {
        o[k] = pages.reduce((a, p) => a + p.retiredLineByCategory[k], 0); return o;
      }, {}),
    },
    jsonLdTypes: (() => {
      const o = {};
      for (const p of pages) for (const t of p.jsonLdTypes) o[t] = (o[t] || 0) + 1;
      return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]));
    })(),
    links: {
      directEdges: pages.reduce((a, p) => a + p.outboundResolved, 0),
      viaRedirectEdges: pages.reduce((a, p) => a + p.outboundViaRedirect, 0),
      nonHtmlTargets: pages.reduce((a, p) => a + p.outboundNonHtml, 0),
      brokenRefs: pages.reduce((a, p) => a + p.outboundBroken.length, 0),
      distinctBrokenTargets: (() => {
        const s = new Set();
        for (const p of pages) for (const b of p.outboundBroken) s.add(b);
        return s.size;
      })(),
      topBrokenTargets: (() => {
        const o = {};
        for (const p of pages) for (const b of p.outboundBroken) o[b] = (o[b] || 0) + 1;
        return Object.fromEntries(Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, 25));
      })(),
    },
    editorialFreshness: (() => {
      const d = pages.map((p) => p.dateModifiedDaysAgo).filter((x) => x != null).sort((a, b) => a - b);
      const b = { '0-30': 0, '31-90': 0, '91-180': 0, '181-365': 0, '365+': 0 };
      for (const x of d) b[x <= 30 ? '0-30' : x <= 90 ? '31-90' : x <= 180 ? '91-180' : x <= 365 ? '181-365' : '365+']++;
      return {
        pagesWithDateModified: d.length,
        pagesWithout: pages.length - d.length,
        median: q(d, 0.5), p90: q(d, 0.9), max: d[d.length - 1] ?? null,
        buckets: b,
      };
    })(),
    git: {
      available: git.available,
      horizonISO: git.horizon,
      newestISO: git.newest,
      pagesWithCommitInHistory: pages.filter((p) => p.lastCommitISO).length,
      pagesBeyondHorizon: pages.filter((p) => git.available && !p.lastCommitISO).length,
      daysAgo: {
        p0: q(commitDays, 0), p25: q(commitDays, 0.25), p50: q(commitDays, 0.5),
        p75: q(commitDays, 0.75), p90: q(commitDays, 0.9), max: commitDays[commitDays.length - 1] ?? null,
      },
      buckets: (() => {
        const b = { '0-7': 0, '8-14': 0, '15-30': 0, '31+': 0 };
        for (const d of commitDays) b[d <= 7 ? '0-7' : d <= 14 ? '8-14' : d <= 30 ? '15-30' : '31+']++;
        return b;
      })(),
    },
  };

  return {
    _doc: 'The Surface BOM — one MEASURED record per routable HTML page. Built by scripts/build-surface-inventory.mjs; nothing here is hand-written. Link counts, CTA targets, word counts, figure counts and retired-line scores are measured on the page body with site nav/footer chrome removed, so shared boilerplate cannot inflate them or hide an orphan. Replaces docs/handoff/every-surface-map.md, which could go stale; this cannot.',
    _asOf: asOf,
    _asOfBasis: 'Newest commit date in the repo. Deliberately NOT wall-clock: lastCommitDaysAgo is measured against this so the manifest is byte-stable until a commit lands and --check does not red on the calendar.',
    _gitHorizon: git.horizon,
    _gitHorizonNote: 'The clone is shallow. Pages with lastCommitISO=null were not touched inside the available history — an honest absence, never a guessed date.',
    _skippedRoots: Object.fromEntries([...SKIP_TOP.entries()].sort()),
    _generator: 'scripts/build-surface-inventory.mjs',
    summary,
    pages,
  };
}

function readIf(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }

/* ---------------------------------------------------------------------- report */

function report(doc) {
  const s = doc.summary;
  const row = (o) => Object.entries(o).map(([k, v]) => `${k}=${v}`).join('  ');
  console.log(`surface inventory — ${s.pages} routable pages, asOf ${doc._asOf}`);
  console.log(`  lang            ${row(s.byLang)}`);
  console.log(`  surfaceClass    ${row(s.bySurfaceClass)}`);
  console.log(`  indexable       ${s.indexable} indexable / ${s.noindex} noindex; ${s.inSitemap} in sitemap`);
  console.log(`  sitemap gaps    ${s.indexableNotInSitemap} indexable-not-in-sitemap, ${s.inSitemapButNoindex} in-sitemap-but-noindex`);
  console.log(`  orphans         ${s.orphans} (${s.orphansIndexable} indexable) — ${row(s.orphansBySurfaceClass)}`);
  console.log(`  hreflang        ${s.hreflangPairPresent} paired, ${s.hreflangCounterpartMissing} counterpart missing`);
  console.log(`  funnel          ${s.withInContentCta} pages with an in-content CTA, ${s.withoutInContentCta} without (${row(s.withoutInContentCtaBySurfaceClass)}); ${s.withWaitlistForm} waitlist forms`);
  console.log(`  analytics       ${s.withAnalytics} pages carry the beacon, ${s.withoutAnalytics} do NOT (${row(s.withoutAnalyticsBySurfaceClass)})`);
  console.log(`  retired line    ${s.retiredLine.totalHits} hits, ${s.retiredLine.pagesOverThreshold3} pages >=3 (${s.retiredLine.indexablePagesOverThreshold3} indexable) — ${row(s.retiredLine.byCategory)}`);
  console.log(`  git freshness   ${row(s.git.buckets)} days-since-commit; ${s.git.pagesBeyondHorizon} beyond the ${doc._gitHorizon?.slice(0, 10)} shallow horizon`);
  console.log(`  editorial age   ${row(s.editorialFreshness.buckets)} days since dateModified; median ${s.editorialFreshness.median}d, ${s.editorialFreshness.pagesWithout} pages declare none`);
  console.log(`  links           ${s.links.directEdges} direct, ${s.links.viaRedirectEdges} via-301, ${s.links.nonHtmlTargets} non-HTML, ${s.links.brokenRefs} broken refs to ${s.links.distinctBrokenTargets} dead targets`);
  console.log(`  audio           ${s.audio.listenUiAndScript} UI+script, ${s.audio.listenUiNoScript} UI with no script, ${s.audio.scriptNoListenUi} script with no UI, ${s.audio.renderedTracks} mp3s`);
  console.log(`  hygiene         chrome-strip misses nav=${s.chromeStripMisses.nav} footer=${s.chromeStripMisses.footer}`);
}

/* ------------------------------------------------------------------- self-test */

function selfTest() {
  const routeSet = new Set(['/', '/library/x/', '/tools/']);
  const cases = [
    [routeFor('index.html'), '/', 'root index -> /'],
    [routeFor('library/x/index.html'), '/library/x/', 'nested index -> pretty route'],
    [routeFor('404.html'), '/404.html', 'standalone file keeps its extension'],
    [classify('/es/library/x/').lang, 'es', 'ES prefix detected'],
    [classify('/library/x/').surfaceClass, 'library', 'library maps to library'],
    [classify('/learn/topics/x/').surfaceClass, 'library', 'learn is reader prose'],
    [classify('/open/recalls/').surfaceClass, 'cost-index', 'open-data explores are Cost Index'],
    [classify('/blog/drafts/x/').surfaceClass, 'legacy', 'drafts are structurally legacy'],
    [classify('/es/blog/drafts/x/').surfaceRoot, 'blog/drafts', 'ES drafts keep the drafts root'],
    [classify('/ledger/').surfaceClass, 'product', 'the product page is product'],
    [classify('/privacy.html').surfaceClass, 'trust', 'root legal files are trust'],
    [classify('/').surfaceRoot, '(home)', 'home has its own root label'],
    [decodeEntities('a &amp;mdash; b'), 'a &mdash; b', 'entity decode is single-pass, not recursive'],
    [decodeEntities('Muntin &mdash; cost'), 'Muntin — cost', 'mdash decodes'],
    [wordCount('<p>one two</p><script>three four five</script>'), 2, 'script text is not prose'],
    [stripChrome('<body>A<header class="nav" id="nav">NAV</header>B\n<footer>F</footer>').body.includes('NAV'), false, 'nav is stripped'],
    [stripChrome('<body>A<header class="nav" id="nav">NAV</header>B\n<footer>F</footer>').body.includes('F'), false, 'footer is stripped'],
    [stripChrome('<body>A<header class="nav" id="nav">NAV</header>B\n<footer>F</footer>').body.includes('B'), true, 'body prose survives'],
    [stripChrome('<body>x</body>').navStripped, false, 'a missing nav is reported, not assumed'],
    [internalLinks('<a href="/tools/?q=1#x">t</a>', '/').join(), '/tools/', 'query and fragment are dropped'],
    [internalLinks('<a href="https://example.com/">t</a>', '/').length, 0, 'external links are excluded'],
    [internalLinks('<a href="mailto:a@b.c">t</a><a href="#top">t</a>', '/').length, 0, 'mailto and bare fragments are excluded'],
    [internalLinks('<a href="https://muntin.digital/tools/">t</a>', '/').join(), '/tools/', 'absolute self-links normalize to a path'],
    [internalLinks('<a href="../tools/">t</a>', '/library/x/').join(), '/library/tools/', 'relative links resolve against the page route, not the site root'],
    [internalLinks('<a href="foo/">t</a>', '/404.html').join(), '/foo/', 'a standalone .html page resolves relatives against its directory'],
    [resolveTarget('/library/x', routeSet), '/library/x/', 'a missing trailing slash still resolves'],
    [resolveTarget('/library/x/index.html', routeSet), '/library/x/', 'an explicit index.html resolves'],
    [resolveTarget('/nope/', routeSet), null, 'an unserved target resolves to null'],
    [jsonLdTypes('<script type="application/ld+json">{"@graph":[{"@type":"Article"},{"@type":"FAQPage"}]}</script>').join(), 'Article,FAQPage', '@graph types are collected'],
    [jsonLdTypes('<script type="application/ld+json">{ nope </script>').join(), '(invalid)', 'unparseable JSON-LD is reported, not silently dropped'],
    [jsonLdTypes('<p>no schema</p>').length, 0, 'a page with no JSON-LD reports none'],
    [stripChrome('<body>A\n<footer class="site-footer" id="footer">F</footer>').body.includes('F'), false, 'a CLASSED footer is stripped too — the narrow /<footer>/ form missed 691 pages'],
    [stripChrome('<body>A<p>mid <footer class="prov">inline</footer> text</p>').body.includes('inline'), true, 'a mid-line inline footer is NOT stripped (only newline-anchored ones are chrome)'],
    [isNonHtmlTarget('/cost-index/week-2026-08-01.json'), true, 'a dataset target is not a broken link'],
    [isNonHtmlTarget('/api/subscribe'), true, 'a form endpoint is not a broken link'],
    [isNonHtmlTarget('/library/x/'), false, 'a page route is not a non-HTML target'],
    [redirectOnce('/blog/restaurant-prime-cost/', [['/blog/*', '/library/:splat']]), '/library/restaurant-prime-cost/', 'a wildcard 301 forwards the splat'],
    [redirectOnce('/course/', [['/course/', '/cost-index/']]), '/cost-index/', 'an exact 301 forwards'],
    [redirectOnce('/library/x/', [['/blog/*', '/library/:splat']]), null, 'a non-matching link is not forwarded'],
    [parseRedirectRules('/a/ /b/ 301\n/c/ /d/ 200\n').flat().join(), '/a/,/b/', 'only 3xx rules become forwarding rules'],
    [jsonLdFacts('<script type="application/ld+json">{"@type":"Article","dateModified":"2026-05-04T10:00:00Z"}</script>').dateModified, '2026-05-04', 'dateModified is read from JSON-LD'],
    [jsonLdFacts('<script type="application/ld+json">{"@type":"Article"}</script>').dateModified, null, 'a page with no dateModified reports null, never a guess'],
    [firstH1('<h1>Plate <em>cost</em>, honestly</h1>'), 'Plate cost, honestly', 'h1 inner markup is stripped'],
    [firstH1('<div>no heading</div>'), null, 'a page with no h1 reports null'],
    [ANALYTICS_RE.test('<script>var s=document.createElement("script");s.src="/assets/p.js?v=1";</script>'), true, 'the lazy-injected beacon is detected — the <script src> form matched nothing'],
    [ANALYTICS_RE.test('<script src="/assets/site.js"></script>'), false, 'an unrelated script is not the beacon'],
    [parseRobotsDisallow('User-agent: *\nDisallow: /admin/\nAllow: /\n').join(), '/admin/', 'Disallow lines are parsed'],
    [parseRedirectSources('/a/  /b/  301\n# comment\n/c/ /d/ 200\n').join(), '/a/', 'only 3xx redirect sources count'],
    [shadowedBy('/audit/x/', ['/audit/*']), '/audit/*', 'a wildcard redirect shadows its subtree'],
    [shadowedBy('/library/x/', ['/audit/*']), null, 'an unrelated route is not shadowed'],
    [daysBetween('2026-08-01T00:00:00Z', '2026-08-07T00:00:00Z'), 6, 'day arithmetic'],
    [countRetired('We hired a web designer.', RETIRED_VOCAB), 1, 'imported vocabulary still matches'],
    [countRetired('Local SEO and your Google Business Profile.', LOCAL_GBP_VOCAB), 2, 'local/GBP vocabulary counts'],
    [countRetired('Our food cost and prime cost.', [...SEO_VOCAB, ...LOCAL_GBP_VOCAB, ...BRAND_DESIGN_VOCAB]), 0, 'cost prose scores zero across every category'],
    [CTA_RE.test('/ledger/'), true, 'the product page is a CTA target'],
    [CTA_RE.test('/es/ledger/'), true, 'the ES product page is a CTA target'],
    [CTA_RE.test('/api/waitlist'), true, 'the waitlist endpoint is a CTA target'],
    [CTA_RE.test('https://ledger.muntin.digital/'), true, 'the off-site product host is a CTA target — the miss that made articles look CTA-less'],
    [CTA_RE.test('https://app.muntin.digital/'), true, 'the operator-app host is a CTA target'],
    [CTA_RE.test('/library/ledger-notes/'), false, 'a route merely containing "ledger" is not a CTA'],
    [CTA_RE.test('https://example.com/ledger/'), false, 'an unrelated host is not a CTA'],
    [allLinks('<a href="https://ledger.muntin.digital/#x">t</a>', '/').join(), 'https://ledger.muntin.digital/', 'external links survive allLinks with the fragment dropped'],
    [allLinks('<a href="https://muntin.digital/tools/">t</a>', '/').join(), '/tools/', 'same-host absolutes collapse to a path'],
  ];
  let pass = 0;
  for (const [got, want, why] of cases) {
    if (got !== want) {
      console.error(`x self-test: ${why} — expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`);
      process.exit(2);
    }
    pass++;
  }
  // Every skipped root must carry a reason, and none may name a tree that serves pages.
  for (const [k, why] of SKIP_TOP) {
    if (!why || why.length < 25) {
      console.error(`x self-test: SKIP_TOP["${k}"] needs a substantive reason for not being reader-facing`);
      process.exit(2);
    }
    pass++;
  }
  console.log(`build-surface-inventory --self-test: OK (${pass} assertions)`);
  process.exit(0);
}

/* ---------------------------------------------------------------------- runner */

function main(argv) {
  if (argv.includes('--self-test')) selfTest();
  const doc = build({ useGit: !argv.includes('--no-git') });
  const built = JSON.stringify(doc, null, 2) + '\n';
  const tag = `${doc.summary.pages} pages, ${doc.summary.orphans} orphan(s), ${doc.summary.indexable} indexable, ${doc.summary.retiredLine.totalHits} retired-line hit(s)`;

  if (argv.includes('--check')) {
    let current = '';
    try { current = fs.readFileSync(OUT, 'utf8'); } catch { /* missing -> stale */ }
    if (current !== built) {
      console.error('surface inventory: data/surface-inventory.json is stale — run `node scripts/build-surface-inventory.mjs` and commit.');
      process.exit(1);
    }
    console.log(`surface inventory: in sync — ${tag}.`);
    if (argv.includes('--report')) report(doc);
    process.exit(0);
  }

  if (argv.includes('--report') && argv.includes('--dry-run')) { report(doc); process.exit(0); }
  fs.writeFileSync(OUT, built);
  console.log(`surface inventory: wrote data/surface-inventory.json — ${tag}.`);
  if (argv.includes('--report')) report(doc);
}

if (import.meta.url === pathToFileURL(process.argv[1] || '').href) {
  main(process.argv.slice(2));
}
